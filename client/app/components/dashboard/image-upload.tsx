import { FC } from 'react';
import { useDropzone } from 'react-dropzone';
import { DropzoneOptions } from 'react-dropzone';

interface ImageUploadProps {
  onDrop: DropzoneOptions['onDrop'];
  isCompressing: boolean;
}

const ImageUpload: FC<ImageUploadProps> = ({ onDrop, isCompressing }) => {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
  });

  return (
    <>
      <div {...getRootProps()} className={`
        border-2 rounded-lg p-8 mb-6 text-center cursor-pointer
        ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
      `}>
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>Drop the images here...</p>
        ) : (
          <p>Drop images here, or click to select files</p>
        )}
      </div>

      {isCompressing && (
        <div className="text-center text-blue-500 mb-4">
          Compressing images...
        </div>
      )}
    </>
  );
};

export default ImageUpload; 