import { useAuth } from "@/hooks/useAuth";
import { OnboardingScreen } from "@/pages/auth/OnboardingScreen";
import { TabNavigator } from "@/navigation/TabNavigator";
import { StackNavigator } from "@/navigation/StackNavigator";
import { HomeScreen } from "@/pages/main/HomeScreen";
import { CalendarScreen } from "@/pages/main/CalendarScreen";
import { AddTransactionScreen } from "@/pages/main/AddTransactionScreen";
import { StatisticsScreen } from "@/pages/main/StatisticsScreen";
import { SettingsScreen } from "@/pages/main/SettingsScreen";

// ─── AppNavigator ─────────────────────────────────────────────────────────────
// Root conditional router — checks user profile in DB to decide which flow to show.
// StackNavigator wraps everything so any screen can push stack pages.

export function AppNavigator() {
  const { isLoading, isAuthenticated } = useAuth();

  // Show nothing while DB loads (brief flash prevention)
  if (isLoading) {
    return (
      <div className="flex h-dvh items-center justify-center bg-brutal-bg">
        <div className="border-4 border-brutal-black bg-brutal-lime p-6 shadow-brutal-lg">
          <p className="text-lg font-black uppercase tracking-widest">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  // Not authenticated → Onboarding (no stack needed)
  if (!isAuthenticated) {
    return <OnboardingScreen />;
  }

  // Authenticated → Main App wrapped in StackNavigator
  return (
    <StackNavigator>
      <TabNavigator
        screens={{
          home: <HomeScreen />,
          calendar: <CalendarScreen />,
          add: <AddTransactionScreen />,
          stats: <StatisticsScreen />,
          settings: <SettingsScreen />,
        }}
      />
    </StackNavigator>
  );
}
