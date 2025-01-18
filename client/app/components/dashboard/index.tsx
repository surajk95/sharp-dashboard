'use client';

import { FC, useState, useCallback } from 'react';
import { ImageData, CompressedImageData } from '../../types/image';
import { COMPRESSION_SERVER_URL } from '../../constants/api';
import { createImageFromCompressedData } from '../../utils/image-utils';
import ImageDropzone from './image-upload';
import ImageGallery from './image-gallery';
import { CompressionSettings } from '../../types/compression-settings';
import CompressionSettingsDialog from './compression-settings';

const defaultSettings: CompressionSettings = {
  format: 'webp',
  quality: 80,
  keepExif: false,
  askDownloadLocation: false,
  usePrefix: true,
  namingPattern: 'compressed-',
  limitDimensions: false,
  maxWidth: 4000,
  maxHeight: 3000
};

const Dashboard: FC = () => {
  const [originalImages, setOriginalImages] = useState<ImageData[]>([]);
  const [compressedImages, setCompressedImages] = useState<ImageData[]>([]);
  const [compressionStatus, setCompressionStatus] = useState<Map<string, boolean>>(new Map());
  const [isCompressing, setIsCompressing] = useState(false);
  const [settings, setSettings] = useState<CompressionSettings>(defaultSettings);
  const [selectedImageIds, setSelectedImageIds] = useState<string[]>([]);
  const [isAdjustingSelected, setIsAdjustingSelected] = useState(false);

  const compressImages = useCallback(async (
    imagesToCompress: { file: File; originalImage: ImageData }[],
    compressionSettings: CompressionSettings
  ) => {
    try {
      setIsCompressing(true);
      
      const formData = new FormData();
      imagesToCompress.forEach(({ file, originalImage }) => {
        formData.append('images', file);
        formData.append('imageIds', originalImage.id);
      });
      
      formData.append('format', compressionSettings.format);
      formData.append('quality', compressionSettings.quality.toString());
      formData.append('keepExif', compressionSettings.keepExif.toString());
      
      if (compressionSettings.limitDimensions) {
        formData.append('maxWidth', compressionSettings.maxWidth.toString());
        formData.append('maxHeight', compressionSettings.maxHeight.toString());
      }

      const response = await fetch(`${COMPRESSION_SERVER_URL}/compress`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Compression failed');
      }

      const compressedData = await response.json();
      return compressedData.map((data: CompressedImageData, index: number) => ({
        ...createImageFromCompressedData(data, compressionSettings),
        id: data.id || imagesToCompress[index].originalImage.id,
        createdAt: imagesToCompress[index].originalImage.createdAt
      }));
    } catch (error) {
      console.error('Error compressing images:', error);
      throw error;
    } finally {
      setIsCompressing(false);
    }
  }, []);

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
      const imagesToCompress = acceptedFiles.map((file, index) => ({
        file,
        originalImage: newOriginalImages[index]
      }));
      
      const newCompressedImages = await compressImages(imagesToCompress, settings);
      setCompressedImages(prev => [...prev, ...newCompressedImages]);

      newOriginalImages.forEach(image => {
        setCompressionStatus(prev => new Map(prev).set(image.id, true));
      });
    } catch (error) {
      console.error('Error compressing images:', error);
      newOriginalImages.forEach(image => {
        setCompressionStatus(prev => new Map(prev).set(image.id, false));
      });
    }
  }, [settings, compressImages]);

  const handleAdjustSelected = async (adjustedSettings: CompressionSettings) => {
    const selectedOriginalImages = originalImages.filter(img => 
      selectedImageIds.includes(img.id)
    );

    try {
      const imagesToCompress = await Promise.all(selectedOriginalImages.map(async originalImage => {
        const response = await fetch(originalImage.url);
        const blob = await response.blob();
        const file = new File([blob], originalImage.name);
        return { file, originalImage };
      }));

      const newCompressedImages = await compressImages(imagesToCompress, adjustedSettings);

      setCompressedImages(prev => {
        const filtered = prev.filter(img => !selectedImageIds.includes(img.id));
        return [...filtered, ...newCompressedImages];
      });

      setIsAdjustingSelected(false);
    } catch (error) {
      console.error('Error adjusting selected images:', error);
    }
  };

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
        <div className="text-2xl font-bold"></div>
        <div className="flex gap-2">
          <CompressionSettingsDialog 
            settings={settings}
            onSettingsChange={setSettings}
            isAdjusting={isAdjustingSelected}
            onAdjust={handleAdjustSelected}
            onClose={() => {
              setIsAdjustingSelected(false);
              setSelectedImageIds([]);
            }}
          />
        </div>
      </div>
      
      <ImageDropzone onDrop={onDrop} isCompressing={isCompressing} />
      
      {compressedImages.length > 0 && (
        <ImageGallery 
          originalImages={originalImages}
          compressedImages={compressedImages} 
          compressionStatus={compressionStatus}
          onRemoveImage={handleRemoveImage}
          settings={settings}
          selectedImageIds={selectedImageIds}
          onSelectedChange={setSelectedImageIds}
          isAdjustingSelected={isAdjustingSelected}
          onAdjustSelected={() => setIsAdjustingSelected(true)}
        />
      )}
    </div>
  );
};

export default Dashboard;
