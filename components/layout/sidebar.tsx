"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { SecureSessionStorage } from "@/lib/utils/session-storage";
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
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigationLoading } from "@/hooks/useNavigationLoading";
import { ModernSidebarLoader } from "@/components/ui/modern-sidebar-loader";
import { useAllPendingCounts } from "@/hooks/usePendingCounts";

const navigationItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: BarChart3,
    showPendingCount: false,
  },
  {
    title: "Appointments Monitoring",
    href: "/appointments",
    icon: Calendar,
    showPendingCount: true,
    pendingKey: 'appointmentsPending',
  },
  {
    title: "Specialist Management",
    href: "/doctors",
    icon: Users,
    showPendingCount: true,
    pendingKey: 'specialistsPending',
  },
  {
    title: "Patient Management",
    href: "/patients",
    icon: Users,
    showPendingCount: false,
  },
  {
    title: "Patient Feedback",
    href: "/feedback",
    icon: MessageSquare,
    showPendingCount: false,
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
    showPendingCount: false,
  },
];

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();
  const { user, isSuperadmin } = useAuth();
  const { isNavigating, loadingPath, navigateWithLoading } = useNavigationLoading({
    loadingMessage: '', // No message for clean tab navigation
    delay: 1000, // Wait 1 second after navigation to ensure page is loaded
  });
  
  // Get pending counts for sidebar indicators
  const { appointmentsPending, specialistsPending, loading: pendingCountsLoading } = useAllPendingCounts();

  // Get user display information
  const getUserDisplayName = () => {
    // if (isSuperadmin()) {
    //   return "Super Admin";
    // }
    if (user?.firstName && user?.lastName) {
      return user.firstName + " " + user.lastName;
    }
    if (user?.displayName) {
      return user.displayName;
    }
    return "Admin User";
  };

  const getUserEmail = () => {
    // Get email from localStorage for superadmin, otherwise use user object
    if (isSuperadmin()) {
      const storedEmail = localStorage.getItem('userEmail');
      const sessionEmail = SecureSessionStorage.getUserEmail();
      return storedEmail || sessionEmail || "";
    }
    return user?.email || "";
  };

  // Handle navigation with loading state
  const handleNavigation = (href: string, title: string) => {
    navigateWithLoading(href, ''); // No message for clean tab navigation
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
          "fixed left-0 top-0 z-50 h-full flex flex-col sidebar-gradient border-r border-border/20 transition-all duration-300 lg:relative lg:z-auto",
          isCollapsed ? "-translate-x-full lg:translate-x-0 lg:w-16" : "w-63"
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
              const isLoading = loadingPath === item.href;
              
              // Get pending count for this item
              const getPendingCount = () => {
                if (!item.showPendingCount || !item.pendingKey) return 0;
                if (item.pendingKey === 'appointmentsPending') return appointmentsPending;
                if (item.pendingKey === 'specialistsPending') return specialistsPending;
                return 0;
              };
              
              const pendingCount = getPendingCount();
              
              return (
                <button
                  key={item.href}
                  onClick={() => handleNavigation(item.href, item.title)}
                  className={cn(
                    "flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 w-full text-left relative",
                    isActive
                      ? "bg-primary text-white shadow-lg"
                      : "text-slate-300 hover:bg-white/10 hover:text-white",
                    isCollapsed && "justify-center px-2",
                    (isLoading || isNavigating) && "opacity-75 cursor-not-allowed"
                  )}
                  disabled={isLoading || isNavigating}
                >
                  {isLoading ? (
                    <ModernSidebarLoader 
                      className={cn(!isCollapsed && "mr-3")} 
                      variant={isActive ? "light" : "dark"}
                    />
                  ) : (
                    <item.icon
                      className={cn("h-5 w-5", !isCollapsed && "mr-3")}
                    />
                  )}
                  {!isCollapsed && (
                    <div className="flex items-center justify-between w-full">
                      <span>{item.title}</span>
                      {item.showPendingCount && pendingCount > 0 && (
                        <div className="ml-2 flex items-center justify-center w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full">
                          {pendingCount}
                        </div>
                      )}
                    </div>
                  )}
                  {isCollapsed && item.showPendingCount && pendingCount > 0 && (
                    <div className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 bg-red-500 text-white text-xs font-bold rounded-full">
                      {pendingCount}
                    </div>
                  )}
                </button>
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
