// File: src/App.tsx

import React, { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import { apiUrl } from './config/api'; // TEAM: central API base + helper



import Info from './App/Info/Info';
import Stack from './App/Stack/Stack';
import { Config } from './Types/config';
import { ConfigProvider } from './context/ConfigContext';
import { ModeProvider } from './context/ModeContext';

// TEAM: Dev-only StrictMode can re-run effects; this cache prevents duplicate network hits
let stationsCache: Config | null = null;

function App() {
  const [config, setConfig] = useState<Config | null>(null);
  const [timeSeriesData, setTimeSeriesData] = useState<Record<string, { timestamp: string; value: number }[]>>({});

  useEffect(() => {
     if (stationsCache) {
        setConfig(stationsCache);
        return; // skip network in dev StrictMode's second mount
      }
    fetch(apiUrl('/stations/?format=json'))
      .then(response => {
        if (!response.ok) throw new Error('Network response was not ok');
        return response.json();
      })
      .then(data => { stationsCache = data; setConfig(data); })
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
                const res = await fetch(apiUrl(`/latest_measurement/${m.instrument_id}/60/`));
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
   <ModeProvider>
    <ConfigProvider config={config} timeSeriesData={timeSeriesData}>
      <div className="app">
     <header
      className="app-header"
      style={{
        position: 'fixed',      // keep if you want it fixed; see note below
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
      }}
    >
      <img
        src="/Photos/InfoCardPhotos/CSUSpur_horiz_campus_rev_rgb.webp"
        alt="CSU Spur Logo"
        className="header-logo"
        style={{ objectFit: 'contain' }}
      />
      <h1 className="title">
        <b>Spur</b> <b>R</b>egional <b>A</b>ir <b>M</b>onitoring <b>S</b>ite (<b>RAMS</b>)
      </h1>
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


    </ModeProvider>
  );
}

export default App;

