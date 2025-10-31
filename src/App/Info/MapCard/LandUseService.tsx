import L from "leaflet";
import { getGroupByCode, groupLabelByGroup, zoningGroups } from "./zoning";
import i18n from "i18next";

/** --- State shared with the Legend & layer component --- */
let featureLayer: L.GeoJSON<any> | null = null;
let clickedLayer: L.Path | null = null;
let currentHighlightGroup: string | null = null;

/** Presence listeners so other components (Legend) can react to add/remove */
type PresenceCb = (present: boolean) => void;
const landUseListeners = new Set<PresenceCb>();

function notifyPresence() {
  const present = !!featureLayer;
  landUseListeners.forEach((cb) => {
    try {
      cb(present);
    } catch {}
  });
}

/** Called by LandUseLayer when it mounts/unmounts */
export function setFeatureLayer(layer: L.GeoJSON<any> | null) {
  featureLayer = layer;
  notifyPresence();
}

/** Query presence (used to initialize UI state) */
export function isLandUsePresent(): boolean {
  return !!featureLayer;
}

/** Subscribe to presence changes; returns a VOID cleanup (for React) */
export function onLandUsePresent(cb: PresenceCb): () => void {
  landUseListeners.add(cb);
  return () => {
    landUseListeners.delete(cb);
  }; // return void, not boolean
}

/** Popup + click highlight per feature */
export function onEachFeature(feature: any, layer: L.Layer) {
  const code = feature?.properties?.ZONE_DISTRICT || "Unknown";
  const group = getGroupByCode(code);
  const label = groupLabelByGroup(group);

  (layer as any).bindPopup(
    `<strong>${label}</strong><br>${i18n.t("MAP.POPUP.ZONE_CODE")}: ${code}`
  );

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

/** Legend highlight */
export function highlightFeaturesByGroup(groupKey: string | null) {
  currentHighlightGroup = groupKey === currentHighlightGroup ? null : groupKey;
  const selectedCodes =
    (currentHighlightGroup && zoningGroups[currentHighlightGroup]?.codes) || [];

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

/** Default polygon style */
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
