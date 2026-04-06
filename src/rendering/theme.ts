import type { ChartTheme } from '../types/theme';

// ---------------------------------------------------------------------------
// ResolvedTheme — fully resolved, no optionals. Every draw function and
// component reads from this single object (stored on store.theme).
// ---------------------------------------------------------------------------

export interface ResolvedTheme {
  // Axes & grid
  axisStroke: string;
  gridStroke: string;
  titleFill: string;
  tickFont: string;
  labelFont: string;
  titleFont: string;

  // Bands
  bandFill: string;

  // Cursor
  cursorStroke: string;
  cursorWidth: number;
  cursorDash: number[];
  cursorPointRadius: number;
  pointFill: string;

  // Selection
  selectFill: string;
  selectStroke: string;
  selectWidth: number;

  // Series palette
  seriesColors: string[];

  // Specialized components
  candlestickUp: string;
  candlestickDown: string;
  boxFill: string;
  boxStroke: string;
  boxMedian: string;
  boxWhisker: string;
  vectorColor: string;
  sparklineStroke: string;
  timelineLabel: string;
  timelineSegment: string;
  timelineText: string;
  annotationStroke: string;
  annotationFill: string;
  annotationFont: string;
  annotationLabelFill: string;

  // Overlay panels
  panelBg: string;
  panelBorder: string;
  panelShadow: string;
  overlayFontFamily: string;
  overlayFontSize: number;
  overlayHiddenOpacity: number;
  overlayZ: number;
  tooltipZ: number;

  // ZoomRanger
  rangerAccent: string;
  rangerDim: string;
}

// ---------------------------------------------------------------------------
// Backwards-compatible alias so existing imports keep working until migrated.
// ---------------------------------------------------------------------------

/** @deprecated Use ResolvedTheme instead */
export type ThemeCache = ResolvedTheme;

// ---------------------------------------------------------------------------
// THEME_DEFAULTS — single source of truth for every hardcoded default.
// ---------------------------------------------------------------------------

export const THEME_DEFAULTS: ResolvedTheme = {
  // Axes & grid
  axisStroke: '#000',
  gridStroke: 'rgba(0,0,0,0.12)',
  titleFill: '#000',
  tickFont: '12px system-ui, sans-serif',
  labelFont: 'bold 12px system-ui, sans-serif',
  titleFont: 'bold 14px system-ui, sans-serif',

  // Bands
  bandFill: 'rgba(0, 120, 255, 0.1)',

  // Cursor
  cursorStroke: '#607D8B',
  cursorWidth: 1,
  cursorDash: [5, 3],
  cursorPointRadius: 4,
  pointFill: '#fff',

  // Selection
  selectFill: 'rgba(0,0,0,0.07)',
  selectStroke: 'rgba(0,0,0,0.15)',
  selectWidth: 1,

  // Series palette
  seriesColors: [
    '#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6',
    '#1abc9c', '#e67e22', '#34495e', '#16a085', '#c0392b',
    '#2980b9', '#27ae60', '#f1c40f', '#8e44ad', '#d35400',
  ],

  // Specialized components
  candlestickUp: '#26a69a',
  candlestickDown: '#ef5350',
  boxFill: 'rgba(52, 152, 219, 0.4)',
  boxStroke: '#2980b9',
  boxMedian: '#e74c3c',
  boxWhisker: '#555',
  vectorColor: '#c0392b',
  sparklineStroke: '#03a9f4',
  timelineLabel: '#666',
  timelineSegment: '#4dabf7',
  timelineText: '#fff',
  annotationStroke: 'red',
  annotationFill: 'rgba(255,0,0,0.1)',
  annotationFont: '11px sans-serif',
  annotationLabelFill: '#000',

  // Overlay panels
  panelBg: 'rgba(255,255,255,0.92)',
  panelBorder: '#ccc',
  panelShadow: '0 1px 4px rgba(0,0,0,0.12)',
  overlayFontFamily: 'sans-serif',
  overlayFontSize: 12,
  overlayHiddenOpacity: 0.4,
  overlayZ: 50,
  tooltipZ: 100,

  // ZoomRanger
  rangerAccent: 'rgba(0,100,255,0.8)',
  rangerDim: 'rgba(0,0,0,0.3)',
};

