import React, { forwardRef } from 'react';
import {
  PANEL_BORDER, PANEL_PAD_X, PANEL_PAD_Y, ROW_PAD_X, ROW_GAP, ROW_LINE_H,
  PANEL_FONT, PANEL_BOLD_FONT, SWATCH_W, SWATCH_H, SWATCH_RADIUS,
} from './tokens';
import { cssVar } from '../../rendering/theme';

// Re-export layout constants so existing consumers (estimatePanelSize) keep working.
export { PANEL_BORDER, PANEL_PAD_X, PANEL_PAD_Y, ROW_PAD_X, ROW_GAP, ROW_LINE_H, PANEL_FONT, PANEL_BOLD_FONT };
export const ROW_SWATCH_W = SWATCH_W;

// --- Shared styles for floating panels (Tooltip, FloatingLegend, HoverLabel) ---

export const panelStyle: React.CSSProperties = {
  position: 'absolute',
  zIndex: cssVar('overlayZ'),
  background: cssVar('panelBg'),
  border: `1px solid ${cssVar('panelBorder')}`,
  borderRadius: 4,
  padding: `${PANEL_PAD_Y}px ${PANEL_PAD_X}px`,
  fontSize: cssVar('overlayFontSize'),
  fontFamily: cssVar('overlayFontFamily'),
  userSelect: 'none',
  boxShadow: cssVar('panelShadow'),
  whiteSpace: 'nowrap' as const,
};

const swatchStyle: React.CSSProperties = {
  width: SWATCH_W,
  height: SWATCH_H,
  borderRadius: SWATCH_RADIUS,
  display: 'inline-block',
  flexShrink: 0,
};

const valueStyle: React.CSSProperties = { fontWeight: 600 };

const rowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: ROW_GAP,
  padding: `1px ${ROW_PAD_X}px`,
  background: 'none',
  border: 'none',
  color: 'inherit',
  font: 'inherit',
  width: '100%',
  textAlign: 'left',
};

// Pre-computed row style variants to avoid object spreads on every render
const rowVisiblePointer: React.CSSProperties = { ...rowStyle, opacity: 1, cursor: 'pointer' };
const rowVisibleDefault: React.CSSProperties = { ...rowStyle, opacity: 1, cursor: 'default' };
const rowHiddenPointer: React.CSSProperties = { ...rowStyle, opacity: cssVar('overlayHiddenOpacity'), cursor: 'pointer' };
const rowHiddenDefault: React.CSSProperties = { ...rowStyle, opacity: cssVar('overlayHiddenOpacity'), cursor: 'default' };

// Swatch style cache keyed by color string
const swatchStyleCache = new Map<string, React.CSSProperties>();

function getSwatchStyle(color: string): React.CSSProperties {
  let cached = swatchStyleCache.get(color);
  if (cached == null) {
    cached = { ...swatchStyle, backgroundColor: color };
    swatchStyleCache.set(color, cached);
  }
  return cached;
}

// --- Series row item ---

export interface SeriesRowProps {
  label: string;
  color: string;
  value?: string;
  isHidden?: boolean;
  onClick?: () => void;
}

export function SeriesRow({
  label, color, value, isHidden, onClick,
}: SeriesRowProps): React.ReactElement {
  const style = isHidden
    ? (onClick ? rowHiddenPointer : rowHiddenDefault)
    : (onClick ? rowVisiblePointer : rowVisibleDefault);

  if (onClick != null) {
    return (
      <button type="button" onClick={onClick} style={style} aria-label={`Toggle ${label}`}>
        <span style={getSwatchStyle(color)} />
        <span>{label}</span>
        {value && <span style={valueStyle}>{value}</span>}
      </button>
    );
  }

  return (
    <div style={style}>
      <span style={getSwatchStyle(color)} />
      <span>{label}</span>
      {value && <span style={valueStyle}>{value}</span>}
    </div>
  );
}

// --- Panel container ---

export interface PanelProps {
  left: number;
  top: number;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  'data-testid'?: string;
  onMouseDown?: React.MouseEventHandler;
  onMouseEnter?: React.MouseEventHandler;
  onMouseLeave?: React.MouseEventHandler;
}

export const Panel = forwardRef<HTMLDivElement, PanelProps>(function Panel(
  { left, top, children, className, style, 'data-testid': testId, onMouseDown, onMouseEnter, onMouseLeave },
  ref,
) {
  return (
    <div
      ref={ref}
      className={className}
      data-testid={testId}
      onMouseDown={onMouseDown}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{ ...panelStyle, left, top, ...style }}
    >
      {children}
    </div>
  );
});

// --- Helper: build series value string from store ---

export function formatSeriesValue(
  store: { dataStore: { getYValues: (g: number, i: number) => ArrayLike<number | null> } },
  group: number,
  index: number,
  activeGroup: number,
  activeDataIdx: number,
): string {
  if (activeDataIdx < 0 || activeGroup < 0) return '';
  if (group !== activeGroup) return '';
  const yData = store.dataStore.getYValues(group, index);
  const val = yData[activeDataIdx];
  if (val == null) return '';
  return typeof val === 'number' ? val.toPrecision(4) : String(val);
}
