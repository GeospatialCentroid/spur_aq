import React, { useEffect, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  useMap,
  GeoJSON,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import { useConfig } from "../../../context/ConfigContext";
import "./MapCard.css";

const customIcon = new L.Icon({
  iconUrl: "/Photos/MapCardPhotos/marker-icon-2x.png",
  iconSize: [15, 20],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

const MarkerClusterComponent = ({ stations }: { stations: any[] }) => {
  const map = useMap();

  useEffect(() => {
    const markerClusterGroup = L.markerClusterGroup();

    stations.forEach((station) => {
      const rawLat = parseFloat(station.lat);
      const rawLng = parseFloat(station.lng);
      if (isNaN(rawLat) || isNaN(rawLng)) return;

      const marker = L.marker([rawLat, rawLng], { icon: customIcon }).bindPopup(
        `<h6>${station.name}</h6><p>${station.description}</p>`
      );

      markerClusterGroup.addLayer(marker);
    });

    map.addLayer(markerClusterGroup);

    return () => {
      map.removeLayer(markerClusterGroup);
    };
  }, [map, stations]);

  return null;
};

const zoningGroups: Record<string, { codes: string[]; color: string }> = {
  "Single Unit (SU)": { codes: ["SU"], color: "#e41a1c" },
  "Two Unit (TU)": { codes: ["TU"], color: "#377eb8" },
  "Multi Unit (MU, RH, RO)": { codes: ["MU", "RH", "RO"], color: "#984ea3" },
  "Mixed Use (MX, M-GMX)": { codes: ["MX", "M-GMX"], color: "#4daf4a" },
  "Residential Mixed Use (RX)": { codes: ["RX"], color: "#ff7f00" },
  "Main Street (MS)": { codes: ["MS"], color: "#a65628" },
  "Downtown (AS, C, CPV, GT, LD, TD)": { codes: ["AS", "C", "CPV", "GT", "LD", "TD"], color: "#f781bf" },
  "Downtown - Civic (D-CV)": { codes: ["D-CV"], color: "#999999" },
  "Commercial Corridor (CC)": { codes: ["CC"], color: "#66c2a5" },
  "Cherry Creek North (C-CCN)": { codes: ["C-CCN"], color: "#ffff33" },
  "Campus (EI, EI2, ENT, H, H2, NWC)": { codes: ["EI", "EI2", "ENT", "H", "H2", "NWC"], color: "#a6cee3" },
  "Airport (DIA)": { codes: ["DIA"], color: "#1f78b4" },
  "Industrial - Mixed Use (I-MX, M-IMX)": { codes: ["I-MX", "M-IMX"], color: "#b2df8a" },
  "Industrial - Light (I-A)": { codes: ["I-A"], color: "#33a02c" },
  "Industrial - General (I-B)": { codes: ["I-B"], color: "#fb9a99" },
  "Planned Unit Development (PUD-D, PUD-G)": { codes: ["PUD-D", "PUD-G"], color: "#fdbf6f" },
  "Manufactured Home Community (MHC)": { codes: ["MHC"], color: "#cab2d6" },
  "Special (O-1)": { codes: ["O-1"], color: "#6a3d9a" },
  "Open Space - Conservation (OS-C)": { codes: ["OS-C"], color: "#ffff99" },
  "Open Space - Public Parks (OS-A)": { codes: ["OS-A"], color: "#b15928" },
  "Open Space - Recreation (OS-B)": { codes: ["OS-B"], color: "#8dd3c7" },
  "Former Chapter 59 Zone": { codes: ["CH59"], color: "#d9d9d9" },
  "Other": { codes: [], color: "#cccccc" },
};

function getGroupByCode(fullCode: string) {
  const match = fullCode.match(/^[A-Z]+-([A-Z]+)-/);
  const useType = match ? match[1] : fullCode;
  return Object.entries(zoningGroups).find(([, group]) =>
    group.codes.includes(useType)
  )?.[1];
}

const LandUseLayer = () => {
  const [geojson, setGeojson] = useState<any>(null);

  useEffect(() => {
    fetch("https://services1.arcgis.com/zdB7qR0BtYrg0Xpl/arcgis/rest/services/ODC_ZONE_ZONING_A/FeatureServer/209/query?where=1%3D1&outFields=*&f=geojson")
      .then(res => res.json())
      .then(setGeojson);
  }, []);

  return geojson ? (
    <GeoJSON
      data={geojson}
      style={(feature) => {
        const fullCode = feature?.properties?.ZONE_DISTRICT || "";
        const group = getGroupByCode(fullCode);
        return {
          fillColor: group?.color || "#cccccc",
          color: "#666",
          weight: 0.5,
          fillOpacity: 0.6,
        };
      }}
      onEachFeature={(feature, layer) => {
        const code = feature.properties.ZONE_DISTRICT || "Unknown";
        const group = getGroupByCode(code);
        const name = (Object.keys(zoningGroups) as string[]).find(
          (key) => zoningGroups[key] === group
        ) || "Other";

        layer.bindPopup(`<strong>${name}</strong><br>Zone Code: ${code}`);
      }}
    />
  ) : null;
};

const ResizeMapOnExpand = ({ trigger }: { trigger: boolean }) => {
  const map = useMap();

  useEffect(() => {
    if (trigger) {
      setTimeout(() => {
        map.invalidateSize();
      }, 300);
    }
  }, [trigger, map]);

  return null;
};

const ExpandControl = ({
  expanded,
  setExpanded,
}: {
  expanded: boolean;
  setExpanded: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const map = useMap();

  useEffect(() => {
    const ExpandControl = L.Control.extend({
      options: { position: "topleft" },
      onAdd: function () {
        const container = L.DomUtil.create(
          "div",
          "leaflet-bar leaflet-control map-expand-button"
        );

        container.innerHTML = `
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            ${expanded
              ? '<polyline points="15 9 9 15" /><path d="M9 9h6v6" />'
              : '<path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M16 3h3a2 2 0 0 1 2 2v3"/><path d="M8 21H5a2 2 0 0 1-2-2v-3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/>'}
          </svg>
        `;

        container.title = expanded ? "Collapse Map" : "Expand Map";

        container.onclick = function () {
          setExpanded((prev) => !prev);
        };

        return container;
      },
    });

    const control = new ExpandControl();
    map.addControl(control);

    return () => {
      map.removeControl(control);
    };
  }, [map, expanded, setExpanded]);

  return null;
};

const MapCard = () => {
  const { config } = useConfig();
  const [expanded, setExpanded] = useState<boolean>(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mapContainer = mapContainerRef.current;
    if (!mapContainer) return;

    if (expanded) {
      mapContainer.classList.add("map-fullscreen");
      document.body.classList.add("map-fullscreen-active");
    } else {
      mapContainer.classList.remove("map-fullscreen");
      document.body.classList.remove("map-fullscreen-active");
    }
  }, [expanded]);

  if (!config) {
    return <div>Loading map data...</div>;
  }

  return (
    <div className="map-wrapper">
      <h5>Map</h5>
      <div ref={mapContainerRef} className="map-container">
        <MapContainer
          center={[39.78366, -104.974191]}
          zoom={13}
          style={{ width: "100%", height: "100%" }}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <ResizeMapOnExpand trigger={expanded} />
          <MarkerClusterComponent stations={config} />
          <LandUseLayer />
          <ExpandControl expanded={expanded} setExpanded={setExpanded} />
        </MapContainer>
      </div>
    </div>
  );
};

export default MapCard;
