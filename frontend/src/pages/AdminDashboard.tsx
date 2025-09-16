import React from 'react';
import { useLocation } from 'react-router-dom';
import GeminiCLIInterface from '@/components/admin/GeminiCLIInterface';

const AdminDashboard = () => {
  const location = useLocation();
  const isTestingRoute = location.pathname.includes('/testing');

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        {isTestingRoute ? (
          <div className="mt-8">
            <h2 className="text-2xl font-semibold mb-6">Gemini CLI Testing</h2>
            <GeminiCLIInterface />
          </div>
        ) : (
          <p className="text-muted-foreground">Navigate to operations/testing to use Gemini CLI tools.</p>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
