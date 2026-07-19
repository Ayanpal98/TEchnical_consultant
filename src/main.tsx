import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Explicit PWA Service Worker Registration
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const swUrl = (import.meta as any).env?.PROD ? '/sw.js' : '/dev-sw.js?dev-sw';
    navigator.serviceWorker.register(swUrl, { scope: '/' })
      .then((reg) => {
        console.log('PWA Service Worker registered successfully with scope:', reg.scope);
      })
      .catch((err) => {
        console.error('PWA Service Worker registration failed:', err);
      });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
