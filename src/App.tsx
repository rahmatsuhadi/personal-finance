import { useEffect } from "react";
import { AppNavigator } from "@/navigation/AppNavigator";
import { seedDefaultData } from "@/db/db";
import { AuthProvider } from "@/contexts/AuthContext";
import { SyncProvider } from "@/contexts/SyncContext";

// ─── App Root ─────────────────────────────────────────────────────────────────

export default function App() {
  useEffect(() => {
    // Seed default categories and wallets on first launch
    seedDefaultData().catch(console.error);
  }, []);

  return (
    <AuthProvider>
      <SyncProvider>
        <AppNavigator />
      </SyncProvider>
    </AuthProvider>
  );
}
