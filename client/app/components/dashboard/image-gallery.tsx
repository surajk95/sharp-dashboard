import { FC, useState, useMemo } from 'react';
import { ImageData } from '../../types/image';
import { downloadImage } from '../../utils/image-utils';
import { Search, ArrowUp, ArrowDown, X } from 'lucide-react';
import ImageComparisonDialog from './image-comparison-dialog';

interface ImageGalleryProps {
  originalImages: ImageData[];
  compressionStatus: Map<string, boolean>;
  compressedImages?: ImageData[];
  onRemoveImage: (image: ImageData) => void;
}

type SortField = 'name' | 'size' | 'date';
type SortOrder = 'asc' | 'desc';

const ImageGallery: FC<ImageGalleryProps> = ({ 
  originalImages = [], 
  compressionStatus, 
  compressedImages = [],
  onRemoveImage
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [selectedImage, setSelectedImage] = useState<ImageData | null>(null);

  const sortedAndFilteredImages = useMemo(() => {
    return compressedImages
      .filter(image => 
        image.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => {
        const compareValue = sortOrder === 'asc' ? 1 : -1;
        if (sortField === 'name') {
          return a.name.localeCompare(b.name) * compareValue;
        }
        if (sortField === 'date') {
          return ((a.createdAt || 0) - (b.createdAt || 0)) * compareValue;
        }
        return (a.size - b.size) * compareValue;
      });
  }, [compressedImages, searchTerm, sortField, sortOrder]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(current => current === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const findOriginalImage = (compressedImage: ImageData): ImageData => {
    return originalImages.find(img => img.id === compressedImage.id) || compressedImage;
  };

  return (
    <div className="border rounded-lg border-gray-700">
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 h-4 w-4" />
            <input
              type="text"
              placeholder="Search images..."
              className="pl-9 pr-4 py-2 w-full border rounded-md bg-gray-800 
                border-gray-700 text-gray-200 placeholder-gray-400
                focus:outline-none focus:ring-1 focus:ring-blue-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => toggleSort('name')}
              className={`px-3 py-1.5 border rounded-md flex items-center gap-1 
                border-gray-700 text-gray-200
                hover:bg-gray-700
                ${sortField === 'name' ? 'bg-gray-700' : 'bg-gray-800'}`}
            >
              Name
              {sortField === 'name' && (
                sortOrder === 'asc' ? (
                  <ArrowUp className="h-4 w-4" />
                ) : (
                  <ArrowDown className="h-4 w-4" />
                )
              )}
            </button>
            <button
              onClick={() => toggleSort('size')}
              className={`px-3 py-1.5 border rounded-md flex items-center gap-1 
                border-gray-700 text-gray-200
                hover:bg-gray-700
                ${sortField === 'size' ? 'bg-gray-700' : 'bg-gray-800'}`}
            >
              Size
              {sortField === 'size' && (
                sortOrder === 'asc' ? (
                  <ArrowUp className="h-4 w-4" />
                ) : (
                  <ArrowDown className="h-4 w-4" />
                )
              )}
            </button>
            <button
              onClick={() => toggleSort('date')}
              className={`px-3 py-1.5 border rounded-md flex items-center gap-1 
                border-gray-700 text-gray-200
                hover:bg-gray-700
                ${sortField === 'date' ? 'bg-gray-700' : 'bg-gray-800'}`}
            >
              Date
              {sortField === 'date' && (
                sortOrder === 'asc' ? (
                  <ArrowUp className="h-4 w-4" />
                ) : (
                  <ArrowDown className="h-4 w-4" />
                )
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 bg-gray-800">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {sortedAndFilteredImages.map((image, index) => {
            const isSuccess = compressionStatus.get(image.id);
            return (
              <div 
                key={`image-${index}`} 
                className="border p-2 rounded-lg border-gray-700 bg-gray-800"
              >
                <div 
                  className="cursor-pointer relative"
                  onClick={() => setSelectedImage(image)}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveImage(image);
                    }}
                    className="absolute top-1 right-1 p-1 text-white hover:text-red-500 rounded-full 
                      transition-colors z-10"
                    title="Remove image"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <img 
                    src={image.url} 
                    alt={`Image ${index + 1}`} 
                    className="w-full h-24 object-cover mb-2"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs truncate text-gray-200">{image.name}</p>
                  <span 
                    className={`w-3 h-3 rounded-full ${isSuccess ? 'bg-green-500' : 'bg-red-500'}`}
                    title={isSuccess ? 'Compression Successful' : 'Compression Failed'}
                  />
                </div>
                <button
                  onClick={() => downloadImage(image)}
                  className="mt-2 px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs w-full"
                >
                  Download
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {selectedImage && (
        <ImageComparisonDialog
          originalImage={findOriginalImage(selectedImage)}
          compressedImage={selectedImage}
          onClose={() => setSelectedImage(null)}
          open={!!selectedImage}
        />
      )}
    </div>
  );
};

export default ImageGallery; 