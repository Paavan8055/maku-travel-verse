import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './lib/i18n'
import { initSentry } from './utils/sentry'

// Initialize Sentry error tracking
initSentry();

createRoot(document.getElementById("root")!).render(<App />);
