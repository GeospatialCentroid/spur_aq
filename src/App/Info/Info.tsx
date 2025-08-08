import React from 'react';
import './Info.css';
import InfoCard from './InfoCard/InfoCard';
import RecentValCard from './RecentValCard/RecentValCard';
import { useConfig } from '../../context/ConfigContext';
import MapCard from './MapCard/MapCard';

const Info: React.FC = () => {
  const { config, timeSeriesData } = useConfig(); 
  return (
    <div className="App-info container-fluid my-4">
      <div className="row g-4">
        <InfoCard />

        <div className="col-md-4">
          <div className="card h-100">
            <div className="card-body">
               <MapCard />
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card h-100">
            <div className="card-body">
              <h5 className="card-title">Recent Values</h5>
              {config ? (
                <RecentValCard
                  stationData={config}
        
                />
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
