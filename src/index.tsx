// File: src/Index.tsx
/**
 * Entry point for the React application.
 * 
 * - Initializes the React root using `ReactDOM.createRoot`.
 * - Wraps the <App /> component in <BrowserRouter> to enable routing functionality.
 * - Renders the component tree inside <React.StrictMode> to help identify potential problems.
 * - Calls `reportWebVitals()` to optionally measure and report app performance.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // Global styles
import App from './App'; // Main App component
import reportWebVitals from './reportWebVitals'; // Performance measuring tool
import { BrowserRouter } from 'react-router-dom'; // Router wrapper for navigation support

// Create a root container for the React application
const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

// Render the root React component wrapped in <BrowserRouter>
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

// Start measuring performance (optional)
// You can log results or send to an analytics endpoint
reportWebVitals();
