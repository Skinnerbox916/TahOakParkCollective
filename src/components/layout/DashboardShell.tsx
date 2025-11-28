"use client";

import { useState, useCallback } from "react";
import { DashboardHeader } from "./DashboardHeader";
import { DashboardSidebar } from "./DashboardSidebar";
import type { NavItem, DashboardType } from "@/lib/navigation";

interface DashboardShellProps {
  type: DashboardType;
  navItems: NavItem[];
  children: React.ReactNode;
}

/**
 * Shared dashboard layout shell for admin and portal pages.
 * Provides responsive navigation with desktop sidebar and mobile drawer.
 */
export function DashboardShell({ type, navItems, children }: DashboardShellProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleMenuClick = useCallback(() => {
    setIsDrawerOpen(true);
  }, []);

  const handleDrawerClose = useCallback(() => {
    setIsDrawerOpen(false);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader type={type} onMenuClick={handleMenuClick} />
      
      <div className="flex">
        <DashboardSidebar
          type={type}
          navItems={navItems}
          isDrawerOpen={isDrawerOpen}
          onDrawerClose={handleDrawerClose}
        />
        
        <main className="flex-1 p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

