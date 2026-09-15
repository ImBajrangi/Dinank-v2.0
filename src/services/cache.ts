import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Multi-Tier Fast Cache Manager
 * Tier 1: Synchronous In-Memory Map (Instant 0ms lookup, zero UI lag/flicker)
 * Tier 2: Persistent AsyncStorage (Hydrates on boot, async debounced writes for low-end phone performance)
 */
class MemoryDiskCache {
  private memoryCache: Map<string, any> = new Map();
  private writeTimeouts: Map<string, any> = new Map();

  /**
   * Synchronously read from memory cache
   */
  get<T>(key: string, defaultValue: T): T {
    if (this.memoryCache.has(key)) {
      return this.memoryCache.get(key) as T;
    }
    return defaultValue;
  }

  /**
   * Set in memory immediately (0ms for UI) and debounce persistent write
   */
  set<T>(key: string, value: T, debounceMs: number = 300): void {
    // Instant in-memory update
    this.memoryCache.set(key, value);

    // Debounced disk persistence to keep low-spec devices responsive
    if (this.writeTimeouts.has(key)) {
      clearTimeout(this.writeTimeouts.get(key));
    }

    const timeout = setTimeout(async () => {
      try {
        const serialized = JSON.stringify(value);
        await AsyncStorage.setItem(key, serialized);
      } catch (error) {
        console.warn(`[Cache] Failed to persist key "${key}" to disk:`, error);
      } finally {
        this.writeTimeouts.delete(key);
      }
    }, debounceMs);

    this.writeTimeouts.set(key, timeout);
  }

  /**
   * Warm up and hydrate in-memory cache from AsyncStorage on app launch
   */
  async hydrate<T>(key: string, defaultValue: T): Promise<T> {
    try {
      const stored = await AsyncStorage.getItem(key);
      if (stored !== null) {
        const parsed = JSON.parse(stored) as T;
        this.memoryCache.set(key, parsed);
        return parsed;
      }
    } catch (error) {
      console.warn(`[Cache] Failed to hydrate key "${key}":`, error);
    }
    this.memoryCache.set(key, defaultValue);
    return defaultValue;
  }

  /**
   * Remove key from both memory and storage
   */
  async remove(key: string): Promise<void> {
    this.memoryCache.delete(key);
    if (this.writeTimeouts.has(key)) {
      clearTimeout(this.writeTimeouts.get(key));
      this.writeTimeouts.delete(key);
    }
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.warn(`[Cache] Failed to remove key "${key}":`, error);
    }
  }

  /**
   * Force flush any pending debounced writes immediately
   */
  async flush(key: string): Promise<void> {
    if (this.writeTimeouts.has(key)) {
      clearTimeout(this.writeTimeouts.get(key));
      this.writeTimeouts.delete(key);
      const value = this.memoryCache.get(key);
      if (value !== undefined) {
        await AsyncStorage.setItem(key, JSON.stringify(value));
      }
    }
  }
}

export const cache = new MemoryDiskCache();
