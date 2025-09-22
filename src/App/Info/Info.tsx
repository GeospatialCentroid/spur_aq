import React from 'react';
import './Info.css';
import InfoCard from './InfoCard/InfoCard';
import RecentValCard from './RecentValCard/RecentValCard';
import { useConfig } from '../../context/ConfigContext';
import MapCard from './MapCard/MapCard';

const Info: React.FC = () => {
  const { config } = useConfig();

  return (
    <div className="App-info container-fluid my-4">
      <div className="row g-4 top-row">
        {/* About */}
        <div className="col-md-4">
          <div className="card info-card h-100">
            <div className="card-body info-card__body">
              <div className="card-header-row">
                <h5 className="card-title section-title">About</h5>
              </div>
              {/* InfoCard now renders only the scrollable content/media */}
              <InfoCard />
            </div>
          </div>
        </div>

        {/* Map */}
        <div className="col-md-4">
          <div className="card map-card h-100">
            <div className="card-body">
              <MapCard />
            </div>
          </div>
        </div>

        {/* Recent Measurements */}
        <div className="col-md-4">
          <div className="card h-100">
            <div className="card-body card-body--with-qr">
              <div className="card-header-row">
                <h5 className="card-title section-title">
                  Recent <span className="section-title__break">Measurements</span> 
                </h5>
                <img
                  src="/Photos/ordorReportQR.png"   /* verify filename/path */
                  alt="Open odor report (QR)"
                  className="qr-code-title"
                  loading="lazy"
                />
              </div>

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
