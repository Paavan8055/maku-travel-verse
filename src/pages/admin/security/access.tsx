
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, User, Lock, Key } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function AdminAccessControl() {
  const accessControls = [
    {
      role: 'Super Admin',
      users: 2,
      permissions: ['All Access'],
      lastModified: '2 days ago'
    },
    {
      role: 'Admin',
      users: 5,
      permissions: ['User Management', 'Booking Management', 'Reports'],
      lastModified: '1 week ago'
    },
    {
      role: 'Support',
      users: 12,
      permissions: ['View Bookings', 'Customer Support'],
      lastModified: '3 days ago'
    },
    {
      role: 'Read Only',
      users: 8,
      permissions: ['View Reports', 'View Analytics'],
      lastModified: '5 days ago'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Access Control</h1>
        <p className="text-muted-foreground">
          Manage user roles and permissions
        </p>
      </div>

      <div className="flex gap-4">
        <Button className="gap-2">
          <User className="h-4 w-4" />
          Add New Role
        </Button>
        <Button variant="outline" className="gap-2">
          <Key className="h-4 w-4" />
          Manage API Keys
        </Button>
      </div>

      <div className="grid gap-4">
        {accessControls.map((control, index) => (
          <Card key={index}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  <CardTitle className="text-lg">{control.role}</CardTitle>
                </div>
                <Badge variant="outline">{control.users} users</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <span className="text-sm font-medium">Permissions: </span>
                  <span className="text-sm text-muted-foreground">
                    {control.permissions.join(', ')}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">
                  Last modified: {control.lastModified}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
