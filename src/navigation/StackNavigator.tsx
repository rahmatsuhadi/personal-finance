import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface StackEntry {
  id: string;
  screen: ReactNode;
}

interface StackContextValue {
  /** Push a new screen on top of the stack */
  push: (screen: ReactNode) => void;
  /** Pop the top screen off the stack */
  pop: () => void;
  /** Pop all screens, return to root */
  popAll: () => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const StackContext = createContext<StackContextValue>({
  push: () => {},
  pop: () => {},
  popAll: () => {},
});

export function useStack() {
  return useContext(StackContext);
}

// ─── StackNavigator Provider ──────────────────────────────────────────────────

interface StackNavigatorProps {
  /** The base content (TabNavigator lives here) */
  children: ReactNode;
}

export function StackNavigator({ children }: StackNavigatorProps) {
  const [stack, setStack] = useState<StackEntry[]>([]);

  const push = useCallback((screen: ReactNode) => {
    const id = `stack-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setStack((prev) => [...prev, { id, screen }]);
  }, []);

  const pop = useCallback(() => {
    setStack((prev) => prev.slice(0, -1));
  }, []);

  const popAll = useCallback(() => {
    setStack([]);
  }, []);

  return (
    <StackContext.Provider value={{ push, pop, popAll }}>
      {/* Base layer — TabNavigator */}
      <div className="relative h-dvh w-full overflow-hidden">
        {children}

        {/* Stack screens — rendered on top, absolute positioned */}
        {stack.map((entry, index) => (
          <div
            key={entry.id}
            className={cn(
              "absolute inset-0 z-50 bg-brutal-bg",
              "animate-in slide-in-from-right duration-250 ease-out"
            )}
            style={{ zIndex: 50 + index }}
          >
            {entry.screen}
          </div>
        ))}
      </div>
    </StackContext.Provider>
  );
}
