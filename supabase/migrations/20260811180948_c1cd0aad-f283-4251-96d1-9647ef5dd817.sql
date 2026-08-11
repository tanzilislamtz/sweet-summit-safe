-- Fix security linter warning 0029 for SECURITY DEFINER functions
-- By default, all functions are executable by PUBLIC.
-- For SECURITY DEFINER functions, this can be a risk if not intended.

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;
