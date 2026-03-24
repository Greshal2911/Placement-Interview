"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  BookMarked,
  PenTool,
  Zap,
  TrendingUp,
  Settings,
  Sparkles,
  ShieldCheck,
} from "lucide-react";

const mainNav = [
  { href: "/dashboard", label: "Dashboard", icon: TrendingUp },
  { href: "/modules", label: "Modules", icon: BookMarked },
  { href: "/practice", label: "Practice", icon: PenTool },
  { href: "/interview", label: "AI Interview", icon: Zap },
];

const secondaryNav = [
  { href: "/analytics", label: "Analytics", hint: "Insights", icon: BookOpen },
  { href: "/profile", label: "Profile", hint: "Setup", icon: ShieldCheck },
];

export function Sidebar() {
  const pathname = usePathname();

  const renderNavItem = (item: {
    href: string;
    label: string;
    icon: React.FC<React.SVGProps<SVGSVGElement>>;
    hint?: string;
  }) => {
    const Icon = item.icon;
    const isActive = pathname?.startsWith(item.href);
    return (
      <Link key={item.href} href={item.href}>
        <Button
          variant={isActive ? "default" : "ghost"}
          size="sm"
          className="w-full justify-between gap-3 rounded-2xl"
        >
          <span className="flex items-center gap-3 text-sm font-medium">
            <Icon className="w-4 h-4" />
            {item.label}
          </span>
          {item.hint && (
            <span className="text-xs uppercase tracking-wide text-slate-500">
              {item.hint}
            </span>
          )}
        </Button>
      </Link>
    );
  };

  return (
    <aside className="hidden xl:flex flex-col w-72 bg-gradient-to-b from-card to-[#14192f] h-screen sticky top-0 border-r border-border shadow-lg">
      <div className="px-6 py-5 border-b border-border">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
          Quick Prep
        </p>
        <h2 className="text-2xl font-semibold mt-1 text-foreground">Placement Lab</h2>
        <p className="text-sm text-muted-foreground mt-1">OOPs · C++ · Interviews</p>
      </div>

      <div className="px-6 py-5 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground uppercase">Progress</p>
          <span className="text-xs text-emerald-400">Streak 7d</span>
        </div>
        <div className="relative h-2 rounded-full bg-muted">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
            style={{ width: "62%" }}
          />
        </div>
        <p className="text-xs text-muted-foreground">Module completion 62%</p>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
        <section>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-muted-foreground uppercase">Navigation</p>
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <div className="space-y-2">{mainNav.map(renderNavItem)}</div>
        </section>

        <section className="pt-3">
          <p className="text-xs text-muted-foreground uppercase mb-2">Extras</p>
          <div className="space-y-2">{secondaryNav.map(renderNavItem)}</div>
        </section>
      </div>

      <div className="border-t border-border px-6 py-5 space-y-3">
        <p className="text-xs text-muted-foreground uppercase">Need a push?</p>
        <p className="text-sm text-foreground leading-tight">
          Reserve a slot with Gemini Coach to rehearse interviews and get
          instant feedback.
        </p>
        <Link href="/interview">
          <Button
            variant="default"
            size="sm"
            className="w-full rounded-full"
          >
            <span className="flex items-center justify-center gap-2 font-semibold">
              <Zap className="w-4 h-4" />
              Start AI Interview
            </span>
          </Button>
        </Link>
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2 rounded-full"
        >
          <Settings className="w-4 h-4" />
          Settings
        </Button>
      </div>
    </aside>
  );
}
