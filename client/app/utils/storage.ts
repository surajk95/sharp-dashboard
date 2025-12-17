import { ImageData } from '../types/image';
import { CompressionSettings } from '../types/compression-settings';

const DB_NAME = 'SharpDashboardDB';
const DB_VERSION = 2; // Increment version to trigger upgrade
const IMAGES_STORE = 'images';
const SETTINGS_STORE = 'settings';
const BLOBS_STORE = 'blobs'; // New store for blob data

interface StoredState {
  originalImages: ImageData[];
  compressedImages: ImageData[];
  compressionStatus: [string, boolean][];
  settings: CompressionSettings;
  lastUpdated: number;
}

interface StoredImageBlob {
  id: string;
  data: Blob;
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

        if (!db.objectStoreNames.contains(BLOBS_STORE)) {
          db.createObjectStore(BLOBS_STORE, { keyPath: 'id' });
        }
      };
    });
  }

  private async blobFromUrl(url: string): Promise<Blob> {
    const response = await fetch(url);
    return await response.blob();
  }

  async saveState(state: StoredState): Promise<void> {
    if (!this.db) await this.init();
    if (!this.db) throw new Error('Database not initialized');

    // Convert blob URLs to actual blobs
    const allImages = [...state.originalImages, ...state.compressedImages];
    const blobPromises = allImages.map(async (img) => {
      try {
        const blob = await this.blobFromUrl(img.url);
        return { id: img.id, data: blob };
      } catch (error) {
        console.error(`Failed to fetch blob for image ${img.id}:`, error);
        return null;
      }
    });

    const blobs = (await Promise.all(blobPromises)).filter(Boolean) as StoredImageBlob[];

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([IMAGES_STORE, SETTINGS_STORE, BLOBS_STORE], 'readwrite');
      
      transaction.onerror = () => reject(transaction.error);
      transaction.oncomplete = () => resolve();

      // Save image metadata (without blob URLs, as they're temporary)
      const imagesStore = transaction.objectStore(IMAGES_STORE);
      imagesStore.clear();

      allImages.forEach(image => {
        const { url, ...imageWithoutUrl } = image;
        imagesStore.put({ ...imageWithoutUrl, url: '' }); // Store empty URL, will recreate on load
      });

      // Save blobs
      const blobsStore = transaction.objectStore(BLOBS_STORE);
      blobsStore.clear();

      blobs.forEach(blob => {
        blobsStore.put(blob);
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
      const transaction = this.db!.transaction([IMAGES_STORE, SETTINGS_STORE, BLOBS_STORE], 'readonly');
      
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

        const blobsStore = transaction.objectStore(BLOBS_STORE);
        const blobsRequest = blobsStore.getAll();

        Promise.all([
          new Promise<ImageData[]>((res, rej) => {
            imagesRequest.onsuccess = () => res(imagesRequest.result as ImageData[]);
            imagesRequest.onerror = () => rej(imagesRequest.error);
          }),
          new Promise<StoredImageBlob[]>((res, rej) => {
            blobsRequest.onsuccess = () => res(blobsRequest.result as StoredImageBlob[]);
            blobsRequest.onerror = () => rej(blobsRequest.error);
          })
        ]).then(([images, blobs]) => {
          // Create a map of blobs by ID
          const blobsMap = new Map(blobs.map(blob => [blob.id, blob.data]));

          // Recreate blob URLs for each image
          const imagesWithUrls = images.map(img => {
            const blob = blobsMap.get(img.id);
            return {
              ...img,
              url: blob ? URL.createObjectURL(blob) : ''
            };
          });

          const imagesMap = new Map(imagesWithUrls.map(img => [img.id, img]));

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
        }).catch(reject);
      };

      stateRequest.onerror = () => reject(stateRequest.error);
    });
  }

  async clearState(): Promise<void> {
    if (!this.db) await this.init();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([IMAGES_STORE, SETTINGS_STORE, BLOBS_STORE], 'readwrite');
      
      transaction.onerror = () => reject(transaction.error);
      transaction.oncomplete = () => resolve();

      transaction.objectStore(IMAGES_STORE).clear();
      transaction.objectStore(SETTINGS_STORE).clear();
      transaction.objectStore(BLOBS_STORE).clear();
    });
  }
}

export const storageManager = new StorageManager();
export type { StoredState };
