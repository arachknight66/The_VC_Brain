"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Building2,
  Users,
  GitMerge,
  Radio,
  Bot,
  Settings,
  Plus,
  Upload,
  SunMoon,
  Search
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "./../layout/topbar";

interface CommandPaletteProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export function CommandPalette({ open, setOpen }: CommandPaletteProps) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [setOpen]);

  if (!open) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] sm:pt-[20vh]">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 bg-background/80 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative z-50 w-full max-w-xl overflow-hidden rounded-xl border border-border bg-card shadow-2xl mx-4"
        >
          <Command
            className="flex h-full w-full flex-col overflow-hidden bg-transparent"
            loop
          >
            <div className="flex items-center border-b border-border px-3">
              <Search className="mr-2 h-4 w-4 shrink-0 text-muted-foreground opacity-50" />
              <Command.Input
                autoFocus
                placeholder="Type a command or search..."
                className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 text-foreground"
              />
            </div>
            <Command.List className="max-h-[300px] overflow-y-auto overflow-x-hidden p-2 text-sm text-foreground scrollbar-hide">
              <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
                No results found.
              </Command.Empty>

              <Command.Group heading="Navigation" className="text-muted-foreground text-xs font-medium px-2 py-1.5 [&_[cmdk-group-items]]:flex [&_[cmdk-group-items]]:flex-col [&_[cmdk-group-items]]:gap-1">
                <Command.Item
                  onSelect={() => { router.push("/dashboard"); setOpen(false); }}
                  className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 text-foreground transition-colors"
                >
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  <span>Dashboard</span>
                </Command.Item>
                <Command.Item
                  onSelect={() => { router.push("/companies"); setOpen(false); }}
                  className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 text-foreground transition-colors"
                >
                  <Building2 className="mr-2 h-4 w-4" />
                  <span>Companies</span>
                </Command.Item>
                <Command.Item
                  onSelect={() => { router.push("/founders"); setOpen(false); }}
                  className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 text-foreground transition-colors"
                >
                  <Users className="mr-2 h-4 w-4" />
                  <span>Founders</span>
                </Command.Item>
                <Command.Item
                  onSelect={() => { router.push("/pipeline"); setOpen(false); }}
                  className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 text-foreground transition-colors"
                >
                  <GitMerge className="mr-2 h-4 w-4" />
                  <span>Pipeline</span>
                </Command.Item>
                <Command.Item
                  onSelect={() => { router.push("/signals"); setOpen(false); }}
                  className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 text-foreground transition-colors"
                >
                  <Radio className="mr-2 h-4 w-4" />
                  <span>Signals</span>
                </Command.Item>
                <Command.Item
                  onSelect={() => { router.push("/copilot"); setOpen(false); }}
                  className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 text-foreground transition-colors"
                >
                  <Bot className="mr-2 h-4 w-4" />
                  <span>Copilot</span>
                </Command.Item>
              </Command.Group>

              <Command.Separator className="-mx-2 h-px bg-border my-1" />

              <Command.Group heading="Actions" className="text-muted-foreground text-xs font-medium px-2 py-1.5 [&_[cmdk-group-items]]:flex [&_[cmdk-group-items]]:flex-col [&_[cmdk-group-items]]:gap-1">
                <Command.Item
                  onSelect={() => { console.log("New scan"); setOpen(false); }}
                  className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 text-foreground transition-colors"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  <span>New scan</span>
                  <CommandShortcut className="ml-auto text-[10px] tracking-widest text-muted-foreground opacity-70">⌘N</CommandShortcut>
                </Command.Item>
                <Command.Item
                  onSelect={() => { console.log("Upload pitch deck"); setOpen(false); }}
                  className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 text-foreground transition-colors"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  <span>Upload pitch deck</span>
                </Command.Item>
                <Command.Item
                  onSelect={() => { setTheme(theme === 'dark' ? 'light' : 'dark'); setOpen(false); }}
                  className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 text-foreground transition-colors"
                >
                  <SunMoon className="mr-2 h-4 w-4" />
                  <span>Toggle theme</span>
                </Command.Item>
              </Command.Group>
            </Command.List>
          </Command>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

function CommandShortcut({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn("ml-auto text-xs tracking-widest text-muted-foreground", className)}
      {...props}
    />
  )
}
