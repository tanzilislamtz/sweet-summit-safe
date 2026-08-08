import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useEffect } from "react";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { AdminShell } from "@/components/admin/AdminShell";
import { useAdminAccess } from "./admin";
import { adminList, adminSave } from "@/lib/admin.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  component: SettingsPage,
});

type SettingRow = { key: string; value: Record<string, unknown>; description: string | null };

function SettingsPage() {
  const access = useAdminAccess();
  const queryClient = useQueryClient();
  const list = useServerFn(adminList);
  const save = useServerFn(adminSave);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "app_settings"],
    queryFn: () => list({ data: { table: "app_settings", pageSize: 50, orderBy: "key", ascending: true } }),
  });

  const [draft, setDraft] = useState<Record<string, Record<string, unknown>>>({});

  useEffect(() => {
    if (!data) return;
    const next: Record<string, Record<string, unknown>> = {};
    for (const row of data.rows as unknown as SettingRow[]) {
      next[row.key] = { ...(row.value ?? {}) };
    }
    setDraft(next);
  }, [data]);

  const mutation = useMutation({
    mutationFn: (input: { key: string; value: Record<string, unknown> }) =>
      save({ data: { table: "app_settings", id: input.key, values: { value: input.value } } }),
    onSuccess: () => {
      toast.success("Settings saved");
      queryClient.invalidateQueries({ queryKey: ["admin", "app_settings"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const groups = (data?.rows ?? []) as unknown as SettingRow[];

  return (
    <AdminShell
      title="Site settings"
      description="Global configuration for identity, features, moderation rules and the AI assistant."
      account={access}
    >
      {isLoading ? (
        <div className="grid h-40 place-items-center text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : !access.isAdmin ? (
        <p className="rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground">
          Only administrators can change site settings.
        </p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {groups.map((row) => {
            const values = draft[row.key] ?? {};
            return (
              <section key={row.key} className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-semibold capitalize">{row.key}</h2>
                    <p className="text-xs text-muted-foreground">{row.description ?? "Configuration group"}</p>
                  </div>
                  <button
                    onClick={() => mutation.mutate({ key: row.key, value: values })}
                    disabled={mutation.isPending}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
                  >
                    <Save className="h-3.5 w-3.5" /> Save
                  </button>
                </div>

                <div className="mt-4 space-y-3">
                  {Object.entries(values).map(([field, value]) => (
                    <div key={field} className="flex items-center justify-between gap-3">
                      <span className="text-xs font-medium capitalize text-muted-foreground">
                        {field.replace(/_/g, " ")}
                      </span>
                      {typeof value === "boolean" ? (
                        <button
                          onClick={() =>
                            setDraft((prev) => ({ ...prev, [row.key]: { ...prev[row.key], [field]: !value } }))
                          }
                          className={cn(
                            "flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition",
                            value ? "bg-primary" : "bg-muted",
                          )}
                        >
                          <span className={cn("h-5 w-5 rounded-full bg-background transition", value ? "translate-x-5" : "")} />
                        </button>
                      ) : typeof value === "number" ? (
                        <input
                          type="number"
                          value={value}
                          onChange={(e) =>
                            setDraft((prev) => ({
                              ...prev,
                              [row.key]: { ...prev[row.key], [field]: Number(e.target.value) || 0 },
                            }))
                          }
                          className="w-32 rounded-lg border border-border bg-background px-2.5 py-1.5 text-right text-sm outline-none focus:border-primary"
                        />
                      ) : (
                        <input
                          value={String(value ?? "")}
                          maxLength={200}
                          onChange={(e) =>
                            setDraft((prev) => ({ ...prev, [row.key]: { ...prev[row.key], [field]: e.target.value } }))
                          }
                          className="w-56 rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm outline-none focus:border-primary"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </AdminShell>
  );
}
