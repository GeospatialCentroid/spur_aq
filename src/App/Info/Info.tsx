// File: src/App/Info/Info.tsx

import React from 'react';
import './Info.css';
import InfoCard from './InfoCard/InfoCard';
import RecentValCard from './RecentValCard/RecentValCard';
import { useConfig } from '../../context/ConfigContext'; // ✅ Add this

const Info: React.FC = () => {
  const { config } = useConfig(); // ✅ Pull in config data

  return (
    <div className="App-info container-fluid my-4">
      <div className="row g-4">
        {/* INFO CARD (Dynamic from .txt) */}
        <InfoCard />

        {/* MAP CARD */}
        <div className="col-md-4">
          <div className="card h-100">
            <div className="card-body">
              <h5 className="card-title">Map</h5>
              <p className="card-text">
                [Your map component or placeholder goes here]
              </p>
            </div>
          </div>
        </div>

        {/* RECENT VALUES */}
        <div className="col-md-4">
          <div className="card h-100">
            <div className="card-body">
              <h5 className="card-title">Recent Values</h5>
              {config ? (
                <RecentValCard stationData={config} />
              ) : (
                <p>Loading data...</p>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Info;
