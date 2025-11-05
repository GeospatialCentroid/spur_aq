export type ZoningGroup = { codes: string[]; color: string };

export const zoningGroups: Record<string, ZoningGroup> = {
  "Single Unit (SU)": { codes: ["SU"], color: "#FFFBD5" },
  "Two Unit (TU)": { codes: ["TU"], color: "#FFF45A" },
  "Multi Unit (MU, RH, RO)": { codes: ["MU", "RH", "RO"], color: "#FFC94B" },
  "Residential Mixed Use (RX)": { codes: ["RX"], color: "#E5A64D" },
  "Commercial Corridor (CC)": { codes: ["CC"], color: "#F4B4A9" },
  "Mixed Use (MX, M-GMX)": { codes: ["MX", "M-GMX"], color: "#E88A8A" },
  "Main Street (MS)": { codes: ["MS"], color: "#E55A50" },
  "Cherry Creek North (C-CCN)": { codes: ["C-CCN"], color: "#FF5C9C" },
  "Downtown (AS, C, CPV, GT, LD, TD)": { codes: ["AS", "C", "CPV", "GT", "LD", "TD"], color: "#C75A4A" },
  "Downtown - Civic (D-CV)": { codes: ["D-CV"], color: "#5C8EEB" },

  "Industrial - Light (I-A)": { codes: ["I-A"], color: "#E5D9FA" },
  "Industrial - General (I-B)": { codes: ["I-B"], color: "#CBB2F5" },
  "Industrial - Mixed Use (I-MX, M-IMX)": { codes: ["I-MX", "M-IMX"], color: "#C38AF3" },

  "Campus (EI, EI2, ENT, H, H2, NWC)": { codes: ["EI", "EI2", "ENT", "H", "H2", "NWC"], color: "#BED2FF" },
  "Special (O-1)": { codes: ["O-1"], color: "#8DD08A" },

  "Open Space - Public Parks (OS-A)": { codes: ["OS-A"], color: "#A1EAA0" },
  "Open Space - Recreation (OS-B)": { codes: ["OS-B"], color: "#B6D592" },
  "Open Space - Conservation (OS-C)": { codes: ["OS-C"], color: "#88C590" },

  "Airport (DIA)": { codes: ["DIA"], color: "#92C4F0" },
  "Planned Unit Development (PUD-D, PUD-G)": { codes: ["PUD-D", "PUD-G"], color: "#D8D67A" },
  "Former Chapter 59 Zone": { codes: ["CH59"], color: "#E1E1E1" },

  Other: { codes: [], color: "#cccccc" },
};

export function getGroupByCode(fullCode: string | undefined | null) {
  if (!fullCode) return undefined;
  const parts = fullCode.split("-").filter(Boolean);
  const useType = parts.length >= 2 ? parts[1] : fullCode;
  return Object.values(zoningGroups).find((g) => g.codes.includes(useType));
}

export function groupLabelByGroup(group: ZoningGroup | undefined) {
  return (Object.keys(zoningGroups) as (keyof typeof zoningGroups)[])
    .find((k) => zoningGroups[k] === group) || "Other";
}
