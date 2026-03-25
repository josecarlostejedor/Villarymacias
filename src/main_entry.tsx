import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from '@/src/App_main';
import '@/src/index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
