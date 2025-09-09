
import React from 'react';
import { PartnerDashboardReal } from '@/components/dashboard/PartnerDashboardReal';
import { UniversalAIProvider } from '@/features/universal-ai/context/UniversalAIContext';
import UniversalAIWidget from '@/features/universal-ai/components/UniversalAIWidget';

export default function PartnerDashboard() {
  return (
    <UniversalAIProvider>
      <PartnerDashboardReal />
      <UniversalAIWidget dashboardType="partner" />
    </UniversalAIProvider>
  );
}
