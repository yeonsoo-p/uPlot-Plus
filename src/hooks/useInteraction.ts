import { useEffect, useRef } from 'react';
import type { ChartStore } from './useChartStore';
import type { SelectState } from '../types/cursor';
import { posToVal, invalidateScaleCache } from '../core/Scale';

/**
 * Hook that attaches mouse/touch listeners to the chart container
 * for cursor tracking, drag-to-zoom selection, and zoom reset.
 */
export function useInteraction(
  store: ChartStore,
  containerRef: React.RefObject<HTMLDivElement | null>,
): void {
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const selectRef = useRef<SelectState>({
    show: false,
    left: 0,
    top: 0,
    width: 0,
    height: 0,
  });

  useEffect(() => {
    const el = containerRef.current;
    if (el == null) return;

    function getPlotCoords(e: MouseEvent | Touch): { cx: number; cy: number } | null {
      const rect = el?.getBoundingClientRect();
      if (rect == null) return null;

      const plotBox = store.plotBox;
      const cx = e.clientX - rect.left - plotBox.left;
      const cy = e.clientY - rect.top - plotBox.top;
      return { cx, cy };
    }

    function isInPlot(cx: number, cy: number): boolean {
      const plotBox = store.plotBox;
      return cx >= 0 && cx <= plotBox.width && cy >= 0 && cy <= plotBox.height;
    }

    function onMouseMove(e: MouseEvent): void {
      const coords = getPlotCoords(e);
      if (coords == null) return;

      const { cx, cy } = coords;

      if (!isInPlot(cx, cy) && dragStartRef.current == null) {
        store.cursorManager.hide();
        store.scheduleRedraw();
        return;
      }

      // Update cursor
      store.cursorManager.update(
        cx,
        cy,
        store.plotBox,
        store.dataStore.data,
        store.seriesConfigs,
        (id) => store.scaleManager.getScale(id),
        (gi) => store.dataStore.getWindow(gi),
        (gi) => store.scaleManager.getGroupXScaleKey(gi),
      );

      // Update selection during drag
      if (dragStartRef.current != null) {
        const sel = selectRef.current;
        const startX = dragStartRef.current.x;
        const plotBox = store.plotBox;

        const clampedCx = Math.max(0, Math.min(cx, plotBox.width));

        sel.show = true;
        sel.left = Math.min(startX, clampedCx);
        sel.top = 0;
        sel.width = Math.abs(clampedCx - startX);
        sel.height = plotBox.height;

        store.selectState = sel;
      }

      store.scheduleRedraw();
    }

    function onMouseDown(e: MouseEvent): void {
      if (e.button !== 0) return; // left click only

      const coords = getPlotCoords(e);
      if (coords == null) return;
      if (!isInPlot(coords.cx, coords.cy)) return;

      dragStartRef.current = { x: coords.cx, y: coords.cy };

      // Reset selection
      const sel = selectRef.current;
      sel.show = false;
      sel.left = 0;
      sel.width = 0;
      store.selectState = sel;
    }

    function onMouseUp(e: MouseEvent): void {
      if (dragStartRef.current == null) return;

      const coords = getPlotCoords(e);
      const sel = selectRef.current;

      // Minimum drag width to trigger zoom (5 CSS pixels)
      if (sel.width > 5 && coords != null) {
        applyZoom(sel);
      }

      // Clear selection
      dragStartRef.current = null;
      sel.show = false;
      sel.left = 0;
      sel.width = 0;
      store.selectState = sel;
      store.scheduleRedraw();
    }

    function onMouseLeave(_e: MouseEvent): void {
      store.cursorManager.hide();

      if (dragStartRef.current != null) {
        dragStartRef.current = null;
        const sel = selectRef.current;
        sel.show = false;
        sel.width = 0;
        store.selectState = sel;
      }

      store.scheduleRedraw();
    }

    function onDblClick(_e: MouseEvent): void {
      // Reset zoom: clear all scale min/max to re-enable auto-ranging
      for (const scale of store.scaleManager.getAllScales()) {
        scale.min = null;
        scale.max = null;
        scale.auto = true;
        invalidateScaleCache(scale);
      }
      store.renderer.clearCache();
      store.scheduleRedraw();
    }

    function applyZoom(sel: SelectState): void {
      const plotBox = store.plotBox;
      const fracLeft = sel.left / plotBox.width;
      const fracRight = (sel.left + sel.width) / plotBox.width;

      // Apply pixel-fraction zoom to all x-scales
      for (const scale of store.scaleManager.getAllScales()) {
        if (scale.ori !== 0) continue; // only x-scales
        if (scale.min == null || scale.max == null) continue;

        const newMin = posToVal(
          plotBox.left + fracLeft * plotBox.width,
          scale,
          plotBox.width,
          plotBox.left,
        );
        const newMax = posToVal(
          plotBox.left + fracRight * plotBox.width,
          scale,
          plotBox.width,
          plotBox.left,
        );

        scale.min = Math.min(newMin, newMax);
        scale.max = Math.max(newMin, newMax);
        scale.auto = false;
        invalidateScaleCache(scale);
      }

      store.renderer.clearCache();
    }

    // Touch support
    function onTouchStart(e: TouchEvent): void {
      const touch = e.touches[0];
      if (touch == null) return;

      const coords = getPlotCoords(touch);
      if (coords == null) return;
      if (!isInPlot(coords.cx, coords.cy)) return;

      dragStartRef.current = { x: coords.cx, y: coords.cy };
    }

    function onTouchMove(e: TouchEvent): void {
      const touch = e.touches[0];
      if (touch == null) return;

      // Synthesize mousemove
      const mouseEvent = new MouseEvent('mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY,
      });
      onMouseMove(mouseEvent);

      // Prevent scroll while dragging in chart
      if (dragStartRef.current != null) {
        e.preventDefault();
      }
    }

    function onTouchEnd(e: TouchEvent): void {
      const touch = e.changedTouches[0];
      if (touch == null) return;

      const mouseEvent = new MouseEvent('mouseup', {
        clientX: touch.clientX,
        clientY: touch.clientY,
      });
      onMouseUp(mouseEvent);
    }

    el.addEventListener('mousemove', onMouseMove);
    el.addEventListener('mousedown', onMouseDown);
    el.addEventListener('mouseup', onMouseUp);
    el.addEventListener('mouseleave', onMouseLeave);
    el.addEventListener('dblclick', onDblClick);
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd);

    return () => {
      el.removeEventListener('mousemove', onMouseMove);
      el.removeEventListener('mousedown', onMouseDown);
      el.removeEventListener('mouseup', onMouseUp);
      el.removeEventListener('mouseleave', onMouseLeave);
      el.removeEventListener('dblclick', onDblClick);
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, [store, containerRef]);
}
