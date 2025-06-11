// src/App.tsx
import React, { useEffect, useState } from 'react';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';

import Info from './App/Info/Info';
import Stack from './App/Stack/Stack';
import { Config } from './types/config';
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

  if (!config) {
    return (
      <div className="App-loading">
        <h2>Loading configuration...</h2>
      </div>
    );
  }

  return (
    <ConfigProvider config={config}>
      <div className="App">
        <header className="App-header">
          <h1>SPUR Air Quality</h1>
        </header>

        <main className="App-body">
          {/* Optional: raw JSON preview */}
          {/* <section className="Body-section">
            <h2>Loaded Config</h2>
            <pre style={{ textAlign: 'left', backgroundColor: '#f5f5f5', padding: '1em' }}>
              {JSON.stringify(config, null, 2)}
            </pre>
          </section> */}

          <section className="Body-section">
            <Info />
          </section>

          <section className="Body-section stack">
            <Stack />
          </section>
        </main>

        <footer className="App-footer">
          <p>© {new Date().getFullYear()} SPUR. All rights reserved.</p>
        </footer>
      </div>
    </ConfigProvider>
  );
}

export default App;
