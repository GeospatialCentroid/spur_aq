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
            {/* Make this the container for the header + gauge */}
            <div className="card-body card-body--with-qr">
              <div className="card-header-row">
                <h5 className="card-title section-title">
                  Recent <span className="section-title__break">Measurements</span>
                </h5>

                {/* Text + (arrow + QR) pinned to the top right */}
                <div className="qr-cta odor-report">
                  <div className="qr-cta__text odor-text">
                    <div className="qr-cta__lead"></div>
                    <a
                      className="qr-cta__action"
                      href="https://docs.google.com/forms/d/e/1FAIpQLSco4B_ZMGY-7RVMePDOx7fg8ExX97nKQmC4we0pxqArWDV34A/viewform"   // <- put your real report URL here
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      What’s&nbsp;that&nbsp;smell?
                    </a>

                  </div>

                  <div className="qr-cta__right">
                    <svg className="qr-cta__arrow" viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        d="M5 12h12m-4-4 4 4-4 4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>

                    <img
                      src="/Photos/ordorReportQR.png"
                      alt="QR code to report odors"
                      className="qr-code-title odor-qr"
                      loading="lazy"
                    />
                  </div>
                </div>
              </div>{/* end .card-header-row */}

              {config ? (
                <RecentValCard stationData={config} />
              ) : (
                <p>Loading data...</p>
              )}
            </div>{/* end .card-body */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Info;
