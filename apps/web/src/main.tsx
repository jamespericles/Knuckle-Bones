import '@fontsource-variable/grenze-gotisch';
import '@fontsource/alegreya-sans/400.css';
import '@fontsource/alegreya-sans/700.css';
import './styles/tokens.css';
import './styles/global.css';
import './styles/animations.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';

const root = document.getElementById('root');
if (!root) throw new Error('Missing #root element');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
