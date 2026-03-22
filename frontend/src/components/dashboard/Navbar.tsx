import { useState } from "react";
import { Activity, Bell, Moon, Sun, Search, LogOut } from "lucide-react";

interface NavbarProps {
  isDark: boolean;
  onToggleTheme: () => void;
  user: { name: string; email: string };
  onLogout: () => void;
}

const Navbar = ({ isDark, onToggleTheme, user, onLogout }: NavbarProps) => {
  const [alertCount] = useState(3);
  const initials = user.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <nav className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-[1600px] mx-auto px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md gradient-accent flex items-center justify-center">
              <Activity className="w-4 h-4 text-card" />
            </div>
            <span className="font-display text-lg font-semibold tracking-tight text-foreground">
              FinSight
            </span>
          </div>
          <span className="text-muted-foreground text-xs font-body tracking-wider uppercase ml-2 hidden sm:inline">
            Anomaly Intelligence
          </span>
        </div>

        <div className="flex items-center gap-1">
          <div className="hidden md:flex items-center bg-secondary/50 rounded-md px-3 py-1.5 gap-2 mr-2">
            <Search className="w-3.5 h-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search ticker..."
              className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none w-32 font-body"
            />
          </div>

          <button
            onClick={onToggleTheme}
            className="p-2 rounded-md hover:bg-secondary/70 transition-colors text-muted-foreground hover:text-foreground"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <button className="p-2 rounded-md hover:bg-secondary/70 transition-colors text-muted-foreground hover:text-foreground relative">
            <Bell className="w-4 h-4" />
            {alertCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-accent-rose animate-pulse-subtle" />
            )}
          </button>

          <div className="flex items-center gap-2 ml-2 pl-2 border-l border-border">
            <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-xs font-medium text-foreground">
              {initials}
            </div>
            <span className="text-sm text-foreground hidden sm:block font-body">
              {user.name.split(" ")[0]}
            </span>
            <button
              onClick={onLogout}
              className="p-1.5 rounded-md hover:bg-secondary/70 transition-colors text-muted-foreground hover:text-red-400 ml-1"
              title="Logout"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;