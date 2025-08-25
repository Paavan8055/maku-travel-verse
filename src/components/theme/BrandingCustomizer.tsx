import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { 
  Palette, 
  Upload, 
  Eye, 
  Download,
  RefreshCw,
  Paintbrush,
  Type,
  Layout,
  Monitor
} from 'lucide-react';

interface BrandSettings {
  logoUrl: string;
  faviconUrl: string;
  companyName: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: string;
  fontSize: number;
  borderRadius: number;
  darkModeEnabled: boolean;
  customCss: string;
}

export const BrandingCustomizer: React.FC = () => {
  const [settings, setSettings] = useState<BrandSettings>({
    logoUrl: '',
    faviconUrl: '',
    companyName: 'MAKU Travel',
    primaryColor: '#0066CC',
    secondaryColor: '#6B7280',
    accentColor: '#10B981',
    fontFamily: 'Inter',
    fontSize: 14,
    borderRadius: 8,
    darkModeEnabled: true,
    customCss: ''
  });

  const [previewMode, setPreviewMode] = useState(false);

  const handleSettingChange = (key: keyof BrandSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = () => {
    // Save branding settings
    console.log('Saving branding settings:', settings);
  };

  const handleReset = () => {
    setSettings({
      logoUrl: '',
      faviconUrl: '',
      companyName: 'MAKU Travel',
      primaryColor: '#0066CC',
      secondaryColor: '#6B7280',
      accentColor: '#10B981',
      fontFamily: 'Inter',
      fontSize: 14,
      borderRadius: 8,
      darkModeEnabled: true,
      customCss: ''
    });
  };

  const fontOptions = [
    'Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Poppins', 'Source Sans Pro'
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center">
            <Palette className="h-6 w-6 mr-2 text-primary" />
            Branding Customizer
          </h2>
          <p className="text-muted-foreground">Customize your platform's appearance and branding</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => setPreviewMode(!previewMode)}>
            <Eye className="h-4 w-4 mr-2" />
            {previewMode ? 'Exit Preview' : 'Preview'}
          </Button>
          <Button variant="outline" onClick={handleReset}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button onClick={handleSave}>
            <Download className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customization Panel */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="branding">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="branding">Branding</TabsTrigger>
              <TabsTrigger value="colors">Colors</TabsTrigger>
              <TabsTrigger value="typography">Typography</TabsTrigger>
              <TabsTrigger value="layout">Layout</TabsTrigger>
            </TabsList>

            <TabsContent value="branding" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Paintbrush className="h-5 w-5 mr-2" />
                    Brand Identity
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Company Name</Label>
                    <Input 
                      value={settings.companyName}
                      onChange={(e) => handleSettingChange('companyName', e.target.value)}
                      placeholder="Enter company name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Logo URL</Label>
                    <div className="flex space-x-2">
                      <Input 
                        value={settings.logoUrl}
                        onChange={(e) => handleSettingChange('logoUrl', e.target.value)}
                        placeholder="https://example.com/logo.png"
                      />
                      <Button variant="outline" size="sm">
                        <Upload className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Favicon URL</Label>
                    <div className="flex space-x-2">
                      <Input 
                        value={settings.faviconUrl}
                        onChange={(e) => handleSettingChange('faviconUrl', e.target.value)}
                        placeholder="https://example.com/favicon.ico"
                      />
                      <Button variant="outline" size="sm">
                        <Upload className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Dark Mode Support</Label>
                      <p className="text-sm text-muted-foreground">
                        Enable automatic dark/light mode switching
                      </p>
                    </div>
                    <Switch 
                      checked={settings.darkModeEnabled}
                      onCheckedChange={(checked) => handleSettingChange('darkModeEnabled', checked)}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="colors" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Color Scheme</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Primary Color</Label>
                      <div className="flex space-x-2">
                        <div 
                          className="w-10 h-10 rounded border cursor-pointer"
                          style={{ backgroundColor: settings.primaryColor }}
                          onClick={() => {/* Open color picker */}}
                        />
                        <Input 
                          value={settings.primaryColor}
                          onChange={(e) => handleSettingChange('primaryColor', e.target.value)}
                          placeholder="#0066CC"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Secondary Color</Label>
                      <div className="flex space-x-2">
                        <div 
                          className="w-10 h-10 rounded border cursor-pointer"
                          style={{ backgroundColor: settings.secondaryColor }}
                          onClick={() => {/* Open color picker */}}
                        />
                        <Input 
                          value={settings.secondaryColor}
                          onChange={(e) => handleSettingChange('secondaryColor', e.target.value)}
                          placeholder="#6B7280"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Accent Color</Label>
                      <div className="flex space-x-2">
                        <div 
                          className="w-10 h-10 rounded border cursor-pointer"
                          style={{ backgroundColor: settings.accentColor }}
                          onClick={() => {/* Open color picker */}}
                        />
                        <Input 
                          value={settings.accentColor}
                          onChange={(e) => handleSettingChange('accentColor', e.target.value)}
                          placeholder="#10B981"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-4">
                    <Label className="text-base font-semibold">Color Preview</Label>
                    <div className="mt-2 p-4 border rounded-lg space-y-2">
                      <div className="flex space-x-2">
                        <Button style={{ backgroundColor: settings.primaryColor, borderColor: settings.primaryColor }}>
                          Primary Button
                        </Button>
                        <Button variant="outline" style={{ borderColor: settings.secondaryColor, color: settings.secondaryColor }}>
                          Secondary Button
                        </Button>
                        <Button variant="outline" style={{ borderColor: settings.accentColor, color: settings.accentColor }}>
                          Accent Button
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="typography" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Type className="h-5 w-5 mr-2" />
                    Typography Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Font Family</Label>
                    <Select value={settings.fontFamily} onValueChange={(value) => handleSettingChange('fontFamily', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {fontOptions.map(font => (
                          <SelectItem key={font} value={font} style={{ fontFamily: font }}>
                            {font}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Base Font Size: {settings.fontSize}px</Label>
                    <Slider
                      value={[settings.fontSize]}
                      onValueChange={(value) => handleSettingChange('fontSize', value[0])}
                      min={12}
                      max={18}
                      step={1}
                      className="w-full"
                    />
                  </div>

                  <div className="pt-4">
                    <Label className="text-base font-semibold">Typography Preview</Label>
                    <div className="mt-2 p-4 border rounded-lg space-y-2" style={{ fontFamily: settings.fontFamily, fontSize: settings.fontSize }}>
                      <h1 className="text-2xl font-bold">Heading 1</h1>
                      <h2 className="text-xl font-semibold">Heading 2</h2>
                      <p className="text-base">Regular paragraph text with normal font weight.</p>
                      <p className="text-sm text-muted-foreground">Small text used for descriptions and secondary information.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="layout" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Layout className="h-5 w-5 mr-2" />
                    Layout & Spacing
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Border Radius: {settings.borderRadius}px</Label>
                    <Slider
                      value={[settings.borderRadius]}
                      onValueChange={(value) => handleSettingChange('borderRadius', value[0])}
                      min={0}
                      max={20}
                      step={2}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Custom CSS</Label>
                    <Textarea 
                      value={settings.customCss}
                      onChange={(e) => handleSettingChange('customCss', e.target.value)}
                      placeholder="Enter custom CSS rules..."
                      rows={6}
                    />
                    <p className="text-xs text-muted-foreground">
                      Add custom CSS to further customize the appearance
                    </p>
                  </div>

                  <div className="pt-4">
                    <Label className="text-base font-semibold">Component Preview</Label>
                    <div className="mt-2 space-y-2">
                      <div className="p-3 border" style={{ borderRadius: settings.borderRadius }}>
                        Card with custom border radius
                      </div>
                      <Button style={{ borderRadius: settings.borderRadius }}>
                        Button with custom radius
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Live Preview */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Monitor className="h-5 w-5 mr-2" />
                Live Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div 
                className="border rounded-lg p-4 space-y-4"
                style={{ 
                  fontFamily: settings.fontFamily, 
                  fontSize: settings.fontSize,
                  borderRadius: settings.borderRadius 
                }}
              >
                {/* Mock header */}
                <div className="flex items-center justify-between pb-2 border-b">
                  <div className="font-bold" style={{ color: settings.primaryColor }}>
                    {settings.companyName}
                  </div>
                  <div className="w-6 h-6 rounded" style={{ backgroundColor: settings.accentColor }} />
                </div>

                {/* Mock content */}
                <div className="space-y-3">
                  <div 
                    className="p-3 rounded"
                    style={{ 
                      backgroundColor: settings.primaryColor + '10',
                      borderRadius: settings.borderRadius 
                    }}
                  >
                    <div className="font-medium" style={{ color: settings.primaryColor }}>
                      Primary Card
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Sample content with primary styling
                    </div>
                  </div>

                  <Button 
                    size="sm" 
                    style={{ 
                      backgroundColor: settings.primaryColor,
                      borderRadius: settings.borderRadius 
                    }}
                  >
                    Primary Action
                  </Button>

                  <Button 
                    size="sm" 
                    variant="outline"
                    style={{ 
                      borderColor: settings.accentColor,
                      color: settings.accentColor,
                      borderRadius: settings.borderRadius 
                    }}
                  >
                    Secondary Action
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};