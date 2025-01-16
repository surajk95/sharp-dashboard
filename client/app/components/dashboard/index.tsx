'use client';

import { FC, useState, useCallback } from 'react';
import { ImageData } from '../../types/image';
import { COMPRESSION_SERVER_URL } from '../../constants/api';
import { createImageFromCompressedData } from '../../utils/image-utils';
import ImageDropzone from './image-upload';
import ImageGallery from './image-gallery';
import CompressionSettings, { CompressionSettings as Settings } from './compression-settings';

const defaultSettings: Settings = {
  format: 'webp',
  quality: 80,
  keepExif: false,
  askDownloadLocation: false
};

const Dashboard: FC = () => {
  const [originalImages, setOriginalImages] = useState<ImageData[]>([]);
  const [compressedImages, setCompressedImages] = useState<ImageData[]>([]);
  const [compressionStatus, setCompressionStatus] = useState<Map<string, boolean>>(new Map());
  const [isCompressing, setIsCompressing] = useState(false);
  const [settings, setSettings] = useState<Settings>(defaultSettings);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const newOriginalImages = acceptedFiles.map(file => ({
      url: URL.createObjectURL(file),
      size: file.size,
      name: file.name,
      id: crypto.randomUUID(),
      createdAt: Date.now()
    }));
    
    setOriginalImages(prev => [...prev, ...newOriginalImages]);

    try {
      setIsCompressing(true);
      
      const formData = new FormData();
      acceptedFiles.forEach((file, index) => {
        formData.append('images', file);
        formData.append('imageIds', newOriginalImages[index].id);
      });
      
      formData.append('format', settings.format);
      formData.append('quality', settings.quality.toString());
      formData.append('keepExif', settings.keepExif.toString());

      const response = await fetch(`${COMPRESSION_SERVER_URL}/compress`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Compression failed');
      }

      const compressedData = await response.json();
      const newCompressedImages = compressedData.map((data: any, index: number) => ({
        ...createImageFromCompressedData(data),
        id: data.id || newOriginalImages[index].id,
        createdAt: newOriginalImages[index].createdAt
      }));

      setCompressedImages(prev => [...prev, ...newCompressedImages]);

      newOriginalImages.forEach(image => {
        setCompressionStatus(prev => new Map(prev).set(image.id, true));
      });
    } catch (error) {
      console.error('Error compressing images:', error);
      newOriginalImages.forEach(image => {
        setCompressionStatus(prev => new Map(prev).set(image.id, false));
      });
    } finally {
      setIsCompressing(false);
    }
  }, [settings]);

  const handleRemoveImage = (imageToRemove: ImageData) => {
    setCompressedImages(prev => prev.filter(img => img.id !== imageToRemove.id));
    setCompressionStatus(prev => {
      const newStatus = new Map(prev);
      newStatus.delete(imageToRemove.id);
      return newStatus;
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Image Compression</h1>
        <CompressionSettings 
          settings={settings}
          onSettingsChange={setSettings}
        />
      </div>
      
      <ImageDropzone onDrop={onDrop} isCompressing={isCompressing} />
      
      {compressedImages.length > 0 && (
        <ImageGallery 
          originalImages={originalImages}
          compressedImages={compressedImages} 
          compressionStatus={compressionStatus}
          onRemoveImage={handleRemoveImage}
          settings={settings}
        />
      )}
    </div>
  );
};

export default Dashboard;
