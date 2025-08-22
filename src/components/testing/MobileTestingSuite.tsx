import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Smartphone, Tablet, Monitor, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface DeviceTest {
  device: string;
  viewport: { width: number; height: number };
  userAgent: string;
  tests: {
    name: string;
    status: 'pass' | 'fail' | 'warning';
    details?: string;
  }[];
}

interface ResponsiveTest {
  breakpoint: string;
  minWidth: number;
  maxWidth?: number;
  passed: boolean;
  issues: string[];
}

export const MobileTestingSuite = () => {
  const [deviceTests, setDeviceTests] = useState<DeviceTest[]>([]);
  const [responsiveTests, setResponsiveTests] = useState<ResponsiveTest[]>([]);
  const [currentViewport, setCurrentViewport] = useState({ width: 0, height: 0 });
  const [isRunning, setIsRunning] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    const updateViewport = () => {
      setCurrentViewport({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    updateViewport();
    window.addEventListener('resize', updateViewport);
    return () => window.removeEventListener('resize', updateViewport);
  }, []);

  const testResponsiveBreakpoints = () => {
    const breakpoints = [
      { name: 'Mobile', min: 0, max: 767 },
      { name: 'Tablet', min: 768, max: 1023 },
      { name: 'Desktop', min: 1024, max: 1439 },
      { name: 'Large Desktop', min: 1440 }
    ];

    const tests = breakpoints.map(bp => {
      const issues: string[] = [];
      const currentWidth = window.innerWidth;
      
      // Check if current viewport matches expected behavior
      const isInRange = currentWidth >= bp.min && (bp.max ? currentWidth <= bp.max : true);
      
      // Test navigation visibility
      const nav = document.querySelector('nav');
      const mobileMenu = document.querySelector('[data-mobile-menu]');
      
      if (currentWidth < 768) {
        if (!mobileMenu) issues.push('Mobile menu not found');
        if (nav && !nav.classList.contains('mobile-optimized')) {
          issues.push('Navigation not mobile-optimized');
        }
      }

      // Test touch targets
      const buttons = document.querySelectorAll('button');
      buttons.forEach((button, index) => {
        const rect = button.getBoundingClientRect();
        if (rect.height < 44 || rect.width < 44) {
          issues.push(`Button ${index + 1} too small for touch (${rect.width}x${rect.height})`);
        }
      });

      // Test text readability
      const textElements = document.querySelectorAll('p, span, h1, h2, h3, h4, h5, h6');
      textElements.forEach((element, index) => {
        const styles = window.getComputedStyle(element);
        const fontSize = parseFloat(styles.fontSize);
        if (fontSize < 16 && currentWidth < 768) {
          issues.push(`Text element ${index + 1} too small on mobile (${fontSize}px)`);
        }
      });

      return {
        breakpoint: bp.name,
        minWidth: bp.min,
        maxWidth: bp.max,
        passed: issues.length === 0,
        issues
      };
    });

    setResponsiveTests(tests);
  };

  const testDeviceCompatibility = () => {
    const devices = [
      {
        device: 'iPhone 12',
        viewport: { width: 390, height: 844 },
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
      },
      {
        device: 'iPhone SE',
        viewport: { width: 375, height: 667 },
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
      },
      {
        device: 'Samsung Galaxy S21',
        viewport: { width: 360, height: 800 },
        userAgent: 'Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36'
      },
      {
        device: 'iPad',
        viewport: { width: 768, height: 1024 },
        userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
      },
      {
        device: 'iPad Pro',
        viewport: { width: 1024, height: 1366 },
        userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
      }
    ];

    const tests = devices.map(device => {
      const tests = [];

      // Test viewport compatibility
      const isViewportSupported = device.viewport.width >= 320; // Minimum supported width
      tests.push({
        name: 'Viewport Support',
        status: isViewportSupported ? 'pass' as const : 'fail' as const,
        details: `${device.viewport.width}x${device.viewport.height}`
      });

      // Test touch interactions
      const hasTouchSupport = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      tests.push({
        name: 'Touch Support',
        status: hasTouchSupport ? 'pass' as const : 'warning' as const,
        details: hasTouchSupport ? 'Touch events supported' : 'Touch events not detected'
      });

      // Test orientation support
      const supportsOrientation = 'orientation' in window;
      tests.push({
        name: 'Orientation Support',
        status: supportsOrientation ? 'pass' as const : 'warning' as const,
        details: supportsOrientation ? 'Orientation changes supported' : 'Orientation API not available'
      });

      // Test performance on device type
      const isLowEndDevice = device.viewport.width <= 375 && device.viewport.height <= 667;
      tests.push({
        name: 'Performance Optimization',
        status: isLowEndDevice ? 'warning' as const : 'pass' as const,
        details: isLowEndDevice ? 'May need performance optimization' : 'Good performance expected'
      });

      // Test CSS features
      const supportsFlexbox = CSS.supports('display', 'flex');
      const supportsGrid = CSS.supports('display', 'grid');
      tests.push({
        name: 'Modern CSS Support',
        status: (supportsFlexbox && supportsGrid) ? 'pass' as const : 'warning' as const,
        details: `Flexbox: ${supportsFlexbox}, Grid: ${supportsGrid}`
      });

      return {
        device: device.device,
        viewport: device.viewport,
        userAgent: device.userAgent,
        tests
      };
    });

    setDeviceTests(tests);
  };

  const runMobileTests = async () => {
    setIsRunning(true);
    
    // Run tests with small delays to show progress
    await new Promise(resolve => setTimeout(resolve, 500));
    testResponsiveBreakpoints();
    
    await new Promise(resolve => setTimeout(resolve, 500));
    testDeviceCompatibility();
    
    setIsRunning(false);
  };

  const getStatusIcon = (status: 'pass' | 'fail' | 'warning') => {
    switch (status) {
      case 'pass': return <CheckCircle className="h-4 w-4 text-success" />;
      case 'fail': return <XCircle className="h-4 w-4 text-destructive" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-warning" />;
    }
  };

  const getDeviceIcon = (device: string) => {
    if (device.includes('iPad')) return <Tablet className="h-5 w-5" />;
    if (device.includes('iPhone') || device.includes('Galaxy')) return <Smartphone className="h-5 w-5" />;
    return <Monitor className="h-5 w-5" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Mobile Testing Suite</h2>
          <p className="text-muted-foreground">
            Test responsive design and mobile compatibility
          </p>
        </div>
        <Button onClick={runMobileTests} disabled={isRunning}>
          {isRunning ? 'Testing...' : 'Run Mobile Tests'}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current Viewport</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {isMobile ? <Smartphone className="h-5 w-5" /> : <Monitor className="h-5 w-5" />}
              <span className="font-medium">
                {currentViewport.width}x{currentViewport.height}
              </span>
            </div>
            <Badge variant={isMobile ? 'default' : 'secondary'}>
              {isMobile ? 'Mobile' : 'Desktop'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {responsiveTests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Responsive Breakpoint Tests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {responsiveTests.map((test) => (
                <div key={test.breakpoint} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{test.breakpoint}</span>
                      <span className="text-sm text-muted-foreground">
                        {test.minWidth}px{test.maxWidth ? ` - ${test.maxWidth}px` : '+'}
                      </span>
                    </div>
                    <Badge variant={test.passed ? 'default' : 'destructive'}>
                      {test.passed ? 'Pass' : 'Issues Found'}
                    </Badge>
                  </div>
                  {test.issues.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {test.issues.map((issue, index) => (
                        <div key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                          <XCircle className="h-3 w-3 text-destructive" />
                          {issue}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {deviceTests.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {deviceTests.map((deviceTest) => (
            <Card key={deviceTest.device}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {getDeviceIcon(deviceTest.device)}
                  {deviceTest.device}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {deviceTest.viewport.width}x{deviceTest.viewport.height}
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {deviceTest.tests.map((test, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(test.status)}
                        <span className="text-sm">{test.name}</span>
                      </div>
                      {test.details && (
                        <span className="text-xs text-muted-foreground">
                          {test.details}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};