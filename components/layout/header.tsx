"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Settings, LogOut, User, Shield, Menu } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

interface HeaderProps {
  title?: string;
  onMenuClick?: () => void;
}

export function Header({ title, onMenuClick }: HeaderProps) {
  const { user, signOut, isSuperadmin } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutDialog, setLogoutDialog] = useState(false);

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
    return user?.email || "admin@unihealth.ph";
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 lg:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onMenuClick}
      >
        <Menu className="h-5 w-5" />
      </Button>

      <div className="flex-1 flex items-center gap-4">
        <h1 className="text-xl font-semibold">UniHealth Admin</h1>
        {isSuperadmin() && (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            <Shield className="h-3 w-3 mr-1" />
            Super Admin
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* Theme Toggle */}
        <ThemeToggle />

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src="" alt={user.email} />
                <AvatarFallback>
                  {user.email.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{getUserDisplayName()}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {getUserEmail()}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setLogoutDialog(true)} disabled={isLoggingOut}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sign out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>

    {/* Logout Confirmation Dialog */}
    <ConfirmationDialog
      open={logoutDialog}
      onOpenChange={setLogoutDialog}
      title="Confirm Sign Out"
      description="Are you sure you want to sign out? You will need to log in again to access the system."
      confirmText="Sign Out"
      cancelText="Cancel"
      variant="default"
      loading={isLoggingOut}
      onConfirm={handleLogout}
    />
    </>
  );
}