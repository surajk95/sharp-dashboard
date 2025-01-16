import { ImageData } from '../types/image';

export const createImageFromCompressedData = (
  img: { name: string; data: string; id: string; format: string }
): ImageData => {
  const binaryStr = atob(img.data);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }
  
  // Remove any existing file extension from the name
  const nameWithoutExt = img.name.replace(/\.[^/.]+$/, '');
  
  // Create the blob with the correct format
  const blob = new Blob([bytes], { type: `image/${img.format}` });
  
  return {
    url: URL.createObjectURL(blob),
    size: blob.size,
    name: `compressed-${nameWithoutExt}.${img.format}`,
    id: img.id
  };
};

export const downloadImage = (image: ImageData) => {
  const link = document.createElement('a');
  link.href = image.url;
  link.download = image.name;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}; 