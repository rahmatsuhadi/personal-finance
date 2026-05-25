import { useAuth } from "@/hooks/useAuth";
import { Routes, Route, Navigate } from "react-router-dom";
import { OnboardingScreen } from "@/pages/auth/OnboardingScreen";
import { TabNavigator } from "@/navigation/TabNavigator";
import { HomeScreen } from "@/pages/home/HomeScreen";
import { CalendarScreen } from "@/pages/calendar/CalendarScreen";
import { AddTransactionScreen } from "@/pages/transactions/AddTransactionScreen";
import { StatisticsScreen } from "@/pages/statistics/StatisticsScreen";
import { SettingsScreen } from "@/pages/settings/SettingsScreen";
import { TransactionDetailScreen } from "@/pages/transactions/TransactionDetailScreen";
import { EditTransactionScreen } from "@/pages/transactions/EditTransactionScreen";
import { AIChatbotScreen } from "@/pages/ai-chat/AIChatbotScreen";
import { CategoryListScreen } from "@/pages/categories/CategoryListScreen";
import { BudgetSetupScreen } from "@/pages/budgets/BudgetSetupScreen";
import { BudgetFormScreen } from "@/pages/budgets/BudgetFormScreen";
import { BudgetDetailScreen } from "@/pages/budgets/BudgetDetailScreen";

// ─── AppNavigator ─────────────────────────────────────────────────────────────
// Root conditional router — checks user profile in DB to decide which flow to show.

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

  // Not authenticated → Onboarding
  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/onboarding" element={<OnboardingScreen />} />
        <Route path="*" element={<Navigate to="/onboarding" replace />} />
      </Routes>
    );
  }

  // Authenticated → Main App with TabNavigator and Stack Screens
  return (
    <div className="relative h-dvh w-full overflow-hidden">
      <TabNavigator
        screens={{
          home: <HomeScreen />,
          calendar: <CalendarScreen />,
          add: <AddTransactionScreen />,
          stats: <StatisticsScreen />,
          settings: <SettingsScreen />,
        }}
      />

      {/* Stack screens on top of TabNavigator */}
      <Routes>
        <Route path="/transaction/:id" element={
          <div className="absolute inset-0 z-[60] bg-brutal-bg animate-in slide-in-from-right duration-250 ease-out">
            <TransactionDetailScreen />
          </div>
        } />
        <Route path="/transaction/edit/:id" element={
          <div className="absolute inset-0 z-[60] bg-brutal-bg animate-in slide-in-from-right duration-250 ease-out">
            <EditTransactionScreen />
          </div>
        } />
        <Route path="/settings/categories" element={
          <div className="absolute inset-0 z-[60] bg-brutal-bg animate-in slide-in-from-right duration-250 ease-out">
            <CategoryListScreen />
          </div>
        } />
        <Route path="/settings/budgets" element={
          <div className="absolute inset-0 z-[60] bg-brutal-bg animate-in slide-in-from-right duration-250 ease-out">
            <BudgetSetupScreen />
          </div>
        } />
        <Route path="/settings/budgets/add" element={
          <div className="absolute inset-0 z-[70] bg-brutal-bg animate-in slide-in-from-right duration-250 ease-out">
            <BudgetFormScreen />
          </div>
        } />
        <Route path="/settings/budgets/edit/:id" element={
          <div className="absolute inset-0 z-[70] bg-brutal-bg animate-in slide-in-from-right duration-250 ease-out">
            <BudgetFormScreen />
          </div>
        } />
        <Route path="/budgets/:id" element={
          <div className="absolute inset-0 z-[60] bg-brutal-bg animate-in slide-in-from-right duration-250 ease-out">
            <BudgetDetailScreen />
          </div>
        } />
        <Route path="/ai-chat" element={
          <div className="absolute inset-0 z-[60] bg-brutal-bg animate-in slide-in-from-right duration-250 ease-out">
            <AIChatbotScreen />
          </div>
        } />
      </Routes>
    </div>
  );
}
