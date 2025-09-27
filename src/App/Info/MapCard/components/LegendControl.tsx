// src/App/Info/MapCard/components/LegendControl.tsx
import React, { useEffect, useState } from "react";
import L from "leaflet";
import { useMap } from "react-leaflet";
import { zoningGroups } from "../zoning";
import { highlightFeaturesByGroup } from "../LandUseService";

/**
 * LegendControl
 *  - Map control button toggles a floating Legend window.
 *  - Legend is appended to <body> so it isn't clipped by the map/card.
 *  - When the map enters fullscreen, the legend "pins" to the viewport (position:fixed)
 *    so it stays visible. Otherwise it scrolls with the page (position:absolute).
 *  - User can drag & resize; position is saved in localStorage.
 *  - Clicks on legend items call highlightFeaturesByGroup(key).
 *  - Close [×] hides the legend (toggle button brings it back).
 *  - NOTE: The reset (↺) button was intentionally removed.
 */
const LegendControl: React.FC = () => {
  const map = useMap();
  const [visible, setVisible] = useState(false);

  // --- knobs & keys ----------------------------------------------------------
  const MARGIN = 4; // min distance from viewport edges

  /**
   * v2 schema: reuse saved position only if the user moved the legend,
   * and the current window size is close to when it was saved.
   */
  const PERSIST_LEGEND = false; // ← flip to true if you ever want to remember position again
  const POS_KEY = "legendPos_v2";
  const VIEW_TOL = 120; // px tolerance for "same" viewport

  const MIN_W = 220;
  const MIN_H = 140;

  // --- persisted position helpers (v2) --------------------------------------
  type SavedPos = {
    left: number;
    top: number;
    winW: number;
    winH: number;
    userMoved?: boolean;
  };

const getSavedPos = (): SavedPos | null => {
  if (!PERSIST_LEGEND) return null; // disable reads when persistence is off
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
  if (!PERSIST_LEGEND) return; // disable writes when persistence is off
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

  useEffect(() => {
    if (!map) return;
    if (!PERSIST_LEGEND) { clearSavedPos(); } // wipe any old saved coords


    // ------------------------------------------------------------------------
    // 1) Toggle control in the map
    // ------------------------------------------------------------------------
    const ToggleLegend = L.Control.extend({
      options: { position: "bottomleft" as L.ControlPosition },
      onAdd: () => {
        const btn = L.DomUtil.create("button", "toggle-legend-btn") as HTMLButtonElement;
        btn.textContent = visible ? "Hide Legend" : "Show Legend";
        btn.style.background = "white";
        btn.style.padding = "6px 8px";
        btn.style.cursor = "pointer";
        btn.style.border = "1px solid #ccc";
        btn.style.borderRadius = "3px";
        L.DomEvent.disableClickPropagation(btn);
        L.DomEvent.on(btn, "click", (ev: any) => {
          L.DomEvent.stop(ev);
          btn.textContent = visible ? "Show Legend" : "Hide Legend";
          setVisible((v) => !v);
        });
        return btn;
      },
    });
    const toggleCtrl = new (ToggleLegend as any)();
    map.addControl(toggleCtrl);

    if (!visible) {
      return () => {
        map.removeControl(toggleCtrl);
      };
    }

    // ------------------------------------------------------------------------
    // 2) Build the floating legend in <body>
    // ------------------------------------------------------------------------
    let container: HTMLDivElement | null = document.createElement("div");
    container.className = "legend legend-floating";
    container.style.position = "absolute";
    // NOTE: z-index is set dynamically below so the header always stays above.
    container.style.visibility = "hidden";

    container.innerHTML = `
      <div class="legend-header" title="Drag to move" style="display:flex;align-items:center;gap:8px;justify-content:space-between;">
        <strong>Zones — Click to Highlight</strong>
        <span style="display:flex;gap:6px;align-items:center;">
          <button class="legend-close" aria-label="Hide legend" title="Hide legend" style="cursor:pointer;border:none;background:transparent;font-size:18px;line-height:1">×</button>
        </span>
      </div>
      <div class="legend-body"></div>
      <!-- Footer holds the visual resizer inline with the scrollbar arrows -->
      <div class="legend-footer">
        <div class="legend-resizer" title="Resize"></div>
      </div>
    `;

    document.body.appendChild(container);

    // --- utilities -----------------------------------------------------------
    const viewport = () => ({ w: window.innerWidth, h: window.innerHeight });

    const isFs = () =>
      map.getContainer().classList.contains("map-fullscreen") ||
      document.body.classList.contains("map-fullscreen-active");

    function headerSafeTop(): number {
      const header = document.querySelector(".app-header") as HTMLElement | null;
      if (!header) return MARGIN;
      const h = header.getBoundingClientRect().height || 0;
      return Math.max(MARGIN, Math.round(h) + 8);
    }

    // NEW: compute header z-index and keep legend *below* it
    function headerZ(): number {
      const header =
        (document.querySelector(".app-header") as HTMLElement | null) ||
        (document.querySelector(".site-header") as HTMLElement | null) ||
        (document.querySelector(".navbar") as HTMLElement | null) ||
        (document.querySelector("header") as HTMLElement | null);
      const zi = header ? parseInt(getComputedStyle(header).zIndex || "0", 10) : 0;
      // Fall back to a high value if header's z-index is not set/auto
      return Number.isFinite(zi) && zi > 0 ? zi : 10000;
    }

    function applyLayering() {
      if (!container) return;
      const z = Math.max(1, headerZ() - 1);
      container.style.zIndex = String(z);
    }

    // Clamp within viewport (respect header when not fullscreen)
    function clamp() {
      if (!container) return;
      const { w, h } = viewport();
      const rect = container.getBoundingClientRect();
      const minTop = isFs() ? MARGIN : headerSafeTop();
      const left = Math.min(Math.max(MARGIN, parseFloat(container.style.left || "0")), w - rect.width - MARGIN);
      const top = Math.min(Math.max(minTop, parseFloat(container.style.top || "0")), h - rect.height - MARGIN);
      container.style.left = `${left}px`;
      container.style.top = `${top}px`;
    }

    function capSize() {
      if (!container) return;
      const { w, h } = viewport();
      const maxW = Math.max(MIN_W, Math.floor(w * 0.6));
      const maxH = Math.max(MIN_H, Math.floor(h * 0.6));
      container.style.maxWidth = `${maxW}px`;
      container.style.maxHeight = `${maxH}px`;
    }

    function anchorToMap() {
      if (!container) return;
      const r0 = container.getBoundingClientRect();
      const mapRect = map.getContainer().getBoundingClientRect();
      const { w, h } = viewport();
      const minTop = isFs() ? MARGIN : headerSafeTop();
      let l = mapRect.right - r0.width - MARGIN;
      let t = mapRect.bottom - r0.height - MARGIN;
      l = Math.min(Math.max(MARGIN, l), w - r0.width - MARGIN);
      t = Math.min(Math.max(minTop, t), h - r0.height - MARGIN);
      container.style.left = `${l}px`;
      container.style.top = `${t}px`;
    }

    function setPinned(isFixed: boolean) {
      if (!container) return;
      container.classList.toggle("fixed", isFixed);
      container.style.position = isFixed ? "fixed" : "absolute";
      applyLayering(); // keep legend under header in both modes
      clamp();
    }

    // ------------------------------------------------------------------------
    // 3) Initial placement
    // ------------------------------------------------------------------------
    // 3) Initial placement
    const saved = PERSIST_LEGEND ? getSavedPos() : null;
    const legendRect0 = container.getBoundingClientRect();
    const mapRect = map.getContainer().getBoundingClientRect();
    const initialLeft = mapRect.right - legendRect0.width - MARGIN;
    const initialTop = mapRect.bottom - legendRect0.height - MARGIN;

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

    // ensure layering from the start
    applyLayering();

    // Establish fullscreen state and ensure mode matches immediately
    const mapEl = map.getContainer();
    const bodyEl = document.body;
    let wasFullscreen =
      mapEl.classList.contains("map-fullscreen") ||
      bodyEl.classList.contains("map-fullscreen-active");
    setPinned(wasFullscreen);

    // ------------------------------------------------------------------------
    // 4) Legend content & interactions
    // ------------------------------------------------------------------------
    L.DomEvent.disableClickPropagation(container);
    L.DomEvent.disableScrollPropagation(container);

    const body = container.querySelector(".legend-body") as HTMLDivElement;
    Object.keys(zoningGroups).forEach((label) => {
      const group = zoningGroups[label];
      const item = document.createElement("div");
      item.className = "legend-item";
      item.dataset.group = label;
      item.innerHTML = `<i style="background:${group.color}"></i> ${label}`;
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

    // --- Dragging
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

    // --- Resizing
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

    // --- init / constraints
    capSize();
    setTimeout(() => {
      applyLayering();
      clamp();
    }, 0);

    // Window resize: keep placement or re-anchor
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

    // Fullscreen transitions
    const onFullscreenClassChange = () => {
      const nowFs =
        mapEl.classList.contains("map-fullscreen") ||
        bodyEl.classList.contains("map-fullscreen-active");
      setPinned(nowFs);
      if (wasFullscreen && !nowFs) {
        clearSavedPos();
        anchorToMap();
        requestAnimationFrame(() => {
          requestAnimationFrame(() => anchorToMap());
        });
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
      map.removeControl(toggleCtrl);
    };
  }, [map, visible]);

  return null;
};

export default LegendControl;
