import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { DemoApp } from './DemoApp';
import './demo.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <DemoApp />
    </BrowserRouter>
  </StrictMode>,
);
