import { type ReactNode } from "react";
import { Home, Calendar, Plus, BarChart2, Settings } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

// ─── Tab Types ────────────────────────────────────────────────────────────────

export type TabId = "home" | "calendar" | "add" | "stats" | "settings";

interface Tab {
  id: TabId;
  label: string;
  Icon: typeof Home;
  isSpecial?: boolean;
  path: string;
}

const TABS: Tab[] = [
  { id: "home", label: "Utama", Icon: Home, path: "/" },
  { id: "calendar", label: "Kalender", Icon: Calendar, path: "/calendar" },
  { id: "add", label: "Tambah", Icon: Plus, isSpecial: true, path: "/add" },
  { id: "stats", label: "Statistik", Icon: BarChart2, path: "/stats" },
  { id: "settings", label: "Profil", Icon: Settings, path: "/settings" },
];

// ─── TabBar Component ─────────────────────────────────────────────────────────

interface TabBarProps {
  activeTab: TabId;
}

function TabBar({ activeTab }: TabBarProps) {
  const navigate = useNavigate();

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
                onClick={() => navigate(tab.path)}
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
              onClick={() => navigate(tab.path)}
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
}

export function TabNavigator({
  screens,
}: TabNavigatorProps) {
  const location = useLocation();
  
  // Determine active tab from URL path
  let activeTab: TabId = "home";
  if (location.pathname.startsWith("/calendar")) activeTab = "calendar";
  else if (location.pathname.startsWith("/add")) activeTab = "add";
  else if (location.pathname.startsWith("/stats")) activeTab = "stats";
  else if (location.pathname.startsWith("/settings")) activeTab = "settings";

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
      <TabBar activeTab={activeTab} />
    </div>
  );
}

export { TabBar };
