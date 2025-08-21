import React, { useEffect } from "react";
import { useMap } from "react-leaflet";

const ResizeMapOnExpand: React.FC<{ trigger: boolean }> = ({ trigger }) => {
  const map = useMap();
  useEffect(() => {
    if (trigger) {
      setTimeout(() => map.invalidateSize(), 300);
    }
  }, [trigger, map]);
  return null;
};

export default ResizeMapOnExpand;
