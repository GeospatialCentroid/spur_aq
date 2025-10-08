import React, { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, LayersControl } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "./components/cluster.css";
import "./icons/stationIcons.css";
import basemaps from "./components/basemaps.json";

import { useConfig } from "../../../context/ConfigContext";
import "./MapCard.css";

import MarkerCluster from "./components/MarkerCluster";
import LandUseLayer from "./components/LandUseLayer";
import LegendControl from "./components/LegendControl";
import ResizeMapOnExpand from "./components/ResizeMapOnExpand";
import ExpandControl from "./components/ExpandControl";
import RegisterMapRef from "./components/RegisterMapRef";

/** Minimal error boundary so MarkerCluster issues don't crash the whole map. */
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: any, info: any) {
    // eslint-disable-next-line no-console
    console.error("MarkerCluster crashed:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 8, background: "#fff3cd", border: "1px solid #ffeeba" }}>
          Marker layer failed to render. Check console for details.
        </div>
      );
    }
    return this.props.children;
  }
}

const MapCard: React.FC = () => {
  const { config } = useConfig();

  const [expanded, setExpanded] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  const initialCenter = useMemo<[number, number]>(() => [39.78366, -104.974191], []);
  const initialZoom = 13;

  // Deduplicate basemaps by URL in case JSON gets edited with duplicates later.
  const baseLayers = useMemo(
    () => basemaps.filter((m, i, arr) => arr.findIndex((x) => x.url === m.url) === i),
    []
  );

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
        <div ref={mapContainerRef} className="map-container" style={{ height: 480 }}>
          <MapContainer
            /* no className here */
            center={initialCenter}
            zoom={initialZoom}
            minZoom={2}
            maxZoom={20} // fixes "Map has no maxZoom specified"
            scrollWheelZoom
            style={{ width: "100%", height: "100%" }}
          >
            <RegisterMapRef mapRef={mapRef} />

            {/* Layout controls */}
            <ResizeMapOnExpand trigger={expanded} />
            <ExpandControl expanded={expanded} setExpanded={setExpanded} />

            <LayersControl position="topright">
              {/* --- Base layers (only one active) --- */}
              {baseLayers.map(({ id, name, url, attribution, checked, maxZoom }) => (
                <LayersControl.BaseLayer key={id} name={name} checked={!!checked}>
                  {url ? (
                    <TileLayer
                      url={url}
                      attribution={attribution}
                      maxZoom={maxZoom ?? 20}
                      detectRetina
                    />
                  ) : null}
                </LayersControl.BaseLayer>
              ))}

              {/* --- Overlays (multi-select) --- */}
              <LayersControl.Overlay checked name="Stations">
                <ErrorBoundary>
                  <MarkerCluster stations={config} />
                </ErrorBoundary>
              </LayersControl.Overlay>

              {/* Start with Land Use visible by default */}
              <LayersControl.Overlay checked name="Land Use">
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
