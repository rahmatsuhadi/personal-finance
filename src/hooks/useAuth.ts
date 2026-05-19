import { useState, useEffect, useCallback } from "react";
import { liveQuery } from "dexie";
import { db } from "@/db/db";
import { userRepository } from "@/repositories/userRepository";
import type { UserProfile } from "@/db/db";

// ─── useAuth Hook ─────────────────────────────────────────────────────────────
// Reactive via Dexie liveQuery — undefined=loading, null=no user, UserProfile=logged in

export function useAuth() {
  const [user, setUser] = useState<UserProfile | null | undefined>(undefined);

  useEffect(() => {
    const sub = liveQuery(() => db.user_profile.get(1)).subscribe({
      next: (result) => setUser(result ?? null),
      error: (err) => {
        console.error("[useAuth] liveQuery error:", err);
        setUser(null);
      },
    });
    return () => sub.unsubscribe();
  }, []);

  const isLoading = user === undefined;
  const isAuthenticated = !isLoading && user !== null;

  const saveName = useCallback(async (name: string) => {
    await userRepository.saveName(name);
  }, []);

  const logout = useCallback(async () => {
    await userRepository.clear();
  }, []);

  return { user, isLoading, isAuthenticated, saveName, logout };
}
