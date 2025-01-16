import { FC, useState } from 'react';
import { ImageData } from '../../types/image';
import { formatFileSize, calculateCompressionRatio } from '../../utils/image-utils';
import { X, Download } from 'lucide-react';
import ReactCompareImage from 'react-compare-image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { downloadImage } from '../../utils/image-utils';
import './styles.css';
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
    ? calculateCompressionRatio(originalImage.size, compressedImage.size)
    : '0';

  const handleFullScreenToggle = () => {
    setShowFullScreen(!showFullScreen);
  };

  return (
    <>
      <Dialog open={open && !showFullScreen} onOpenChange={onClose}>
        <DialogContent className="max-w-[75vw] w-[90vw]">
          <DialogHeader>
            <DialogTitle>{originalImage.name}</DialogTitle>
          </DialogHeader>
          
          <div 
            className="dialog-content aspect-video w-full max-w-[90vw] max-h-[80vh] relative cursor-zoom-in flex items-center justify-center overflow-hidden"
            onClick={handleFullScreenToggle}
          >
            {compressedImage ? (
              <ReactCompareImage
                leftImage={originalImage.url}
                rightImage={compressedImage.url}
                leftImageAlt={originalImage.name}
                rightImageAlt={compressedImage.name}
                leftImageCss={{
                  objectFit: 'contain',
                  maxHeight: '80vh',
                  // maxWidth: '40vw',
                }}
                rightImageCss={{
                  objectFit: 'contain',
                  maxHeight: '80vh',
                  // maxWidth: '40vw',
                }}
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

          <div className="mt-4 flex justify-between items-end">
            <div className="grid grid-cols-2 gap-2 text-sm text-gray-300">
              <div className="space-y-1">
                <p>Original <b>{formatFileSize(originalImage.size)}</b></p>
                {compressedImage && (
                  <div className="space-y-1">
                    <p>Compressed <b>{formatFileSize(compressedImage.size)}</b></p>
                    <p><b className="text-green-500">{compressionRatio}%</b> smaller</p>
                  </div>
                )}
              </div>
            </div>
            
            {compressedImage && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  downloadImage(compressedImage);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <Download className="h-4 w-4" />
                Download
              </button>
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