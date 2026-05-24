import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from "react";
import { liveQuery } from "dexie";
import { db } from "@/db/db";
import { userRepository } from "@/repositories/userRepository";
import getSession, { authClient } from "@/lib/auth-client";
import type { UserProfile } from "@/db/db";

interface AuthContextType {
  user: UserProfile | null | undefined;
  isLoading: boolean;
  isAuthenticated: boolean;
  isCloudConnected: boolean;
  cloudUser: { id: string; name: string; email: string; image?: string } | null;
  saveName: (name: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logoutCloud: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null | undefined>(undefined);
  const [cloudSession, setCloudSession] = useState<boolean | null>(null); // null=checking
  const [cloudUser, setCloudUser] = useState<{ id: string; name: string; email: string; image?: string } | null>(null);

  // ── Local profile (Dexie reactive) ───────────────────────────────────────
  useEffect(() => {
    const sub = liveQuery(() => db.user_profile.get(1)).subscribe({
      next: (result) => setUser(result ?? null),
      error: (err) => {
        console.error("[AuthContext] liveQuery error:", err);
        setUser(null);
      },
    });
    return () => sub.unsubscribe();
  }, []);

  // ── Cloud session (Better Auth) ───────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    
    getSession()
      .then((data) => {
        if (cancelled) return;
        if (data && data.user) {
          setCloudSession(true);
          setCloudUser({
            id: data.user.id,
            name: data.user.name,
            email: data.user.email,
            image: data.user.image ?? undefined,
          });
          
          // CRITICAL: If local profile not set yet, auto-save cloud name to trigger onboarding completion
          userRepository.get().then(localUser => {
            if (!localUser && data.user.name) {
              console.log("[AuthContext] Cloud session found, initializing local profile with name:", data.user.name);
              userRepository.saveName(data.user.name).catch(console.error);
            }
          });
        } else {
          setCloudSession(false);
          setCloudUser(null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCloudSession(false);
          setCloudUser(null);
        }
      });

    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveName = useCallback(async (name: string) => {
    await userRepository.saveName(name);
  }, []);

  const loginWithGoogle = useCallback(async () => {
    await authClient.signIn.social({
      provider: "google",
      callbackURL: `${import.meta.env.VITE_APP_URL}/onboarding`, // Better Auth redirects here after login
    });
  }, []);

  const logoutCloud = useCallback(async () => {
    await authClient.signOut();
    setCloudSession(false);
    setCloudUser(null);
  }, []);

  const logout = useCallback(async () => {
    await authClient.signOut().catch(() => { }); // best-effort cloud logout
    await userRepository.clear();
    setCloudSession(false);
    setCloudUser(null);
  }, []);

  const value = useMemo(() => ({
    user,
    isLoading: user === undefined,
    isAuthenticated: user !== undefined && user !== null,
    isCloudConnected: cloudSession === true,
    cloudUser,
    saveName,
    loginWithGoogle,
    logoutCloud,
    logout,
  }), [user, cloudSession, cloudUser, saveName, loginWithGoogle, logoutCloud, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
}
