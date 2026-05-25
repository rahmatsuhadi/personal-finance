import { createAuthClient } from "better-auth/client";
import { CONFIG } from "@/config";
import { apiClient } from "@/lib/apiClient";

// ─── Better Auth Client ───────────────────────────────────────────────────────
// The baseURL must point to the finance-api backend that has better-auth server
// configured. Override via VITE_API_URL env variable.

const baseURL = CONFIG.API_URL;

export const authClient = createAuthClient({
  baseURL,
  fetchOptions: {
    credentials: "include"
  }
});

export type Session = Awaited<ReturnType<typeof authClient.getSession>>["data"];

interface User {
  id: string,
  name: string
  email: string
  image?: string
}

export default async function getSession(): Promise<{user:User} | null> {
  try {
    const result = await apiClient.get(CONFIG.ENDPOINTS.AUTH_ME);
    return result;
  } catch (err: any) {
    if (err.message === "Unauthorized") {
      return null;
    }
    console.warn("[AuthClient] getSession failed or unauthorized:", err);
    return null;
  }
}
