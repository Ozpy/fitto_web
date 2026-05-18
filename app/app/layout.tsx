"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { useAppStore } from "@/store/useAppStore";
import { Button } from "@/components/ui/button";
import { Menu, Globe } from "lucide-react";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { toggleSidebar, language, setLanguage } = useAppStore();

  const toggleLanguage = () => {
    setLanguage(language === 'es' ? 'en' : 'es');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-md lg:px-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={toggleSidebar}>
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold lg:hidden">FITTO</h1>
          </div>
          <div className="flex items-center gap-4">
            {/* Language Switcher */}
            <Button variant="ghost" size="sm" onClick={toggleLanguage} className="text-xs uppercase font-semibold text-muted-foreground hover:text-foreground">
              <Globe className="mr-2 h-4 w-4" />
              {language}
            </Button>
            
            {/* User profile dropdown etc could go here */}
            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-sm cursor-pointer">
              U
            </div>
          </div>
        </header>
        <div className="p-4 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
