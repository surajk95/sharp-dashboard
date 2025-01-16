import { FC } from 'react';
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

interface CompressionSettingsProps {
  settings: CompressionSettings;
  onSettingsChange: (settings: CompressionSettings) => void;
}

const CompressionSettingsDialog: FC<CompressionSettingsProps> = ({
  settings,
  onSettingsChange,
}) => {
  return (
    <Dialog>
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
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="format" className="col-span-2">
              Format
            </Label>
            <Select
              value={settings.format}
              onValueChange={(value: CompressionSettings['format']) =>
                onSettingsChange({ ...settings, format: value })
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
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="quality" className="col-span-2">
              Quality: {settings.quality}
            </Label>
            <div className="col-span-2">
              <Slider
                value={[settings.quality]}
                min={1}
                max={100}
                step={1}
                onValueChange={([value]) =>
                  onSettingsChange({ ...settings, quality: value })
                }
              />
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="keepExif" className="col-span-2">
              Keep EXIF Data
            </Label>
            <Switch
              id="keepExif"
              checked={settings.keepExif}
              onCheckedChange={(checked) =>
                onSettingsChange({ ...settings, keepExif: checked })
              }
              className="col-span-2"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="askDownloadLocation" className="col-span-2 flex items-center gap-2">
              Ask Download Location
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>If you're not able to save images in a folder because of permissions, try creating a subfolder within that folder</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Label>
            <Switch
              id="askDownloadLocation"
              checked={settings.askDownloadLocation}
              onCheckedChange={(checked) =>
                onSettingsChange({ ...settings, askDownloadLocation: checked })
              }
              className="col-span-2"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
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
              checked={settings.usePrefix}
              onCheckedChange={(checked) =>
                onSettingsChange({ 
                  ...settings, 
                  usePrefix: checked,
                  namingPattern: checked ? 'compressed-' : '-compressed'
                })
              }
              className="col-span-2"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="namingPattern" className="col-span-2 flex items-center gap-2">
              {settings.usePrefix ? 'Prefix' : 'Suffix'} Pattern
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Pattern to add {settings.usePrefix ? 'before' : 'after'} the original filename</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Label>
            <input
              type="text"
              id="namingPattern"
              value={settings.namingPattern}
              onChange={(e) =>
                onSettingsChange({ ...settings, namingPattern: e.target.value })
              }
              className="col-span-2 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="limitDimensions" className="col-span-2 flex items-center gap-2">
              Limit Image Dimensions
            </Label>
            <Switch
              id="limitDimensions"
              checked={settings.limitDimensions}
              onCheckedChange={(checked) =>
                onSettingsChange({ ...settings, limitDimensions: checked })
              }
              className="col-span-2"
            />
          </div>
          
          {settings.limitDimensions && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="maxWidth" className="col-span-1">
                Max Width
              </Label>
              <input
                type="number"
                id="maxWidth"
                value={settings.maxWidth || 0}
                onChange={(e) => {
                  const value = e.target.value === '' ? 0 : parseInt(e.target.value);
                  onSettingsChange({ ...settings, maxWidth: value });
                }}
                className="col-span-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
              <Label htmlFor="maxHeight" className="col-span-1">
                Max Height
              </Label>
              <input
                type="number"
                id="maxHeight"
                value={settings.maxHeight || 0}
                onChange={(e) => {
                  const value = e.target.value === '' ? 0 : parseInt(e.target.value);
                  onSettingsChange({ ...settings, maxHeight: value });
                }}
                className="col-span-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CompressionSettingsDialog; 