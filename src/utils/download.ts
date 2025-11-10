// src/utils/download.ts
import { apiUrl } from '../config/api';

export function buildDownloadUrl(raw: string): string {
  const isAbsolute = /^https?:\/\//i.test(raw);
  const tz = new URLSearchParams(window.location.search).get('tz');

  if (isAbsolute) {
    const u = new URL(raw);
    // prevent duplicates
    if (!u.searchParams.has('fmt')) u.searchParams.set('fmt', 'csv');
    if (tz === 'UTC') u.searchParams.set('tz', 'UTC');
    return u.toString();
  } else {
    // relative path → let apiUrl add host (& tz=UTC when active)
    const hasFmt = /[?&]fmt=/.test(raw);
    const withFmt = hasFmt ? raw : `${raw}${raw.includes('?') ? '&' : '?'}fmt=csv`;
    return apiUrl(withFmt);
  }
}

export const safeFilename = (s: string) => s.replace(/[^\w.-]+/g, '_');
