// src/map/icons/stationIcons.ts
import L from 'leaflet';
import type { Station } from '../../../../Types/config';
import { normalizeSvg, stripScripts, looksLikeInlineSvg } from './svgUtils';

type StationKind = 'air-quality' | 'weather';

interface StationIconOpts {
  kind: StationKind;
  size?: number;        // circular head diameter
  accent?: string;      // ring color
  fill?: string;        // circle fill
  tip?: string;         // pin tip color
  label?: string;       // accessible label
  svg?: string;         // inline <svg…>, data URL, or URL
}

/**
 * Creates a Leaflet DivIcon (pin shape in CSS) and injects a glyph from JSON.
 */
export function makeStationDivIcon({
  kind,
  size = 36,
  accent = '#2563eb',
  fill = '#ffffff',
  tip = '#111827',
  label = 'Station',
  svg,
}: StationIconOpts): L.DivIcon {
    const head = size;
    const totalH = Math.round(size * 1.6); // circle + tip
    const iconAnchor: [number, number] = [Math.round(head / 2), totalH];


  // Build glyph html (inline <svg> or <img src>)
  let glyphHtml = '';
  if (svg && svg.trim()) {
    const raw = normalizeSvg(svg);
    if (looksLikeInlineSvg(raw)) {
      const clean = stripScripts(raw);
      glyphHtml = `<span class="station-glyph" aria-hidden="true">${clean}</span>`;
    } else if (
      /^data:image\/svg\+xml/i.test(raw) ||
      /^https?:\/\//i.test(raw) ||
      /\.svg(\?|#|$)/i.test(raw)
    ) {
      const safeSrc = raw.replace(/"/g, '&quot;');
      glyphHtml = `<img class="station-glyph" src="${safeSrc}" alt="" aria-hidden="true" />`;
    } else {
      glyphHtml = `<span class="station-glyph" aria-hidden="true">${raw}</span>`;
    }
  }

    const className = `station-divicon station-${kind}`;

    const html = `
    <div class="station-pin" role="img" aria-label="${label}"
        style="--size:${head}px; --accent:${accent}; --fill:${fill}; --tip:${tip};">
        <div class="station-tip"></div>
        <div class="station-head">
        <div class="station-glyph-wrapper">
            ${glyphHtml}
        </div>
        </div>
    </div>
    `;





  // Optional debug:
  // console.log('DivIcon <svg>?', html.includes('<svg'));
  // console.log('DivIcon <img>?', html.includes('<img'));

  return L.divIcon({
    html,
    className,
    iconSize: [head, totalH],
    iconAnchor,
    popupAnchor: [0, -head * 0.6],
    tooltipAnchor: [0, -head * 0.6],
  });
}

/** Convenience: make from a Station (uses station.icon_svg) */
export function makeIconFromStation(
  station: Station,
  opts?: Partial<Omit<StationIconOpts, 'svg' | 'kind'>> & { kind?: StationIconOpts['kind'] }
): L.DivIcon {
  // Optional debug for a single station:
  // const rawHead = (station.icon_svg || '').slice(0, 80);
  // const normHead = normalizeSvg(station.icon_svg || '').slice(0, 80);
  // console.log('RAW →', rawHead, 'NORM →', normHead);

  return makeStationDivIcon({
    kind: opts?.kind ?? 'air-quality',
    size: opts?.size ?? 40,
    accent: opts?.accent ?? '#1fa755',
    fill: opts?.fill ?? '#fff',
    tip: opts?.tip ?? '#1fa755',
    label: opts?.label ?? station.name,
    svg: station.icon_svg || '',
  });
}
