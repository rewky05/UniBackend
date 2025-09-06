'use client';

import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { Button, ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ModernButtonLoader } from './modern-button-loader';

interface LoadingButtonProps extends ButtonProps {
  loading?: boolean;
  loadingText?: string;
  children: React.ReactNode;
}

export const LoadingButton = React.forwardRef<HTMLButtonElement, LoadingButtonProps>(
  ({ loading = false, loadingText, children, className, disabled, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        className={cn(className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <>
            <ModernButtonLoader className="mr-2" size="md" />
            {loadingText || 'Loading...'}
          </>
        ) : (
          children
        )}
      </Button>
    );
  }
);

LoadingButton.displayName = 'LoadingButton';

// Specialized loading buttons for common actions
export const SubmitButton = React.forwardRef<HTMLButtonElement, Omit<LoadingButtonProps, 'loadingText'>>(
  ({ loading, children = 'Submit', ...props }, ref) => {
    return (
      <LoadingButton
        ref={ref}
        loading={loading}
        loadingText="Submitting..."
        {...props}
      >
        {children}
      </LoadingButton>
    );
  }
);

SubmitButton.displayName = 'SubmitButton';

export const SaveButton = React.forwardRef<HTMLButtonElement, Omit<LoadingButtonProps, 'loadingText'>>(
  ({ loading, children = 'Save', ...props }, ref) => {
    return (
      <LoadingButton
        ref={ref}
        loading={loading}
        loadingText="Saving..."
        {...props}
      >
        {children}
      </LoadingButton>
    );
  }
);

SaveButton.displayName = 'SaveButton';

export const DeleteButton = React.forwardRef<HTMLButtonElement, Omit<LoadingButtonProps, 'loadingText'>>(
  ({ loading, children = 'Delete', ...props }, ref) => {
    return (
      <LoadingButton
        ref={ref}
        loading={loading}
        loadingText="Deleting..."
        variant="destructive"
        {...props}
      >
        {children}
      </LoadingButton>
    );
  }
);

DeleteButton.displayName = 'DeleteButton';

export const UpdateButton = React.forwardRef<HTMLButtonElement, Omit<LoadingButtonProps, 'loadingText'>>(
  ({ loading, children = 'Update', ...props }, ref) => {
    return (
      <LoadingButton
        ref={ref}
        loading={loading}
        loadingText="Updating..."
        {...props}
      >
        {children}
      </LoadingButton>
    );
  }
);

UpdateButton.displayName = 'UpdateButton';
