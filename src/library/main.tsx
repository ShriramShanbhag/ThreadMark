import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Library } from './Library';
import '../styles/library.css';

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(
    <StrictMode>
      <Library />
    </StrictMode>,
  );
}
