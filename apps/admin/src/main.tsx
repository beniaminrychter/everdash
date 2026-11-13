import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Button } from '@/components/ui/button';
import '@fontsource-variable/inter';
import './index.css';

const root = document.querySelector('#root');
const colorScheme = window.matchMedia('(prefers-color-scheme: dark)');

function syncColorScheme() {
  document.documentElement.classList.toggle('dark', colorScheme.matches);
}

syncColorScheme();
colorScheme.addEventListener('change', syncColorScheme);

if (root) {
  createRoot(root).render(
    <StrictMode>
      <main className="p-8">
        <Button>EverDash admin</Button>
      </main>
    </StrictMode>,
  );
}
