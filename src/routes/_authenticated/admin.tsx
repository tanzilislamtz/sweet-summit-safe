import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Loader2, ShieldAlert } from "lucide-react";
import { useAdminAccessQuery } from "@/lib/use-admin-access";

export { useAdminAccess } from "@/lib/use-admin-access";
export type { AdminAccess } from "@/lib/use-admin-access";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminLayout,
  errorComponent: ({ error }) => (
    <div className="grid min-h-screen place-items-center px-6 text-center">
      <div>
        <h1 className="text-lg font-semibold">Admin panel could not load</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
      </div>
    </div>
  ),
});

function AdminLayout() {
  const navigate = useNavigate();
  const { data, isLoading, error } = useAdminAccessQuery();

  useEffect(() => {
    if (error) navigate({ to: "/admin-login" });
  }, [error, navigate]);

  if (isLoading || !data) {
    return (
      <div className="grid min-h-screen place-items-center bg-background text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!data.isStaff) {
    return (
      <div className="grid min-h-screen place-items-center bg-background px-6 text-center text-foreground">
        <div className="max-w-sm">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-destructive/10 text-destructive">
            <ShieldAlert className="h-6 w-6" />
          </span>
          <h1 className="mt-4 text-lg font-semibold">No admin access</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your account ({data.email}) is signed in, but it does not hold an admin or moderator role. Ask an owner
            administrator to grant you access.
          </p>
        </div>
      </div>
    );
  }

  return <Outlet />;
}
