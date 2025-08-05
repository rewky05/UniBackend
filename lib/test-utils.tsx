import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient;
}

export function renderWithProviders(
  ui: React.ReactElement,
  options: CustomRenderOptions = {}
) {
  const { queryClient = createTestQueryClient(), ...renderOptions } = options;

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient,
  };
}

export function createMockSpecialist(overrides = {}) {
  return {
    id: 'test-specialist-id',
    firstName: 'Dr. Test',
    lastName: 'Specialist',
    specialty: 'Cardiology',
    isSpecialist: true,
    isGeneralist: false,
    status: 'verified',
    email: 'test@example.com',
    contactNumber: '+1234567890',
    ...overrides,
  };
}

export function createMockClinic(overrides = {}) {
  return {
    id: 'test-clinic-id',
    name: 'Test Clinic',
    type: 'hospital',
    addressLine: '123 Test St',
    contactNumber: '+1234567890',
    isActive: true,
    ...overrides,
  };
} 