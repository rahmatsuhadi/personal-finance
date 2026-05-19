import { useState, useEffect, useCallback } from "react";
import { db } from "@/db/db";
import { userRepository } from "@/repositories/userRepository";
import type { UserProfile } from "@/db/db";

// ─── useAuth Hook ─────────────────────────────────────────────────────────────
// Manual subscribe ke Dexie dengan useEffect + liveQuery observable,
// sehingga reactive saat data berubah (login/logout).

export function useAuth() {
  // undefined = masih loading | null = belum login | UserProfile = sudah login
  const [user, setUser] = useState<UserProfile | null | undefined>(undefined);

  useEffect(() => {
    // Import liveQuery secara langsung dari dexie
    import("dexie").then(({ liveQuery }) => {
      const observable = liveQuery(() => db.user_profile.get(1));
      const subscription = observable.subscribe({
        next: (result) => {
          setUser(result ?? null);
        },
        error: (err) => {
          console.error("[useAuth] liveQuery error:", err);
          setUser(null);
        },
      });
      return () => subscription.unsubscribe();
    });
  }, []);

  const isLoading = user === undefined;
  const isAuthenticated = !isLoading && user !== null;

  const saveName = useCallback(async (name: string) => {
    await userRepository.saveName(name);
    // liveQuery akan otomatis trigger update lewat subscription di atas
  }, []);

  const logout = useCallback(async () => {
    await userRepository.clear();
    // liveQuery otomatis update
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated,
    saveName,
    logout,
  };
}
