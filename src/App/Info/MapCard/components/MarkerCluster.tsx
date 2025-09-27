import React, { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import { customIcon } from "../mapIcon";

type Props = { stations: any[] };

const MarkerCluster: React.FC<Props> = ({ stations }) => {
  const map = useMap();

  useEffect(() => {
    const cluster = (L as any).markerClusterGroup
      ? (L as any).markerClusterGroup()
      : L.layerGroup();

    stations.forEach((s) => {
      const lat = parseFloat(s.lat);
      const lng = parseFloat(s.lng);
      if (isNaN(lat) || isNaN(lng)) return;
      const m = L.marker([lat, lng], { icon: customIcon }).bindPopup(
        `<h6>${s.name}</h6><p>${s.description}</p>`
      );
      cluster.addLayer(m);
    });

    map.addLayer(cluster);
    return () => {
      map.removeLayer(cluster);
    };
  }, [map, stations]);

  return null;
};

export default MarkerCluster;
