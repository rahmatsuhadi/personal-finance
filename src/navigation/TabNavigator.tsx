import { useState, type ReactNode } from "react";
import { Home, Calendar, Plus, BarChart2, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Tab Types ────────────────────────────────────────────────────────────────

export type TabId = "home" | "calendar" | "add" | "stats" | "settings";

interface Tab {
  id: TabId;
  label: string;
  Icon: typeof Home;
  isSpecial?: boolean;
}

const TABS: Tab[] = [
  { id: "home", label: "Utama", Icon: Home },
  { id: "calendar", label: "Kalender", Icon: Calendar },
  { id: "add", label: "Tambah", Icon: Plus, isSpecial: true },
  { id: "stats", label: "Statistik", Icon: BarChart2 },
  { id: "settings", label: "Profil", Icon: Settings },
];

// ─── TabBar Component ─────────────────────────────────────────────────────────

interface TabBarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

function TabBar({ activeTab, onTabChange }: TabBarProps) {
  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50",
        "border-t-2 border-brutal-black bg-brutal-bg",
        "pb-[var(--safe-bottom)]"
      )}
      style={{ boxShadow: "0 -4px 0px 0px #0a0a0a" }}
    >
      <div className="flex h-[64px] items-stretch">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;

          if (tab.isSpecial) {
            return (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  "flex flex-1 flex-col items-center justify-center",
                  "border-l-2 border-r-2 border-brutal-black",
                  "brutal-press"
                )}
              >
                {/* FAB-style Plus button */}
                <div
                  className={cn(
                    "flex h-12 w-12 items-center justify-center",
                    "border-2 border-brutal-black bg-brutal-lime",
                    "shadow-brutal-md brutal-press"
                  )}
                >
                  <Plus size={24} strokeWidth={3} />
                </div>
              </button>
            );
          }

          return (
            <button
              key={tab.id}
              id={`tab-${tab.id}`}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1",
                "border-r-2 border-brutal-black transition-colors",
                "last:border-r-0 first:border-l-0",
                isActive ? "bg-brutal-black text-brutal-lime" : "bg-transparent text-brutal-black"
              )}
            >
              <tab.Icon
                size={20}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span className="text-[10px] font-bold uppercase tracking-wider">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

// ─── TabNavigator ─────────────────────────────────────────────────────────────

interface TabNavigatorProps {
  screens: Record<TabId, ReactNode>;
  defaultTab?: TabId;
}

export function TabNavigator({
  screens,
  defaultTab = "home",
}: TabNavigatorProps) {
  const [activeTab, setActiveTab] = useState<TabId>(defaultTab);

  return (
    <div className="relative flex h-dvh flex-col bg-brutal-bg">
      {/* Screen content */}
      <div className="flex-1 overflow-hidden">
        {Object.entries(screens).map(([tabId, screen]) => (
          <div
            key={tabId}
            className={cn(
              "h-full w-full overflow-y-auto",
              tabId === activeTab ? "block" : "hidden"
            )}
          >
            {screen}
          </div>
        ))}
      </div>

      {/* Bottom Tab Bar */}
      <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}

export { TabBar };