// ---------------------------------------------------------------------------
// DARK_THEME — pre-built dark mode preset. Use with ThemeProvider or Chart.
// ---------------------------------------------------------------------------

export const DARK_THEME: ChartTheme = {
  axisStroke: '#ccc',
  gridStroke: 'rgba(255,255,255,0.08)',
  titleFill: '#e0e0e0',
  cursor: { stroke: '#90caf9', pointFill: '#1e1e1e' },
  select: { fill: 'rgba(255,255,255,0.06)', stroke: 'rgba(255,255,255,0.15)' },
  overlay: {
    panelBg: 'rgba(30,30,30,0.95)',
    panelBorder: '#555',
    panelShadow: '0 1px 4px rgba(0,0,0,0.4)',
  },
  ranger: { accent: 'rgba(100,180,255,0.8)', dim: 'rgba(0,0,0,0.5)' },
  annotation: { stroke: '#ff6b6b', fill: 'rgba(255,100,100,0.15)', labelFill: '#e0e0e0' },
};

// ---------------------------------------------------------------------------
// VAR_MAP — maps ResolvedTheme keys to CSS custom property names.
// ---------------------------------------------------------------------------

const VAR_MAP: Readonly<Record<keyof ResolvedTheme, string>> = {
  axisStroke: '--uplot-axis-stroke',
  gridStroke: '--uplot-grid-stroke',
  titleFill: '--uplot-title-fill',
  tickFont: '--uplot-tick-font',
  labelFont: '--uplot-label-font',
  titleFont: '--uplot-title-font',
  bandFill: '--uplot-band-fill',
  cursorStroke: '--uplot-cursor-stroke',
  cursorWidth: '--uplot-cursor-width',
  cursorDash: '--uplot-cursor-dash',
  cursorPointRadius: '--uplot-cursor-point-radius',
  pointFill: '--uplot-point-fill',
  selectFill: '--uplot-select-fill',
  selectStroke: '--uplot-select-stroke',
  selectWidth: '--uplot-select-width',
  seriesColors: '--uplot-series-colors',
  candlestickUp: '--uplot-candlestick-up',
  candlestickDown: '--uplot-candlestick-down',
  boxFill: '--uplot-box-fill',
  boxStroke: '--uplot-box-stroke',
  boxMedian: '--uplot-box-median',
  boxWhisker: '--uplot-box-whisker',
  vectorColor: '--uplot-vector-color',
  sparklineStroke: '--uplot-sparkline-stroke',
  timelineLabel: '--uplot-timeline-label',
  timelineSegment: '--uplot-timeline-segment',
  timelineText: '--uplot-timeline-text',
  annotationStroke: '--uplot-annotation-stroke',
  annotationFill: '--uplot-annotation-fill',
  annotationFont: '--uplot-annotation-font',
  annotationLabelFill: '--uplot-annotation-label-fill',
  panelBg: '--uplot-panel-bg',
  panelBorder: '--uplot-panel-border',
  panelShadow: '--uplot-panel-shadow',
  overlayFontFamily: '--uplot-overlay-font-family',
  overlayFontSize: '--uplot-overlay-font-size',
  overlayHiddenOpacity: '--uplot-overlay-hidden-opacity',
  overlayZ: '--uplot-overlay-z',
  tooltipZ: '--uplot-tooltip-z',
  rangerAccent: '--uplot-ranger-accent',
  rangerDim: '--uplot-ranger-dim',
};

// ---------------------------------------------------------------------------
// cssVar — generates var(--uplot-x, fallback) from THEME_DEFAULTS.
// Used by React overlay components so fallbacks stay in sync.
// ---------------------------------------------------------------------------

/** Keys whose resolved values are numbers but need 'px' units in CSS contexts. */
const PX_KEYS: ReadonlySet<keyof ResolvedTheme> = new Set(['overlayFontSize']);

