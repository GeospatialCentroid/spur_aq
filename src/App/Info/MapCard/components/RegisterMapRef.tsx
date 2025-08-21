import React, { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";

const RegisterMapRef: React.FC<{ mapRef: React.MutableRefObject<L.Map | null> }> = ({ mapRef }) => {
  const map = useMap();
  useEffect(() => {
    mapRef.current = map;
    return () => {
      mapRef.current = null;
    };
  }, [map, mapRef]);
  return null;
};

export default RegisterMapRef;
