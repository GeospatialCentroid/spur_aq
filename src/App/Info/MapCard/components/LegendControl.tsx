// src/App/Info/MapCard/components/LegendControl.tsx
import React, { useEffect, useState } from "react";
import L from "leaflet";
import { useMap } from "react-leaflet";
import { zoningGroups } from "../zoning";
import { highlightFeaturesByGroup } from "../LandUseService";

/** A floating, draggable/resizable legend. Toggle button lives in map; legend lives in body. */
const LegendControl: React.FC = () => {
  const map = useMap();
  const [visible, setVisible] = useState(false);

  /** Tune spawn distance from the map’s bottom-right corner */
  const MARGIN = 4;

  /** Persisted position key */
  const POS_KEY = "legendPos_v1";

  const getSavedPos = () => {
    try {
      const raw = localStorage.getItem(POS_KEY);
      if (!raw) return null;
      const p = JSON.parse(raw);
      if (typeof p.left === "number" && typeof p.top === "number") {
        return p as { left: number; top: number };
      }
    } catch {}
    return null;
  };

  const savePos = (left: number, top: number) => {
    try {
      localStorage.setItem(POS_KEY, JSON.stringify({ left, top }));
    } catch {}
  };

  const clearSavedPos = () => {
    try {
      localStorage.removeItem(POS_KEY);
    } catch {}
  };

  useEffect(() => {
    if (!map) return;

    // --- Toggle control shown on the map ---
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

    // If legend not visible, just clean up the toggle on unmount/update.
    if (!visible) {
      return () => {
        map.removeControl(toggleCtrl);
      };
    }

    // --- Legend floating window ---
    let container: HTMLDivElement | null = null;

    const MIN_W = 220;
    const MIN_H = 140;

    const viewport = () => ({ w: window.innerWidth, h: window.innerHeight });

    const clamp = () => {
      if (!container) return;
      const { w, h } = viewport();
      const rect = container.getBoundingClientRect();
      const left = Math.min(Math.max(MARGIN, parseFloat(container.style.left || "0")), w - rect.width - MARGIN);
      const top = Math.min(Math.max(MARGIN, parseFloat(container.style.top || "0")), h - rect.height - MARGIN);
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

    // Build legend in BODY so it’s not constrained by the map
    container = document.createElement("div");
    container.className = "legend legend-floating";
    container.style.position = "fixed";
    container.style.zIndex = "99999";
    // Start hidden; we’ll place it and then reveal to avoid flicker
    container.style.visibility = "hidden";
    container.innerHTML = `
      <div class="legend-header" title="Drag to move" style="display:flex;align-items:center;gap:8px;justify-content:space-between;">
        <strong>Zones — Click to Highlight</strong>
        <span style="display:flex;gap:6px;align-items:center;">
          <button class="legend-reset" aria-label="Reset position" title="Reset position" style="cursor:pointer;border:none;background:transparent;font-size:16px;line-height:1">↺</button>
          <button class="legend-close" aria-label="Hide legend" title="Hide legend" style="cursor:pointer;border:none;background:transparent;font-size:18px;line-height:1">×</button>
        </span>
      </div>
      <div class="legend-body"></div>
      <div class="legend-resizer"></div>
    `;

    // Append BEFORE measuring
    document.body.appendChild(container);

    // Initial placement: use saved position if present; otherwise spawn near map’s bottom-right
    const saved = getSavedPos();
    const legendRect0 = container.getBoundingClientRect();
    const mapRect = map.getContainer().getBoundingClientRect();

    const initialLeft = mapRect.right - legendRect0.width - MARGIN;
    const initialTop = mapRect.bottom - legendRect0.height - MARGIN;

    let left = saved ? saved.left : initialLeft;
    let top = saved ? saved.top : initialTop;

    // Clamp to viewport
    const vw = window.innerWidth,
      vh = window.innerHeight;
    left = Math.min(Math.max(MARGIN, left), vw - legendRect0.width - MARGIN);
    top = Math.min(Math.max(MARGIN, top), vh - legendRect0.height - MARGIN);

    container.style.left = `${left}px`;
    container.style.top = `${top}px`;
    container.style.right = "";
    container.style.bottom = "";
    container.style.visibility = "visible";

    // Reset button handler
    const resetBtn = container.querySelector<HTMLButtonElement>(".legend-reset");
    resetBtn?.addEventListener("click", () => {
      if (!container) return;
      clearSavedPos();

      // Recompute from map’s bottom-right using current size
      const r0 = container.getBoundingClientRect();
      const mapRect2 = map.getContainer().getBoundingClientRect();
      let l = mapRect2.right - r0.width - MARGIN;
      let t = mapRect2.bottom - r0.height - MARGIN;

      // Clamp to viewport
      const vw2 = window.innerWidth,
        vh2 = window.innerHeight;
      l = Math.min(Math.max(MARGIN, l), vw2 - r0.width - MARGIN);
      t = Math.min(Math.max(MARGIN, t), vh2 - r0.height - MARGIN);

      container.style.left = `${l}px`;
      container.style.top = `${t}px`;
    });

    // Prevent map interactions when interacting with legend
    L.DomEvent.disableClickPropagation(container);
    L.DomEvent.disableScrollPropagation(container);

    // Build legend body
    const body = container.querySelector(".legend-body") as HTMLDivElement;
    Object.keys(zoningGroups).forEach((label) => {
      const group = zoningGroups[label];
      const item = document.createElement("div");
      item.className = "legend-item";
      item.dataset.group = label;
      item.innerHTML = `<i style="background:${group.color}"></i> ${label}`;
      body.appendChild(item);
    });

    // Click behavior: select group or clear
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

    // Dragging
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

    // Resizing (bottom-right handle)
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
      // keep within viewport
      clamp();
      // ensure we can still resize later
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

    // Size & position constraints
    capSize();
    setTimeout(clamp, 0);

    // Window resize: keep user placement if saved; otherwise re-anchor to map bottom-right
    const onResize = () => {
      capSize();
      if (!container) return;

      const savedPos = getSavedPos();
      if (savedPos) {
        const r = container.getBoundingClientRect();
        const vw2 = window.innerWidth,
          vh2 = window.innerHeight;
        let l = Math.min(Math.max(MARGIN, r.left), vw2 - r.width - MARGIN);
        let t = Math.min(Math.max(MARGIN, r.top), vh2 - r.height - MARGIN);
        container.style.left = `${l}px`;
        container.style.top = `${t}px`;
        savePos(l, t);
      } else {
        const mapRect2 = map.getContainer().getBoundingClientRect();
        const r0 = container.getBoundingClientRect();
        let l = mapRect2.right - r0.width - MARGIN;
        let t = mapRect2.bottom - r0.height - MARGIN;
        const vw2 = window.innerWidth,
          vh2 = window.innerHeight;
        l = Math.min(Math.max(MARGIN, l), vw2 - r0.width - MARGIN);
        t = Math.min(Math.max(MARGIN, t), vh2 - r0.height - MARGIN);
        container.style.left = `${l}px`;
        container.style.top = `${t}px`;
      }
    };

    window.addEventListener("resize", onResize);

    // Cleanup
    return () => {
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
