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
    } catch (error) {
      console.error('Error compressing images:', error);
    } finally {
      setIsCompressing(false);
    }
  }, []);

  return (
    <div className="w-full h-full p-6">
      <h2 className="text-2xl font-bold mb-6">Image Compression</h2>
      
      <ImageDropzone onDrop={onDrop} isCompressing={isCompressing} />

      {(originalImages.length > 0 || compressedImages.length > 0) && (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
          <ImageGallery title="Original Images" images={originalImages} />
          <ImageGallery 
            title="Compressed Images" 
            images={compressedImages} 
            showDownload={true}
          />
        </div>
      )}
    </div>
  );
};

export default Dashboard;