export function cssVar(key: keyof ResolvedTheme): string {
  const varName = VAR_MAP[key];
  const fallback = THEME_DEFAULTS[key];
  const suffix = PX_KEYS.has(key) ? 'px' : '';
  return `var(${varName}, ${Array.isArray(fallback) ? fallback.join(',') : `${fallback}${suffix}`})`;
}

// ---------------------------------------------------------------------------
// resolveTheme — reads CSS custom properties from a canvas element and
// returns a fully resolved theme. One getComputedStyle call per full redraw.
// ---------------------------------------------------------------------------

export function resolveTheme(canvas: HTMLCanvasElement | null): ResolvedTheme {
  if (canvas == null) return THEME_DEFAULTS;

  const cs = getComputedStyle(canvas);

  const v = (key: keyof ResolvedTheme, fb: string): string =>
    cs.getPropertyValue(VAR_MAP[key]).trim() || fb;

  const n = (key: keyof ResolvedTheme, fb: number): number => {
    const raw = cs.getPropertyValue(VAR_MAP[key]).trim();
    if (raw === '') return fb;
    const parsed = parseFloat(raw);
    return isNaN(parsed) ? fb : parsed;
  };

  const csv = (key: keyof ResolvedTheme, fb: string[]): string[] => {
    const raw = cs.getPropertyValue(VAR_MAP[key]).trim();
    return raw !== '' ? raw.split(',').map(s => s.trim()).filter(Boolean) : fb;
  };

  const numCsv = (key: keyof ResolvedTheme, fb: number[]): number[] => {
    const raw = cs.getPropertyValue(VAR_MAP[key]).trim();
    if (raw === '') return fb;
    const parsed = raw.split(',').map(s => Number(s.trim())).filter(x => !isNaN(x));
    return parsed.length > 0 ? parsed : fb;
  };

  const d = THEME_DEFAULTS;

  return {
    // Axes & grid
    axisStroke: v('axisStroke', d.axisStroke),
    gridStroke: v('gridStroke', d.gridStroke),
    titleFill: v('titleFill', d.titleFill),
    tickFont: v('tickFont', d.tickFont),
    labelFont: v('labelFont', d.labelFont),
    titleFont: v('titleFont', d.titleFont),

    // Bands
    bandFill: v('bandFill', d.bandFill),

    // Cursor
    cursorStroke: v('cursorStroke', d.cursorStroke),
    cursorWidth: n('cursorWidth', d.cursorWidth),
    cursorDash: numCsv('cursorDash', d.cursorDash),
    cursorPointRadius: n('cursorPointRadius', d.cursorPointRadius),
    pointFill: v('pointFill', d.pointFill),

    // Selection
    selectFill: v('selectFill', d.selectFill),
    selectStroke: v('selectStroke', d.selectStroke),
    selectWidth: n('selectWidth', d.selectWidth),

    // Series palette
    seriesColors: csv('seriesColors', d.seriesColors),

    // Specialized components
    candlestickUp: v('candlestickUp', d.candlestickUp),
    candlestickDown: v('candlestickDown', d.candlestickDown),
    boxFill: v('boxFill', d.boxFill),
    boxStroke: v('boxStroke', d.boxStroke),
    boxMedian: v('boxMedian', d.boxMedian),
    boxWhisker: v('boxWhisker', d.boxWhisker),
    vectorColor: v('vectorColor', d.vectorColor),
    sparklineStroke: v('sparklineStroke', d.sparklineStroke),
    timelineLabel: v('timelineLabel', d.timelineLabel),
    timelineSegment: v('timelineSegment', d.timelineSegment),
    timelineText: v('timelineText', d.timelineText),
    annotationStroke: v('annotationStroke', d.annotationStroke),
    annotationFill: v('annotationFill', d.annotationFill),
    annotationFont: v('annotationFont', d.annotationFont),
    annotationLabelFill: v('annotationLabelFill', d.annotationLabelFill),

    // Overlay panels
    panelBg: v('panelBg', d.panelBg),
    panelBorder: v('panelBorder', d.panelBorder),
    panelShadow: v('panelShadow', d.panelShadow),
    overlayFontFamily: v('overlayFontFamily', d.overlayFontFamily),
    overlayFontSize: n('overlayFontSize', d.overlayFontSize),
    overlayHiddenOpacity: n('overlayHiddenOpacity', d.overlayHiddenOpacity),
    overlayZ: n('overlayZ', d.overlayZ),
    tooltipZ: n('tooltipZ', d.tooltipZ),

    // ZoomRanger
    rangerAccent: v('rangerAccent', d.rangerAccent),
    rangerDim: v('rangerDim', d.rangerDim),
  };
}

