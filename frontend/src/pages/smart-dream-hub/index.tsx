import React from 'react';
import { SmartDreamDashboard } from '@/components/enhanced-dreams/SmartDreamDashboard';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

const SmartDreamHubPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16">
        <SmartDreamDashboard />
      </main>
      <Footer />
    </div>
  );
};

export default SmartDreamHubPage;