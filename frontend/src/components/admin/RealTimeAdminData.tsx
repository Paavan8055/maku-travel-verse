import React, { createContext, useContext } from 'react';
import { useAdminData } from '@/hooks/useAdminData';

const AdminDataContext = createContext<ReturnType<typeof useAdminData> | null>(null);

export const AdminDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const adminData = useAdminData();

  return (
    <AdminDataContext.Provider value={adminData}>
      {children}
    </AdminDataContext.Provider>
  );
};

export const useAdminDataContext = () => {
  const context = useContext(AdminDataContext);
  if (!context) {
    throw new Error('useAdminDataContext must be used within AdminDataProvider');
  }
  return context;
};