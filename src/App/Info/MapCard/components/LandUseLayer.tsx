import React, { useEffect } from "react";
import { useMap } from "react-leaflet";
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
  const response = await fetch(`${layerUrl}?${params.toString()}`);
  const data = await response.json();
  return data.count as number;
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
  return data.features as any[];
}

async function fetchAllFeatures() {
  const maxPerRequest = 2000;
  const totalCount = await getTotalFeatureCount();
  let all: any[] = [];
  for (let offset = 0; offset < totalCount; offset += maxPerRequest) {
    const count = Math.min(maxPerRequest, totalCount - offset);
    const features = await fetchFeatures(offset, count);
    all = all.concat(features);
  }
  return all;
}

const LandUseLayer: React.FC<Props> = ({ onLoaded }) => {
  const map = useMap();

  useEffect(() => {
    let mounted = true;
    let layer: L.GeoJSON | null = null;

    (async () => {
      const features = await fetchAllFeatures();
      if (!mounted) return;

      const geoJson = { type: "FeatureCollection" as const, features };

      layer = L.geoJSON(geoJson, {
        style: defaultStyle as any,
        onEachFeature,
      }).addTo(map);

      setFeatureLayer(layer);
      onLoaded?.();
    })();

    return () => {
      mounted = false;
      if (layer) {
        map.removeLayer(layer);
      }
      setFeatureLayer(null);
    };
  }, [map, onLoaded]);

  return null;
};

export default LandUseLayer;
