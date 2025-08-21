import L from "leaflet";
import { getGroupByCode, groupLabelByGroup, zoningGroups } from "./zoning";

let featureLayer: L.GeoJSON<any> | null = null;
let clickedLayer: L.Path | null = null;
let currentHighlightGroup: string | null = null;

export function setFeatureLayer(layer: L.GeoJSON<any> | null) {
  featureLayer = layer;
}

export function onEachFeature(feature: any, layer: L.Layer) {
  const code = feature?.properties?.ZONE_DISTRICT || "Unknown";
  const group = getGroupByCode(code);
  const label = groupLabelByGroup(group);

  (layer as any).bindPopup(`<strong>${label}</strong><br>Zone Code: ${code}`);

  (layer as any).on("click", () => {
    if (clickedLayer && featureLayer) {
      featureLayer.resetStyle(clickedLayer);
    }
    clickedLayer = layer as L.Path;
    clickedLayer.setStyle({
      weight: 2,
      color: "#000",
      dashArray: "",
      fillOpacity: 0.6,
    });
    if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
      clickedLayer.bringToFront();
    }
  });
}

export function highlightFeaturesByGroup(groupKey: string | null) {
  currentHighlightGroup = groupKey === currentHighlightGroup ? null : groupKey;
  const selectedCodes =
    currentHighlightGroup && zoningGroups[currentHighlightGroup]?.codes || [];

  if (!featureLayer) return;

  featureLayer.setStyle((feature: any) => {
    if (!feature) return {};
    const fullCode = feature.properties?.ZONE_DISTRICT || "";
    const match = fullCode.match(/^[A-Z]+-([A-Z]+)-/);
    const useType = match ? match[1] : fullCode;
    const isMatch = selectedCodes.includes(useType);

    const group = getGroupByCode(fullCode);
    const color = group?.color || "#cccccc";

    return {
      fillColor: color,
      fillOpacity: currentHighlightGroup ? (isMatch ? 0.9 : 0.2) : 0.6,
      color: isMatch ? "#000" : "#666",
      weight: isMatch ? 2 : 0.5,
    } as L.PathOptions;
  });
}

export function defaultStyle(feature?: any): L.PathOptions {
  const fullCode = feature?.properties?.ZONE_DISTRICT as string | undefined;
  const group = getGroupByCode(fullCode || "");
  return {
    fillColor: group?.color || "#cccccc",
    color: "#666",
    weight: 0.5,
    fillOpacity: 0.6,
  };
}
