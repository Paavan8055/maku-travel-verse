// Firebase configuration for MAKU.Travel
export const firebaseConfig = {
  // TODO: Replace with actual Firebase project configuration
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "demo-api-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "maku-travel.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "maku-travel",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "maku-travel.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789012",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789012:web:abcdef123456789012345678",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-XXXXXXXXXX"
};

// Environment check
export const isFirebaseConfigured = () => {
  return !!(
    firebaseConfig.apiKey && 
    firebaseConfig.apiKey !== "demo-api-key" &&
    firebaseConfig.projectId &&
    firebaseConfig.projectId !== "maku-travel"
  );
};

// Service configuration
export const firebaseServices = {
  analytics: true,
  performance: true,
  messaging: false, // Enable when ready for push notifications
  remoteConfig: true,
  crashlytics: false // Enable when ready for crash reporting
};