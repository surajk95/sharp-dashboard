import { ImageData } from '../types/image';
import { CompressionSettings } from '../types/compression-settings';

const DB_NAME = 'SharpDashboardDB';
const DB_VERSION = 1;
const IMAGES_STORE = 'images';
const SETTINGS_STORE = 'settings';

interface StoredState {
  originalImages: ImageData[];
  compressedImages: ImageData[];
  compressionStatus: [string, boolean][];
  settings: CompressionSettings;
  lastUpdated: number;
}

class StorageManager {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores
        if (!db.objectStoreNames.contains(IMAGES_STORE)) {
          db.createObjectStore(IMAGES_STORE, { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
          db.createObjectStore(SETTINGS_STORE);
        }
      };
    });
  }

  async saveState(state: StoredState): Promise<void> {
    if (!this.db) await this.init();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([IMAGES_STORE, SETTINGS_STORE], 'readwrite');
      
      transaction.onerror = () => reject(transaction.error);
      transaction.oncomplete = () => resolve();

      // Save images
      const imagesStore = transaction.objectStore(IMAGES_STORE);
      
      // Clear existing images
      imagesStore.clear();

      // Save all images (both original and compressed)
      const allImages = [...state.originalImages, ...state.compressedImages];
      allImages.forEach(image => {
        imagesStore.put(image);
      });

      // Save state metadata
      const settingsStore = transaction.objectStore(SETTINGS_STORE);
      settingsStore.put({
        originalImageIds: state.originalImages.map(img => img.id),
        compressedImageIds: state.compressedImages.map(img => img.id),
        compressionStatus: state.compressionStatus,
        settings: state.settings,
        lastUpdated: state.lastUpdated
      }, 'state');
    });
  }

  async loadState(): Promise<StoredState | null> {
    if (!this.db) await this.init();
    if (!this.db) return null;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([IMAGES_STORE, SETTINGS_STORE], 'readonly');
      
      transaction.onerror = () => reject(transaction.error);

      const settingsStore = transaction.objectStore(SETTINGS_STORE);
      const stateRequest = settingsStore.get('state');

      stateRequest.onsuccess = () => {
        const stateData = stateRequest.result;
        if (!stateData) {
          resolve(null);
          return;
        }

        const imagesStore = transaction.objectStore(IMAGES_STORE);
        const imagesRequest = imagesStore.getAll();

        imagesRequest.onsuccess = () => {
          const allImages = imagesRequest.result as ImageData[];
          const imagesMap = new Map(allImages.map(img => [img.id, img]));

          const originalImages = stateData.originalImageIds
            .map((id: string) => imagesMap.get(id))
            .filter(Boolean) as ImageData[];

          const compressedImages = stateData.compressedImageIds
            .map((id: string) => imagesMap.get(id))
            .filter(Boolean) as ImageData[];

          resolve({
            originalImages,
            compressedImages,
            compressionStatus: stateData.compressionStatus,
            settings: stateData.settings,
            lastUpdated: stateData.lastUpdated
          });
        };

        imagesRequest.onerror = () => reject(imagesRequest.error);
      };

      stateRequest.onerror = () => reject(stateRequest.error);
    });
  }

  async clearState(): Promise<void> {
    if (!this.db) await this.init();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([IMAGES_STORE, SETTINGS_STORE], 'readwrite');
      
      transaction.onerror = () => reject(transaction.error);
      transaction.oncomplete = () => resolve();

      transaction.objectStore(IMAGES_STORE).clear();
      transaction.objectStore(SETTINGS_STORE).clear();
    });
  }
}

export const storageManager = new StorageManager();
export type { StoredState };

