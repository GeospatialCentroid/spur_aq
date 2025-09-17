// src/map/components/MarkerCluster.tsx
import React, { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import type { Station } from "../../../../Types/config";
import { makeIconFromStation } from "../icons/stationIcons";

type Props = { stations: Station[] };

const MarkerCluster: React.FC<Props> = ({ stations }) => {
  const map = useMap();

  useEffect(() => {
    const hasMC = (L as any).markerClusterGroup;

    const cluster = hasMC
      ? (L as any).markerClusterGroup({
          zoomToBoundsOnClick: false,     // we’ll toggle spiderfy instead
          spiderfyOnMaxZoom: false,
          spiderfyDistanceMultiplier: 1.15,
          spiderLegPolylineOptions: {
            color: "#000",
            weight: 3,
            opacity: 1,
            lineCap: "round",
            lineJoin: "round",
            interactive: true,
          },
        })
      : L.layerGroup();

    // markers
    stations.forEach((s) => {
      const lat = parseFloat(s.lat);
      const lng = parseFloat(s.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

      const icon = makeIconFromStation(s);
      const m = L.marker([lat, lng], { icon }).bindPopup(
        `<h6>${s.name}</h6><p>${s.description ?? ""}</p>`
      );
      cluster.addLayer(m);
    });

    // toggle spiderfy on cluster click
    cluster.on("clusterclick", (e: any) => {
      e.originalEvent?.preventDefault?.();
      e.originalEvent?.stopPropagation?.();
      const cl = e.layer;
      if (!cl) return;
      cl._spiderfied ? cl.unspiderfy() : cl.spiderfy();
    });

    // collapse when clicking map / panning / zooming
    const collapseAll = () => (cluster as any).unspiderfy?.();
    map.on("click zoomstart movestart", collapseAll);

    // optional: collapse with ESC
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") collapseAll();
    };
    document.addEventListener("keydown", onKey);

    map.addLayer(cluster);
    return () => {
      document.removeEventListener("keydown", onKey);
      map.off("click zoomstart movestart", collapseAll);
      cluster.off("clusterclick");
      map.removeLayer(cluster);
    };
  }, [map, stations]);

  return null;
};

export default MarkerCluster;
