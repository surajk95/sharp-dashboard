import { FC, useState, useRef, useEffect } from 'react';
import { ImageData } from '../../types/image';
import { 
  Crop, 
  RotateCw, 
  Maximize2, 
  SplitSquareVertical, 
  SplitSquareHorizontal,
  Grid2x2,
  Download,
  X,
  Check
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

interface ImageEditorProps {
  image: ImageData;
  onClose: () => void;
  onSave: (editedImages: ImageData[]) => void;
  open: boolean;
  onRecompress?: (images: ImageData[]) => Promise<ImageData[]>;
}

type EditorMode = 'view' | 'crop' | 'rotate' | 'resize' | 'split';
type SplitMode = 'vertical' | 'horizontal' | 'quarter';

const ImageEditor: FC<ImageEditorProps> = ({
  image,
  onClose,
  onSave,
  open,
  onRecompress
}) => {
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

  useEffect(() => {
    if (open && imgRef.current) {
      const img = imgRef.current;
      img.onload = () => {
        setImageNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
        setResizeWidth(img.naturalWidth);
        setResizeHeight(img.naturalHeight);
      };
    }
  }, [open, image.url]);

  const handleCropStart = (e: React.MouseEvent<HTMLDivElement>) => {
    if (mode !== 'crop') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setDragStart({ x, y });
    setCropArea({ x, y, width: 0, height: 0 });
    setIsDragging(true);
  };

  const handleCropMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || mode !== 'crop') return;
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

  const applyCrop = async (): Promise<ImageData> => {
    return new Promise((resolve) => {
      const canvas = canvasRef.current;
      const img = imgRef.current;
      if (!canvas || !img) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const cropX = (cropArea.x / 100) * img.naturalWidth;
      const cropY = (cropArea.y / 100) * img.naturalHeight;
      const cropWidth = (cropArea.width / 100) * img.naturalWidth;
      const cropHeight = (cropArea.height / 100) * img.naturalHeight;

      canvas.width = cropWidth;
      canvas.height = cropHeight;

      ctx.drawImage(
        img,
        cropX, cropY, cropWidth, cropHeight,
        0, 0, cropWidth, cropHeight
      );

      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const nameWithoutExt = image.name.replace(/\.[^/.]+$/, '');
          const ext = image.name.split('.').pop();
          resolve({
            url,
            size: blob.size,
            name: `${nameWithoutExt}-cropped.${ext}`,
            id: crypto.randomUUID(),
            createdAt: Date.now(),
            quality: image.quality,
            format: image.format
          });
        }
      });
    });
  };

  const applyRotation = async (): Promise<ImageData> => {
    return new Promise((resolve) => {
      const canvas = canvasRef.current;
      const img = imgRef.current;
      if (!canvas || !img) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const rad = (rotation * Math.PI) / 180;
      const sin = Math.abs(Math.sin(rad));
      const cos = Math.abs(Math.cos(rad));
      
      canvas.width = img.naturalWidth * cos + img.naturalHeight * sin;
      canvas.height = img.naturalWidth * sin + img.naturalHeight * cos;

      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(rad);
      ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);

      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const nameWithoutExt = image.name.replace(/\.[^/.]+$/, '');
          const ext = image.name.split('.').pop();
          resolve({
            url,
            size: blob.size,
            name: `${nameWithoutExt}-rotated.${ext}`,
            id: crypto.randomUUID(),
            createdAt: Date.now(),
            quality: image.quality,
            format: image.format
          });
        }
      });
    });
  };

  const applyResize = async (): Promise<ImageData> => {
    return new Promise((resolve) => {
      const canvas = canvasRef.current;
      const img = imgRef.current;
      if (!canvas || !img) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = resizeWidth;
      canvas.height = resizeHeight;

      ctx.drawImage(img, 0, 0, resizeWidth, resizeHeight);

      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const nameWithoutExt = image.name.replace(/\.[^/.]+$/, '');
          const ext = image.name.split('.').pop();
          resolve({
            url,
            size: blob.size,
            name: `${nameWithoutExt}-resized.${ext}`,
            id: crypto.randomUUID(),
            createdAt: Date.now(),
            quality: image.quality,
            format: image.format
          });
        }
      });
    });
  };

  const applySplit = async (): Promise<ImageData[]> => {
    return new Promise((resolve) => {
      const canvas = canvasRef.current;
      const img = imgRef.current;
      if (!canvas || !img) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const results: ImageData[] = [];
      const nameWithoutExt = image.name.replace(/\.[^/.]+$/, '');
      const ext = image.name.split('.').pop();

      const createSplitImage = (
        sx: number, sy: number, sw: number, sh: number, suffix: string
      ): Promise<ImageData> => {
        return new Promise((res) => {
          canvas.width = sw;
          canvas.height = sh;
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);

          canvas.toBlob((blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob);
              res({
                url,
                size: blob.size,
                name: `${nameWithoutExt}-${suffix}.${ext}`,
                id: crypto.randomUUID(),
                createdAt: Date.now(),
                quality: image.quality,
                format: image.format
              });
            }
          });
        });
      };

      const width = img.naturalWidth;
      const height = img.naturalHeight;

      if (splitMode === 'vertical') {
        Promise.all([
          createSplitImage(0, 0, width / 2, height, 'left'),
          createSplitImage(width / 2, 0, width / 2, height, 'right')
        ]).then(resolve);
      } else if (splitMode === 'horizontal') {
        Promise.all([
          createSplitImage(0, 0, width, height / 2, 'top'),
          createSplitImage(0, height / 2, width, height / 2, 'bottom')
        ]).then(resolve);
      } else if (splitMode === 'quarter') {
        Promise.all([
          createSplitImage(0, 0, width / 2, height / 2, 'tl'),
          createSplitImage(width / 2, 0, width / 2, height / 2, 'tr'),
          createSplitImage(0, height / 2, width / 2, height / 2, 'bl'),
          createSplitImage(width / 2, height / 2, width / 2, height / 2, 'br')
        ]).then(resolve);
      }
    });
  };

  const handleSave = async () => {
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
      if (onRecompress && results.length > 0) {
        results = await onRecompress(results);
      }
    }

    if (results.length > 0) {
      onSave(results);
      onClose();
    }
  };

  const handleModeChange = (newMode: EditorMode) => {
    setMode(newMode);
    setCropArea({ x: 0, y: 0, width: 100, height: 100 });
    setRotation(0);
    if (imgRef.current) {
      setResizeWidth(imgRef.current.naturalWidth);
      setResizeHeight(imgRef.current.naturalHeight);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-[90vw] max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Edit Image - {image.name}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex gap-2 flex-wrap border-b border-gray-700 pb-4">
              <button
                onClick={() => handleModeChange('view')}
                className={`px-3 py-2 rounded flex items-center gap-2 ${
                  mode === 'view' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200'
                }`}
              >
                View
              </button>
              <button
                onClick={() => handleModeChange('crop')}
                className={`px-3 py-2 rounded flex items-center gap-2 ${
                  mode === 'crop' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200'
                }`}
              >
                <Crop className="h-4 w-4" />
                Crop
              </button>
              <button
                onClick={() => handleModeChange('rotate')}
                className={`px-3 py-2 rounded flex items-center gap-2 ${
                  mode === 'rotate' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200'
                }`}
              >
                <RotateCw className="h-4 w-4" />
                Rotate
              </button>
              <button
                onClick={() => handleModeChange('resize')}
                className={`px-3 py-2 rounded flex items-center gap-2 ${
                  mode === 'resize' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200'
                }`}
              >
                <Maximize2 className="h-4 w-4" />
                Resize
              </button>
              <button
                onClick={() => handleModeChange('split')}
                className={`px-3 py-2 rounded flex items-center gap-2 ${
                  mode === 'split' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200'
                }`}
              >
                <SplitSquareVertical className="h-4 w-4" />
                Split
              </button>
            </div>

            {/* Tool-specific controls */}
            {mode === 'crop' && (
              <div className="bg-gray-800 p-4 rounded">
                <p className="text-sm text-gray-300 mb-2">
                  Click and drag on the image to select the area to crop
                </p>
              </div>
            )}

            {mode === 'rotate' && (
              <div className="bg-gray-800 p-4 rounded space-y-4">
                <div>
                  <Label>Rotation: {rotation}°</Label>
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
                    className="px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-600"
                  >
                    +90°
                  </button>
                  <button
                    onClick={() => setRotation((r) => (r - 90 + 360) % 360)}
                    className="px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-600"
                  >
                    -90°
                  </button>
                  <button
                    onClick={() => setRotation(0)}
                    className="px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-600"
                  >
                    Reset
                  </button>
                </div>
              </div>
            )}

            {mode === 'resize' && (
              <div className="bg-gray-800 p-4 rounded space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="width">Width (px)</Label>
                    <input
                      type="number"
                      id="width"
                      value={resizeWidth || 0}
                      onChange={(e) => {
                        const value = e.target.value === '' ? 0 : parseInt(e.target.value);
                        setResizeWidth(value);
                      }}
                      className="w-full mt-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="height">Height (px)</Label>
                    <input
                      type="number"
                      id="height"
                      value={resizeHeight || 0}
                      onChange={(e) => {
                        const value = e.target.value === '' ? 0 : parseInt(e.target.value);
                        setResizeHeight(value);
                      }}
                      className="w-full mt-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setResizeWidth(imageNaturalSize.width / 2);
                      setResizeHeight(imageNaturalSize.height / 2);
                    }}
                    className="px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-600"
                  >
                    50%
                  </button>
                  <button
                    onClick={() => {
                      setResizeWidth(imageNaturalSize.width);
                      setResizeHeight(imageNaturalSize.height);
                    }}
                    className="px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-600"
                  >
                    100%
                  </button>
                  <button
                    onClick={() => {
                      setResizeWidth(imageNaturalSize.width * 2);
                      setResizeHeight(imageNaturalSize.height * 2);
                    }}
                    className="px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-600"
                  >
                    200%
                  </button>
                </div>
              </div>
            )}

            {mode === 'split' && (
              <div className="bg-gray-800 p-4 rounded">
                <Label>Split Mode</Label>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => setSplitMode('vertical')}
                    className={`px-3 py-2 rounded flex items-center gap-2 ${
                      splitMode === 'vertical' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200'
                    }`}
                  >
                    <SplitSquareVertical className="h-4 w-4" />
                    Vertical
                  </button>
                  <button
                    onClick={() => setSplitMode('horizontal')}
                    className={`px-3 py-2 rounded flex items-center gap-2 ${
                      splitMode === 'horizontal' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200'
                    }`}
                  >
                    <SplitSquareHorizontal className="h-4 w-4" />
                    Horizontal
                  </button>
                  <button
                    onClick={() => setSplitMode('quarter')}
                    className={`px-3 py-2 rounded flex items-center gap-2 ${
                      splitMode === 'quarter' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200'
                    }`}
                  >
                    <Grid2x2 className="h-4 w-4" />
                    Quarter
                  </button>
                </div>
              </div>
            )}

            {/* Image preview */}
            <div className="relative border border-gray-700 rounded overflow-hidden bg-gray-900">
              <div
                className="relative w-full"
                style={{ minHeight: '400px' }}
                onMouseDown={handleCropStart}
                onMouseMove={handleCropMove}
                onMouseUp={handleCropEnd}
                onMouseLeave={handleCropEnd}
              >
                <img
                  ref={imgRef}
                  src={image.url}
                  alt={image.name}
                  className="w-full h-auto"
                  style={{
                    transform: mode === 'rotate' ? `rotate(${rotation}deg)` : undefined,
                    maxHeight: '600px',
                    objectFit: 'contain'
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
                      <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-blue-500" />
                    )}
                    {(splitMode === 'horizontal' || splitMode === 'quarter') && (
                      <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-blue-500" />
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex justify-end gap-2 pt-4 border-t border-gray-700">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={mode === 'view'}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Check className="h-4 w-4" />
                {mode === 'split' ? 'Create Split Images' : 'Save Changes'}
              </button>
            </div>
          </div>

          {/* Hidden canvas for processing */}
          <canvas ref={canvasRef} className="hidden" />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ImageEditor;

