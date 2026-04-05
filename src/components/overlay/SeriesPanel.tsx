import React, { forwardRef } from 'react';

// --- Shared styles for floating panels (Tooltip, FloatingLegend, HoverLabel) ---

export const panelStyle: React.CSSProperties = {
  position: 'absolute',
  zIndex: 50,
  background: 'var(--uplot-panel-bg, rgba(255,255,255,0.92))',
  border: '1px solid var(--uplot-panel-border, #ccc)',
  borderRadius: 4,
  padding: '4px 6px',
  fontSize: 12,
  fontFamily: 'sans-serif',
  userSelect: 'none',
  boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
  whiteSpace: 'nowrap' as const,
};

const swatchStyle: React.CSSProperties = {
  width: 12,
  height: 3,
  borderRadius: 1,
  display: 'inline-block',
  flexShrink: 0,
};

const valueStyle: React.CSSProperties = { fontWeight: 600 };

const rowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  padding: '1px 4px',
};

// Pre-computed row style variants to avoid object spreads on every render
const rowVisiblePointer: React.CSSProperties = { ...rowStyle, opacity: 1, cursor: 'pointer' };
const rowVisibleDefault: React.CSSProperties = { ...rowStyle, opacity: 1, cursor: 'default' };
const rowHiddenPointer: React.CSSProperties = { ...rowStyle, opacity: 0.4, cursor: 'pointer' };
const rowHiddenDefault: React.CSSProperties = { ...rowStyle, opacity: 0.4, cursor: 'default' };

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

  return (
    <div onClick={onClick} style={style}>
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
  onMouseDown?: React.MouseEventHandler;
  onMouseEnter?: React.MouseEventHandler;
  onMouseLeave?: React.MouseEventHandler;
}

export const Panel = forwardRef<HTMLDivElement, PanelProps>(function Panel(
  { left, top, children, className, style, onMouseDown, onMouseEnter, onMouseLeave },
  ref,
) {
  return (
    <div
      ref={ref}
      className={className}
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
  const yData = store.dataStore.getYValues(group, index);
  const val = yData[activeDataIdx];
  if (val == null) return '';
  return typeof val === 'number' ? val.toPrecision(4) : String(val);
}
