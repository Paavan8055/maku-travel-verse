// Simple logger for Supabase Edge Functions
export default {
  info: (message: string, data?: any) => {
    console.log(`[INFO] ${message}`, data ? JSON.stringify(data, null, 2) : '');
  },
  
  warn: (message: string, data?: any) => {
    console.warn(`[WARN] ${message}`, data ? JSON.stringify(data, null, 2) : '');
  },
  
  error: (message: string, data?: any) => {
    console.error(`[ERROR] ${message}`, data ? JSON.stringify(data, null, 2) : '');
  }
};