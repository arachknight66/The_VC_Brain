"use client";

import React, { useEffect, useState, useContext } from "react";
import { Search, Bell, Sun, Moon, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { CommandPalette } from "@/components/ui/command-palette";
import { MobileMenuContext } from "./app-shell";
// Minimal hook mock if use-theme doesn't exist yet
import { useTheme as useNextTheme } from "next-themes";

export function useTheme() {
  try {
    const context = require("@/hooks/use-theme");
    return context.useTheme();
  } catch (e) {
    try {
      return useNextTheme();
    } catch(err) {
      return { theme: "dark", setTheme: () => {} };
    }
  }
}

interface TopbarProps {
  title: string;
  subtitle?: string;
}

export function Topbar({ title, subtitle }: TopbarProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  
  const mobileCtx = useContext(MobileMenuContext);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle Ctrl+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCmdOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-20 flex h-14 w-full items-center justify-between border-b border-border bg-background/70 px-4 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <button
            onClick={() => mobileCtx?.setMobileOpen(true)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-input bg-transparent text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 lg:hidden"
          >
            <Menu className="h-4 w-4" />
          </button>
          
          <div className="flex flex-col">
            <h1 className="text-sm font-semibold tracking-tight lg:text-base">{title}</h1>
            {subtitle && (
              <span className="text-xs text-muted-foreground">{subtitle}</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Search trigger */}
          <button
            onClick={() => setCmdOpen(true)}
            className="group relative inline-flex h-9 w-full sm:w-64 items-center justify-start rounded-[0.5rem] bg-muted/50 px-4 py-2 text-sm font-normal text-muted-foreground shadow-none transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring sm:pr-12"
          >
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <span className="hidden lg:inline-flex">Search or command...</span>
            <span className="inline-flex lg:hidden">Search...</span>
            <kbd className="pointer-events-none absolute right-[0.3rem] top-[0.3rem] hidden h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
              <span className="text-xs">⌘</span>K
            </kbd>
          </button>

          <div className="flex items-center gap-1 ml-2">
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
              aria-label="Toggle theme"
            >
              {mounted ? (
                theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />
              ) : (
                <div className="h-4 w-4" />
              )}
            </button>
            <button className="inline-flex h-9 w-9 items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 relative">
              <Bell className="h-4 w-4" />
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary"></span>
            </button>
          </div>
        </div>
      </header>
      
      <CommandPalette open={cmdOpen} setOpen={setCmdOpen} />
    </>
  );
}
