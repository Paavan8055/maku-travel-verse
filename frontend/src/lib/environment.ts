// Environment configuration for Firebase + Supabase hybrid setup
export const environment = {
  production: import.meta.env.PROD,
  development: import.meta.env.DEV,
  
  // Supabase configuration (primary backend)
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL || 'https://iomeddeasarntjhqzndu.supabase.co',
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY!
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