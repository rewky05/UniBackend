import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/hooks/useAuth';
import { QueryProvider } from '@/lib/providers/query-provider';
import { ErrorBoundary } from '@/components/error-boundary';
import { GlobalLoadingProvider } from '@/hooks/useGlobalLoading';
import { GlobalLoadingOverlay } from '@/components/ui/global-loading-overlay';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'UniHealth Admin Portal',
  description: 'Administrative portal for managing healthcare professionals in Cebu City',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ErrorBoundary>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            <QueryProvider>
              <AuthProvider>
                <GlobalLoadingProvider>
                  {children}
                  <GlobalLoadingOverlay />
                </GlobalLoadingProvider>
              </AuthProvider>
            </QueryProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}