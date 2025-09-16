import React from 'react';
import { AdminGuard } from '@/features/auth/components/AdminGuard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProductionDiagnostics } from '@/components/diagnostics/ProductionDiagnostics';
import PaymentDebugger from '@/components/debugging/PaymentDebugger';
import { BookingTestPanel } from '@/components/debug/BookingTestPanel';
import TestModeIndicator from '@/components/TestModeIndicator';
import { HealthDebugPanel } from '@/components/debug/HealthDebugPanel';
import { 
  Activity, 
  CreditCard, 
  Settings, 
  TestTube, 
  Monitor,
  AlertTriangle
} from 'lucide-react';

const AdminDiagnosticsPage = () => {
  return (
    <AdminGuard>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-2 mb-6">
          <Monitor className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold">System Diagnostics</h1>
        </div>

        <Tabs defaultValue="system" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="system" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              System Health
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Payment Debug
            </TabsTrigger>
            <TabsTrigger value="bookings" className="flex items-center gap-2">
              <TestTube className="h-4 w-4" />
              Booking Tests
            </TabsTrigger>
            <TabsTrigger value="environment" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Environment
            </TabsTrigger>
            <TabsTrigger value="monitoring" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Monitoring
            </TabsTrigger>
          </TabsList>

          <TabsContent value="system" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Production System Diagnostics</CardTitle>
                <CardDescription>
                  Real-time system health and performance monitoring
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ProductionDiagnostics />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Payment System Debugger</CardTitle>
                <CardDescription>
                  Test and debug payment processing flows
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PaymentDebugger />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bookings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Booking Flow Test Panel</CardTitle>
                <CardDescription>
                  Test complete booking flows for hotels, flights, and activities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BookingTestPanel 
                  onTestHotelBooking={() => window.location.href = '/search/hotels?destination=Sydney&checkIn=' + 
                    new Date(Date.now() + 86400000).toISOString().split('T')[0] + 
                    '&checkOut=' + new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0] + 
                    '&adults=2&rooms=1&test=true'}
                  onTestFlightBooking={() => window.location.href = '/search/flights?origin=SYD&destination=MEL&departure=' +
                    new Date(Date.now() + 86400000).toISOString().split('T')[0] + 
                    '&adults=1&test=true'}
                  onTestActivityBooking={() => window.location.href = '/search/activities?destination=Sydney&date=' +
                    new Date(Date.now() + 86400000).toISOString().split('T')[0] + 
                    '&participants=2&test=true'}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="environment" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Environment & Test Mode</CardTitle>
                <CardDescription>
                  Environment configuration and test mode indicators
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <TestModeIndicator />
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="space-y-2">
                      <h4 className="font-medium">Environment Variables</h4>
                      <div className="text-sm space-y-1">
                        <div>Node Environment: <code>{process.env.NODE_ENV}</code></div>
                        <div>Development Mode: <code>{process.env.NODE_ENV === 'development' ? 'Yes' : 'No'}</code></div>
                        <div>Host: <code>{window.location.hostname}</code></div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium">Build Information</h4>
                      <div className="text-sm space-y-1">
                        <div>Timestamp: <code>{new Date().toISOString()}</code></div>
                        <div>User Agent: <code className="text-xs">{navigator.userAgent.substring(0, 50)}...</code></div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="monitoring" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Health Monitoring</CardTitle>
                <CardDescription>
                  Real-time health monitoring and circuit breaker status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <HealthDebugPanel />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminGuard>
  );
};

export default AdminDiagnosticsPage;