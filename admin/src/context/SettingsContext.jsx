import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as settingsService from '../services/settingsService';

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refreshSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await settingsService.get();
      setSettings(data);
    } catch (err) {
      setError(err?.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSettings();
  }, [refreshSettings]);

  const updateSettings = useCallback(async (partial) => {
    try {
      const updated = await settingsService.update(partial);
      setSettings(updated);
      return updated;
    } catch (err) {
      setError(err?.message || 'Failed to update settings');
      throw err;
    }
  }, []);

  const value = useMemo(
    () => ({
      settings,
      loading,
      error,
      updateSettings,
      refreshSettings,
    }),
    [settings, loading, error, updateSettings, refreshSettings],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return ctx;
}
