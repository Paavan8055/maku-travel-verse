import Navbar from "@/components/Navbar";
import { ProviderTestPanel } from "@/components/debug/ProviderTestPanel";
import { ProviderRotationTestPanel } from "@/components/debug/ProviderRotationTestPanel";
import { DirectProviderTest } from "@/components/debug/DirectProviderTest";
import HotelBedsMonitoringDashboard from "@/components/admin/HotelBedsMonitoringDashboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const DebugPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold">System Debug Panel</h1>
            <p className="text-muted-foreground">
              Test and monitor all provider integrations and system functionality
            </p>
          </div>
          
          <Tabs defaultValue="provider-test" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="provider-test">Provider Tests</TabsTrigger>
              <TabsTrigger value="direct-test">Direct Test</TabsTrigger>
              <TabsTrigger value="rotation-test">Rotation Tests</TabsTrigger>
              <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
            </TabsList>
            
            <TabsContent value="provider-test">
              <ProviderTestPanel />
            </TabsContent>
            
            <TabsContent value="direct-test">
              <DirectProviderTest />
            </TabsContent>
            
            <TabsContent value="rotation-test">
              <ProviderRotationTestPanel />
            </TabsContent>
            
            <TabsContent value="monitoring">
              <HotelBedsMonitoringDashboard />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default DebugPage;