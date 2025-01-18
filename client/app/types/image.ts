export interface ImageData {
  url: string;
  size: number;
  name: string;
  id: string;
  createdAt?: number; // Unix timestamp in milliseconds
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