// src/App/Info/Info.tsx
import React from 'react';
import './Info.css';
import InfoCard from './InfoCard/InfoCard';
import MapCard from './MapCard/MapCard';



const Info: React.FC = () => (
  <div className="App-info container-fluid my-4">
    <div className="row g-4">
      
        {/* INFO CARD (Dynamic from .txt) */}
           <InfoCard />

        {/* MAP CARD */}
        <div className="col-md-4">
          <div className="card h-100">
            <div className="card-body">
               <MapCard />
            </div>
          </div>
        </div>

        {/* HOW TO USE CARD */}
        <div className="col-md-4">
          <div className="card h-100">
            <div className="card-body">
              <h5 className="card-title">How to Use</h5>
              <p className="card-text">
                1. Do this.<br/>
                2. Then that.<br/>
                3. Finally, enjoy!
              </p>
            </div>
          </div>
        </div>
        </div>
  </div>
);

export default Info;
