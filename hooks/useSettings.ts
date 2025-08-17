'use client';

import { useState, useEffect } from 'react';
import { settingsService } from '@/lib/services/settings.service';
import { SystemSettings } from '@/lib/types/database';

export function useSettings() {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        const data = await settingsService.getSettings();
        setSettings(data);
        setError(null);
      } catch (err) {
        console.error('Error loading settings:', err);
        setError('Failed to load settings');
        // Set default settings on error
        setSettings({
          defaultAppointmentDuration: 30,
          appointmentDurationUnit: 'minutes'
        });
      } finally {
        setLoading(false);
      }
    };

    loadSettings();

    // Listen for real-time updates
    const unsubscribe = settingsService.onSettingsChange((newSettings) => {
      setSettings(newSettings);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const getDefaultDurationMinutes = (): number => {
    if (!settings) return 30;
    
    if (settings.appointmentDurationUnit === 'hours') {
      return settings.defaultAppointmentDuration * 60;
    }
    
    return settings.defaultAppointmentDuration;
  };

  return {
    settings,
    loading,
    error,
    getDefaultDurationMinutes
  };
}
