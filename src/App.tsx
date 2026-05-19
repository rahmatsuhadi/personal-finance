import { useEffect } from "react";
import { AppNavigator } from "@/navigation/AppNavigator";
import { seedDefaultData } from "@/db/db";

// ─── App Root ─────────────────────────────────────────────────────────────────

export default function App() {
  useEffect(() => {
    // Seed default categories and wallets on first launch
    seedDefaultData().catch(console.error);
  }, []);

  return <AppNavigator />;
}
