import { ref, get, set, onValue, off } from 'firebase/database';
import { db } from '@/lib/firebase/config';
import { SystemSettings } from '@/lib/types/database';
import { activityLogger } from './activity-logger.service';

export class SettingsService {
  private static instance: SettingsService;
  private settingsRef = ref(db, 'settings/general');
  private cache: SystemSettings | null = null;
  private listeners: Array<() => void> = [];

  private constructor() {}

  static getInstance(): SettingsService {
    if (!SettingsService.instance) {
      SettingsService.instance = new SettingsService();
    }
    return SettingsService.instance;
  }

  /**
   * Get system settings with caching
   */
  async getSettings(): Promise<SystemSettings> {
    try {
      if (this.cache) {
        return this.cache;
      }

      const snapshot = await get(this.settingsRef);
      
      if (snapshot.exists()) {
        this.cache = snapshot.val() as SystemSettings;
        return this.cache;
      } else {
        // Return default settings if none exist
        const defaultSettings: SystemSettings = {
          defaultAppointmentDuration: 30,
          appointmentDurationUnit: 'minutes'
        };
        return defaultSettings;
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      // Return default settings on error
      return {
        defaultAppointmentDuration: 30,
        appointmentDurationUnit: 'minutes'
      };
    }
  }

  /**
   * Update system settings
   */
  async updateSettings(
    updates: Partial<SystemSettings>,
    updatedBy: string
  ): Promise<void> {
    try {
      const currentSettings = await this.getSettings();
      const updatedSettings: SystemSettings = {
        ...currentSettings,
        ...updates,
        lastUpdated: new Date().toISOString(),
        updatedBy
      };

      await set(this.settingsRef, updatedSettings);
      
      // Update cache
      this.cache = updatedSettings;

      // Log the settings change
      const changedFields = Object.keys(updates);
      for (const field of changedFields) {
        await activityLogger.logSettingsChanged(
          field,
          updatedBy,
          updatedBy, // adminEmail - using UID for now
          currentSettings[field as keyof SystemSettings],
          updates[field as keyof SystemSettings]
        );
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      throw new Error('Failed to update settings');
    }
  }

  /**
   * Listen to settings changes
   */
  onSettingsChange(callback: (settings: SystemSettings) => void): () => void {
    const unsubscribe = onValue(this.settingsRef, (snapshot) => {
      if (snapshot.exists()) {
        const settings = snapshot.val() as SystemSettings;
        this.cache = settings;
        callback(settings);
      } else {
        // Return default settings if none exist
        const defaultSettings: SystemSettings = {
          defaultAppointmentDuration: 30,
          appointmentDurationUnit: 'minutes'
        };
        this.cache = defaultSettings;
        callback(defaultSettings);
      }
    });

    this.listeners.push(unsubscribe);
    return unsubscribe;
  }

  /**
   * Clear all listeners and cache
   */
  cleanup(): void {
    this.listeners.forEach(unsubscribe => unsubscribe());
    this.listeners = [];
    this.cache = null;
  }
}

// Export singleton instance
export const settingsService = SettingsService.getInstance();