// ---------------------------------------------------------------------------
// Backwards-compatible alias for existing callers.
// ---------------------------------------------------------------------------

/** @deprecated Use resolveTheme instead */
export function readThemeVars(canvas: HTMLCanvasElement | null): ResolvedTheme {
  return resolveTheme(canvas);
}

// ---------------------------------------------------------------------------
// themeToVars — maps a ChartTheme JS object to CSS custom property values
// for use as React inline style on a wrapper div.
// ---------------------------------------------------------------------------

export function themeToVars(theme: ChartTheme): React.CSSProperties {
  // Using a mutable CSSProperties object; CSS custom property keys (--uplot-*)
  // are accepted via React's `[key: `--${string}`]` index signature.
  const vars: React.CSSProperties & Record<string, string | number> = {};

  const set = (key: keyof ResolvedTheme, value: string | number | undefined) => {
    if (value != null) vars[VAR_MAP[key]] = value;
  };

  const setArr = (key: keyof ResolvedTheme, value: unknown[] | undefined) => {
    if (value != null) vars[VAR_MAP[key]] = value.join(',');
  };

  // Flat fields
  set('axisStroke', theme.axisStroke);
  set('gridStroke', theme.gridStroke);
  set('titleFill', theme.titleFill);
  set('tickFont', theme.tickFont);
  set('labelFont', theme.labelFont);
  set('titleFont', theme.titleFont);
  set('bandFill', theme.bandFill);

  // Cursor
  set('cursorStroke', theme.cursor?.stroke);
  set('cursorWidth', theme.cursor?.width);
  setArr('cursorDash', theme.cursor?.dash);
  set('cursorPointRadius', theme.cursor?.pointRadius);
  set('pointFill', theme.cursor?.pointFill);

  // Selection
  set('selectFill', theme.select?.fill);
  set('selectStroke', theme.select?.stroke);
  set('selectWidth', theme.select?.width);

  // Series
  setArr('seriesColors', theme.seriesColors);

  // Specialized
  set('candlestickUp', theme.candlestick?.upColor);
  set('candlestickDown', theme.candlestick?.downColor);
  set('boxFill', theme.boxWhisker?.fill);
  set('boxStroke', theme.boxWhisker?.stroke);
  set('boxMedian', theme.boxWhisker?.medianColor);
  set('boxWhisker', theme.boxWhisker?.whiskerColor);
  set('vectorColor', theme.vector?.color);
  set('sparklineStroke', theme.sparkline?.stroke);
  set('timelineLabel', theme.timeline?.labelColor);
  set('timelineSegment', theme.timeline?.segmentColor);
  set('timelineText', theme.timeline?.segmentTextColor);
  set('annotationStroke', theme.annotation?.stroke);
  set('annotationFill', theme.annotation?.fill);
  set('annotationFont', theme.annotation?.font);
  set('annotationLabelFill', theme.annotation?.labelFill);

  // Overlay
  set('panelBg', theme.overlay?.panelBg);
  set('panelBorder', theme.overlay?.panelBorder);
  set('panelShadow', theme.overlay?.panelShadow);
  set('overlayFontFamily', theme.overlay?.fontFamily);
  if (theme.overlay?.fontSize != null) vars[VAR_MAP.overlayFontSize] = `${theme.overlay.fontSize}px`;
  set('overlayHiddenOpacity', theme.overlay?.hiddenOpacity);
  set('overlayZ', theme.overlay?.zIndex);
  set('tooltipZ', theme.overlay?.tooltipZIndex);

  // Ranger
  set('rangerAccent', theme.ranger?.accent);
  set('rangerDim', theme.ranger?.dim);

  return vars;
}
