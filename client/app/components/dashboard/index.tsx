'use client';

import { FC, useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

interface ImageData {
  url: string;
  size: number;
  name: string;
}

const COMPRESSION_SERVER_URL = 'http://localhost:3005';

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
      
      const newCompressedImages = compressedData.map((img: { name: string, data: string }) => {
        const binaryStr = atob(img.data);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
          bytes[i] = binaryStr.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: 'image/jpeg' });
        
        return {
          url: URL.createObjectURL(blob),
          size: blob.size,
          name: `compressed-${img.name}`
        };
      });

      setCompressedImages(prev => [...prev, ...newCompressedImages]);
    } catch (error) {
      console.error('Error compressing images:', error);
    } finally {
      setIsCompressing(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
  });

  const handleDownload = (image: ImageData) => {
    const link = document.createElement('a');
    link.href = image.url;
    link.download = image.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full h-full p-6">
      <h2 className="text-2xl font-bold mb-6">Image Compression</h2>
      
      <div {...getRootProps()} className={`
        border-2 border-dashed rounded-lg p-8 mb-6 text-center cursor-pointer
        ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
      `}>
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>Drop the images here...</p>
        ) : (
          <p>Drag & drop images here, or click to select files</p>
        )}
      </div>

      {isCompressing && (
        <div className="text-center text-blue-500 mb-4">
          Compressing images...
        </div>
      )}

      {(originalImages.length > 0 || compressedImages.length > 0) && (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-2">Original Images</h3>
            <div className="space-y-4">
              {originalImages.map((image, index) => (
                <div key={`original-${index}`} className="border-b pb-4">
                  <img 
                    src={image.url} 
                    alt={`Original ${index + 1}`} 
                    className="max-w-full h-auto mb-2"
                  />
                  <p className="text-sm">
                    {image.name} - Size: {(image.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-2">Compressed Images</h3>
            <div className="space-y-4">
              {compressedImages.map((image, index) => (
                <div key={`compressed-${index}`} className="border-b pb-4">
                  <img 
                    src={image.url} 
                    alt={`Compressed ${index + 1}`} 
                    className="max-w-full h-auto mb-2"
                  />
                  <p className="text-sm">
                    {image.name} - Size: {(image.size / 1024).toFixed(2)} KB
                  </p>
                  <button
                    onClick={() => handleDownload(image)}
                    className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                  >
                    Download
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
