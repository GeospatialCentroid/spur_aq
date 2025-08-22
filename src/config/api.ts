/**
 * API base configuration (single source of truth).
 *
 * How to use (team notes):
 * - Set REACT_APP_API_BASE_URL in `.env` to the host+port ONLY (no paths, no queries).
 *   Example:
 *     REACT_APP_API_BASE_URL=http://10.1.77.22:8001
 *
 * - Then import either:
 *     - API_BASE_URL  -> if you need a plain string base for templating
 *     - apiUrl(path)  -> helper that joins the base with any endpoint path
 *
 * - After editing `.env`, restart `npm start` (Create React App reads env at startup).
 *
 * Why this exists:
 * - All code references ONE place for the API base, so switching dev/prod is trivial.
 * - We strip trailing slashes to avoid `//` mistakes.
 */

const raw = (process.env.REACT_APP_API_BASE_URL || '').trim();

// default is the current dev box, so the app still works if .env is empty
export const API_BASE_URL = raw ? raw.replace(/\/+$/, '') : 'http://10.1.76.54:8001';

export const apiUrl = (path: string) =>
  `${API_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
