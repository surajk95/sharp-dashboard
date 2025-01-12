import { FC } from 'react';
import { ImageData } from '../../types/image';
import { downloadImage } from '../../utils/image-utils';

interface ImageGalleryProps {
  title: string;
  images: ImageData[];
  showDownload?: boolean;
}

const ImageGallery: FC<ImageGalleryProps> = ({ title, images, showDownload }) => {
  return (
    <div className="border rounded-lg p-4">
      <h3 className="font-semibold mb-2">{title}</h3>
      <div className="space-y-4">
        {images.map((image, index) => (
          <div key={`${title}-${index}`} className="border-b pb-4">
            <img 
              src={image.url} 
              alt={`${title} ${index + 1}`} 
              className="max-w-full h-auto mb-2"
            />
            <p className="text-sm">
              {image.name} - Size: {(image.size / 1024).toFixed(2)} KB
            </p>
            {showDownload && (
              <button
                onClick={() => downloadImage(image)}
                className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
              >
                Download
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ImageGallery; 