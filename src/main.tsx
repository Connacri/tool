import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { initAnalytics } from './services/analyticsService';
import './index.css';

// Non bloquant : l'initialisation part en parallèle du premier rendu et ne peut
// jamais faire échouer le démarrage (voir services/analyticsService.ts).
initAnalytics();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
