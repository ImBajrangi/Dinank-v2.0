import { cache } from './cache';

export interface SavedSource {
  id: string;
  name: string;
  type: 'sheet' | 'file';
  urlOrUri: string;
  importedCount: number;
  lastSyncedAt: string;
  createdAt: string;
}

const STORAGE_KEY_SAVED_SOURCES = '@saved_sources_v1';

export class SourcesService {
  /**
   * Retrieve all saved spreadsheet/link sources from cache & disk
   */
  static async getSavedSources(): Promise<SavedSource[]> {
    try {
      return await cache.hydrate<SavedSource[]>(STORAGE_KEY_SAVED_SOURCES, []);
    } catch (e) {
      return [];
    }
  }

  /**
   * Save or update a source
   */
  static async saveSource(source: SavedSource): Promise<SavedSource[]> {
    const existing = await this.getSavedSources();
    const index = existing.findIndex((s) => s.id === source.id || (s.urlOrUri && s.urlOrUri === source.urlOrUri));
    
    let updated: SavedSource[];
    if (index >= 0) {
      updated = [...existing];
      updated[index] = { ...existing[index], ...source };
    } else {
      updated = [source, ...existing];
    }

    cache.set(STORAGE_KEY_SAVED_SOURCES, updated);
    return updated;
  }

  /**
   * Batch save sources
   */
  static async saveMultipleSources(sources: SavedSource[]): Promise<SavedSource[]> {
    const existing = await this.getSavedSources();
    const map = new Map<string, SavedSource>();
    
    existing.forEach((s) => map.set(s.id, s));
    sources.forEach((s) => {
      const matchKey = Array.from(map.keys()).find(k => map.get(k)?.urlOrUri === s.urlOrUri);
      if (matchKey) {
        map.set(matchKey, { ...map.get(matchKey)!, ...s });
      } else {
        map.set(s.id, s);
      }
    });

    const updated = Array.from(map.values());
    cache.set(STORAGE_KEY_SAVED_SOURCES, updated);
    return updated;
  }

  /**
   * Update an existing source by ID
   */
  static async updateSource(id: string, updates: Partial<SavedSource>): Promise<SavedSource[]> {
    const existing = await this.getSavedSources();
    const updated = existing.map((s) => (s.id === id ? { ...s, ...updates } : s));
    cache.set(STORAGE_KEY_SAVED_SOURCES, updated);
    return updated;
  }

  /**
   * Delete a saved source
   */
  static async deleteSource(id: string): Promise<SavedSource[]> {
    const existing = await this.getSavedSources();
    const updated = existing.filter((s) => s.id !== id);
    cache.set(STORAGE_KEY_SAVED_SOURCES, updated);
    return updated;
  }
}
