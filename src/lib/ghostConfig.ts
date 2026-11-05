import { useState, useEffect, useCallback } from 'react';
import defaultGhostData from '../data/ghost.json';

export interface GhostConfig {
  is_active: boolean;
  flee_messages: string[];
  catch_messages: string[];
}

const STORAGE_KEY = 'cineflow_ghost_config';
const EVENT_NAME = 'cineflow_ghost_config_updated';

export const DEFAULT_GHOST_CONFIG: GhostConfig = {
  is_active: defaultGhostData.is_active ?? false,
  flee_messages: defaultGhostData.flee_messages || [
    'Eep! Too close! 👻',
    'Whooosh! 💨',
    'Can’t catch me! 🏃‍♂️💨',
    'Boo! 🎃',
    'Spooky mode activated! 🦇',
    'Did I scare you? 👻',
    'Ahhh human! 😱',
    'Floating away... ✨',
    'Teleporting magic! 🪄',
  ],
  catch_messages: defaultGhostData.catch_messages || [
    'Poof! You got me! 👻🎉',
    'Impressive reflexes! 🏆',
    'Ghost Whisperer unlocked! ✨',
    'You caught the Phantom! 🌟',
    'Aha! Caught in the act! 🪄',
    'Nice catch, movie buff! 🎬',
  ],
};

/**
 * Read the current Ghost configuration from localStorage or default
 */
export function getStoredGhostConfig(): GhostConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        is_active: typeof parsed.is_active === 'boolean' ? parsed.is_active : DEFAULT_GHOST_CONFIG.is_active,
        flee_messages: Array.isArray(parsed.flee_messages) && parsed.flee_messages.length > 0
          ? parsed.flee_messages
          : DEFAULT_GHOST_CONFIG.flee_messages,
        catch_messages: Array.isArray(parsed.catch_messages) && parsed.catch_messages.length > 0
          ? parsed.catch_messages
          : DEFAULT_GHOST_CONFIG.catch_messages,
      };
    }
  } catch (err) {
    console.warn('Failed to parse stored ghost config:', err);
  }
  return DEFAULT_GHOST_CONFIG;
}

/**
 * Save Ghost configuration to localStorage and notify all listeners
 */
export function setStoredGhostConfig(newConfig: GhostConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: newConfig }));
  } catch (err) {
    console.error('Failed to save ghost config to localStorage:', err);
  }
}

/**
 * Reset Ghost configuration back to default ghost.json
 */
export function resetStoredGhostConfig(): GhostConfig {
  try {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: DEFAULT_GHOST_CONFIG }));
  } catch (err) {
    console.error('Failed to reset ghost config:', err);
  }
  return DEFAULT_GHOST_CONFIG;
}

/**
 * React hook to read, watch, and modify Ghost configuration
 */
export function useGhostConfig() {
  const [config, setConfig] = useState<GhostConfig>(() => getStoredGhostConfig());

  useEffect(() => {
    // Initial fetch from public/ghost.json to keep in sync if updated on server
    let isMounted = true;
    fetch('/ghost.json')
      .then((res) => (res.ok ? res.json() : null))
      .then((remoteData) => {
        if (!isMounted || !remoteData) return;
        const remoteIsActive = typeof remoteData.is_active === 'boolean' ? remoteData.is_active : false;
        
        // If server disabled the ghost in ghost.json, immediately enforce false
        if (!remoteIsActive) {
          setConfig((prev) => ({ ...prev, is_active: false }));
          return;
        }

        const localRaw = localStorage.getItem(STORAGE_KEY);
        if (!localRaw) {
          const synced: GhostConfig = {
            is_active: remoteIsActive,
            flee_messages: Array.isArray(remoteData.flee_messages) ? remoteData.flee_messages : DEFAULT_GHOST_CONFIG.flee_messages,
            catch_messages: Array.isArray(remoteData.catch_messages) ? remoteData.catch_messages : DEFAULT_GHOST_CONFIG.catch_messages,
          };
          setConfig(synced);
        }
      })
      .catch(() => {
        // Fallback to local default
      });

    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<GhostConfig>;
      if (customEvent.detail) {
        setConfig(customEvent.detail);
      } else {
        setConfig(getStoredGhostConfig());
      }
    };

    window.addEventListener(EVENT_NAME, handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      isMounted = false;
      window.removeEventListener(EVENT_NAME, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const updateConfig = useCallback((updater: Partial<GhostConfig> | ((prev: GhostConfig) => GhostConfig)) => {
    setConfig((prev) => {
      const updated = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };
      setStoredGhostConfig(updated);
      return updated;
    });
  }, []);

  const toggleActive = useCallback(() => {
    updateConfig((prev) => ({ ...prev, is_active: !prev.is_active }));
  }, [updateConfig]);

  const addFleeMessage = useCallback((message: string) => {
    const trimmed = message.trim();
    if (!trimmed) return;
    updateConfig((prev) => ({
      ...prev,
      flee_messages: [...prev.flee_messages, trimmed],
    }));
  }, [updateConfig]);

  const removeFleeMessage = useCallback((index: number) => {
    updateConfig((prev) => ({
      ...prev,
      flee_messages: prev.flee_messages.filter((_, i) => i !== index),
    }));
  }, [updateConfig]);

  const addCatchMessage = useCallback((message: string) => {
    const trimmed = message.trim();
    if (!trimmed) return;
    updateConfig((prev) => ({
      ...prev,
      catch_messages: [...prev.catch_messages, trimmed],
    }));
  }, [updateConfig]);

  const removeCatchMessage = useCallback((index: number) => {
    updateConfig((prev) => ({
      ...prev,
      catch_messages: prev.catch_messages.filter((_, i) => i !== index),
    }));
  }, [updateConfig]);

  const resetToDefault = useCallback(() => {
    const fresh = resetStoredGhostConfig();
    setConfig(fresh);
  }, []);

  return {
    config,
    isActive: config.is_active,
    fleeMessages: config.flee_messages,
    catchMessages: config.catch_messages,
    updateConfig,
    toggleActive,
    addFleeMessage,
    removeFleeMessage,
    addCatchMessage,
    removeCatchMessage,
    resetToDefault,
  };
}
