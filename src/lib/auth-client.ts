import type { UserProfile } from "@/db/db";
import { createAuthClient } from "better-auth/client";

// ─── Better Auth Client ───────────────────────────────────────────────────────
// The baseURL must point to the finance-api backend that has better-auth server
// configured. Override via VITE_API_URL env variable.

const baseURL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

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
    const res = await fetch(`${baseURL}/api/auth/me`, {
      method: "GET",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });
    
    if (res.status === 401) {
      return null;
    }
    
    if (!res.ok) throw new Error(`[USER]: ${res.status}`);
    const result = await res.json();
    return result;
  } catch (err) {
    console.warn("[AuthClient] getSession failed or unauthorized:", err);
    return null;
  }
}
