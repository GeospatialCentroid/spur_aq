// File: src/App.tsx

import React, { useEffect, useState } from 'react';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';

import Info from './App/Info/Info';
import Stack from './App/Stack/Stack';
import { Config } from './Types/config';
import { ConfigProvider } from './context/ConfigContext';

function App() {
  const [config, setConfig] = useState<Config | null>(null);
  const [timeSeriesData, setTimeSeriesData] = useState<Record<string, { timestamp: string; value: number }[]>>({});

  useEffect(() => {
    fetch('http://129.82.30.40:8001/stations/?format=json')
      .then(response => {
        if (!response.ok) throw new Error('Network response was not ok');
        return response.json();
      })
      .then(data => setConfig(data))
      .catch(error => console.error('Error fetching config:', error));
  }, []);

  // Fetch latest measurement data every 5 minutes
  useEffect(() => {
    const fetchLatest = async () => {
      if (!config) return;

      const newData: Record<string, { timestamp: string; value: number }[]> = {};

      for (const station of config) {
        for (const instrument of station.children || []) {
          for (const m of instrument.measurements || []) {
            if (m.feature_measure && m.instrument_id) {
              try {
                const res = await fetch(`http://129.82.30.24:8001/latest_measurement/${m.instrument_id}/60/`);
                const latest = await res.json();
                newData[m.name] = [latest]; // stores under the variable name
              } catch (err) {
                console.error(`Failed to fetch latest for ${m.name}`, err);
              }
            }
          }
        }
      }

      setTimeSeriesData(newData);
    };

    fetchLatest();
    const intervalId = setInterval(fetchLatest, 5 * 60 * 1000); // 5 minutes
    return () => clearInterval(intervalId);
  }, [config]);

  if (!config) {
    return (
      <div className="app-loading">
        <h2>Loading configuration...</h2>
      </div>
    );
  }

  return (
    <ConfigProvider config={config} timeSeriesData={timeSeriesData}>
      <div className="app">
        <header
          className="app-header"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1rem',
          }}
        >
          <h1>SPUR Air Quality</h1>
          <img
            src="/Photos/InfoCardPhotos/CSUSpur_horiz_campus_rev_rgb.webp"
            alt="CSU Spur Logo"
            style={{ height: '60px', objectFit: 'contain' }}
          />
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

