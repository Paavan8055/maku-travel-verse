import React from 'react';
import { BookingManagement } from '@/components/admin/BookingManagement';

const AdminBookingsPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Booking Management</h1>
        <p className="text-muted-foreground">
          Manage and monitor all travel bookings across the platform
        </p>
      </div>
      <BookingManagement />
    </div>
  );
};

export default AdminBookingsPage;