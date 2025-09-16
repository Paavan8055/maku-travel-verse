import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookingManagement } from '@/components/admin/BookingManagement';
import { EnhancedBookingOperations } from '@/components/admin/EnhancedBookingOperations';
import { NotificationCenter } from '@/components/admin/NotificationCenter';
import { Calendar, RefreshCw, Bell } from 'lucide-react';

const AdminBookingsPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Booking Management</h1>
        <p className="text-muted-foreground">
          Enhanced booking operations with bulk actions, customer communication, and lifecycle tracking
        </p>
      </div>

      <Tabs defaultValue="management" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="management" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Booking Management
          </TabsTrigger>
          <TabsTrigger value="operations" className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Enhanced Operations
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications & Alerts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="management">
          <BookingManagement />
        </TabsContent>

        <TabsContent value="operations">
          <EnhancedBookingOperations />
        </TabsContent>

        <TabsContent value="notifications">
          <NotificationCenter />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminBookingsPage;