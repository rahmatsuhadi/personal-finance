import { useState, useEffect, useCallback } from "react";
import { liveQuery } from "dexie";
import { db } from "@/db/db";
import { userRepository } from "@/repositories/userRepository";
import { authClient } from "@/lib/auth-client";
import type { UserProfile } from "@/db/db";

// ─── useAuth Hook ─────────────────────────────────────────────────────────────
// Reactive via Dexie liveQuery — undefined=loading, null=no user, UserProfile=logged in
// Also monitors Better Auth cloud session for Google login state.

export function useAuth() {
  const [user, setUser] = useState<UserProfile | null | undefined>(undefined);
  const [cloudSession, setCloudSession] = useState<boolean | null>(null); // null=checking

  // ── Local profile (Dexie reactive) ───────────────────────────────────────
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

  // ── Cloud session (Better Auth) ───────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    authClient
      .getSession()
      .then(({ data }) => {
        if (cancelled) return;
        if (data?.user) {
          setCloudSession(true);
          // Mirror the cloud identity into local DB
          userRepository.saveGoogleSession({
            googleId: data.user.id,
            email: data.user.email,
            name: data.user.name,
            avatar: data.user.image ?? undefined,
          });
        } else {
          setCloudSession(false);
        }
      })
      .catch(() => {
        if (!cancelled) setCloudSession(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const isLoading = user === undefined;
  const isAuthenticated = !isLoading && user !== null;
  const isCloudConnected = cloudSession === true;

  const saveName = useCallback(async (name: string) => {
    await userRepository.saveName(name);
  }, []);

  const loginWithGoogle = useCallback(async () => {
    await authClient.signIn.social({ provider: "google", callbackURL: `${import.meta.env.VITE_APP_URL}/` });
  }, []);

  const logoutCloud = useCallback(async () => {
    await authClient.signOut();
    await userRepository.clearGoogleSession();
    setCloudSession(false);
  }, []);

  const logout = useCallback(async () => {
    await authClient.signOut().catch(() => { }); // best-effort cloud logout
    await userRepository.clear();
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated,
    isCloudConnected,
    saveName,
    loginWithGoogle,
    logoutCloud,
    logout,
  };
}
