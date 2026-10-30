import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';

// Register PWA service worker immediately so browsers recognize CineStream as an installable PWA
registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('[PWA] New CineStream update available.');
  },
  onOfflineReady() {
    console.log('[PWA] CineStream is ready for offline playback caching.');
  },
  onRegisterError(error) {
    console.error('[PWA] SW registration failed:', error);
  },
});

createRoot(document.getElementById('root')!).render(<App />);
