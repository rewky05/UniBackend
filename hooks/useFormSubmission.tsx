'use client';

import { useState, useCallback } from 'react';
import { useGlobalLoading } from './useGlobalLoading';

interface UseFormSubmissionOptions {
  loadingMessage?: string;
  successMessage?: string;
  errorMessage?: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function useFormSubmission(options: UseFormSubmissionOptions = {}) {
  const {
    loadingMessage = 'Submitting...',
    successMessage = 'Success!',
    errorMessage = 'An error occurred',
    onSuccess,
    onError,
  } = options;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const { showLoading, hideLoading } = useGlobalLoading();

  const submitForm = useCallback(async (
    submitFn: () => Promise<any>,
    options?: {
      showGlobalLoading?: boolean;
      customLoadingMessage?: string;
    }
  ) => {
    const { showGlobalLoading = true, customLoadingMessage } = options || {};
    
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    if (showGlobalLoading) {
      showLoading(customLoadingMessage || loadingMessage);
    }

    try {
      const result = await submitFn();
      setSubmitSuccess(true);
      onSuccess?.();
      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : errorMessage;
      setSubmitError(errorMsg);
      onError?.(error instanceof Error ? error : new Error(errorMsg));
      throw error;
    } finally {
      setIsSubmitting(false);
      if (showGlobalLoading) {
        hideLoading();
      }
    }
  }, [loadingMessage, errorMessage, onSuccess, onError, showLoading, hideLoading]);

  const resetForm = useCallback(() => {
    setIsSubmitting(false);
    setSubmitError(null);
    setSubmitSuccess(false);
  }, []);

  return {
    isSubmitting,
    submitError,
    submitSuccess,
    submitForm,
    resetForm,
  };
}
