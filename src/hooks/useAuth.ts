import { useAuthContext } from "@/contexts/AuthContext";

/**
 * Hook to access the authentication state and actions.
 * Now acts as a wrapper for AuthContext to maintain backward compatibility.
 */
export function useAuth() {
  return useAuthContext();
}
