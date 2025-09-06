'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { ProtectedRoute } from './protected-route';
import { useGlobalLoading } from '@/hooks/useGlobalLoading';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export function DashboardLayout({ children, title }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const { hideLoading } = useGlobalLoading();

  // Hide loading when pathname changes (page has loaded)
  useEffect(() => {
    hideLoading();
  }, [pathname, hideLoading]);

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-background">
        <Sidebar />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header 
            title={title}
            onMenuClick={() => setSidebarOpen(!sidebarOpen)} 
          />
          
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background">
            <div className="container mx-auto px-4 py-6 lg:px-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}