// src/App/Info/MapCard/components/LegendControl.tsx
import React, { useEffect, useState } from "react";
import L from "leaflet";
import { useTranslation } from "react-i18next";
import { useMap } from "react-leaflet";
import { zoningGroups } from "../zoning";
import {
  highlightFeaturesByGroup,
  isLandUsePresent,
  onLandUsePresent,
} from "../LandUseService";

const MARGIN = 4;
const PERSIST_LEGEND = false; // flip to true to remember legend position
const POS_KEY = "legendPos_v2";
const VIEW_TOL = 120;
const MIN_W = 220;
const MIN_H = 140;

type SavedPos = {
  left: number;
  top: number;
  winW: number;
  winH: number;
  userMoved?: boolean;
};

const getSavedPos = (): SavedPos | null => {
  if (!PERSIST_LEGEND) return null;
  try {
    const raw = localStorage.getItem(POS_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as Partial<SavedPos>;
    if (!p || !p.userMoved) return null;
    if (
      typeof p.left === "number" &&
      typeof p.top === "number" &&
      typeof p.winW === "number" &&
      typeof p.winH === "number"
    ) {
      const dw = Math.abs(window.innerWidth - p.winW);
      const dh = Math.abs(window.innerHeight - p.winH);
      if (dw <= VIEW_TOL && dh <= VIEW_TOL) return p as SavedPos;
    }
  } catch {}
  return null;
};

const savePos = (left: number, top: number) => {
  if (!PERSIST_LEGEND) return;
  try {
    const payload: SavedPos = {
      left,
      top,
      winW: window.innerWidth,
      winH: window.innerHeight,
      userMoved: true,
    };
    localStorage.setItem(POS_KEY, JSON.stringify(payload));
  } catch {}
};

const clearSavedPos = () => {
  try {
    localStorage.removeItem(POS_KEY);
  } catch {}
};

const getAttributionHeight = (): number => {
  const attr = document.querySelector(".leaflet-control-attribution") as HTMLElement | null;
  if (!attr) return 0;
  const r = attr.getBoundingClientRect();
  // +4px breathing room
  return Math.max(0, Math.round(r.height)) + 4;
};


const LegendControl: React.FC = () => {
  const map = useMap();
  const { t, i18n } = useTranslation("map");
  const [visible, setVisible] = useState(false);
  const [landUseAvailable, setLandUseAvailable] = useState<boolean>(false);

  // Sync with Land Use overlay presence
  useEffect(() => {
    setLandUseAvailable(isLandUsePresent());
    const off = onLandUsePresent((present: boolean) => {
      setLandUseAvailable(present);
      if (!present) setVisible(false); // auto-close if layer vanishes
    });
    return off;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!map) return;
    if (!PERSIST_LEGEND) clearSavedPos();

    // If Land Use isn't available, mount nothing (no button, no legend)
    if (!landUseAvailable) return;

  // Attribution height scoped to THIS map instance
  const getAttrHeight = (): number => {
    const attr = map.getContainer().querySelector(".leaflet-control-attribution") as HTMLElement | null;
    if (!attr) return 0;
    const r = attr.getBoundingClientRect();
    return Math.max(0, Math.round(r.height)) + 4; // +4 breathing room
};


    // --- Leaflet toggle control (appears only when Land Use is available) ---
   const ToggleLegend = L.Control.extend({
  options: { position: "bottomright" as L.ControlPosition },

  onAdd: () => {
    const btn = L.DomUtil.create("button", "toggle-legend-btn") as HTMLButtonElement;
    btn.textContent = String(t("MAP.ACTIONS.SHOW_LEGEND"));
    btn.style.background = "white";
    btn.style.padding = "6px 8px";
    btn.style.cursor = "pointer";
    btn.style.border = "1px solid #ccc";
    btn.style.borderRadius = "3px";

    // Reset default control margins and set our own
    btn.style.margin = "0";
    btn.style.marginRight = "10px";
    btn.style.display = "block"; 


    // Fixed gap from the bottom-right corner (does not follow attribution now)
    const GAP_PX = 6;
    const bump = () => {
      btn.style.marginBottom = `${GAP_PX}px`;
    };

    bump();
    requestAnimationFrame(bump);
    setTimeout(bump, 150);

    const onR = () => bump();
    window.addEventListener("resize", onR);

    L.DomEvent.disableClickPropagation(btn);
    L.DomEvent.on(btn, "click", (ev: any) => {
      L.DomEvent.stop(ev);
      setVisible(true);
    });

    // Keep a handle for cleanup
    (btn as any).__onResize = onR;
    return btn;
  },
  onRemove: function (_mapInstance: L.Map) {
    const el = (this as any)._container as HTMLButtonElement | undefined;
    if (!el) return;
    const fn = (el as any).__onResize as (() => void) | undefined;
    if (fn) window.removeEventListener("resize", fn);
  },

});


    // Only mount the toggle when legend is hidden
    let toggleCtrl: L.Control | null = null;
    if (!visible) {
      toggleCtrl = new (ToggleLegend as any)() as L.Control;
      map.addControl(toggleCtrl);
    return () => {
      if (toggleCtrl) map.removeControl(toggleCtrl);
    };
    }


    // --- Floating legend in <body> (only when visible) ---
    let container: HTMLDivElement | null = document.createElement("div");
    container.className = "legend legend-floating";
    container.style.position = "absolute";
    container.style.visibility = "hidden";

    container.innerHTML = `
      <div class="legend-header" title="${String(t("MAP.LEGEND.DRAG_HINT"))}"
          style="display:flex;align-items:center;gap:8px;justify-content:space-between;">
        <strong>${String(t("MAP.LEGEND.HEADER"))}</strong>
        <span style="display:flex;gap:6px;align-items:center;">
          <button class="legend-close"
                  aria-label="${String(t("MAP.ACTIONS.HIDE_LEGEND"))}"
                  title="${String(t("MAP.ACTIONS.HIDE_LEGEND"))}"
                  style="cursor:pointer;border:none;background:transparent;font-size:18px;line-height:1">×</button>
        </span>
      </div>
      <div class="legend-body"></div>
      <div class="legend-footer">
        <div class="legend-resizer" title="${String(t("MAP.LEGEND.RESIZE"))}"></div>
      </div>
    `;

    document.body.appendChild(container);

    const viewport = () => ({ w: window.innerWidth, h: window.innerHeight });
    const isFs = () =>
      map.getContainer().classList.contains("map-fullscreen") ||
      document.body.classList.contains("map-fullscreen-active");

    const headerEl =
      (document.querySelector(".app-header") as HTMLElement | null) ||
      (document.querySelector(".site-header") as HTMLElement | null) ||
      (document.querySelector(".navbar") as HTMLElement | null) ||
      (document.querySelector("header") as HTMLElement | null);

    const headerSafeTop = () => {
      if (!headerEl) return MARGIN;
      const h = headerEl.getBoundingClientRect().height || 0;
      return Math.max(MARGIN, Math.round(h) + 8);
    };

    const headerZ = () => {
      const zi = headerEl ? parseInt(getComputedStyle(headerEl).zIndex || "0", 10) : 0;
      return Number.isFinite(zi) && zi > 0 ? zi : 10000;
    };

    const applyLayering = () => {
      if (!container) return;
      const z = Math.max(1, headerZ() - 1);
      container.style.zIndex = String(z);
    };

    const clamp = () => {
      if (!container) return;
      const { w, h } = viewport();
      const rect = container.getBoundingClientRect();
      const minTop = isFs() ? MARGIN : headerSafeTop();
      const left = Math.min(Math.max(MARGIN, parseFloat(container.style.left || "0")), w - rect.width - MARGIN);
      const bottomSafe = h - rect.height - MARGIN - getAttrHeight() - 18;
      const top = Math.min(Math.max(minTop, parseFloat(container.style.top || "0")), bottomSafe);

      container.style.left = `${left}px`;
      container.style.top = `${top}px`;
    };

    const capSize = () => {
      if (!container) return;
      const { w, h } = viewport();
      const maxW = Math.max(MIN_W, Math.floor(w * 0.6));
      const maxH = Math.max(MIN_H, Math.floor(h * 0.6));
      container.style.maxWidth = `${maxW}px`;
      container.style.maxHeight = `${maxH}px`;
    };

    const anchorToMap = () => {
      if (!container) return;
      const r0 = container.getBoundingClientRect();
      const mapRect = map.getContainer().getBoundingClientRect();
      const { w, h } = viewport();
      const minTop = isFs() ? MARGIN : headerSafeTop();
      let l = mapRect.right - r0.width - MARGIN;
      let t = mapRect.bottom - r0.height - MARGIN - getAttrHeight() - 18;

      l = Math.min(Math.max(MARGIN, l), w - r0.width - MARGIN);
      t = Math.min(Math.max(minTop, t), h - r0.height - MARGIN);
      container.style.left = `${l}px`;
      container.style.top = `${t}px`;
    };

    const setPinned = (fixed: boolean) => {
      if (!container) return;
      container.classList.toggle("fixed", fixed);
      container.style.position = fixed ? "fixed" : "absolute";
      applyLayering();
      clamp();
    };

    // initial placement
    const saved = PERSIST_LEGEND ? getSavedPos() : null;
    const legendRect0 = container.getBoundingClientRect();
    const mapRect = map.getContainer().getBoundingClientRect();
    const initialLeft = mapRect.right - legendRect0.width - MARGIN;
    const initialTop  = mapRect.bottom - legendRect0.height - MARGIN - getAttrHeight() - 18;


    let left = saved ? saved.left : initialLeft;
    let top = saved ? saved.top : initialTop;
    const { w: vw, h: vh } = viewport();
    left = Math.min(Math.max(MARGIN, left), vw - legendRect0.width - MARGIN);
    top = Math.min(Math.max(isFs() ? MARGIN : headerSafeTop(), top), vh - legendRect0.height - MARGIN);

    container.style.left = `${left}px`;
    container.style.top = `${top}px`;
    container.style.right = "";
    container.style.bottom = "";
    container.style.visibility = "visible";
    applyLayering();

    // fullscreen sync
    const mapEl = map.getContainer();
    const bodyEl = document.body;
    let wasFullscreen =
      mapEl.classList.contains("map-fullscreen") ||
      bodyEl.classList.contains("map-fullscreen-active");
    setPinned(wasFullscreen);

    // content & interactions
    L.DomEvent.disableClickPropagation(container);
    L.DomEvent.disableScrollPropagation(container);

    const body = container.querySelector(".legend-body") as HTMLDivElement;

    Object.keys(zoningGroups).forEach((label) => {
      const group = zoningGroups[label];
      const item = document.createElement("div");
      item.className = "legend-item";
      item.dataset.group = label;

      // Force a string + provide a fallback if the key is missing
      const translated = String(t(`MAP.ZONES.${label}`, { defaultValue: label }));

      item.innerHTML = `<i style="background:${group.color}"></i> ${translated}`;
      body.appendChild(item);
    });


    container.addEventListener("click", (e) => {
      const closeBtn = (e.target as HTMLElement).closest(".legend-close");
      if (closeBtn) {
        L.DomEvent.stop(e);
        setVisible(false);
        return;
      }
      const it = (e.target as HTMLElement).closest(".legend-item") as HTMLElement | null;
      if (!it) return;
      const key = it.dataset.group!;
      const selected = it.classList.contains("selected-legend");
      container!.querySelectorAll(".legend-item").forEach((el) => el.classList.remove("selected-legend"));
      if (!selected) {
        it.classList.add("selected-legend");
        highlightFeaturesByGroup(key);
      } else {
        highlightFeaturesByGroup(null);
      }
    });

    // dragging
    const header = container.querySelector(".legend-header") as HTMLDivElement;
    let dragging = false,
      sx = 0,
      sy = 0,
      sl = 0,
      st = 0;
    const onMove = (ev: MouseEvent) => {
      if (!dragging || !container) return;
      container.style.left = `${sl + (ev.clientX - sx)}px`;
      container.style.top = `${st + (ev.clientY - sy)}px`;
      clamp();
    };
    const onUp = () => {
      dragging = false;
      if (container) {
        const r = container.getBoundingClientRect();
        savePos(r.left, r.top);
      }
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
    header.addEventListener("mousedown", (ev) => {
      if ((ev.target as HTMLElement).closest(".legend-close")) return;
      const r = container!.getBoundingClientRect();
      container!.style.left = `${r.left}px`;
      container!.style.top = `${r.top}px`;
      container!.style.right = "";
      container!.style.bottom = "";
      dragging = true;
      sx = ev.clientX;
      sy = ev.clientY;
      sl = r.left;
      st = r.top;
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    });

    // resizing
    const resizer = container.querySelector(".legend-resizer") as HTMLDivElement;
    let resizing = false,
      sw = 0,
      sh = 0;
    const onRMove = (ev: MouseEvent) => {
      if (!resizing || !container) return;
      const dx = ev.clientX - sx;
      const dy = ev.clientY - sy;
      const leftNow = parseFloat(container.style.left || "0");
      const topNow = parseFloat(container.style.top || "0");
      const newW = Math.max(MIN_W, sw + dx);
      const newH = Math.max(MIN_H, sh + dy);
      container.style.width = `${newW}px`;
      container.style.height = `${newH}px`;
      clamp();
      container.style.left = `${leftNow}px`;
      container.style.top = `${topNow}px`;
    };
    const onRUp = () => {
      resizing = false;
      if (container) {
        const r = container.getBoundingClientRect();
        savePos(r.left, r.top);
      }
      document.removeEventListener("mousemove", onRMove);
      document.removeEventListener("mouseup", onRUp);
    };
    resizer.addEventListener("mousedown", (ev) => {
      ev.preventDefault();
      const r = container!.getBoundingClientRect();
      container!.style.left = `${r.left}px`;
      container!.style.top = `${r.top}px`;
      container!.style.right = "";
      container!.style.bottom = "";
      resizing = true;
      sx = ev.clientX;
      sy = ev.clientY;
      sw = r.width;
      sh = r.height;
      document.addEventListener("mousemove", onRMove);
      document.addEventListener("mouseup", onRUp);
    });

    // init / constraints
    const capAndClamp = () => {
      capSize();
      applyLayering();
      clamp();
    };
    capAndClamp();

    const onResize = () => {
      capSize();
      applyLayering();
      if (!container) return;
      if (PERSIST_LEGEND && getSavedPos()) {
        const r = container.getBoundingClientRect();
        const { w, h } = viewport();
        let l = Math.min(Math.max(MARGIN, r.left), w - r.width - MARGIN);
        let t = Math.min(Math.max(isFs() ? MARGIN : headerSafeTop(), r.top), h - r.height - MARGIN);
        container.style.left = `${l}px`;
        container.style.top = `${t}px`;
        savePos(l, t);
      } else {
        anchorToMap();
      }
    };
    window.addEventListener("resize", onResize);

    const onFullscreenClassChange = () => {
      const nowFs =
        mapEl.classList.contains("map-fullscreen") ||
        bodyEl.classList.contains("map-fullscreen-active");
      setPinned(nowFs);
      if (wasFullscreen && !nowFs) {
        // reset placement when exiting fullscreen
        anchorToMap();
        requestAnimationFrame(() => requestAnimationFrame(anchorToMap));
        setTimeout(anchorToMap, 200);
      }
      wasFullscreen = nowFs;
    };
    const mo = new MutationObserver(onFullscreenClassChange);
    mo.observe(mapEl, { attributes: true, attributeFilter: ["class"] });
    mo.observe(bodyEl, { attributes: true, attributeFilter: ["class"] });

    const ro = new ResizeObserver(() => {
      if (!getSavedPos()) anchorToMap();
    });
    ro.observe(mapEl);

    // Cleanup
    return () => {
      mo.disconnect();
      ro.disconnect();
      window.removeEventListener("resize", onResize);
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      document.removeEventListener("mousemove", onRMove);
      document.removeEventListener("mouseup", onRUp);
      if (container && container.parentElement) container.parentElement.removeChild(container);
      if (toggleCtrl) map.removeControl(toggleCtrl);
    };
  }, [map, visible, landUseAvailable, i18n.language]);

  return null;
};

export default LegendControl;
