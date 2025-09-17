// src/map/icons/svgUtils.ts
export function normalizeSvg(input: string): string {
  let s = (input || '').trim();

  // JSON unicode escapes common in APIs
  s = s
    .replace(/\\u003c/gi, '<')
    .replace(/\\u003e/gi, '>')
    .replace(/\\u0026/gi, '&');

  // HTML entities sometimes present
  s = s
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&amp;/gi, '&');

  // Fallback: decode remaining \uXXXX (double-escaped)
  if (!/<svg[\s>]/i.test(s)) {
    s = s.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) =>
      String.fromCharCode(parseInt(hex, 16))
    );
  }
  return s;
}

export function stripScripts(svgOrHtml: string): string {
  return (svgOrHtml || '').replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '');
}

export function looksLikeInlineSvg(s: string): boolean {
  return /<svg[\s>]/i.test(s);
}
