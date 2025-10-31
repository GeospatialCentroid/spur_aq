import React, { useEffect } from "react";
import L from "leaflet";
import { useMap } from "react-leaflet";
import { useTranslation } from "react-i18next";

type Props = {
  expanded: boolean;
  setExpanded: React.Dispatch<React.SetStateAction<boolean>>;
};

const ExpandControl: React.FC<Props> = ({ expanded, setExpanded }) => {
  const map = useMap();
  const { t, i18n } = useTranslation("map");

  useEffect(() => {
    const Expand = L.Control.extend({
      options: { position: "topleft" as L.ControlPosition },
      onAdd: function () {
        const c = L.DomUtil.create("div", "leaflet-bar leaflet-control map-expand-button");
        L.DomEvent.disableClickPropagation(c);
        c.style.cursor = "pointer";
        c.title = expanded
          ? (t("MAP.ACTIONS.COLLAPSE_MAP") as string)
          : (t("MAP.ACTIONS.EXPAND_MAP") as string);

        c.innerHTML = `
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            ${
              expanded
                ? '<polyline points="15 9 9 15" /><path d="M9 9h6v6" />'
                : '<path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M16 3h3a2 2 0 0 1 2 2v3"/><path d="M8 21H5a2 2 0 0 1-2-2v-3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/>'
            }
          </svg>
        `;
        c.onclick = () => setExpanded((p) => !p);
        return c;
      },
    });

    const ctrl = new (Expand as any)();
    map.addControl(ctrl);
    return () => {
      map.removeControl(ctrl);
    };
  }, [map, expanded, setExpanded, i18n.language]);


  return null;
};

export default ExpandControl;
