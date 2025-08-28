
import React from 'react';
import { CorrelationTracker } from '@/components/admin/CorrelationTracker';

export default function AdminCorrelationTracking() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Correlation Tracking</h1>
        <p className="text-muted-foreground">
          Track request flows and correlations across services
        </p>
      </div>
      <CorrelationTracker />
    </div>
  );
}
