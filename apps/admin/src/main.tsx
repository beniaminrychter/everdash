import React from 'react';
import { createRoot } from 'react-dom/client';
import { AdminApp } from './ui/AdminApp';
import './index.css';

const root = document.querySelector('#root');

if (root) {
  createRoot(root).render(
    <React.StrictMode>
      <AdminApp />
    </React.StrictMode>,
  );
}
