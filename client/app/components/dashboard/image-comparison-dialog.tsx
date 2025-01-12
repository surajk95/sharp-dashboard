import { FC, useState } from 'react';
import { ImageData } from '../../types/image';
import { formatFileSize } from '../../utils/image-utils';
import { X } from 'lucide-react';
import ReactCompareImage from 'react-compare-image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ImageComparisonDialogProps {
  originalImage: ImageData;
  compressedImage?: ImageData;
  onClose: () => void;
  open: boolean;
}

const ImageComparisonDialog: FC<ImageComparisonDialogProps> = ({
  originalImage,
  compressedImage,
  onClose,
  open
}) => {
  const [showFullScreen, setShowFullScreen] = useState(false);
  const compressionRatio = compressedImage 
    ? ((1 - compressedImage.size / originalImage.size) * 100).toFixed(1)
    : 0;

  const handleFullScreenToggle = () => {
    setShowFullScreen(!showFullScreen);
  };

  return (
    <>
      <Dialog open={open && !showFullScreen} onOpenChange={onClose}>
        <DialogContent className="max-w-[75vw] w-[90vw]">
          <DialogHeader>
            <DialogTitle>Image Comparison</DialogTitle>
          </DialogHeader>
          
          <div 
            className="aspect-video w-full relative cursor-zoom-in flex items-center justify-center"
            onClick={handleFullScreenToggle}
          >
            {compressedImage ? (
              <ReactCompareImage
                leftImage={originalImage.url}
                rightImage={compressedImage.url}
                leftImageLabel="Original"
                rightImageLabel="Compressed"
                sliderLineWidth={2}
                handleSize={40}
                sliderPositionPercentage={0.5}
                hover
              />
            ) : (
              <img
                src={originalImage.url}
                alt={originalImage.name}
                className="w-full h-full object-contain"
              />
            )}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4 text-sm text-gray-300">
            <div className="space-y-1">
              <p className="font-medium">Original Image</p>
              <p>Size: {formatFileSize(originalImage.size)}</p>
              <p>Name: {originalImage.name}</p>
            </div>
            {compressedImage && (
              <div className="space-y-1">
                <p className="font-medium">Compressed Image</p>
                <p>Size: {formatFileSize(compressedImage.size)}</p>
                <p>Compression: {compressionRatio}% smaller</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {showFullScreen && compressedImage && (
        <div 
          className="fixed inset-0 bg-black z-50 overflow-auto cursor-zoom-out"
          onClick={handleFullScreenToggle}
        >
          <div className="min-w-full min-h-full p-4 flex items-center justify-center">
            <div className="w-full h-full">
              <ReactCompareImage
                leftImage={originalImage.url}
                rightImage={compressedImage.url}
                leftImageLabel="Original"
                rightImageLabel="Compressed"
                sliderLineWidth={2}
                handleSize={40}
                sliderPositionPercentage={0.5}
                hover
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ImageComparisonDialog; 