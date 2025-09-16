import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { getPerformance } from 'firebase/performance';
import { environment, isConfigured } from './environment';

// Initialize Firebase only if configured
const app = isConfigured.firebase ? initializeApp(environment.firebase) : null;

// Initialize services (only in browser and if configured)
export const analytics = app && typeof window !== 'undefined' && environment.features.firebaseAnalytics 
  ? getAnalytics(app) 
  : null;

export const perf = app && typeof window !== 'undefined' && environment.features.firebasePerformance 
  ? getPerformance(app) 
  : null;

export default app;