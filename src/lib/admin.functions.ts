import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Admin panel data layer.
 *
 * Every function runs as the signed-in user (RLS enforced) and additionally
 * verifies the caller holds an admin/moderator role before touching data.
 * Only tables in ADMIN_TABLES can be reached — the table name arrives from the
 * client, so an allow-list is mandatory.
 */

export const ADMIN_TABLES = [
  "profiles",
  "user_roles",
  "subjects",
  "boards",
  "chapters",
  "questions",
  "mock_tests",
  "posts",
  "post_reports",
  "study_groups",
  "group_members",
  "tutors",
  "tutor_applications",
  "ads",
  "announcements",
  "app_settings",
  "admin_audit_log",
] as const;

export type AdminTable = (typeof ADMIN_TABLES)[number];

const isAdminTable = (value: unknown): value is AdminTable =>
  typeof value === "string" && (ADMIN_TABLES as readonly string[]).includes(value);

type SupabaseCtx = { supabase: any; userId: string };

async function assertStaff(context: SupabaseCtx): Promise<{ admin: boolean }> {
  const { data, error } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId);
  if (error) throw new Error(error.message);
  const roles: string[] = (data ?? []).map((r: { role: string }) => r.role);
  if (!roles.includes("admin") && !roles.includes("moderator")) {
    throw new Error("Forbidden — admin access required.");
  }
  return { admin: roles.includes("admin") };
}

async function audit(
  context: SupabaseCtx,
  action: string,
  entity: string,
  entityId: string | null,
  meta: Record<string, any> = {},
) {
  await (context.supabase as any)
    .from("admin_audit_log")
    .insert({ admin_id: context.userId, action, entity, entity_id: entityId, meta });
}

/** Am I allowed into the admin panel at all? */
export const getAdminAccess = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [{ data: roles }, { data: profile }] = await Promise.all([
      context.supabase.from("user_roles").select("role").eq("user_id", context.userId),
      context.supabase
        .from("profiles")
        .select("full_name, email, avatar_url")
        .eq("id", context.userId)
        .maybeSingle(),
    ]);
    const list: string[] = (roles ?? []).map((r: { role: string }) => r.role);
    return {
      isAdmin: list.includes("admin"),
      isStaff: list.includes("admin") || list.includes("moderator"),
      roles: list,
      name: (profile?.full_name as string) ?? null,
      email: (profile?.email as string) ?? null,
    };
  });

export type ListInput = {
  table: string;
  search?: string;
  searchColumns?: string[];
  page?: number;
  pageSize?: number;
  orderBy?: string;
  ascending?: boolean;
  filters?: { column: string; value: string }[];
};

export const adminList = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: ListInput) => {
    if (!isAdminTable(input.table)) throw new Error("Unknown table");
    return input;
  })
  .handler(async ({ data, context }) => {
    await assertStaff(context as SupabaseCtx);
    const page = Math.max(1, data.page ?? 1);
    const pageSize = Math.min(100, Math.max(5, data.pageSize ?? 25));
    const from = (page - 1) * pageSize;

    let query = (context.supabase as any)
      .from(data.table)
      .select("*", { count: "exact" })
      .range(from, from + pageSize - 1);

    if (data.orderBy) query = query.order(data.orderBy, { ascending: data.ascending ?? false });

    for (const f of data.filters ?? []) {
      if (f.value) query = query.eq(f.column, f.value);
    }

    const term = data.search?.trim();
    if (term && data.searchColumns?.length) {
      query = query.or(data.searchColumns.map((c) => `${c}.ilike.%${term}%`).join(","));
    }

    const { data: rows, error, count } = await query;
    if (error) throw new Error(error.message);
    return { rows: (rows ?? []) as Record<string, any>[], count: count ?? 0, page, pageSize };
  });

export const adminSave = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { table: string; id?: string | null; values: Record<string, any> }) => {
    if (!isAdminTable(input.table)) throw new Error("Unknown table");
    return input;
  })
  .handler(async ({ data, context }) => {
    await assertStaff(context as SupabaseCtx);
    const pk = data.table === "app_settings" ? "key" : "id";

    if (data.id) {
      const { error } = await (context.supabase as any)
        .from(data.table)
        .update(data.values)
        .eq(pk, data.id);
      if (error) throw new Error(error.message);
      await audit(context as SupabaseCtx, "update", data.table, data.id, data.values);
      return { ok: true as const, id: data.id };
    }

    const { data: inserted, error } = await (context.supabase as any)
      .from(data.table)
      .insert(data.values)
      .select()
      .single();
    if (error) throw new Error(error.message);
    const newId = String((inserted as Record<string, any>)[pk] ?? "");
    await audit(context as SupabaseCtx, "create", data.table, newId, data.values);
    return { ok: true as const, id: newId };
  });

