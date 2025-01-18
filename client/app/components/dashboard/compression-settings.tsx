import { FC, useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Settings2, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CompressionSettings } from '../../types/compression-settings';

interface CompressionSettingsDialogProps {
  settings: CompressionSettings;
  onSettingsChange: (settings: CompressionSettings) => void;
  isAdjusting?: boolean;
  onAdjust?: (settings: CompressionSettings) => void;
  onClose?: () => void;
}

const CompressionSettingsDialog: FC<CompressionSettingsDialogProps> = ({
  settings,
  onSettingsChange,
  isAdjusting,
  onAdjust,
  onClose,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [localSettings, setLocalSettings] = useState(settings);
  console.log(isAdjusting)
  useEffect(() => {
    if (isAdjusting) {
      setIsOpen(true);
    }
  }, [isAdjusting]);

  const handleClose = () => {
    setIsOpen(false);
    onClose?.();
  };

  const handleSave = () => {
    if (isAdjusting && onAdjust) {
      onAdjust(localSettings);
    } else {
      onSettingsChange(localSettings);
    }
    handleClose();
  };

  return (
    <Dialog 
      open={isOpen || isAdjusting} 
      onOpenChange={(open) => {
        if (!open) handleClose();
        else setIsOpen(true);
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" className="fixed top-[20px] right-[20px] flex items-center gap-2">
          <Settings2 className="h-4 w-4" />
          Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Compression Settings</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4 py-1">
            <Label htmlFor="format" className="col-span-2">
              Format
            </Label>
            <Select
              value={localSettings.format}
              onValueChange={(value: CompressionSettings['format']) =>
                setLocalSettings({ ...localSettings, format: value })
              }
            >
              <SelectTrigger className="col-span-2">
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="jpeg">JPEG</SelectItem>
                <SelectItem value="png">PNG</SelectItem>
                <SelectItem value="webp">WebP</SelectItem>
                <SelectItem value="avif">AVIF</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4 py-1">
            <Label htmlFor="quality" className="col-span-2">
              Quality: {localSettings.quality}
            </Label>
            <div className="col-span-2">
              <Slider
                value={[localSettings.quality]}
                min={1}
                max={100}
                step={1}
                onValueChange={([value]) =>
                  setLocalSettings({ ...localSettings, quality: value })
                }
              />
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4 py-1">
            <Label htmlFor="keepExif" className="col-span-2">
              Keep EXIF Data
            </Label>
            <Switch
              id="keepExif"
              checked={localSettings.keepExif}
              onCheckedChange={(checked) =>
                setLocalSettings({ ...localSettings, keepExif: checked })
              }
              className="col-span-2"
            />
          </div>
          {!isAdjusting && (
            <div className="grid grid-cols-4 items-center gap-4 py-1">
              <Label htmlFor="askDownloadLocation" className="col-span-2 flex items-center gap-2">
                Ask Download Location
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>If you&apos;re not able to save images in a folder because of permissions, try creating a subfolder within that folder</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Label>
            <Switch
              id="askDownloadLocation"
              checked={localSettings.askDownloadLocation}
              onCheckedChange={(checked) =>
                setLocalSettings({ ...localSettings, askDownloadLocation: checked })
              }
              className="col-span-2"
              />
            </div>
          )}
          <div className="grid grid-cols-4 items-center gap-4 py-1">
            <Label htmlFor="usePrefix" className="col-span-2 flex items-center gap-2">
              Add Prefix to compressed images
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Toggle between prefix or suffix for compressed image names</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Label>
            <Switch
              id="usePrefix"
              checked={localSettings.usePrefix}
              onCheckedChange={(checked) =>
                setLocalSettings({ 
                  ...localSettings, 
                  usePrefix: checked,
                  namingPattern: checked ? 'compressed-' : '-compressed'
                })
              }
              className="col-span-2"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4 py-1">
            <Label htmlFor="namingPattern" className="col-span-2 flex items-center gap-2">
              {localSettings.usePrefix ? 'Prefix' : 'Suffix'} Pattern
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Pattern to add {localSettings.usePrefix ? 'before' : 'after'} the original filename</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Label>
            <input
              type="text"
              id="namingPattern"
              value={localSettings.namingPattern}
              onChange={(e) =>
                setLocalSettings({ ...localSettings, namingPattern: e.target.value })
              }
              className="col-span-2 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4 py-1">
            <Label htmlFor="limitDimensions" className="col-span-2 flex items-center gap-2">
              Limit Image Dimensions
            </Label>
            <Switch
              id="limitDimensions"
              checked={localSettings.limitDimensions}
              onCheckedChange={(checked) =>
                setLocalSettings({ ...localSettings, limitDimensions: checked })
              }
              className="col-span-2"
            />
          </div>
          
          {localSettings.limitDimensions && (
            <div className="grid grid-cols-4 items-center gap-4 py-1">
              <Label htmlFor="maxWidth" className="col-span-1">
                Max Width
              </Label>
              <input
                type="number"
                id="maxWidth"
                value={localSettings.maxWidth || 0}
                onChange={(e) => {
                  const value = e.target.value === '' ? 0 : parseInt(e.target.value);
                  setLocalSettings({ ...localSettings, maxWidth: value });
                }}
                className="col-span-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
              <Label htmlFor="maxHeight" className="col-span-1">
                Max Height
              </Label>
              <input
                type="number"
                id="maxHeight"
                value={localSettings.maxHeight || 0}
                onChange={(e) => {
                  const value = e.target.value === '' ? 0 : parseInt(e.target.value);
                  setLocalSettings({ ...localSettings, maxHeight: value });
                }}
                className="col-span-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
          )}
        </div>
        {isAdjusting && (
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Save Changes
          </button>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CompressionSettingsDialog; 