'use client';

import { FC, useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

interface ImageData {
  url: string;
  size: number;
}

const COMPRESSION_SERVER_URL = 'http://localhost:3005';

const Dashboard: FC = () => {
  const [originalImage, setOriginalImage] = useState<ImageData | null>(null);
  const [compressedImage, setCompressedImage] = useState<ImageData | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Set original image
    setOriginalImage({
      url: URL.createObjectURL(file),
      size: file.size,
    });

    try {
      setIsCompressing(true);
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch(`${COMPRESSION_SERVER_URL}/compress`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Compression failed');
      }

      const compressedBlob = await response.blob();
      setCompressedImage({
        url: URL.createObjectURL(compressedBlob),
        size: compressedBlob.size,
      });
    } catch (error) {
      console.error('Error compressing image:', error);
    } finally {
      setIsCompressing(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxFiles: 1
  });

  const handleDownload = () => {
    if (!compressedImage) return;
    const link = document.createElement('a');
    link.href = compressedImage.url;
    link.download = 'compressed-image.jpg';
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
          <p>Drop the image here...</p>
        ) : (
          <p>Drag & drop an image here, or click to select one</p>
        )}
      </div>

      {isCompressing && (
        <div className="text-center text-blue-500 mb-4">
          Compressing image...
        </div>
      )}

      {(originalImage || compressedImage) && (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
          {/* Original Image */}
          {originalImage && (
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-2">Original Image</h3>
              <img 
                src={originalImage.url} 
                alt="Original" 
                className="max-w-full h-auto mb-2"
              />
              <p>Size: {(originalImage.size / 1024).toFixed(2)} KB</p>
            </div>
          )}

          {/* Compressed Image */}
          {compressedImage && (
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-2">Compressed Image</h3>
              <img 
                src={compressedImage.url} 
                alt="Compressed" 
                className="max-w-full h-auto mb-2"
              />
              <p>Size: {(compressedImage.size / 1024).toFixed(2)} KB</p>
              <button
                onClick={handleDownload}
                className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Download Compressed Image
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
