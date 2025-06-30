// File: src/Index.tsx
/**
 * Entry point for the React application.
 * 
 * - Initializes the React root using `ReactDOM.createRoot`.
 * - Renders the <App /> component wrapped in <React.StrictMode> to help identify potential problems.
 * - Calls `reportWebVitals()` to optionally measure and report app performance.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // Global styles
import App from './App'; // Main App component
import reportWebVitals from './reportWebVitals'; // Performance measuring tool

// Create a root container for the React application
const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

// Render the root React component
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Start measuring performance (optional)
// You can log results or send to an analytics endpoint
reportWebVitals();
