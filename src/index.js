import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/styles.css'; // Ensure this path is correct

const root = createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
