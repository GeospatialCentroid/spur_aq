import React, { useEffect, useMemo, useRef, useState } from "react";
import { GeoJSON, useMap } from "react-leaflet";
import L from "leaflet";
import { defaultStyle, onEachFeature, setFeatureLayer } from "../LandUseService";

type Props = {
  onLoaded?: () => void;
};

const layerUrl =
  "https://services1.arcgis.com/zdB7qR0BtYrg0Xpl/arcgis/rest/services/ODC_ZONE_ZONING_A/FeatureServer/209/query";

async function getTotalFeatureCount() {
  const params = new URLSearchParams({
    where: "1=1",
    returnCountOnly: "true",
    f: "json",
  });
  const res = await fetch(`${layerUrl}?${params.toString()}`);
  const data = await res.json();
  return data.count as number;
}

async function fetchFeatures(offset: number, count: number) {
  const params = new URLSearchParams({
    where: "1=1",
    outFields: "*",
    f: "geojson",
    resultOffset: String(offset),
    resultRecordCount: String(count),
  });
  const res = await fetch(`${layerUrl}?${params.toString()}`);
  const data = await res.json();
  return data.features as any[];
}

async function fetchAllFeatures() {
  const maxPerRequest = 2000;
  const total = await getTotalFeatureCount();
  const all: any[] = [];
  for (let offset = 0; offset < total; offset += maxPerRequest) {
    const count = Math.min(maxPerRequest, total - offset);
    const chunk = await fetchFeatures(offset, count);
    all.push(...chunk);
  }
  return all;
}

const LandUseLayer: React.FC<Props> = ({ onLoaded }) => {
  const map = useMap();
  const [fc, setFc] = useState<GeoJSON.FeatureCollection | null>(null);

  // keep a ref to the live L.GeoJSON layer so LegendService can restyle
  const layerRef = useRef<L.GeoJSON<any> | null>(null);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const features = await fetchAllFeatures();
        if (!alive) return;
        setFc({ type: "FeatureCollection", features } as any);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("Failed to load land-use features:", e);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  // whenever the GeoJSON ref changes, register it for highlight/reset helpers
useEffect(() => {
  return () => setFeatureLayer(null);
}, []);

  // Ensure the map relayouts once data is ready (helps after initial mount)
  useEffect(() => {
    if (!fc) return;
    // slight delay to let tiles/layout settle
    setTimeout(() => map.invalidateSize(), 0);
    onLoaded?.();
  }, [fc, map, onLoaded]);

  if (!fc) return null;

  return (
    <GeoJSON
      data={fc as any}
      style={defaultStyle as any}
      onEachFeature={onEachFeature as any}
      ref={(instance) => {
        layerRef.current = (instance as unknown as L.GeoJSON) || null;
      }}
      eventHandlers={{
        add: () => {
          // Overlay got added (checked ON)
          setFeatureLayer(layerRef.current);
          onLoaded?.(); // keep your hook if you want this signal on first add
        },
        remove: () => {
          // Overlay got removed (checked OFF)
          setFeatureLayer(null);
        },
      }}
    />
  );
};

export default LandUseLayer;
