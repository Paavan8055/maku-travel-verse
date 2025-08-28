
import React from 'react';
import { BookingManagement } from '@/components/admin/BookingManagement';

export default function AdminBookingManagement() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Booking Management</h1>
        <p className="text-muted-foreground">
          Manage and monitor all bookings across the platform
        </p>
      </div>
      <BookingManagement />
    </div>
  );
}
