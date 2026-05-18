"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { useAppStore } from "@/store/useAppStore";
import { Button } from "@/components/ui/button";
import { Menu, Globe, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { toggleSidebar, language, setLanguage } = useAppStore();
  const router = useRouter();

  const toggleLanguage = () => {
    setLanguage(language === 'es' ? 'en' : 'es');
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      router.push("/auth/login");
    } catch (e) {
      console.error("Error signing out", e);
    }
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
            
            {/* User profile avatar */}
            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm select-none">
              U
            </div>

            {/* Sign Out Button */}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleSignOut} 
              className="text-xs font-semibold text-destructive hover:text-destructive hover:bg-destructive/10 gap-1.5 px-3 py-1.5 rounded-full"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Cerrar Sesión</span>
            </Button>
          </div>
        </header>
        <div className="p-4 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
