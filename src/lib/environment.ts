// Environment configuration for Firebase + Supabase hybrid setup
export const environment = {
  production: import.meta.env.PROD,
  development: import.meta.env.DEV,
  
  // Supabase configuration (primary backend)
  supabase: {
    url: 'https://iomeddeasarntjhqzndu.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvbWVkZGVhc2FybnRqaHF6bmR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzODk0NjksImV4cCI6MjA2OTk2NTQ2OX0.tZ50J9PPa6ZqDdPF0-WPYwoLO-aGBIf6Qtjr7dgYrDI'
  },
  
  // Firebase configuration (analytics, real-time features)
  firebase: {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
  },
  
  // Gemini AI configuration
  gemini: {
    apiKey: import.meta.env.VITE_GEMINI_API_KEY
  },
  
  // Feature flags
  features: {
    firebaseAnalytics: true,
    firebasePerformance: true,
    firebaseMessaging: false, // Enable when ready
    geminiAI: true,
    realTimeUpdates: true
  },
  
  // API endpoints
  api: {
    base: import.meta.env.VITE_API_BASE_URL || '/api',
    timeout: 30000
  }
};

export const isConfigured = {
  firebase: !!(environment.firebase.apiKey && environment.firebase.projectId),
  gemini: !!environment.gemini.apiKey,
  supabase: !!(environment.supabase.url && environment.supabase.anonKey)
};