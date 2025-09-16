import React from 'react';
import { EnhancedUserDashboard } from '@/components/dashboard/EnhancedUserDashboard';
import { UniversalAIProvider } from '@/features/universal-ai/context/UniversalAIContext';
import UniversalAIWidget from '@/features/universal-ai/components/UniversalAIWidget';

export default function UserDashboard() {
  return (
    <UniversalAIProvider>
      <EnhancedUserDashboard />
      <UniversalAIWidget dashboardType="user" />
    </UniversalAIProvider>
  );
}