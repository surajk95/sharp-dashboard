import { ImageData } from '../types/image';
import { CompressionSettings } from '../types/compression-settings';

export const createImageFromCompressedData = (
  img: { name: string; data: string; id: string; format: string },
  settings?: CompressionSettings
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
  
  // Apply naming pattern based on settings
  const fileName = settings?.usePrefix
    ? `${settings.namingPattern || 'compressed-'}${nameWithoutExt}.${img.format}`
    : `${nameWithoutExt}${settings?.namingPattern || '-compressed'}.${img.format}`;
  
  return {
    url: URL.createObjectURL(blob),
    size: blob.size,
    name: fileName,
    id: img.id
  };
};

export async function downloadWithDialog(image: ImageData) {
  const response = await fetch(image.url);
  const blob = await response.blob();
  
  // Create file handle
  const handle = await window.showSaveFilePicker({
    suggestedName: image.name,
    types: [{
      description: 'Image Files',
      accept: {
        'image/*': ['.jpg', '.jpeg', '.png', '.webp']
      }
    }]
  });
  
  // Create writable stream and write the blob
  const writable = await handle.createWritable();
  await writable.write(blob);
  await writable.close();
}

export async function downloadImage(image: ImageData, askLocation = false) {
  try {
    if (askLocation) {
      await downloadWithDialog(image);
    } else {
      const link = document.createElement('a');
      link.href = image.url;
      link.download = image.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  } catch (err) {
    if (err instanceof Error && err.name !== 'AbortError') {
      // Fall back to traditional download
      const link = document.createElement('a');
      link.href = image.url;
      link.download = image.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }
}

export async function bulkDownload(images: ImageData[], askLocation = false) {
  try {
    if (askLocation) {
      const dirHandle = await window.showDirectoryPicker();
      for (const image of images) {
        try {
          const response = await fetch(image.url);
          const blob = await response.blob();
          const fileHandle = await dirHandle.getFileHandle(image.name, { create: true });
          const writable = await fileHandle.createWritable();
          await writable.write(blob);
          await writable.close();
        } catch (err) {
          console.error(`Failed to save ${image.name}:`, err);
        }
      }
    } else {
      images.forEach(image => downloadImage(image, false));
    }
  } catch (err) {
    if (err instanceof Error && err.name !== 'AbortError') {
      images.forEach(image => downloadImage(image, false));
    }
  }
}

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

export const calculateCompressionRatio = (originalSize: number, compressedSize: number): string => {
  return ((1 - compressedSize / originalSize) * 100).toFixed(1);
}; 