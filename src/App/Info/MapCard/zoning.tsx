export type ZoningGroup = { codes: string[]; color: string };

export const zoningGroups: Record<string, ZoningGroup> = {
  "Airport (DIA)": { codes: ["DIA"], color: "#92C4F0" },
  "Campus (EI, EI2, ENT, H, H2, NWC)": { codes: ["EI", "EI2", "ENT", "H", "H2", "NWC"], color: "#BED2FF" },
  "Cherry Creek North (C-CCN)": { codes: ["C-CCN"], color: "#FF0066" },
  "Commercial Corridor (CC)": { codes: ["CC"], color: "#FF9696" },
  "Downtown (AS, C, CPV, GT, LD, TD)": { codes: ["AS", "C", "CPV", "GT", "LD", "TD"], color: "#C72D26" },
  "Downtown - Civic (D-CV)": { codes: ["D-CV"], color: "#5685F5" },
  "Former Chapter 59 Zone": { codes: ["Former Chapter 59 Zone", "CH59"], color: "#E1E1E1" },

  "Industrial - General (I-B)": { codes: ["I-B"], color: "#D4ABFF" },
  "Industrial - Light (I-A)": { codes: ["I-A"], color: "#E8C9FF" },
  "Industrial - Mixed Use (I-MX, M-IMX)": { codes: ["I-MX", "M-IMX"], color: "#FF0000" },

  "Main Street (MS)": { codes: ["MS"], color: "#FEFEFA" },
  "Mixed Use (MX, M-GMX)": { codes: ["MX", "M-GMX"], color: "#E65256" },
  "Multi Unit (MU, RH, RO)": { codes: ["MU", "RH", "RO"], color: "#FFAA00" },
  "Manufactured Home Community (MHC)": { codes: ["MHC"], color: "#A87000" },

  "Open Space - Conservation (OS-C)": { codes: ["OS-C"], color: "#73B273" },
  "Open Space - Public Parks (OS-A)": { codes: ["OS-A"], color: "#96E78A" },
  "Open Space - Recreation (OS-B)": { codes: ["OS-B"], color: "#9DBA79" },

  "Planned Unit Development (PUD-D, PUD-G)": { codes: ["PUD-D", "PUD-G"], color: "#C8C83C" },
  "Residential Mixed Use (RX)": { codes: ["RX"], color: "#FF0000" },
  "Single Unit (SU)": { codes: ["SU"], color: "#FFFFBE" },
  "Special (O-1)": { codes: ["O-1"], color: "#74C477" },
  "Two Unit (TU)": { codes: ["TU"], color: "#FFFF00" },

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
