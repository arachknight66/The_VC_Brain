"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Compass,
  Building2,
  GitCommitHorizontal,
  FileText,
  Sparkles,
  Settings,
  HelpCircle,
  MessageSquare,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn, initials } from "@/lib/utils";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  user?: {
    displayName?: string;
    email?: string;
  };
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const mainNavItems = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Discovery", href: "/signals", icon: Compass },
    { label: "Companies", href: "/companies", icon: Building2 },
    { label: "Diligence", href: "/pipeline", icon: GitCommitHorizontal },
    { label: "Memos", href: "/copilot", icon: FileText },
  ];

  const bottomNavItems = [
    { label: "Settings", href: "/settings", icon: Settings },
    { label: "Help", href: "#", icon: HelpCircle },
    { label: "Feedback", href: "#", icon: MessageSquare },
  ];

  return (
    <aside
      className={cn(
        "relative flex flex-col justify-between border-r border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] transition-all duration-300 ease-in-out select-none",
        collapsed ? "w-16" : "w-[240px]"
      )}
    >
      {/* Top Header & Logo */}
      <div className="p-5 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white font-bold shadow-md shadow-blue-500/20">
              VB
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="font-bold text-base tracking-tight text-blue-600 leading-tight">
                  The VC Brain
                </span>
                <span className="text-[10px] font-semibold tracking-wider text-[var(--color-text-tertiary)] uppercase">
                  INTELLIGENCE PLATFORM
                </span>
              </div>
            )}
          </Link>
        </div>

        {/* Primary Action Button */}
        {!collapsed ? (
          <Link href="/copilot">
            <Button className="w-full justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 shadow-sm shadow-blue-500/20 transition-all">
              <Sparkles size={16} />
              <span>Generate Memo</span>
            </Button>
          </Link>
        ) : (
          <Link href="/copilot" title="Generate Memo">
            <Button size="icon" className="w-full h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white">
              <Sparkles size={16} />
            </Button>
          </Link>
        )}

        {/* Main Navigation Links */}
        <nav className="flex flex-col gap-1 mt-2">
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                  isActive
                    ? "bg-blue-600 text-white shadow-sm shadow-blue-500/20"
                    : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]"
                )}
                title={collapsed ? item.label : undefined}
              >
                <Icon size={18} className={cn(isActive ? "text-white" : "text-[var(--color-text-tertiary)]")} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Footer Section */}
      <div className="p-4 border-t border-[var(--color-border-subtle)] flex flex-col gap-3">
        <nav className="flex flex-col gap-1">
          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "text-blue-600 bg-blue-50/50"
                    : "text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]"
                )}
                title={collapsed ? item.label : undefined}
              >
                <Icon size={17} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User Account / Logout */}
        <div className="pt-2 flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-700 font-semibold text-xs">
              {initials(user?.displayName || "Partner")}
            </div>
            {!collapsed && (
              <div className="flex flex-col truncate">
                <span className="text-xs font-semibold text-[var(--color-text-primary)] truncate">
                  {user?.displayName || "Partner Access"}
                </span>
                <span className="text-[10px] text-[var(--color-text-tertiary)] truncate">
                  {user?.email || "partner@vcbrain.ai"}
                </span>
              </div>
            )}
          </div>
          <Link
            href="/api/auth/google/logout"
            className="text-[var(--color-text-tertiary)] hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
            title="Sign out"
          >
            <LogOut size={16} />
          </Link>
        </div>

        {/* Collapse Toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-7 flex h-6 w-6 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] shadow-sm"
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>
    </aside>
  );
}
