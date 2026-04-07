import React from 'react';
import { useDraggableOverlay } from '../hooks/useDraggableOverlay';
import type { OverlayPosition } from '../types/common';
import { panelStyle } from './overlay/SeriesPanel';

export interface DraggableLabelProps {
  /** Content to display inside the label. */
  children: React.ReactNode;
  /** Initial position: corner preset or {x, y} in pixels. Default: 'top-left'. */
  position?: OverlayPosition;
  /** Opacity when not hovered (0-1). Default: 0.8. */
  idleOpacity?: number;
  /** Whether to show (default: true). */
  show?: boolean;
  /** Called with the new position whenever the label is dragged. */
  onPositionChange?: (pos: { x: number; y: number }) => void;
  /** Accessible label for the draggable control. Default: 'Draggable label'. */
  ariaLabel?: string;
  /** CSS class for custom styling. */
  className?: string;
  /** Inline style overrides. */
  style?: React.CSSProperties;
}

const DEFAULT_OFFSET = { x: 0, y: 0 };
const ESTIMATED_SIZE = { w: 100, h: 28 };

/**
 * A DOM-based draggable text label rendered inside the chart's plot area.
 * Drag to reposition. Fades to `idleOpacity` when not hovered.
 *
 * Must be a child of `<Chart>`.
 */
export function DraggableLabel({
  children,
  position = 'top-left',
  idleOpacity = 0.8,
  show = true,
  onPositionChange,
  ariaLabel = 'Draggable label',
  className,
  style: styleProp,
}: DraggableLabelProps): React.ReactElement | null {
  const overlay = useDraggableOverlay({
    mode: 'draggable',
    show,
    position,
    offset: DEFAULT_OFFSET,
    idleOpacity,
    estimatedSize: ESTIMATED_SIZE,
    onPositionChange,
  });

  if (!show || overlay.renderPos == null) return null;

  const onKeyDown = (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 1 : 10;
    switch (e.key) {
      case 'ArrowUp':    overlay.moveBy(0, -step); e.preventDefault(); break;
      case 'ArrowDown':  overlay.moveBy(0, step);  e.preventDefault(); break;
      case 'ArrowLeft':  overlay.moveBy(-step, 0); e.preventDefault(); break;
      case 'ArrowRight': overlay.moveBy(step, 0);  e.preventDefault(); break;
    }
  };

  return (
    <div
      ref={overlay.panelRef}
      className={className}
      data-testid="draggable-label"
      tabIndex={0}
      role="group"
      aria-label={ariaLabel}
      onKeyDown={onKeyDown}
      style={{
        ...panelStyle,
        ...overlay.panelStyle,
        ...styleProp,
        left: overlay.renderPos.x,
        top: overlay.renderPos.y,
      }}
      {...overlay.panelHandlers}
    >
      {children}
    </div>
  );
}
