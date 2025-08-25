export type ZoningGroup = { codes: string[]; color: string };

export const zoningGroups: Record<string, ZoningGroup> = {
  "Single Unit (SU)": { codes: ["SU"], color: "#e41a1c" },
  "Two Unit (TU)": { codes: ["TU"], color: "#377eb8" },
  "Multi Unit (MU, RH, RO)": { codes: ["MU", "RH", "RO"], color: "#984ea3" },
  "Mixed Use (MX, M-GMX)": { codes: ["MX", "M-GMX"], color: "#4daf4a" },
  "Residential Mixed Use (RX)": { codes: ["RX"], color: "#ff7f00" },
  "Main Street (MS)": { codes: ["MS"], color: "#a65628" },
  "Downtown (AS, C, CPV, GT, LD, TD)": { codes: ["AS", "C", "CPV", "GT", "LD", "TD"], color: "#f781bf" },
  "Downtown - Civic (D-CV)": { codes: ["D-CV"], color: "#999999" },
  "Commercial Corridor (CC)": { codes: ["CC"], color: "#66c2a5" },
  "Cherry Creek North (C-CCN)": { codes: ["C-CCN"], color: "#ffff33" },
  "Campus (EI, EI2, ENT, H, H2, NWC)": { codes: ["EI", "EI2", "ENT", "H", "H2", "NWC"], color: "#a6cee3" },
  "Airport (DIA)": { codes: ["DIA"], color: "#1f78b4" },
  "Industrial - Mixed Use (I-MX, M-IMX)": { codes: ["I-MX", "M-IMX"], color: "#b2df8a" },
  "Industrial - Light (I-A)": { codes: ["I-A"], color: "#33a02c" },
  "Industrial - General (I-B)": { codes: ["I-B"], color: "#fb9a99" },
  "Planned Unit Development (PUD-D, PUD-G)": { codes: ["PUD-D", "PUD-G"], color: "#fdbf6f" },
  "Manufactured Home Community (MHC)": { codes: ["MHC"], color: "#cab2d6" },
  "Special (O-1)": { codes: ["O-1"], color: "#6a3d9a" },
  "Open Space - Conservation (OS-C)": { codes: ["OS-C"], color: "#ffff99" },
  "Open Space - Public Parks (OS-A)": { codes: ["OS-A"], color: "#b15928" },
  "Open Space - Recreation (OS-B)": { codes: ["OS-B"], color: "#8dd3c7" },
  "Former Chapter 59 Zone": { codes: ["CH59"], color: "#d9d9d9" },
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
