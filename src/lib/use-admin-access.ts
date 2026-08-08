import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getAdminAccess } from "@/lib/admin.functions";

export type AdminAccess = {
  isAdmin: boolean;
  isStaff: boolean;
  roles: string[];
  name: string | null;
  email: string | null;
};

const FALLBACK: AdminAccess = { isAdmin: false, isStaff: false, roles: [], name: null, email: null };

/**
 * Shared admin identity. Backed by a single cached query so every admin screen
 * reads the same record without relying on React context across route chunks.
 */
export function useAdminAccessQuery() {
  const fetchAccess = useServerFn(getAdminAccess);
  return useQuery({
    queryKey: ["admin", "access"],
    queryFn: () => fetchAccess() as Promise<AdminAccess>,
    staleTime: 60_000,
    retry: false,
  });
}

export function useAdminAccess(): AdminAccess {
  const { data } = useAdminAccessQuery();
  return data ?? FALLBACK;
}
