import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plane, Hotel, MapPin } from 'lucide-react';

export const EnhancedUserDashboard = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plane className="h-5 w-5" />
            Travel Overview
          </CardTitle>
          <CardDescription>Your recent travel activity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4">
              <div className="text-2xl font-bold text-primary">12</div>
              <p className="text-sm text-muted-foreground">Trips Completed</p>
            </div>
            <div className="text-center p-4">
              <div className="text-2xl font-bold text-primary">8</div>
              <p className="text-sm text-muted-foreground">Countries Visited</p>
            </div>
            <div className="text-center p-4">
              <div className="text-2xl font-bold text-primary">2</div>
              <p className="text-sm text-muted-foreground">Upcoming Trips</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};