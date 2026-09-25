import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './fonts.css';
import './index.css';
import App from './App';

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

// Drop the HTML boot splash once React has painted.
requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    document.getElementById('boot-splash')?.setAttribute('hidden', '');
  });
});
