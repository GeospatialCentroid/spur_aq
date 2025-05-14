import React, { useEffect, useState } from 'react';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';

import Info from './App/Info/Info';
import Stack from './App/Stack/Stack';
import { Config } from './Types/config'; // if you're typing the config

function App() {
  const [config, setConfig] = useState<Config | null>(null);

  useEffect(() => {
    fetch('/config.json')
      .then(response => {
        if (!response.ok) throw new Error('Network response was not ok');
        return response.json();
      })
      .then(data => setConfig(data))
      .catch(error => console.error('Error fetching config:', error));
  }, []);

  return (
    <div className="App"> {/* Entire App to Render */}
      <header className="App-header">
        <h1>SPUR Air Quality</h1>
      </header>

      <main className="App-body">
        {/* To view config response */}
        {config && (
          <section className="Body-section">
            <h2>Loaded Config</h2>
            <pre style={{ textAlign: 'left', backgroundColor: '#f5f5f5', padding: '1em' }}>
              {JSON.stringify(config, null, 2)}
            </pre>
          </section>
        )}

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
  );
}

export default App;
