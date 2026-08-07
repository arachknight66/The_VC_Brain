"use client";

import React, { useState } from "react";
import { Sidebar } from "./sidebar";

export const MobileMenuContext = React.createContext<{
  setMobileOpen: (open: boolean) => void;
}>({
  setMobileOpen: () => {},
});

interface AppShellProps {
  children: React.ReactNode;
  user?: { email: string; displayName: string };
}

export function AppShell({ children, user }: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden text-foreground selection:bg-primary/20">
      <Sidebar 
        collapsed={collapsed} 
        setCollapsed={setCollapsed} 
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        user={user}
      />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <MobileMenuContext.Provider value={{ setMobileOpen }}>
          {children}
        </MobileMenuContext.Provider>
      </main>
    </div>
  );
}
