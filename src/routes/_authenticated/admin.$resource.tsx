import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, Loader2, Pencil, Trash2, X, ChevronLeft, ChevronRight, Inbox } from "lucide-react";
import { toast } from "sonner";
import { AdminShell } from "@/components/admin/AdminShell";
import { useAdminAccess } from "@/lib/use-admin-access";
import { RESOURCE_BY_SLUG, type FieldDef, type ResourceDef } from "@/lib/admin-resources";
import { adminList, adminSave, adminDelete } from "@/lib/admin.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/$resource")({
  component: ResourcePage,
});

type Row = Record<string, any>;

function ResourcePage() {
  const { resource: slug } = Route.useParams();
  const def = RESOURCE_BY_SLUG.get(slug);
  const navigate = useNavigate();

  useEffect(() => {
    if (!def && slug !== "users" && slug !== "settings") navigate({ to: "/admin" });
  }, [def, slug, navigate]);

  if (!def) return null;
  return <ResourceView key={def.slug} def={def} />;
}

function ResourceView({ def }: { def: ResourceDef }) {
  const access = useAdminAccess();
  const queryClient = useQueryClient();
  const list = useServerFn(adminList);
  const save = useServerFn(adminSave);
  const remove = useServerFn(adminDelete);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<Row | null>(null);
  const [creating, setCreating] = useState(false);

  const filterList = useMemo(
    () => Object.entries(filters).filter(([, v]) => v).map(([column, value]) => ({ column, value })),
    [filters],
  );

  const query = useQuery({
    queryKey: ["admin", def.table, search, page, filterList],
    queryFn: () =>
      list({
        data: {
          table: def.table,
          search,
          searchColumns: def.searchColumns,
          page,
          pageSize: 25,
          orderBy: def.orderBy,
          ascending: def.orderBy === "sort_order" || def.orderBy === "name",
          filters: filterList,
        },
      }),
  });

  // lookup labels for relational selects
  const needsLookups = def.fields.some((f) => f.key.endsWith("_id"));
  const lookups = useQuery({
    queryKey: ["admin", "lookups"],
    enabled: needsLookups,
    staleTime: 300_000,
    queryFn: async () => {
      const [subjects, chapters, boards] = await Promise.all([
        list({ data: { table: "subjects", pageSize: 100, orderBy: "sort_order", ascending: true } }),
        list({ data: { table: "chapters", pageSize: 100, orderBy: "sort_order", ascending: true } }),
        list({ data: { table: "boards", pageSize: 100, orderBy: "name", ascending: true } }),
      ]);
      return {
        subject_id: subjects.rows.map((r) => ({ value: String(r['id']), label: String(r['name']) })),
        chapter_id: chapters.rows.map((r) => ({ value: String(r['id']), label: String(r['name']) })),
        board_id: boards.rows.map((r) => ({ value: String(r['id']), label: String(r['name']) })),
      } as Record<string, { value: string; label: string }[]>;
    },
  });

  const saveMutation = useMutation({
    mutationFn: (input: { id?: string | null; values: Row }) =>
      save({ data: { table: def.table, id: input.id ?? null, values: input.values } }),
    onSuccess: () => {
      toast.success("Saved");
      setEditing(null);
      setCreating(false);
      queryClient.invalidateQueries({ queryKey: ["admin", def.table] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => remove({ data: { table: def.table, id } }),
    onSuccess: () => {
      toast.success("Deleted");
      queryClient.invalidateQueries({ queryKey: ["admin", def.table] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = query.data?.rows ?? [];
  const count = query.data?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(count / 25));
  const readOnly = def.adminOnly && !access.isAdmin;
  const canCreate = def.canCreate !== false && def.fields.length > 0 && !readOnly;

  const labelFor = (key: string, value: unknown) => {
    if (!needsLookups || !key.endsWith("_id")) return value;
    const opts = lookups.data?.[key];
    return opts?.find((o) => o.value === String(value))?.label ?? value;
  };

  return (
    <AdminShell
      title={def.label}
      description={def.description}
      account={access}
      actions={
        canCreate ? (
          <button
            onClick={() => setCreating(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> <span className="hidden sm:inline">New</span>
          </button>
        ) : null
      }
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder={`Search ${def.label.toLowerCase()}…`}
              maxLength={80}
              className="w-full rounded-xl border border-border bg-card py-2.5 pl-9 pr-3 text-sm outline-none focus:border-primary"
            />
          </div>
          {def.filters?.map((f) => (
            <select
              key={f.column}
              value={filters[f.column] ?? ""}
              onChange={(e) => {
                setFilters((prev) => ({ ...prev, [f.column]: e.target.value }));
                setPage(1);
              }}
              className="rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary"
            >
              <option value="">All {f.label.toLowerCase()}</option>
              {f.options.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          ))}
        </div>

        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          {query.isLoading ? (
            <div className="grid h-40 place-items-center text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : rows.length === 0 ? (
            <div className="grid h-48 place-items-center text-center">
              <div>
                <Inbox className="mx-auto h-7 w-7 text-muted-foreground" />
                <p className="mt-2 text-sm font-medium">Nothing here yet</p>
                <p className="text-xs text-muted-foreground">
                  {canCreate ? "Create the first record to get started." : "Records will appear here automatically."}
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    {def.columns.map((c) => (
                      <th key={c.key} className={cn("px-4 py-3 font-medium", c.width)}>
                        {c.label}
                      </th>
                    ))}
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {rows.map((row) => (
                    <tr key={String(row['id'] ?? row['key'])} className="transition hover:bg-muted/40">
                      {def.columns.map((c) => (
                        <td key={c.key} className="max-w-[260px] px-4 py-3 align-middle">
                          <Cell type={c.type} value={labelFor(c.key, row[c.key])} />
                        </td>
                      ))}
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          {def.fields.length > 0 && !readOnly && (
                            <button
                              onClick={() => setEditing(row)}
                              aria-label="Edit"
                              className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                          )}
                          {!readOnly && (
                            <button
                              onClick={() => {
                                if (confirm("Delete this record permanently?")) {
                                  deleteMutation.mutate(String(row['id'] ?? row['key']));
                                }
                              }}
                              aria-label="Delete"
                              className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {count} record{count === 1 ? "" : "s"}
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="grid h-8 w-8 place-items-center rounded-lg border border-border disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span>
              {page} / {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="grid h-8 w-8 place-items-center rounded-lg border border-border disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {(editing || creating) && (
          <RecordEditor
            def={def}
            row={editing}
            lookups={lookups.data ?? {}}
            saving={saveMutation.isPending}
            onClose={() => {
              setEditing(null);
              setCreating(false);
            }}
            onSave={(values) => saveMutation.mutate({ id: editing ? String(editing['id'] ?? editing['key']) : null, values })}
          />
        )}
      </AnimatePresence>
    </AdminShell>
  );
}

function Cell({ type, value }: { type?: string; value: unknown }) {
  if (value === null || value === undefined || value === "") return <span className="text-muted-foreground">—</span>;
  if (type === "boolean")
    return (
      <span
        className={cn(
          "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase",
          value ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground",
        )}
      >
        {value ? "Yes" : "No"}
      </span>
    );
  if (type === "badge")
    return (
      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-primary">
        {String(value)}
      </span>
    );
  if (type === "date") return <span className="text-muted-foreground">{new Date(String(value)).toLocaleDateString()}</span>;
  if (type === "tags" && Array.isArray(value))
    return (
      <span className="flex flex-wrap gap-1">
        {value.slice(0, 3).map((v) => (
          <span key={String(v)} className="rounded-full bg-muted px-2 py-0.5 text-[10px]">
            {String(v)}
          </span>
        ))}
      </span>
    );
  return <span className="line-clamp-2 break-words">{String(value)}</span>;
}

function RecordEditor({
  def,
  row,
  lookups,
  saving,
  onClose,
  onSave,
}: {
  def: ResourceDef;
  row: Row | null;
  lookups: Record<string, { value: string; label: string }[]>;
  saving: boolean;
  onClose: () => void;
  onSave: (values: Row) => void;
}) {
  const [values, setValues] = useState<Row>(() => {
    const initial: Row = {};
    for (const f of def.fields) {
      const current = row?.[f.key];
      initial[f.key] =
        current ?? (f.type === "boolean" ? false : f.type === "number" ? 0 : f.type === "tags" ? [] : f.type === "json" ? [] : "");
    }
    return initial;
  });

  const set = (key: string, value: unknown) => setValues((prev) => ({ ...prev, [key]: value }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const payload: Row = {};
    for (const f of def.fields) {
      let v = values[f.key];
      if (f.type === "number") v = Number(v) || 0;
      if (f.type === "tags" && typeof v === "string") v = v.split(",").map((s) => s.trim()).filter(Boolean);
      if (f.type === "json" && typeof v === "string") {
        try {
          v = JSON.parse(v || "[]");
        } catch {
          toast.error(`${f.label} must be valid JSON`);
          return;
        }
      }
      if (f.key.endsWith("_id") && v === "") v = null;
      payload[f.key] = v;
    }
    onSave(payload);
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm"
      />
      <motion.form
        onSubmit={submit}
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 260, damping: 30 }}
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col border-l border-border bg-card"
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold">{row ? `Edit ${def.label}` : `New ${def.label}`}</h2>
            <p className="text-xs text-muted-foreground">{def.description}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-full hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
          {def.fields.map((f) => (
            <Field key={f.key} field={f} value={values[f.key]} lookups={lookups} onChange={(v) => set(f.key, v)} />
          ))}
        </div>

        <div className="flex gap-2 border-t border-border px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium hover:bg-muted"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save
          </button>
        </div>
      </motion.form>
    </>
  );
}

function Field({
  field,
  value,
  lookups,
  onChange,
}: {
  field: FieldDef;
  value: unknown;
  lookups: Record<string, { value: string; label: string }[]>;
  onChange: (value: unknown) => void;
}) {
  const base =
    "mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary";

  const relational = field.key.endsWith("_id") ? lookups[field.key] : undefined;

  return (
    <label className="block">
      <span className="text-xs font-medium text-muted-foreground">
        {field.label}
        {field.required && <span className="text-destructive"> *</span>}
      </span>

      {field.type === "boolean" ? (
        <button
          type="button"
          onClick={() => onChange(!value)}
          className={cn(
            "mt-1.5 flex h-7 w-12 items-center rounded-full p-0.5 transition",
            value ? "bg-primary" : "bg-muted",
          )}
        >
          <span className={cn("h-6 w-6 rounded-full bg-background transition", value ? "translate-x-5" : "")} />
        </button>
      ) : relational ? (
        <select value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} className={base}>
          <option value="">— none —</option>
          {relational.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ) : field.type === "select" ? (
        <select value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} className={base}>
          <option value="">— none —</option>
          {(field.options ?? []).map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      ) : field.type === "textarea" ? (
        <textarea
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
          required={field.required}
          rows={4}
          maxLength={5000}
          className={base}
        />
      ) : field.type === "json" ? (
        <textarea
          value={typeof value === "string" ? value : JSON.stringify(value ?? [], null, 0)}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className={cn(base, "font-mono text-xs")}
        />
      ) : field.type === "tags" ? (
        <input
          value={Array.isArray(value) ? value.join(", ") : String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
          maxLength={300}
          className={base}
        />
      ) : field.type === "number" ? (
        <input type="number" value={Number(value ?? 0)} onChange={(e) => onChange(e.target.value)} className={base} />
      ) : (
        <input
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
          required={field.required}
          maxLength={300}
          className={base}
        />
      )}

      {field.help && <span className="mt-1 block text-[11px] text-muted-foreground">{field.help}</span>}
    </label>
  );
}
