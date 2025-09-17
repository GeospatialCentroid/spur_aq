import React, { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, LayersControl } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "./components/cluster.css";
import './icons/stationIcons.css';



import { useConfig } from "../../../context/ConfigContext";
import "./MapCard.css";

import MarkerCluster from "./components/MarkerCluster";
import LandUseLayer from "./components/LandUseLayer";
import LegendControl from "./components/LegendControl";
import ResizeMapOnExpand from "./components/ResizeMapOnExpand";
import ExpandControl from "./components/ExpandControl";
import RegisterMapRef from "./components/RegisterMapRef";

const MapCard: React.FC = () => {
  const { config } = useConfig();
  const [expanded, setExpanded] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  const initialCenter = useMemo<[number, number]>(() => [39.78366, -104.974191], []);
  const initialZoom = 13;

  useEffect(() => {
    const el = mapContainerRef.current;
    if (!el) return;
    if (expanded) {
      el.classList.add("map-fullscreen");
      document.body.classList.add("map-fullscreen-active");
    } else {
      el.classList.remove("map-fullscreen");
      document.body.classList.remove("map-fullscreen-active");
      setTimeout(() => {
        mapRef.current?.invalidateSize();
        mapRef.current?.setView(initialCenter, initialZoom);
      }, 400);
    }
  }, [expanded, initialCenter]);

  if (!config) return <div>Loading map data...</div>;

  return (
    <div className="map-wrapper">
      <div className="map-container-wrapper">
       <div ref={mapContainerRef} className="map-container" style={{ height: 480 }}>  {/* try 440–480 */}
        <MapContainer
          /* no className here */
         center={initialCenter}
          zoom={initialZoom}
          scrollWheelZoom
          style={{ width: "100%", height: "100%" }}
              >
            <RegisterMapRef mapRef={mapRef} />
 {/* Layout controls */}
<ResizeMapOnExpand trigger={expanded} />
<ExpandControl expanded={expanded} setExpanded={setExpanded} />

<LayersControl position="topright">
  {/* --- Base layers (only one active) --- */}
  <LayersControl.BaseLayer checked name="OpenStreetMap">
    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
  </LayersControl.BaseLayer>

  <LayersControl.BaseLayer name="Esri Satellite">
    <TileLayer
      url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
      attribution="Tiles © Esri"
    />
  </LayersControl.BaseLayer>

  <LayersControl.BaseLayer name="USGS Topo">
  <TileLayer
    url="https://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer/tile/{z}/{y}/{x}"
    attribution="Map courtesy USGS"
    maxZoom={20}
  />
</LayersControl.BaseLayer>

  {/* --- Overlays (multi-select) --- */}
  <LayersControl.Overlay checked name="Stations">
    {/* MarkerCluster should render a LayerGroup/FeatureGroup under the hood; if not, it still works here */}
    <MarkerCluster stations={config} />
  </LayersControl.Overlay>

  <LayersControl.Overlay name="Land Use">
    <LandUseLayer />
  </LayersControl.Overlay>
</LayersControl>

              {/* UI */}
              <LegendControl />

          </MapContainer>
        </div>
      </div>
    </div>
  );
};

export default MapCard;
