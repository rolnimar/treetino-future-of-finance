import './chain/buffer';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AppProviders } from './lib/providers';
import { App } from './App';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <AppProviders>
    <StrictMode>
      <App />
    </StrictMode>
  </AppProviders>,
);
