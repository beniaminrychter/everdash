import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AdminRoot } from '@/app/AdminRoot';
import '@fontsource-variable/inter';
import './index.css';

const root = document.querySelector('#root');

if (root) {
  createRoot(root).render(
    <StrictMode>
      <AdminRoot />
    </StrictMode>,
  );
}
