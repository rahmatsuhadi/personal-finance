import { AppNavigator } from "@/navigation/AppNavigator";

import { AuthProvider } from "@/contexts/AuthContext";
import { SyncProvider } from "@/contexts/SyncContext";

import { RestoreInitializer } from "@/components/SyncInitializer";
import { Toaster } from "@/components/ui/sonner";

// ─── App Root ─────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <AuthProvider>
      <SyncProvider>
        <RestoreInitializer />
        <AppNavigator />
        <Toaster />
      </SyncProvider>
    </AuthProvider>
  );
}
