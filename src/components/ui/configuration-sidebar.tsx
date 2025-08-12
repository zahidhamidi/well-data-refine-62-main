import React, { useState } from 'react';
import { Settings, Sliders, Filter } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';

interface DecimationConfig {
  depthInterval: number;
  filterMode: 'section' | 'formation' | 'all';
  selectedSection?: string;
  selectedFormation?: string;
  enableSmoothing: boolean;
  outlierRemoval: boolean;
}

interface ConfigurationSidebarProps {
  config: DecimationConfig;
  onConfigChange: (config: DecimationConfig) => void;
  sections: Array<{ id: string; name: string; startDepth: string; endDepth: string }>;
  formations: Array<{ id: string; name: string; startDepth: string; endDepth: string }>;
}

const ConfigurationSidebar: React.FC<ConfigurationSidebarProps> = ({
  config,
  onConfigChange,
  sections,
  formations
}) => {
  const { toast } = useToast();
  
  const updateConfig = (updates: Partial<DecimationConfig>) => {
    onConfigChange({ ...config, ...updates });
  };

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Decimation Configuration
        </CardTitle>
        <CardDescription>
          Configure decimation parameters and filters
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Depth Interval */}
        <div className="space-y-3">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Sliders className="h-4 w-4" />
            Depth Interval (m/ft)
          </Label>
          <div className="space-y-2">
            <Slider
              value={[config.depthInterval]}
              onValueChange={(value) => updateConfig({ depthInterval: value[0] })}
              min={0}
              max={30}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0 (No decimation)</span>
              <span className="font-medium">
                {config.depthInterval === 0 ? "No decimation" : `${config.depthInterval} m/ft`}
              </span>
              <span>30 m/ft</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {config.depthInterval === 0 
                ? "Original data will be displayed" 
                : `Data will be decimated every ${config.depthInterval} m/ft using median values`
              }
            </p>
          </div>
        </div>

        {/* Filter Mode */}
        <div className="space-y-3">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filter Mode
          </Label>
          <Select
            value={config.filterMode}
            onValueChange={(value: 'section' | 'formation' | 'all') => 
              updateConfig({ filterMode: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Data</SelectItem>
              <SelectItem value="section">By Section</SelectItem>
              <SelectItem value="formation">By Formation</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Section Selection */}
        {config.filterMode === 'section' && (
          <div className="space-y-3">
            <Label className="text-sm font-medium">Select Section</Label>
            <Select
              value={config.selectedSection}
              onValueChange={(value) => updateConfig({ selectedSection: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose section..." />
              </SelectTrigger>
              <SelectContent>
                {sections.map((section) => (
                  <SelectItem key={section.id} value={section.id}>
                    {section.name || `${section.startDepth} - ${section.endDepth} ft`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Formation Selection */}
        {config.filterMode === 'formation' && (
          <div className="space-y-3">
            <Label className="text-sm font-medium">Select Formation</Label>
            <Select
              value={config.selectedFormation}
              onValueChange={(value) => updateConfig({ selectedFormation: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose formation..." />
              </SelectTrigger>
              <SelectContent>
                {formations.map((formation) => (
                  <SelectItem key={formation.id} value={formation.id}>
                    {formation.name || `${formation.startDepth} - ${formation.endDepth} ft`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Advanced Options */}
        <div className="space-y-4 pt-4 border-t">
          <Label className="text-sm font-medium">Advanced Options</Label>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="smoothing" className="text-sm">
              Enable Smoothing
            </Label>
            <Switch
              id="smoothing"
              checked={config.enableSmoothing}
              onCheckedChange={(checked) => updateConfig({ enableSmoothing: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="outlier" className="text-sm">
              Remove Outliers
            </Label>
            <Switch
              id="outlier"
              checked={config.outlierRemoval}
              onCheckedChange={(checked) => updateConfig({ outlierRemoval: checked })}
            />
          </div>
        </div>

        {/* Apply Button */}
        <Button 
          className="w-full" 
          size="sm"
          onClick={() => {
            // Configuration is already applied through onConfigChange prop
            // This button provides visual feedback that settings are saved
            toast({
              title: "✅ Configuration Applied",
              description: `Decimation settings saved successfully!`,
              className: "border-green-200 bg-green-50 text-green-800",
            });
          }}
        >
          Apply Configuration
        </Button>
      </CardContent>
    </Card>
  );
};

export default ConfigurationSidebar;