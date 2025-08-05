"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import {
  Users,
  Calendar,
  MessageSquare,
  BarChart3,
  Settings,
  LogOut,
  Heart,
  Menu,
  X,
  ChevronLeft,
  Shield,
  FileText,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const navigationItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: BarChart3,
  },
  {
    title: "Specialist Management",
    href: "/doctors",
    icon: Users,
  },
  {
    title: "Patient Management",
    href: "/patients",
    icon: Users,
  },
  {
    title: "Patient Feedback",
    href: "/feedback",
    icon: MessageSquare,
  },
  // {
  //   title: "Activity Logs",
  //   href: "/activity-logs",
  //   icon: Activity,
  // },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();
  const { user, isSuperadmin } = useAuth();

  // Get user display information
  const getUserDisplayName = () => {
    if (isSuperadmin()) {
      return "Super Admin";
    }
    if (user?.firstName) {
      return user.firstName;
    }
    if (user?.displayName) {
      return user.displayName;
    }
    return "Admin User";
  };

  const getUserEmail = () => {
    // Get email from localStorage for superadmin, otherwise use user object
    if (isSuperadmin()) {
      return localStorage.getItem('userEmail') || "admin@unihealth.ph";
    }
    return user?.email || "admin@unihealth.ph";
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {/* {!isCollapsed && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsCollapsed(true)}
        />
      )} */}
      {isCollapsed && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(false)}
          className="fixed top-3 left-4 z-50 lg:hidden bg-background/80 backdrop-blur"
        >
          <Menu className="h-5 w-5" />
        </Button>
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed left-0 top-0 z-50 h-full sidebar-gradient border-r border-border/20 transition-all duration-300 lg:relative lg:z-auto",
          isCollapsed ? "-translate-x-full lg:translate-x-0 lg:w-16" : "w-64"
        )}
      >
        {/* Header */}
        <div className={`flex h-16 items-center justify-between ${isCollapsed ? "px-4" : "px-4 pr-2"} border-b border-border/20`}>
          {!isCollapsed && (
            <div className="flex items-center space-x-2">
              <div className="bg-primary rounded-lg p-2">
                <Heart className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">UniHealth</h2>
                <p className="text-xs text-slate-300">Admin Portal</p>
              </div>
            </div>
          )}
          {/* Toggle Button for Desktop */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="fixed top-3 left-4 z-40 text-slate-300 backdrop-blur hidden lg:flex lg:left-auto lg:relative lg:top-auto hover:bg-white/10 transition-colors hover:text-white duration-200"
          >
            {isCollapsed ? (
              <Menu className="h-5 w-5" />
            ) : (
              <X className="h-5 w-5" />
            )}
          </Button>

          {/* Toggle Button for Mobile */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-slate-300 hover:bg-white/10 hover:text-white lg:hidden"
          >
            {/* {isCollapsed ? (
              <Menu className="h-5 w-5" />
            ) : (
              <X className="h-5 w-5" />
            )} */}
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4">
          <div className="space-y-1">
            {navigationItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-primary text-white shadow-lg"
                      : "text-slate-300 hover:bg-white/10 hover:text-white",
                    isCollapsed && "justify-center px-2"
                  )}
                >
                  <item.icon
                    className={cn("h-5 w-5", !isCollapsed && "mr-3")}
                  />
                  {!isCollapsed && <span>{item.title}</span>}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* User Section */}
        <div className="border-t border-border/20 p-3">
          <div
            className={cn(
              "flex items-center space-x-3 rounded-lg bg-white/5 p-3",
              isCollapsed && "justify-center bg-transparent p-0"
            )}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
              <Shield className="h-4 w-4 text-white" />
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {getUserDisplayName()}
                </p>
                <p className="text-xs text-slate-300 truncate">
                  {getUserEmail()}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Toggle Button for Desktop */}
      {/* <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="fixed top-4 left-4 z-40 bg-background/80 backdrop-blur hidden lg:flex lg:left-auto lg:relative lg:top-auto"
      >
        <Menu className="h-5 w-5" />
      </Button> */}
    </>
  );
}
