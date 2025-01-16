export interface CompressionSettings {
  format: 'jpeg' | 'png' | 'webp' | 'avif';
  quality: number;
  keepExif: boolean;
  askDownloadLocation: boolean;
  usePrefix: boolean;
  namingPattern: string;
  limitDimensions: boolean;
  maxWidth: number;
  maxHeight: number;
} 