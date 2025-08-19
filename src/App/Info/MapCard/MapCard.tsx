// src/App/Info/MapCard/MapCard.tsx
import React, { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import { useConfig } from "../../../context/ConfigContext";
import "./MapCard.css";

/* --------------------- Icon --------------------- */
const customIcon = new L.Icon({
  iconUrl: "/Photos/MapCardPhotos/marker-icon-2x.png",
  iconSize: [15, 20],
  iconAnchor: [8, 32],
  popupAnchor: [0, -32],
});



let featureLayer: L.GeoJSON<any> | null = null;
let clickedLayer: any = null;
let currentHighlightGroup: any = null;

/* --------------------- Types & Zoning --------------------- */
type ZoningGroup = { codes: string[]; color: string };
const zoningGroups: Record<string, ZoningGroup> = {
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
  Other: { codes: [], color: "#cccccc" },
};

function getGroupByCode(fullCode: string): ZoningGroup | undefined {
  if (!fullCode) return undefined;
  const parts = fullCode.split("-").filter(Boolean);
  const useType = parts.length >= 2 ? parts[1] : fullCode;
  return Object.values(zoningGroups).find((g) => g.codes.includes(useType));
}

function onEachFeature(feature: any, layer: L.Layer) {
  const code = feature.properties?.ZONE_DISTRICT || "Unknown";
  const group = getGroupByCode(code);
  const name =
    (Object.keys(zoningGroups) as (keyof typeof zoningGroups)[]).find(
      (key) => zoningGroups[key] === group
    ) || "Other";

  layer.bindPopup(`<strong>${name}</strong><br>Zone Code: ${code}`);

  layer.on({
    click: function (e) {
      if (clickedLayer && featureLayer) {

            featureLayer.resetStyle(clickedLayer);
      }
      clickedLayer = e.target;
      clickedLayer.setStyle({
        weight: 2,
        color: '#000',
        dashArray: '',
        fillOpacity: 0.60
      });
      if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
        clickedLayer.bringToFront();
      }
    }
  });
}
function highlightFeatures(groupKey: any) {
  currentHighlightGroup = groupKey === currentHighlightGroup ? null : groupKey;
  const selectedCodes = groupKey && zoningGroups[groupKey]?.codes || [];
  if (!featureLayer) return;
  featureLayer.setStyle(feature => {
    if (!feature) return {};
    const fullCode = feature.properties.ZONE_DISTRICT || '';
    const match = fullCode.match(/^[A-Z]+-([A-Z]+)-/);
    const useType = match ? match[1] : fullCode;
    const isMatch = selectedCodes.includes(useType);

    const group = getGroupByCode(fullCode);
    const color = group?.color || '#cccccc';

    return {
      fillColor: color,
      fillOpacity: currentHighlightGroup ? (isMatch ? 0.9 : 0.2) : 0.6,
      color: isMatch ? '#000' : '#666',
      weight: isMatch ? 2 : 0.5
    };
  });
}
/* --------------------- Marker cluster component --------------------- */
const MarkerClusterComponent = ({ stations }: { stations: any[] }) => {
  const map = useMap();

  useEffect(() => {
    // leaflet.markercluster typings can be problematic — cast to any
    const markerClusterGroup = (L as any).markerClusterGroup
      ? (L as any).markerClusterGroup()
      : L.layerGroup(); // fallback

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

/* --------------------- Land use layer (creates L.geoJSON and keeps ref) --------------------- */
const LandUseLayer = ({
  expanded,
  geoJsonLayerRef,
}: {
  expanded: boolean;
  geoJsonLayerRef: React.MutableRefObject<L.GeoJSON | null>;
}) => {
  const map = useMap();

  useEffect(() => {
  let mounted = true;


  // ArcGIS FeatureServer URL
  const layerUrl =
    "https://services1.arcgis.com/zdB7qR0BtYrg0Xpl/arcgis/rest/services/ODC_ZONE_ZONING_A/FeatureServer/209/query";

  async function getTotalFeatureCount() {
    const params = new URLSearchParams({
      where: "1=1",
      returnCountOnly: "true",
      f: "json",
    });
    const response = await fetch(`${layerUrl}?${params.toString()}`);
    const data = await response.json();
    return data.count;
  }

  async function fetchFeatures(offset: number, count: number) {
    const params = new URLSearchParams({
      where: "1=1",
      outFields: "*",
      f: "geojson",
      resultOffset: offset.toString(),
      resultRecordCount: count.toString(),
    });
    const response = await fetch(`${layerUrl}?${params.toString()}`);
    const data = await response.json();
    return data.features;
  }

  async function fetchAllFeatures() {
    const maxPerRequest = 2000;
    const totalCount = await getTotalFeatureCount();
    let allFeatures: any[] = [];
    let offset = 0;

    while (offset < totalCount) {
      const count = Math.min(maxPerRequest, totalCount - offset);
      const features = await fetchFeatures(offset, count);
      allFeatures = allFeatures.concat(features);
      offset += count;
    }
    return allFeatures;
  }

  // Load and render the full dataset
  fetchAllFeatures().then((allFeatures) => {
    if (!mounted) return;

    const geoJson = {
      type: "FeatureCollection"  as const,
      features: allFeatures,
    };

    featureLayer = L.geoJSON(geoJson, {
      style: (feature) => {
        const fullCode =
          (feature?.properties?.ZONE_DISTRICT as string) || "";
        const group = getGroupByCode(fullCode);
        return {
          fillColor: group?.color || "#cccccc",
          color: "#666",
          weight: 0.5,
          fillOpacity: 0.6,
        } as L.PathOptions;
      },
     onEachFeature: onEachFeature, // keep your existing popup/interaction logic
    }).addTo(map);
  });

  return () => {
    mounted = false;
    if (featureLayer) {
      map.removeLayer(featureLayer);
    }
  };
}, [map, geoJsonLayerRef]);


  // if expanded changes, we can trigger a refresh (example maintains style)
  useEffect(() => {
    if (geoJsonLayerRef.current) {
      // forcing a re-style: calling setStyle with the default function
      geoJsonLayerRef.current.setStyle((feature) => {
        const fullCode = (feature?.properties?.ZONE_DISTRICT as string) || "";
        const group = getGroupByCode(fullCode);
        return {
          fillColor: group?.color || "#cccccc",
          color: "#666",
          weight: 0.5,
          fillOpacity: 0.6,
        } as L.PathOptions;
      });
    }
  }, [expanded, geoJsonLayerRef]);

  return null;
};



/* --------------------- Legend control (click to highlight) --------------------- */
const LegendControl = ({ geoJsonLayerRef }: { geoJsonLayerRef: React.MutableRefObject<L.GeoJSON | null> }) => {
  const map = useMap();
  const [legendVisible, setLegendVisible] = useState(false);

  useEffect(() => {
    if (!map) return;

    /* ------------ Toggle button (bottom-left) ------------ */
    const ToggleLegend = L.Control.extend({
      options: { position: "bottomleft" },
      onAdd: () => {
        const btn = L.DomUtil.create("button", "toggle-legend-btn") as HTMLButtonElement;
        btn.textContent = legendVisible ? "Hide Legend" : "Show Legend";
        btn.style.background = "white";
        btn.style.padding = "6px 8px";
        btn.style.cursor = "pointer";
        btn.style.border = "1px solid #ccc";
        btn.style.borderRadius = "3px";
        L.DomEvent.disableClickPropagation(btn);
       L.DomEvent.on(btn, "click", (ev: any) => {
       L.DomEvent.stop(ev);
       // update the label immediately to avoid any flicker
       btn.textContent = legendVisible ? "Show Legend" : "Hide Legend";
       setLegendVisible(v => !v);
   });

        return btn;
      },
    });

    const toggleCtrl = new (ToggleLegend as any)();
    map.addControl(toggleCtrl);

    /* ------------ Floating legend (draggable + resizable) ------------ */
    let container: HTMLDivElement | null = null;

    const MARGIN = 10;
    const MIN_W = 220, MIN_H = 140;
    const MAX_FRAC = 0.6; // ≤ 60% of map size
   const mapEl = map.getContainer();
const viewportSize = () => ({ w: window.innerWidth, h: window.innerHeight });

const applyMaxSize = () => {
  if (!container) return;
  const { w, h } = viewportSize();
  const maxW = Math.max(MIN_W, Math.floor(Math.min(w - MARGIN * 2, w * MAX_FRAC)));
  const maxH = Math.max(MIN_H, Math.floor(Math.min(h - MARGIN * 2, h * MAX_FRAC)));
  container.style.maxWidth = `${maxW}px`;
  container.style.maxHeight = `${maxH}px`;
};

const clampIntoViewport = () => {
  if (!container) return;
  const { w, h } = viewportSize();
  const legRect = container.getBoundingClientRect();
  const currentLeft = parseFloat(container.style.left || "0");
  const currentTop  = parseFloat(container.style.top  || "0");
  const maxLeft = w - legRect.width - MARGIN;
  const maxTop  = h - legRect.height - MARGIN;
  const left = Math.min(Math.max(MARGIN, currentLeft), Math.max(MARGIN, maxLeft));
  const top  = Math.min(Math.max(MARGIN, currentTop),  Math.max(MARGIN, maxTop));
  container.style.left = `${left}px`;
  container.style.top  = `${top}px`;
};

const placeNearMap = () => {
  if (!container) return;
  const mapRect = mapEl.getBoundingClientRect();
  const legRect = container.getBoundingClientRect();
  let left = mapRect.right - legRect.width - MARGIN;
  let top  = mapRect.bottom - legRect.height - MARGIN;
  const { w, h } = viewportSize();
  left = Math.max(MARGIN, Math.min(left, w - legRect.width - MARGIN));
  top  = Math.max(MARGIN, Math.min(top,  h - legRect.height - MARGIN));
  container.style.left = `${left}px`;
  container.style.top  = `${top}px`;
};
    if (legendVisible) {
  container = L.DomUtil.create("div", "legend legend-floating") as HTMLDivElement;
  container.style.position = "fixed";
  container.style.zIndex = "99999";

  container.innerHTML = `
    <div class="legend-header" title="Drag to move">
      <strong>Zones — Click to Highlight</strong>
      <button class="legend-close" aria-label="Hide legend" title="Hide legend">×</button>
    </div>
    <div class="legend-body"></div>
  `;

  const headerEl = container.querySelector(".legend-header") as HTMLDivElement;
  const bodyEl   = container.querySelector(".legend-body") as HTMLDivElement;

  // Items
  for (const groupLabel of Object.keys(zoningGroups)) {
    const group = zoningGroups[groupLabel];
    const item = document.createElement("div");
    item.className = "legend-item";
    item.dataset.group = groupLabel;
    item.innerHTML = `<i style="background:${group.color}"></i> ${groupLabel}`;
    bodyEl.appendChild(item);
  }

  // Resizer
  const resizer = document.createElement("div");
  resizer.className = "legend-resizer";
  container.appendChild(resizer);

  // Close + select
  container.addEventListener("click", (e) => {
    const closeBtn = (e.target as HTMLElement).closest(".legend-close");
    if (closeBtn) {
      L.DomEvent.stop(e);
      setLegendVisible(false);
      return;
    }
    const target = (e.target as HTMLElement).closest(".legend-item") as HTMLElement | null;
    if (!target) return;
    const groupKey = target.dataset.group!;
    const isSelected = target.classList.contains("selected-legend");
    container!.querySelectorAll(".legend-item").forEach((el) => el.classList.remove("selected-legend"));
    if (!isSelected) {
      target.classList.add("selected-legend");
      highlightFeatures(groupKey);
    } else {
      highlightFeatures(null);
    }
  });


  // Insert and size/position (only once)
// Insert and size/position (only once)
  document.body.appendChild(container);
  applyMaxSize();
  placeNearMap();


  // Dragging via header
  const header = container.querySelector(".legend-header") as HTMLElement;
  let dragging = false, sx = 0, sy = 0, sl = 0, st = 0;
  const onMove = (ev: MouseEvent) => {
    if (!dragging || !container) return;
    container.style.left = `${sl + (ev.clientX - sx)}px`;
    container.style.top = `${st + (ev.clientY - sy)}px`;
    clampIntoViewport();

  };
  const onUp = () => {
    dragging = false;
    document.removeEventListener("mousemove", onMove);
    document.removeEventListener("mouseup", onUp);
  };
  header.addEventListener("mousedown", (ev) => {
    if ((ev.target as HTMLElement).closest(".legend-close")) return;
    dragging = true;
    sx = ev.clientX; sy = ev.clientY;
    sl = parseFloat(container!.style.left || "0");
    st = parseFloat(container!.style.top  || "0");

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  });

  // Resizing via handle
  let resizing = false, sw = 0, sh = 0;
  const onRMove = (ev: MouseEvent) => {
    if (!resizing || !container) return;
    const { w, h } = viewportSize();
    const dx = ev.clientX - sx;
    const dy = ev.clientY - sy;
    const currentLeft = parseFloat(container.style.left || "0");
    const currentTop  = parseFloat(container.style.top  || "0");
    let newW = Math.max(MIN_W, Math.min(sw + dx, w - currentLeft - MARGIN));
    let newH = Math.max(MIN_H, Math.min(sh + dy, h - currentTop  - MARGIN));
    container.style.width = `${newW}px`;
    container.style.height = `${newH}px`;


  };
  const onRUp = () => {
    resizing = false;
    document.removeEventListener("mousemove", onRMove);
    document.removeEventListener("mouseup", onRUp);
  };
  resizer.addEventListener("mousedown", (ev) => {
    ev.preventDefault();
    resizing = true;
    sx = ev.clientX; sy = ev.clientY;
    const rect = container!.getBoundingClientRect();
    sw = rect.width; sh = rect.height;
    document.addEventListener("mousemove", onRMove);
    document.addEventListener("mouseup", onRUp);
  });

  // Map resize → re-clamp and re-cap sizes
// Viewport resize → re-clamp and re-cap sizes
const onViewportResize = () => {
  applyMaxSize();
  clampIntoViewport();

};
window.addEventListener("resize", onViewportResize);

// Cleanup
return () => {
  window.removeEventListener("resize", onViewportResize);
    document.removeEventListener("mousemove", onMove);
    document.removeEventListener("mouseup", onUp);
    document.removeEventListener("mousemove", onRMove);
    document.removeEventListener("mouseup", onRUp);
    if (container && container.parentElement) container.parentElement.removeChild(container);
    map.removeControl(toggleCtrl);
  };
}


    // If legend not visible, just cleanup toggle on unmount/re-render
    return () => {
      map.removeControl(toggleCtrl);
    };
  }, [map, legendVisible]);

  return null;
};
/* --------------------- Resize control (invalidateSize on expand) --------------------- */
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

/* --------------------- Expand control (top-left) --------------------- */
const ExpandControl = ({
  expanded,
  setExpanded,
}: {
  expanded: boolean;
  setExpanded: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const map = useMap();

  useEffect(() => {
  const Expand = L.Control.extend({
    options: { position: "topleft" },
    onAdd: function () {
      const container = L.DomUtil.create("div", "leaflet-bar leaflet-control map-expand-button");
      container.innerHTML = `
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            ${expanded
              ? '<polyline points="15 9 9 15" /><path d="M9 9h6v6" />'
              : '<path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M16 3h3a2 2 0 0 1 2 2v3"/><path d="M8 21H5a2 2 0 0 1-2-2v-3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/>'}
          </svg>
        `;
      container.style.cursor = "pointer";
       container.title = expanded ? "Collapse Map" : "Expand Map";

        container.onclick = function () {
          setExpanded((prev) => !prev);
        };

        return container;
    },
  });

  const expandControl = new Expand();
  map.addControl(expandControl);

  // ✅ Cleanup
  return () => {
    map.removeControl(expandControl);
  };
},[map, expanded, setExpanded]);

  return null;
};

/* --------------------- Register MapRef (so parent can call invalidateSize) --------------------- */
const RegisterMapRef = ({ mapRef }: { mapRef: React.MutableRefObject<L.Map | null> }) => {
  const map = useMap();
  useEffect(() => {
    mapRef.current = map;
    return () => {
      mapRef.current = null;
    };
  }, [map, mapRef]);
  return null;
};

/* --------------------- Main MapCard --------------------- */
const MapCard: React.FC = () => {
  const { config } = useConfig();
  const [expanded, setExpanded] = useState<boolean>(false);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const geoJsonLayerRef = useRef<L.GeoJSON | null>(null);

  const initialCenter = React.useMemo<[number, number]>(() => [39.78366, -104.974191], []);
  const initialZoom = 13;

  useEffect(() => {
    const mapContainer = mapContainerRef.current;
    if (!mapContainer) return;

    if (expanded) {
      mapContainer.classList.add("map-fullscreen");
      document.body.classList.add("map-fullscreen-active");
    } else {
      mapContainer.classList.remove("map-fullscreen");
      document.body.classList.remove("map-fullscreen-active");

      // small delay to allow transition
      setTimeout(() => {
        mapRef.current?.invalidateSize();
        mapRef.current?.setView(initialCenter, initialZoom);
      }, 400);
    }
  }, [expanded, initialCenter]);

  if (!config) {
    return <div>Loading map data...</div>;
  }

  return (
    <div className="map-wrapper">

      <div className="map-container-wrapper">
        <div ref={mapContainerRef} className="map-container" style={{ height: 400 }}>
          <MapContainer
            className="map-container"
            center={initialCenter}
            zoom={initialZoom}
            scrollWheelZoom={true}
            style={{ width: "100%", height: "100%" }}
          >
            <RegisterMapRef mapRef={mapRef} />
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <ResizeMapOnExpand trigger={expanded} />
            <MarkerClusterComponent stations={config} />
            <LandUseLayer expanded={expanded} geoJsonLayerRef={geoJsonLayerRef} />
            <LegendControl geoJsonLayerRef={geoJsonLayerRef} />
            <ExpandControl expanded={expanded} setExpanded={setExpanded} />
          </MapContainer>

        </div>
      </div>
    </div>
  );
};

export default MapCard;
