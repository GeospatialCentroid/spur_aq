import React, { useEffect, useState } from "react";
import L from "leaflet";
import { useMap } from "react-leaflet";
import { zoningGroups } from "../zoning";
import { highlightFeaturesByGroup } from "../LandUseService";

/** A floating, draggable/resizable legend. Toggle button lives in map; legend lives in body. */
const LegendControl: React.FC = () => {
  const map = useMap();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!map) return;

    // Toggle control
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

    let container: HTMLDivElement | null = null;
    const MARGIN = 10;
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

    if (visible) {
      // Build legend in BODY so it's not constrained by map container
      container = document.createElement("div");
      container.className = "legend legend-floating";
      container.style.position = "fixed";
      container.style.zIndex = "99999";
      container.style.right = "10px";
      container.style.bottom = "40px";
      container.innerHTML = `
        <div class="legend-header" title="Drag to move">
          <strong>Zones — Click to Highlight</strong>
          <button class="legend-close" aria-label="Hide legend" title="Hide legend">×</button>
        </div>
        <div class="legend-body"></div>
        <div class="legend-resizer"></div>
      `;

      // prevent map interactions when interacting with legend
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

      // click behavior: select group or clear
      container.addEventListener("click", (e) => {
        const closeBtn = (e.target as HTMLElement).closest(".legend-close");
        if (closeBtn) {
          L.DomEvent.stop(e);
          setVisible(false);
          return;
        }
        const item = (e.target as HTMLElement).closest(".legend-item") as HTMLElement | null;
        if (!item) return;
        const key = item.dataset.group!;
        const selected = item.classList.contains("selected-legend");
        container!.querySelectorAll(".legend-item").forEach((el) => el.classList.remove("selected-legend"));
        if (!selected) {
          item.classList.add("selected-legend");
          highlightFeaturesByGroup(key);
        } else {
          highlightFeaturesByGroup(null);
        }
      });

      // drag
      const header = container.querySelector(".legend-header") as HTMLDivElement;
      let dragging = false, sx = 0, sy = 0, sl = 0, st = 0;
      const onMove = (ev: MouseEvent) => {
        if (!dragging || !container) return;
        container.style.left = `${sl + (ev.clientX - sx)}px`;
        container.style.top = `${st + (ev.clientY - sy)}px`;
        clamp();
      };
      const onUp = () => {
        dragging = false;
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
        sx = ev.clientX; sy = ev.clientY;
        sl = r.left; st = r.top;
        document.addEventListener("mousemove", onMove);
        document.addEventListener("mouseup", onUp);
      });

      // resize
      const resizer = container.querySelector(".legend-resizer") as HTMLDivElement;
      let resizing = false, sw = 0, sh = 0;
      const onRMove = (ev: MouseEvent) => {
        if (!resizing || !container) return;
        const dx = ev.clientX - sx;
        const dy = ev.clientY - sy;
        const left = parseFloat(container.style.left || "0");
        const top = parseFloat(container.style.top || "0");
        const newW = Math.max(MIN_W, sw + dx);
        const newH = Math.max(MIN_H, sh + dy);
        container.style.width = `${newW}px`;
        container.style.height = `${newH}px`;
        // keep within viewport
        clamp();
        // ensure we can still resize later
        container.style.left = `${left}px`;
        container.style.top = `${top}px`;
      };
      const onRUp = () => {
        resizing = false;
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
        sx = ev.clientX; sy = ev.clientY;
        sw = r.width; sh = r.height;
        document.addEventListener("mousemove", onRMove);
        document.addEventListener("mouseup", onRUp);
      });

      document.body.appendChild(container);
      capSize();
      // initial clamp (just in case)
      setTimeout(clamp, 0);

      const onResize = () => {
        capSize();
        clamp();
      };
      window.addEventListener("resize", onResize);

      return () => {
        window.removeEventListener("resize", onResize);
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
        document.removeEventListener("mousemove", onRMove);
        document.removeEventListener("mouseup", onRUp);
        if (container && container.parentElement) container.parentElement.removeChild(container);
        map.removeControl(toggleCtrl);
      };
    }

    // if not visible
    return () => {
      map.removeControl(toggleCtrl);
    };
  }, [map, visible]);

  return null;
};

export default LegendControl;
