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
import { Settings2 } from "lucide-react";

export interface CompressionSettings {
  format: 'jpeg' | 'png' | 'webp' | 'avif';
  quality: number;
  keepExif: boolean;
}

interface CompressionSettingsProps {
  settings: CompressionSettings;
  onSettingsChange: (settings: CompressionSettings) => void;
}

const CompressionSettings: FC<CompressionSettingsProps> = ({
  settings,
  onSettingsChange,
}) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <Settings2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Compression Settings</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="format" className="text-right">
              Format
            </Label>
            <Select
              value={settings.format}
              onValueChange={(value: CompressionSettings['format']) =>
                onSettingsChange({ ...settings, format: value })
              }
            >
              <SelectTrigger className="col-span-3">
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
            <Label htmlFor="quality" className="text-right">
              Quality: {settings.quality}
            </Label>
            <div className="col-span-3">
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
            <Label htmlFor="keepExif" className="text-right">
              Keep EXIF Data
            </Label>
            <Switch
              id="keepExif"
              checked={settings.keepExif}
              onCheckedChange={(checked) =>
                onSettingsChange({ ...settings, keepExif: checked })
              }
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CompressionSettings; 