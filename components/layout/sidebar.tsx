"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Dumbbell, 
  Apple, 
  Target, 
  LineChart, 
  Calendar, 
  Bot, 
  Settings,
  X
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { Button } from "@/components/ui/button";
import { translations } from "@/lib/i18n/translations";

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar, language } = useAppStore();
  const t = translations[language].sidebar;

  const navItems = [
    { name: t.dashboard, href: "/app/dashboard", icon: LayoutDashboard },
    { name: t.workouts, href: "/app/workouts", icon: Dumbbell },
    { name: t.nutrition, href: "/app/nutrition", icon: Apple },
    { name: t.habits, href: "/app/habits", icon: Target },
    { name: t.progress, href: "/app/progress", icon: LineChart },
    { name: t.calendar, href: "/app/calendar", icon: Calendar },
    { name: t.assistant, href: "/app/assistant", icon: Bot },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={toggleSidebar}
        />
      )}
      
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transition-transform duration-300 ease-in-out lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center justify-between px-6 border-b border-border">
            <Link href="/app/dashboard" className="flex items-center gap-2 font-bold tracking-tight">
              <img src="/logo.png" alt="FITTO" className="h-9 w-auto" />
            </Link>
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={toggleSidebar}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          <nav className="flex-1 space-y-1 px-3 py-6 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium",
                    isActive 
                      ? "bg-primary/10 text-primary" 
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <item.icon className={cn("h-5 w-5", isActive ? "text-primary" : "text-muted-foreground")} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-border">
            <Link href="/app/settings" className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground">
              <Settings className="h-5 w-5" />
              {t.settings}
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}
