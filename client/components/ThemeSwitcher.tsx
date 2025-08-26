// client/components/ThemeSwitcher.tsx

import { Button } from "@/components/ui/button";
import { Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ThemeSwitcherProps {
  isExpanded: boolean;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
}

export function ThemeSwitcher({ isExpanded, theme, setTheme }: ThemeSwitcherProps) {
  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className={cn(
          "flex items-center p-3 w-full rounded-lg text-left",
          theme === 'light' ? 'text-gray-700 hover:bg-gray-100' : 'text-gray-200 hover:bg-gray-700'
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
        {theme === "dark" ? "Light Mode" : "Dark Mode"}
      </span>
    </button>
  );
}