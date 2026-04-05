// Centralized design tokens for overlay components (Legend, Tooltip, SeriesPanel, ZoomRanger).
// Canvas rendering tokens live separately in src/rendering/theme.ts.

// --- Swatch ---
export const SWATCH_W = 12;
export const SWATCH_H = 3;
export const SWATCH_RADIUS = 1;

// --- Layout ---
export const ROW_GAP = 4;
export const PANEL_BORDER = 1;
export const PANEL_PAD_X = 6;
export const PANEL_PAD_Y = 4;
export const ROW_PAD_X = 4;
export const ROW_LINE_H = 16;

// --- Typography ---
export const OVERLAY_FONT_SIZE = 12;
export const OVERLAY_FONT_FAMILY = 'sans-serif';
export const PANEL_FONT = `${OVERLAY_FONT_SIZE}px ${OVERLAY_FONT_FAMILY}`;
export const PANEL_BOLD_FONT = `bold ${OVERLAY_FONT_SIZE}px ${OVERLAY_FONT_FAMILY}`;

// --- Opacity ---
export const HIDDEN_OPACITY = 0.4;

// --- Z-Index (CSS custom property names + defaults) ---
export const CSS_OVERLAY_Z = '--uplot-overlay-z';
export const CSS_TOOLTIP_Z = '--uplot-tooltip-z';
export const DEFAULT_OVERLAY_Z = 50;
export const DEFAULT_TOOLTIP_Z = 100;

// --- ZoomRanger colors (CSS custom property names + defaults) ---
export const CSS_RANGER_ACCENT = '--uplot-ranger-accent';
export const CSS_RANGER_DIM = '--uplot-ranger-dim';
export const DEFAULT_RANGER_ACCENT = 'rgba(0,100,255,0.8)';
export const DEFAULT_RANGER_DIM = 'rgba(0,0,0,0.3)';
