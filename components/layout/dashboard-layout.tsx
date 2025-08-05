'use client';

import { useState } from 'react';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { ProtectedRoute } from './protected-route';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export function DashboardLayout({ children, title }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

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