import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from "react";
import { liveQuery } from "dexie";
import { db } from "@/db/db";
import { userRepository } from "@/repositories/userRepository";
import type { UserProfile } from "@/db/db";

interface AuthContextType {
  user: UserProfile | null | undefined;
  isLoading: boolean;
  isAuthenticated: boolean;
  saveName: (name: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null | undefined>(undefined);

  // Local profile (Dexie reactive)
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

  const saveName = useCallback(async (name: string) => {
    await userRepository.saveName(name);
  }, []);

  const logout = useCallback(async () => {
    await userRepository.clear();
  }, []);

  const value = useMemo(() => ({
    user,
    isLoading: user === undefined,
    isAuthenticated: user !== undefined && user !== null,
    saveName,
    logout,
  }), [user, saveName, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
}
