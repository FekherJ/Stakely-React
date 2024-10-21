import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';  // Import the main App component

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you don't need performance monitoring, remove this
// reportWebVitals is used to measure performance, but it's optional.
// Remove the import and the following call if you're not using it.
