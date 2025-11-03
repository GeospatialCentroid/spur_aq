import i18n from "i18next";
import { initReactI18next } from "react-i18next";

// English
import enCommon from "./locales/en/common.json";
import enInfo from "./locales/en/info.json";
import enMap from "./locales/en/map.json";
import enRecent from "./locales/en/recent.json";
import enGraph from "./locales/en/graph.json";

// Spanish
import esCommon from "./locales/es/common.json";
import esInfo from "./locales/es/info.json";
import esMap from "./locales/es/map.json";
import esRecent from "./locales/es/recent.json";
import esGraph from "./locales/es/graph.json";

void i18n
  .use(initReactI18next)
  .init({
    lng: "en",                  // default language
    fallbackLng: "en",
    ns: ["common", "info", "map", "recent", "graph"],
    defaultNS: "common",
    resources: {
      en: { common: enCommon, info: enInfo, map: enMap, recent: enRecent, graph: enGraph },
      es: { common: esCommon, info: esInfo, map: esMap, recent: esRecent, graph: esGraph },
    },
    interpolation: { escapeValue: false },
    returnNull: false,
  });

export default i18n;
