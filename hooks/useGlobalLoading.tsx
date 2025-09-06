'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface GlobalLoadingContextType {
  isLoading: boolean;
  loadingMessage: string | null;
  setLoading: (loading: boolean, message?: string) => void;
  showLoading: (message?: string) => void;
  hideLoading: () => void;
}

const GlobalLoadingContext = createContext<GlobalLoadingContextType | undefined>(undefined);

interface GlobalLoadingProviderProps {
  children: ReactNode;
}

export function GlobalLoadingProvider({ children }: GlobalLoadingProviderProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState<string | null>(null);

  const setLoading = useCallback((loading: boolean, message?: string) => {
    setIsLoading(loading);
    setLoadingMessage(message || null);
  }, []);

  const showLoading = useCallback((message?: string) => {
    setLoading(true, message);
  }, [setLoading]);

  const hideLoading = useCallback(() => {
    setLoading(false);
  }, [setLoading]);

  return (
    <GlobalLoadingContext.Provider
      value={{
        isLoading,
        loadingMessage,
        setLoading,
        showLoading,
        hideLoading,
      }}
    >
      {children}
    </GlobalLoadingContext.Provider>
  );
}

export function useGlobalLoading() {
  const context = useContext(GlobalLoadingContext);
  if (context === undefined) {
    throw new Error('useGlobalLoading must be used within a GlobalLoadingProvider');
  }
  return context;
}
