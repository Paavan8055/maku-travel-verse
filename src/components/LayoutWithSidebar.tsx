import React from 'react';
import { TravelFundSidebar } from './TravelFundSidebar';

interface LayoutWithSidebarProps {
  children: React.ReactNode;
}

export const LayoutWithSidebar: React.FC<LayoutWithSidebarProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-background w-full">
      <TravelFundSidebar />
      
      {/* Main content with left margin for desktop sidebar */}
      <div className="lg:ml-64 min-h-screen">
        {children}
      </div>
    </div>
  );
};