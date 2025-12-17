import { FC, useState, useMemo, useEffect } from 'react';
import { ImageData } from '../../types/image';
import { 
  downloadImage, 
  bulkDownload, 
  formatFileSize,
  calculateCompressionRatio 
} from '../../utils/image-utils';
import { Search, ArrowUp, ArrowDown, X, Download, Trash2, Settings2 } from 'lucide-react';
import ImageComparisonDialog from './image-comparison-dialog';
import { CompressionSettings } from '../../types/compression-settings';

interface ImageGalleryProps {
  originalImages: ImageData[];
  compressionStatus: Map<string, boolean>;
  compressedImages?: ImageData[];
  onRemoveImage: (image: ImageData) => void;
  settings: CompressionSettings;
  selectedImageIds: string[];
  onSelectedChange: (ids: string[]) => void;
  isAdjustingSelected?: boolean;
  onAdjustSelected?: () => void;
  onAddImages?: (images: ImageData[]) => void;
  onRecompressImages?: (images: ImageData[]) => Promise<ImageData[]>;
}

type SortField = 'name' | 'size' | 'date';
type SortOrder = 'asc' | 'desc';

const ImageGallery: FC<ImageGalleryProps> = ({ 
  originalImages = [], 
  compressionStatus, 
  compressedImages = [],
  onRemoveImage,
  settings,
  selectedImageIds,
  onSelectedChange,
  onAdjustSelected,
  onAddImages,
  onRecompressImages
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [selectedImage, setSelectedImage] = useState<ImageData | null>(null);
  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);

  useEffect(() => {
    setLastSelectedId(null);
  }, [compressedImages]);

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

  const handleImageSelect = (imageId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    let newSelected = [...selectedImageIds];

    if (event.shiftKey && lastSelectedId) {
      const currentIndex = sortedAndFilteredImages.findIndex(img => img.id === imageId);
      const lastIndex = sortedAndFilteredImages.findIndex(img => img.id === lastSelectedId);
      const start = Math.min(currentIndex, lastIndex);
      const end = Math.max(currentIndex, lastIndex);

      sortedAndFilteredImages.slice(start, end + 1).forEach(img => {
        if (!newSelected.includes(img.id)) {
          newSelected.push(img.id);
        }
      });
    } else {
      if (newSelected.includes(imageId)) {
        newSelected = newSelected.filter(id => id !== imageId);
      } else {
        newSelected.push(imageId);
      }
    }

    setLastSelectedId(imageId);
    onSelectedChange(newSelected);
  };

  const handleSelectAll = () => {
    onSelectedChange(sortedAndFilteredImages.map(img => img.id));
  };

  const handleDeselectAll = () => {
    onSelectedChange([]);
    setLastSelectedId(null);
  };

  const handleBulkDownload = () => {
    const selectedImagesList = sortedAndFilteredImages
      .filter(img => selectedImageIds.includes(img.id));
    bulkDownload(selectedImagesList, settings.askDownloadLocation);
  };

  const handleBulkDelete = () => {
    sortedAndFilteredImages
      .filter(img => selectedImageIds.includes(img.id))
      .forEach(onRemoveImage);
    onSelectedChange([]);
  };

  return (
    <div className="border rounded-lg border-gray-700 max-h-[calc(100vh-200px)] overflow-y-auto">
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

        <div className="mt-4 flex gap-2">
          <button
            onClick={handleSelectAll}
            className="px-3 py-1.5 border rounded-md border-gray-700 
              text-gray-200 hover:bg-gray-700 bg-gray-800 text-sm"
          >
            Select All
          </button>
          <button
            onClick={handleDeselectAll}
            className="px-3 py-1.5 border rounded-md border-gray-700 
              text-gray-200 hover:bg-gray-700 bg-gray-800 text-sm"
          >
            Deselect All
          </button>
          {selectedImageIds.length > 0 && (
            <>
              <button
                onClick={handleBulkDownload}
                className="px-3 py-1.5 border rounded-md border-gray-700 
                  text-gray-200 hover:bg-gray-700 bg-gray-800 text-sm flex items-center gap-1"
              >
                <Download className="h-4 w-4" />
                Download Selected
              </button>
              <button
                onClick={onAdjustSelected}
                className="px-3 py-1.5 border rounded-md border-gray-700 
                  text-gray-200 hover:bg-gray-700 bg-gray-800 text-sm flex items-center gap-1"
              >
                <Settings2 className="h-4 w-4" />
                Adjust Selected
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-3 py-1.5 border rounded-md border-gray-700 
                  text-gray-200 hover:bg-gray-700 bg-gray-800 text-sm flex items-center gap-1"
              >
                <Trash2 className="h-4 w-4" />
                Delete Selected
              </button>
            </>
          )}
        </div>
      </div>

      <div className="p-4 bg-gray-800">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {sortedAndFilteredImages.map((image, index) => {
            const isSuccess = compressionStatus.get(image.id);
            const isSelected = selectedImageIds.includes(image.id);
            
            return (
              <div 
                key={`image-${index}`} 
                className={`border p-2 rounded-lg border-gray-700 bg-gray-800 relative
                  ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
              >
                <div 
                  className="cursor-pointer relative"
                  onClick={() => setSelectedImage(image)}
                >
                  <div
                    onClick={(e) => handleImageSelect(image.id, e)}
                    className="absolute top-1 left-1 z-10"
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      className="w-4 h-4 rounded border-gray-600 bg-gray-800
                        text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveImage(image);
                    }}
                    className="absolute top-1 right-1 p-1 text-white hover:text-red-500 
                      rounded-full transition-colors z-10"
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
                <p className="text-xs text-gray-400 mt-1">
                  <span className="text-gray-100">{`${formatFileSize(image.size)}`} </span>
                  <span className="text-gray-400">({calculateCompressionRatio(findOriginalImage(image).size, image.size)}% smaller)</span>
                </p>
                <p className="text-xs text-gray-400">
                  {image.format && <span className="uppercase">{image.format}</span>}
                  {image.quality && <span className="text-blue-400 font-semibold"> • Q{image.quality}</span>}
                </p>
                <button
                  onClick={() => downloadImage(image, settings.askDownloadLocation)}
                  className="mt-2 px-2 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 text-xs w-full"
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
          onSaveEdited={onAddImages}
          onRecompressImages={onRecompressImages}
        />
      )}
    </div>
  );
};

export default ImageGallery; 