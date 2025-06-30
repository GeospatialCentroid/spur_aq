// File: src/App.tsx

/**
 * Top-level React component for the SPUR Air Quality application.
 *
 * Responsibilities:
 * - Fetches configuration data from a remote API endpoint on initial load.
 * - Provides configuration to the application via React Context (`ConfigProvider`).
 * - Renders header, info panel, data stack, and footer components.
 */

import React, { useEffect, useState } from 'react';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';

import Info from './App/Info/Info';
import Stack from './App/Stack/Stack';
import { Config } from './Types/config';
import { ConfigProvider } from './context/ConfigContext';

function App() {
  const [config, setConfig] = useState<Config | null>(null);

  useEffect(() => {
    fetch('http://129.82.30.72:8001/stations/?format=json')
      .then(response => {
        if (!response.ok) throw new Error('Network response was not ok');
        return response.json();
      })
      .then(data => setConfig(data))
      .catch(error => console.error('Error fetching config:', error));
  }, []);

  useEffect(() => {
    if (config) {
      console.log('Loaded Config:', config);
    }
  }, [config]);

  if (!config) {
    return (
      <div className="app-loading">
        <h2>Loading configuration...</h2>
      </div>
    );
  }

  return (
    <ConfigProvider config={config}>
      <div className="app">
        <header className="app-header">
          <h1>SPUR Air Quality</h1>
        </header>

        <main className="app-body">
          <section className="body-section">
            <Info />
          </section>

          <section className="body-section stack">
            <Stack />
          </section>
        </main>

        <footer className="app-footer">
          <p>© {new Date().getFullYear()} SPUR. All rights reserved.</p>
        </footer>
      </div>
    </ConfigProvider>
  );
}

export default App;
