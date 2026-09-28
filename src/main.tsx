import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { initAnalytics } from './services/analyticsService';
import { adManager } from './services/adService';
import './index.css';

// Non bloquant : l'initialisation part en parallèle du premier rendu et ne peut
// jamais faire échouer le démarrage (voir services/analyticsService.ts).
initAnalytics();

// SDK Google Mobile Ads (Android uniquement) puis interstitiel d'ouverture,
// affiché une seule fois par session. Aucun impact sur le web.
adManager.initialize().then(() => adManager.showOpeningAd());

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
