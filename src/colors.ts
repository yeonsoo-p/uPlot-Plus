import type { GradientConfig } from './types';

/** Convert HSL to RGB. h in [0,360], s and l in [0,100]. */
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  s /= 100;
  l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60)       { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else              { r = c; b = x; }
  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255),
  ];
}

/**
 * Parse a CSS color string into [r, g, b] components.
 * Supports: #rgb, #rrggbb, rgb(r,g,b), rgba(r,g,b,a).
 * Returns null for unsupported formats (e.g. named colors like 'red').
 */
function parseColor(color: string): [number, number, number] | null {
  // #rrggbb or #rrggbbaa
  const hex6 = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i.exec(color);
  if (hex6 && hex6[1] != null && hex6[2] != null && hex6[3] != null) {
    return [
      parseInt(hex6[1], 16),
      parseInt(hex6[2], 16),
      parseInt(hex6[3], 16),
    ];
  }

  // #rgb or #rgba
  const hex3 = /^#([0-9a-f])([0-9a-f])([0-9a-f])/i.exec(color);
  if (hex3 && hex3[1] != null && hex3[2] != null && hex3[3] != null) {
    return [
      parseInt(hex3[1] + hex3[1], 16),
      parseInt(hex3[2] + hex3[2], 16),
      parseInt(hex3[3] + hex3[3], 16),
    ];
  }

  // rgb(r, g, b) or rgba(r, g, b, a) — with or without spaces
  const rgb = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i.exec(color);
  if (rgb && rgb[1] != null && rgb[2] != null && rgb[3] != null) {
    return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])];
  }

  // hsl(h, s%, l%) or hsla(h, s%, l%, a) — with or without spaces
  const hsl = /^hsla?\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%/i.exec(color);
  if (hsl && hsl[1] != null && hsl[2] != null && hsl[3] != null) {
    return hslToRgb(Number(hsl[1]), Number(hsl[2]), Number(hsl[3]));
  }

  return null;
}

/**
 * Create a vertical linear gradient that fades a color from one opacity to another.
 * Useful for area charts: `fill={fadeGradient('#3498db')}`.
 *
 * Supports hex (#rgb, #rrggbb) and rgb()/rgba() color strings.
 *
 * @param color - CSS color string (hex or rgb/rgba)
 * @param fromAlpha - opacity at the top (default 0.8)
 * @param toAlpha - opacity at the bottom (default 0.0)
 */
export function fadeGradient(
  color: string,
  fromAlpha = 0.8,
  toAlpha = 0.0,
): GradientConfig {
  const rgb = parseColor(color);
  if (rgb == null) {
    // Fallback: use the color string as-is for both stops
    return { type: 'linear', stops: [[0, color], [1, color]] };
  }
  const [r, g, b] = rgb;
  return {
    type: 'linear',
    stops: [
      [0, `rgba(${r},${g},${b},${fromAlpha})`],
      [1, `rgba(${r},${g},${b},${toAlpha})`],
    ],
  };
}

/**
 * Return a CSS color string with a new alpha value.
 * Useful for matching fill to stroke: `fill={withAlpha(stroke, 0.1)}`.
 *
 * Supports hex (#rgb, #rrggbb) and rgb()/rgba() color strings.
 *
 * @param color - CSS color string (hex or rgb/rgba)
 * @param alpha - opacity 0–1
 */
export function withAlpha(color: string, alpha: number): string {
  const rgb = parseColor(color);
  if (rgb == null) return color;
  const [r, g, b] = rgb;
  return `rgba(${r},${g},${b},${alpha})`;
}

/**
 * Generate a palette of N visually distinct colors using HSL rotation.
 * Uses the golden angle (~137.5°) for maximum separation between adjacent colors.
 *
 * @param n - number of colors to generate
 * @param saturation - HSL saturation percentage (default 65)
 * @param lightness - HSL lightness percentage (default 50)
 */
export function palette(n: number, saturation = 65, lightness = 50): string[] {
  const colors: string[] = [];
  const goldenAngle = 137.508;
  for (let i = 0; i < n; i++) {
    const hue = (i * goldenAngle) % 360;
    colors.push(`hsl(${hue.toFixed(1)},${saturation}%,${lightness}%)`);
  }
  return colors;
}
