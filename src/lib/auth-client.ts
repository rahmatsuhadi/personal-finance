import { createAuthClient } from "better-auth/client";

// ─── Better Auth Client ───────────────────────────────────────────────────────
// The baseURL must point to the finance-api backend that has better-auth server
// configured. Override via VITE_API_URL env variable.

const baseURL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export const authClient = createAuthClient({
  baseURL,
});

export type Session = Awaited<ReturnType<typeof authClient.getSession>>["data"];
