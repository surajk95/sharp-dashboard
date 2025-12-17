import { FC, useState, useRef, useEffect } from 'react';
import { ImageData } from '../../types/image';
import { formatFileSize, calculateCompressionRatio } from '../../utils/image-utils';
import { 
  Download,
  Crop, 
  RotateCw, 
  Maximize2, 
  SplitSquareVertical, 
  SplitSquareHorizontal,
  Grid2x2,
  Check,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import ReactCompareImage from 'react-compare-image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { downloadImage } from '../../utils/image-utils';
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import './styles.css';

interface ImageComparisonDialogProps {
  originalImage: ImageData;
  compressedImage?: ImageData;
  onClose: () => void;
  open: boolean;
  onSaveEdited?: (editedImages: ImageData[]) => void;
  onRecompressImages?: (images: ImageData[]) => Promise<ImageData[]>;
  onNavigate?: (direction: 'prev' | 'next') => void;
  hasPrev?: boolean;
  hasNext?: boolean;
}

type EditorMode = 'view' | 'crop' | 'rotate' | 'resize' | 'split';
type SplitMode = 'vertical' | 'horizontal' | 'quarter';

const ImageComparisonDialog: FC<ImageComparisonDialogProps> = ({
  originalImage,
  compressedImage,
  onClose,
  open,
  onSaveEdited,
  onRecompressImages,
  onNavigate,
  hasPrev = false,
  hasNext = false
}) => {
  const [showFullScreen, setShowFullScreen] = useState(false);
  const [mode, setMode] = useState<EditorMode>('view');
  const [rotation, setRotation] = useState(0);
  const [resizeWidth, setResizeWidth] = useState(0);
  const [resizeHeight, setResizeHeight] = useState(0);
  const [splitMode, setSplitMode] = useState<SplitMode>('vertical');
  const [cropArea, setCropArea] = useState({ x: 0, y: 0, width: 100, height: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageNaturalSize, setImageNaturalSize] = useState({ width: 0, height: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const compressionRatio = compressedImage 
    ? calculateCompressionRatio(originalImage.size, compressedImage.size)
    : '0';

  useEffect(() => {
    if (open && compressedImage) {
      const img = new Image();
      img.onload = () => {
        setImageNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
        setResizeWidth(img.naturalWidth);
        setResizeHeight(img.naturalHeight);
      };
      img.src = compressedImage.url;
    }
  }, [open, compressedImage]);

  // Keyboard navigation
  useEffect(() => {
    if (!open || !onNavigate) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't navigate if user is in an input field
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === 'ArrowLeft' && hasPrev) {
        e.preventDefault();
        onNavigate('prev');
      } else if (e.key === 'ArrowRight' && hasNext) {
        e.preventDefault();
        onNavigate('next');
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onNavigate, hasPrev, hasNext, onClose]);

  const handleFullScreenToggle = () => {
    setShowFullScreen(!showFullScreen);
  };

  const handleCropStart = (e: React.MouseEvent<HTMLDivElement>) => {
    if (mode !== 'crop') return;
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setDragStart({ x, y });
    setCropArea({ x, y, width: 0, height: 0 });
    setIsDragging(true);
  };

  const handleCropMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || mode !== 'crop') return;
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    setCropArea({
      x: Math.min(dragStart.x, x),
      y: Math.min(dragStart.y, y),
      width: Math.abs(x - dragStart.x),
      height: Math.abs(y - dragStart.y)
    });
  };

  const handleCropEnd = () => {
    setIsDragging(false);
  };

  const processImage = async (
    processFunc: (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, img: HTMLImageElement) => void,
    suffix: string
  ): Promise<ImageData> => {
    return new Promise((resolve) => {
      if (!compressedImage) return;
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        if (!ctx) return;
        processFunc(canvas, ctx, img);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const nameWithoutExt = compressedImage.name.replace(/\.[^/.]+$/, '');
            const ext = compressedImage.name.split('.').pop();
            resolve({
              url,
              size: blob.size,
              name: `${nameWithoutExt}${suffix}.${ext}`,
              id: crypto.randomUUID(),
              createdAt: Date.now(),
              quality: compressedImage.quality,
              format: compressedImage.format
            });
          }
        });
      };
      
      img.src = compressedImage.url;
    });
  };

  const applyCrop = async (): Promise<ImageData> => {
    return processImage((canvas, ctx, img) => {
      const cropX = (cropArea.x / 100) * img.naturalWidth;
      const cropY = (cropArea.y / 100) * img.naturalHeight;
      const cropWidth = (cropArea.width / 100) * img.naturalWidth;
      const cropHeight = (cropArea.height / 100) * img.naturalHeight;

      canvas.width = cropWidth;
      canvas.height = cropHeight;
      ctx.drawImage(img, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
    }, '-cropped');
  };

  const applyRotation = async (): Promise<ImageData> => {
    return processImage((canvas, ctx, img) => {
      const rad = (rotation * Math.PI) / 180;
      const sin = Math.abs(Math.sin(rad));
      const cos = Math.abs(Math.cos(rad));
      
      canvas.width = img.naturalWidth * cos + img.naturalHeight * sin;
      canvas.height = img.naturalWidth * sin + img.naturalHeight * cos;

      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(rad);
      ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
    }, '-rotated');
  };

  const applyResize = async (): Promise<ImageData> => {
    return processImage((canvas, ctx, img) => {
      canvas.width = resizeWidth;
      canvas.height = resizeHeight;
      ctx.drawImage(img, 0, 0, resizeWidth, resizeHeight);
    }, '-resized');
  };

  const applySplit = async (): Promise<ImageData[]> => {
    if (!compressedImage) return [];

    const results: ImageData[] = [];
    const nameWithoutExt = compressedImage.name.replace(/\.[^/.]+$/, '');
    const ext = compressedImage.name.split('.').pop();

    const createSplitImage = (
      sx: number, sy: number, sw: number, sh: number, suffix: string
    ): Promise<ImageData> => {
      return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        img.onload = () => {
          if (!ctx) return;
          canvas.width = sw;
          canvas.height = sh;
          ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);

          canvas.toBlob((blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob);
              resolve({
                url,
                size: blob.size,
                name: `${nameWithoutExt}-${suffix}.${ext}`,
                id: crypto.randomUUID(),
                createdAt: Date.now(),
                quality: compressedImage.quality,
                format: compressedImage.format
              });
            }
          });
        };

        img.src = compressedImage.url;
      });
    };

    const img = new Image();
    await new Promise((resolve) => {
      img.onload = resolve;
      img.src = compressedImage.url;
    });

    const width = img.naturalWidth;
    const height = img.naturalHeight;

    if (splitMode === 'vertical') {
      return Promise.all([
        createSplitImage(0, 0, width / 2, height, 'left'),
        createSplitImage(width / 2, 0, width / 2, height, 'right')
      ]);
    } else if (splitMode === 'horizontal') {
      return Promise.all([
        createSplitImage(0, 0, width, height / 2, 'top'),
        createSplitImage(0, height / 2, width, height / 2, 'bottom')
      ]);
    } else if (splitMode === 'quarter') {
      return Promise.all([
        createSplitImage(0, 0, width / 2, height / 2, 'tl'),
        createSplitImage(width / 2, 0, width / 2, height / 2, 'tr'),
        createSplitImage(0, height / 2, width / 2, height / 2, 'bl'),
        createSplitImage(width / 2, height / 2, width / 2, height / 2, 'br')
      ]);
    }

    return [];
  };

  const handleSave = async () => {
    if (!onSaveEdited) return;
    
    let results: ImageData[] = [];

    if (mode === 'crop' && cropArea.width > 0 && cropArea.height > 0) {
      results = [await applyCrop()];
    } else if (mode === 'rotate' && rotation !== 0) {
      results = [await applyRotation()];
    } else if (mode === 'resize' && (resizeWidth !== imageNaturalSize.width || resizeHeight !== imageNaturalSize.height)) {
      results = [await applyResize()];
    } else if (mode === 'split') {
      results = await applySplit();
      // Recompress split images to maintain quality/format settings
      if (onRecompressImages && results.length > 0) {
        results = await onRecompressImages(results);
      }
    }

    if (results.length > 0) {
      onSaveEdited(results);
      setMode('view');
      setCropArea({ x: 0, y: 0, width: 100, height: 100 });
      setRotation(0);
    }
  };

  const handleModeChange = (newMode: EditorMode) => {
    setMode(newMode);
    setCropArea({ x: 0, y: 0, width: 100, height: 100 });
    setRotation(0);
    setResizeWidth(imageNaturalSize.width);
    setResizeHeight(imageNaturalSize.height);
  };

  return (
    <>
      {/* Navigation arrows - outside dialog content */}
      {open && !showFullScreen && onNavigate && (
        <>
          {hasPrev && (
            <button
              onClick={() => onNavigate('prev')}
              className="fixed left-4 top-1/2 -translate-y-1/2 z-[60] p-2 bg-gray-800 bg-opacity-90 text-white rounded-full hover:bg-gray-700 transition-colors"
              title="Previous image (←)"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          )}
          {hasNext && (
            <button
              onClick={() => onNavigate('next')}
              className="fixed right-4 top-1/2 -translate-y-1/2 z-[60] p-2 bg-gray-800 bg-opacity-90 text-white rounded-full hover:bg-gray-700 transition-colors"
              title="Next image (→)"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          )}
        </>
      )}

      <Dialog open={open && !showFullScreen} onOpenChange={onClose}>
        <DialogContent className="max-w-[90vw] max-h-[95vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>{originalImage.name}</DialogTitle>
          </DialogHeader>

          {/* Edit Toolbar */}
          {compressedImage && (
            <div className="flex gap-2 flex-wrap border-b border-gray-700 pb-3">
              <button
                onClick={() => handleModeChange('view')}
                className={`px-3 py-2 rounded text-sm flex items-center gap-2 ${
                  mode === 'view' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200'
                }`}
              >
                View
              </button>
              <button
                onClick={() => handleModeChange('crop')}
                className={`px-3 py-2 rounded text-sm flex items-center gap-2 ${
                  mode === 'crop' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200'
                }`}
              >
                <Crop className="h-4 w-4" />
                Crop
              </button>
              <button
                onClick={() => handleModeChange('rotate')}
                className={`px-3 py-2 rounded text-sm flex items-center gap-2 ${
                  mode === 'rotate' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200'
                }`}
              >
                <RotateCw className="h-4 w-4" />
                Rotate
              </button>
              <button
                onClick={() => handleModeChange('resize')}
                className={`px-3 py-2 rounded text-sm flex items-center gap-2 ${
                  mode === 'resize' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200'
                }`}
              >
                <Maximize2 className="h-4 w-4" />
                Resize
              </button>
              <button
                onClick={() => handleModeChange('split')}
                className={`px-3 py-2 rounded text-sm flex items-center gap-2 ${
                  mode === 'split' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200'
                }`}
              >
                <SplitSquareVertical className="h-4 w-4" />
                Split
              </button>

              {mode !== 'view' && (
                <div className="ml-auto flex gap-2">
                  <button
                    onClick={() => handleModeChange('view')}
                    className="px-3 py-2 bg-gray-700 text-white rounded text-sm hover:bg-gray-600 flex items-center gap-2"
                  >
                    <X className="h-4 w-4" />
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-3 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 flex items-center gap-2"
                  >
                    <Check className="h-4 w-4" />
                    {mode === 'split' ? 'Create' : 'Apply'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Tool-specific controls */}
          {mode === 'crop' && (
            <div className="bg-gray-800 p-3 rounded text-sm">
              <p className="text-gray-300">
                Click and drag on the image to select the area to crop
              </p>
            </div>
          )}

          {mode === 'rotate' && (
            <div className="bg-gray-800 p-3 rounded space-y-3">
              <div>
                <Label className="text-sm">Rotation: {rotation}°</Label>
                <Slider
                  value={[rotation]}
                  onValueChange={(value) => setRotation(value[0])}
                  min={0}
                  max={360}
                  step={1}
                  className="mt-2"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setRotation((r) => (r + 90) % 360)}
                  className="px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-600 text-sm"
                >
                  +90°
                </button>
                <button
                  onClick={() => setRotation((r) => (r - 90 + 360) % 360)}
                  className="px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-600 text-sm"
                >
                  -90°
                </button>
                <button
                  onClick={() => setRotation(0)}
                  className="px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-600 text-sm"
                >
                  Reset
                </button>
              </div>
            </div>
          )}

          {mode === 'resize' && (
            <div className="bg-gray-800 p-3 rounded space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="width" className="text-sm">Width (px)</Label>
                  <input
                    type="number"
                    id="width"
                    value={resizeWidth || 0}
                    onChange={(e) => {
                      const value = e.target.value === '' ? 0 : parseInt(e.target.value);
                      setResizeWidth(value);
                    }}
                    className="w-full mt-1 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="height" className="text-sm">Height (px)</Label>
                  <input
                    type="number"
                    id="height"
                    value={resizeHeight || 0}
                    onChange={(e) => {
                      const value = e.target.value === '' ? 0 : parseInt(e.target.value);
                      setResizeHeight(value);
                    }}
                    className="w-full mt-1 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setResizeWidth(Math.floor(imageNaturalSize.width / 2));
                    setResizeHeight(Math.floor(imageNaturalSize.height / 2));
                  }}
                  className="px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-600 text-sm"
                >
                  50%
                </button>
                <button
                  onClick={() => {
                    setResizeWidth(imageNaturalSize.width);
                    setResizeHeight(imageNaturalSize.height);
                  }}
                  className="px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-600 text-sm"
                >
                  100%
                </button>
                <button
                  onClick={() => {
                    setResizeWidth(imageNaturalSize.width * 2);
                    setResizeHeight(imageNaturalSize.height * 2);
                  }}
                  className="px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-600 text-sm"
                >
                  200%
                </button>
              </div>
            </div>
          )}

          {mode === 'split' && (
            <div className="bg-gray-800 p-3 rounded">
              <Label className="text-sm">Split Mode</Label>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => setSplitMode('vertical')}
                  className={`px-3 py-2 rounded text-sm flex items-center gap-2 ${
                    splitMode === 'vertical' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200'
                  }`}
                >
                  <SplitSquareVertical className="h-4 w-4" />
                  Vertical
                </button>
                <button
                  onClick={() => setSplitMode('horizontal')}
                  className={`px-3 py-2 rounded text-sm flex items-center gap-2 ${
                    splitMode === 'horizontal' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200'
                  }`}
                >
                  <SplitSquareHorizontal className="h-4 w-4" />
                  Horizontal
                </button>
                <button
                  onClick={() => setSplitMode('quarter')}
                  className={`px-3 py-2 rounded text-sm flex items-center gap-2 ${
                    splitMode === 'quarter' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200'
                  }`}
                >
                  <Grid2x2 className="h-4 w-4" />
                  Quarter
                </button>
              </div>
            </div>
          )}
          
          <div 
            className={`dialog-content w-full max-h-[60vh] relative flex items-center justify-center overflow-hidden border border-gray-700 rounded ${mode === 'view' ? 'cursor-zoom-in' : ''}`}
            onClick={mode === 'view' ? handleFullScreenToggle : undefined}
            onMouseDown={handleCropStart}
            onMouseMove={handleCropMove}
            onMouseUp={handleCropEnd}
            onMouseLeave={handleCropEnd}
          >
            {compressedImage && mode === 'view' ? (
              <ReactCompareImage
                leftImage={originalImage.url}
                rightImage={compressedImage.url}
                leftImageAlt={originalImage.name}
                rightImageAlt={compressedImage.name}
                leftImageCss={{
                  objectFit: 'contain',
                  maxHeight: '60vh',
                }}
                rightImageCss={{
                  objectFit: 'contain',
                  maxHeight: '60vh',
                }}
                leftImageLabel="Original"
                rightImageLabel="Compressed"
                sliderLineWidth={2}
                handleSize={40}
                sliderPositionPercentage={0.5}
                hover
              />
            ) : compressedImage ? (
              <div className="relative w-full h-full min-h-[400px]">
                <img
                  ref={imgRef}
                  src={compressedImage.url}
                  alt={compressedImage.name}
                  className="w-full h-full object-contain"
                  style={{
                    transform: mode === 'rotate' ? `rotate(${rotation}deg)` : undefined,
                    maxHeight: '60vh'
                  }}
                />

                {/* Crop overlay */}
                {mode === 'crop' && cropArea.width > 0 && cropArea.height > 0 && (
                  <div
                    className="absolute border-2 border-blue-500 bg-blue-500 bg-opacity-20"
                    style={{
                      left: `${cropArea.x}%`,
                      top: `${cropArea.y}%`,
                      width: `${cropArea.width}%`,
                      height: `${cropArea.height}%`,
                      pointerEvents: 'none'
                    }}
                  />
                )}

                {/* Split preview lines */}
                {mode === 'split' && (
                  <>
                    {(splitMode === 'vertical' || splitMode === 'quarter') && (
                      <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-blue-500 pointer-events-none" />
                    )}
                    {(splitMode === 'horizontal' || splitMode === 'quarter') && (
                      <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-blue-500 pointer-events-none" />
                    )}
                  </>
                )}
              </div>
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
            
            {compressedImage && mode === 'view' && (
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

          <canvas ref={canvasRef} className="hidden" />
        </DialogContent>
      </Dialog>

      {showFullScreen && compressedImage && (
        <div 
          className="fixed inset-0 bg-black z-[100] flex items-center justify-center cursor-zoom-out"
          onClick={handleFullScreenToggle}
        >
          {/* Navigation arrows in fullscreen */}
          {onNavigate && (
            <>
              {hasPrev && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onNavigate('prev');
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-[101] p-3 bg-gray-800 bg-opacity-90 text-white rounded-full hover:bg-gray-700 transition-colors"
                  title="Previous image (←)"
                >
                  <ChevronLeft className="h-8 w-8" />
                </button>
              )}
              {hasNext && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onNavigate('next');
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-[101] p-3 bg-gray-800 bg-opacity-90 text-white rounded-full hover:bg-gray-700 transition-colors"
                  title="Next image (→)"
                >
                  <ChevronRight className="h-8 w-8" />
                </button>
              )}
            </>
          )}
          
          <div className="w-full h-full p-4">
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
      )}
    </>
  );
};

export default ImageComparisonDialog;