export const adminDelete = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { table: string; id: string }) => {
    if (!isAdminTable(input.table)) throw new Error("Unknown table");
    return input;
  })
  .handler(async ({ data, context }) => {
    await assertStaff(context as SupabaseCtx);
    const pk = data.table === "app_settings" ? "key" : "id";
    const { error } = await (context.supabase as any).from(data.table).delete().eq(pk, data.id);
    if (error) throw new Error(error.message);
    await audit(context as SupabaseCtx, "delete", data.table, data.id);
    return { ok: true as const };
  });

/** Role management — admin only. */
export const adminSetRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string; role: "admin" | "moderator" | "user"; grant: boolean }) => input)
  .handler(async ({ data, context }) => {
    const { admin } = await assertStaff(context as SupabaseCtx);
    if (!admin) throw new Error("Forbidden — only admins can change roles.");
    if (data.userId === context.userId && data.role === "admin" && !data.grant) {
      throw new Error("You cannot remove your own admin role.");
    }
    if (data.grant) {
      const { error } = await context.supabase
        .from("user_roles")
        .insert({ user_id: data.userId, role: data.role });
      if (error && !error.message.includes("duplicate")) throw new Error(error.message);
    } else {
      const { error } = await context.supabase
        .from("user_roles")
        .delete()
        .eq("user_id", data.userId)
        .eq("role", data.role);
      if (error) throw new Error(error.message);
    }
    await audit(context as SupabaseCtx, data.grant ? "grant_role" : "revoke_role", "user_roles", data.userId, {
      role: data.role,
    });
    return { ok: true as const };
  });

export const adminListUsers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { search?: string; status?: string; accountType?: string }) => input)
  .handler(async ({ data, context }) => {
    await assertStaff(context as SupabaseCtx);
    let query = context.supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (data.status) query = query.eq("status", data.status);
    if (data.accountType) query = query.eq("account_type", data.accountType);
    const term = data.search?.trim();
    if (term) query = query.or(`full_name.ilike.%${term}%,email.ilike.%${term}%`);

    const { data: profiles, error } = await query;
    if (error) throw new Error(error.message);

    const { data: roles } = await context.supabase.from("user_roles").select("user_id, role");
    const roleMap = new Map<string, string[]>();
    for (const r of (roles ?? []) as { user_id: string; role: string }[]) {
      roleMap.set(r.user_id, [...(roleMap.get(r.user_id) ?? []), r.role]);
    }
    return ((profiles ?? []) as Record<string, any>[]).map((p: Record<string, any>) => ({
      ...p,
      roles: roleMap.get(String(p['id'])) ?? [],
    }));
  });

/** Dashboard aggregates. */
export const adminStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertStaff(context as SupabaseCtx);
    const countOf = async (table: string, filter?: { column: string; value: unknown }) => {
      let q = (context.supabase as any).from(table).select("*", { count: "exact", head: true });
      if (filter) q = q.eq(filter.column, filter.value);
      const { count } = await q;
      return count ?? 0;
    };

    const [
      users,
      students,
      tutorsCount,
      parents,
      posts,
      hiddenPosts,
      openReports,
      groups,
      questions,
      mockTests,
      tutorProfiles,
      pendingApplications,
      ads,
      announcements,
    ] = await Promise.all([
      countOf("profiles"),
      countOf("profiles", { column: "account_type", value: "student" }),
      countOf("profiles", { column: "account_type", value: "tutor" }),
      countOf("profiles", { column: "account_type", value: "parent" }),
      countOf("posts"),
      countOf("posts", { column: "status", value: "hidden" }),
      countOf("post_reports", { column: "status", value: "open" }),
      countOf("study_groups"),
      countOf("questions"),
      countOf("mock_tests"),
      countOf("tutors"),
      countOf("tutor_applications", { column: "status", value: "pending" }),
      countOf("ads", { column: "is_active", value: true }),
      countOf("announcements", { column: "is_active", value: true }),
    ]);

    const { data: recentUsers } = await context.supabase
      .from("profiles")
      .select("id, full_name, email, account_type, created_at")
      .order("created_at", { ascending: false })
      .limit(6);

    const { data: recentActivity } = await context.supabase
      .from("admin_audit_log")
      .select("id, action, entity, entity_id, created_at")
      .order("created_at", { ascending: false })
      .limit(8);

    const { data: signupSeries } = await context.supabase
      .from("profiles")
      .select("created_at")
      .gte("created_at", new Date(Date.now() - 13 * 86400000).toISOString());

    const buckets: { day: string; count: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      buckets.push({ day: d.toISOString().slice(5, 10), count: 0 });
    }
    for (const row of (signupSeries ?? []) as { created_at: string }[]) {
      const key = row.created_at.slice(5, 10);
      const bucket = buckets.find((b) => b.day === key);
      if (bucket) bucket.count += 1;
    }

    return {
      totals: {
        users,
        students,
        tutors: tutorsCount,
        parents,
        posts,
        hiddenPosts,
        openReports,
        groups,
        questions,
        mockTests,
        tutorProfiles,
        pendingApplications,
        ads,
        announcements,
      },
      recentUsers: (recentUsers ?? []) as Record<string, any>[],
      recentActivity: (recentActivity ?? []) as Record<string, any>[],
      signupSeries: buckets,
    };
  });
