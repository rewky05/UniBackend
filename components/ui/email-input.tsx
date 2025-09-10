'use client';

import React, { forwardRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface EmailInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  onValidationChange?: (isValid: boolean, exists: boolean) => void;
  showValidation?: boolean;
  debounceMs?: number;
  className?: string;
  error?: string;
  required?: boolean;
}

export const EmailInput = forwardRef<HTMLInputElement, EmailInputProps>(
  ({
    label,
    value,
    onChange,
    onValidationChange,
    showValidation = false, // Disabled by default
    debounceMs = 800,
    className,
    error,
    required = false,
    ...props
  }, ref) => {
    // Notify parent component - always return valid, not exists
    React.useEffect(() => {
      if (onValidationChange) {
        onValidationChange(true, false);
      }
    }, [onValidationChange]);

    return (
      <div className={cn('space-y-2', className)}>
        {label && (
          <Label htmlFor={props.id}>
            {label} {required && <span className="text-destructive">*</span>}
          </Label>
        )}
        
        <Input
          ref={ref}
          type="email"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            error && 'border-destructive focus:border-destructive'
          )}
          {...props}
        />

        {/* Error message */}
        {error && (
          <p className="text-sm text-destructive">
            {error}
          </p>
        )}
      </div>
    );
  }
);

EmailInput.displayName = 'EmailInput';
