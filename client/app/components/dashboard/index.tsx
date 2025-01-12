'use client';

import { FC, useState, useCallback } from 'react';
import { ImageData } from '../../types/image';
import { COMPRESSION_SERVER_URL } from '../../constants/api';
import { createImageFromCompressedData } from '../../utils/image-utils';
import ImageDropzone from './image-upload';
import ImageGallery from './image-gallery';

const Dashboard: FC = () => {
  const [originalImages, setOriginalImages] = useState<ImageData[]>([]);
  const [compressedImages, setCompressedImages] = useState<ImageData[]>([]);
  const [compressionStatus, setCompressionStatus] = useState<Map<string, boolean>>(new Map());
  const [isCompressing, setIsCompressing] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const newOriginalImages = acceptedFiles.map(file => ({
      url: URL.createObjectURL(file),
      size: file.size,
      name: file.name
    }));
    
    setOriginalImages(prev => [...prev, ...newOriginalImages]);

    try {
      setIsCompressing(true);
      
      const formData = new FormData();
      acceptedFiles.forEach((file) => {
        formData.append('images', file);
      });

      const response = await fetch(`${COMPRESSION_SERVER_URL}/compress`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Compression failed');
      }

      const compressedData = await response.json();
      const newCompressedImages = compressedData.map(createImageFromCompressedData);

      setCompressedImages(prev => [...prev, ...newCompressedImages]);

      // Update compression status
      newOriginalImages.forEach(image => {
        setCompressionStatus(prev => new Map(prev).set(image.name, true));
      });
    } catch (error) {
      console.error('Error compressing images:', error);
      // Update compression status to failed
      newOriginalImages.forEach(image => {
        setCompressionStatus(prev => new Map(prev).set(image.name, false));
      });
    } finally {
      setIsCompressing(false);
    }
  }, []);

  return (
    <div className="space-y-6">
      <ImageDropzone onDrop={onDrop} isCompressing={isCompressing} />
      
      {originalImages.length > 0 && (
        <ImageGallery 
          images={originalImages} 
          compressionStatus={compressionStatus}
          compressedImages={compressedImages} 
        />
      )}
    </div>
  );
};

export default Dashboard;
