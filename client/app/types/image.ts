export interface ImageData {
  url: string;
  size: number;
  name: string;
  id: string;
  createdAt?: number; // Unix timestamp in milliseconds
  quality?: number;
  format?: string;
}

export interface CompressedImageData {
  id: string;
  url: string;
  size: number;
  name: string;
  format: string;
  quality: number;
  data: string;
} 