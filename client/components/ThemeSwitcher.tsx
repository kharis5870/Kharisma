// client/components/ThemeSwitcher.tsx

import { Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/stores/useSidebarStore";

interface ThemeSwitcherProps {
  isExpanded: boolean;
}

/**
 * Komponen ini membaca store sendiri, bukan menerima `theme`/`setTheme` sebagai
 * prop. Dia satu-satunya pemakai `setTheme`, jadi setelah perubahan ini `theme`
 * keluar sepenuhnya dari pohon komponen Sidebar — warnanya sekarang diurus
 * class `dark` di <html> dan token --sidebar-*, bukan ternary manual.
 */
export function ThemeSwitcher({ isExpanded }: ThemeSwitcherProps) {
  const { theme, setTheme } = useSidebarStore();

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className={cn(
        "flex items-center p-3 w-full rounded-lg text-left transition-colors",
        "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
      )}
    >
      {theme === "dark" ? (
        <Sun className="w-6 h-6 flex-shrink-0" />
      ) : (
        <Moon className="w-6 h-6 flex-shrink-0" />
      )}
      <span className={cn(
        "ml-4 overflow-hidden whitespace-nowrap transition-all duration-300",
        isExpanded ? 'w-full opacity-100' : 'w-0 opacity-0'
      )}>
        {theme === "dark" ? "Mode Terang" : "Mode Gelap"}
      </span>
    </button>
  );
}
