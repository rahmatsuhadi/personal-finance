import { AppNavigator } from "@/navigation/AppNavigator";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "@/components/ui/sonner";

// ─── App Root ─────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <AuthProvider>
      <AppNavigator />
      <Toaster />
    </AuthProvider>
  );
}
