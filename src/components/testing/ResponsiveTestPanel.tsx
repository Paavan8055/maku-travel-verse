import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Smartphone, 
  Tablet, 
  Monitor, 
  Laptop,
  Wifi,
  WifiOff,
  Battery,
  BatteryLow,
  Eye,
  Volume2,
  MousePointer,
  Keyboard,
  Accessibility
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DeviceInfo {
  type: 'mobile' | 'tablet' | 'desktop' | 'tv';
  screenSize: { width: number; height: number };
  pixelRatio: number;
  orientation: 'portrait' | 'landscape';
  touchSupport: boolean;
  batteryLevel?: number;
  isCharging?: boolean;
  connection: string;
  isOnline: boolean;
  reducedMotion: boolean;
  highContrast: boolean;
  darkMode: boolean;
}

interface ResponsiveTestPanelProps {
  className?: string;
}

export const ResponsiveTestPanel = ({ className }: ResponsiveTestPanelProps) => {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [currentBreakpoint, setCurrentBreakpoint] = useState<string>('');

  useEffect(() => {
    const updateDeviceInfo = async () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      // Determine device type based on screen size
      let type: DeviceInfo['type'] = 'desktop';
      if (width < 768) type = 'mobile';
      else if (width < 1024) type = 'tablet';
      else if (width >= 1920) type = 'tv';

      // Determine current breakpoint
      let breakpoint = 'xs';
      if (width >= 1536) breakpoint = '2xl';
      else if (width >= 1280) breakpoint = 'xl';
      else if (width >= 1024) breakpoint = 'lg';
      else if (width >= 768) breakpoint = 'md';
      else if (width >= 640) breakpoint = 'sm';

      setCurrentBreakpoint(breakpoint);

      // Get battery info if available
      let batteryLevel: number | undefined;
      let isCharging: boolean | undefined;
      
      try {
        if ('getBattery' in navigator) {
          const battery = await (navigator as any).getBattery();
          batteryLevel = Math.round(battery.level * 100);
          isCharging = battery.charging;
        }
      } catch (error) {
        // Battery API not available
      }

      // Check accessibility preferences
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const highContrast = window.matchMedia('(prefers-contrast: high)').matches;
      const darkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;

      setDeviceInfo({
        type,
        screenSize: { width, height },
        pixelRatio: window.devicePixelRatio || 1,
        orientation: width > height ? 'landscape' : 'portrait',
        touchSupport: 'ontouchstart' in window,
        batteryLevel,
        isCharging,
        connection: (navigator as any).connection?.effectiveType || 'unknown',
        isOnline: navigator.onLine,
        reducedMotion,
        highContrast,
        darkMode
      });
    };

    updateDeviceInfo();
    
    const handleResize = () => updateDeviceInfo();
    const handleOnline = () => updateDeviceInfo();
    const handleOffline = () => updateDeviceInfo();

    window.addEventListener('resize', handleResize);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const getDeviceIcon = (type: DeviceInfo['type']) => {
    switch (type) {
      case 'mobile': return <Smartphone className="h-4 w-4" />;
      case 'tablet': return <Tablet className="h-4 w-4" />;
      case 'desktop': return <Monitor className="h-4 w-4" />;
      case 'tv': return <Monitor className="h-4 w-4" />;
      default: return <Laptop className="h-4 w-4" />;
    }
  };

  const getBreakpointColor = (breakpoint: string) => {
    const colors = {
      'xs': 'bg-red-500',
      'sm': 'bg-orange-500',
      'md': 'bg-yellow-500',
      'lg': 'bg-green-500',
      'xl': 'bg-blue-500',
      '2xl': 'bg-purple-500'
    };
    return colors[breakpoint as keyof typeof colors] || 'bg-gray-500';
  };

  if (!deviceInfo) {
    return <div className="animate-pulse bg-muted h-64 rounded-lg" />;
  }

  return (
    <Card className={cn("w-full max-w-2xl", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Accessibility className="h-5 w-5" />
          Responsive Test Panel
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Device Information */}
        <div className="space-y-3">
          <h3 className="font-medium flex items-center gap-2">
            {getDeviceIcon(deviceInfo.type)}
            Device Information
          </h3>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Type:</span>
              <Badge variant="outline" className="ml-2 capitalize">
                {deviceInfo.type}
              </Badge>
            </div>
            
            <div>
              <span className="text-muted-foreground">Breakpoint:</span>
              <Badge className={cn("ml-2 text-white", getBreakpointColor(currentBreakpoint))}>
                {currentBreakpoint}
              </Badge>
            </div>
            
            <div>
              <span className="text-muted-foreground">Screen:</span>
              <span className="ml-2 font-mono">
                {deviceInfo.screenSize.width} × {deviceInfo.screenSize.height}
              </span>
            </div>
            
            <div>
              <span className="text-muted-foreground">Orientation:</span>
              <Badge variant="secondary" className="ml-2 capitalize">
                {deviceInfo.orientation}
              </Badge>
            </div>
            
            <div>
              <span className="text-muted-foreground">Pixel Ratio:</span>
              <span className="ml-2">{deviceInfo.pixelRatio}x</span>
            </div>
            
            <div>
              <span className="text-muted-foreground">Touch:</span>
              <Badge variant={deviceInfo.touchSupport ? "default" : "secondary"} className="ml-2">
                {deviceInfo.touchSupport ? 'Supported' : 'Not Supported'}
              </Badge>
            </div>
          </div>
        </div>

        <Separator />

        {/* System Status */}
        <div className="space-y-3">
          <h3 className="font-medium">System Status</h3>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              {deviceInfo.isOnline ? (
                <Wifi className="h-4 w-4 text-green-500" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-500" />
              )}
              <span className="text-muted-foreground">Connection:</span>
              <Badge variant={deviceInfo.isOnline ? "default" : "destructive"} className="ml-1">
                {deviceInfo.isOnline ? deviceInfo.connection : 'Offline'}
              </Badge>
            </div>

            {deviceInfo.batteryLevel !== undefined && (
              <div className="flex items-center gap-2">
                {deviceInfo.batteryLevel < 20 ? (
                  <BatteryLow className="h-4 w-4 text-red-500" />
                ) : (
                  <Battery className="h-4 w-4 text-green-500" />
                )}
                <span className="text-muted-foreground">Battery:</span>
                <span className="font-mono">{deviceInfo.batteryLevel}%</span>
                {deviceInfo.isCharging && (
                  <Badge variant="outline" className="text-xs">Charging</Badge>
                )}
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Accessibility Features */}
        <div className="space-y-3">
          <h3 className="font-medium flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Accessibility Preferences
          </h3>
          
          <div className="grid grid-cols-1 gap-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Reduced Motion:</span>
              <Badge variant={deviceInfo.reducedMotion ? "default" : "secondary"}>
                {deviceInfo.reducedMotion ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">High Contrast:</span>
              <Badge variant={deviceInfo.highContrast ? "default" : "secondary"}>
                {deviceInfo.highContrast ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Dark Mode Preference:</span>
              <Badge variant={deviceInfo.darkMode ? "default" : "secondary"}>
                {deviceInfo.darkMode ? 'Dark' : 'Light'}
              </Badge>
            </div>
          </div>
        </div>

        <Separator />

        {/* Test Actions */}
        <div className="space-y-3">
          <h3 className="font-medium">Test Actions</h3>
          
          <div className="flex flex-wrap gap-2">
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => window.dispatchEvent(new Event('resize'))}
            >
              Trigger Resize
            </Button>
            
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => {
                const main = document.querySelector('main');
                main?.focus();
              }}
            >
              <Keyboard className="h-3 w-3 mr-1" />
              Focus Main
            </Button>
            
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => {
                document.querySelectorAll('[aria-hidden="true"]').forEach(el => {
                  console.log('Hidden element:', el);
                });
              }}
            >
              <MousePointer className="h-3 w-3 mr-1" />
              Check A11y
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};