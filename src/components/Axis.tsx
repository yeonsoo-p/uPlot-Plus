import { useEffect } from 'react';
import type { AxisConfig } from '../types';
import { useChart } from '../hooks/useChart';

export type AxisProps = AxisConfig;

/**
 * Renderless component that registers an axis config with the chart store.
 * Must be a child of <Chart>.
 */
export function Axis(props: AxisProps): null {
  const store = useChart();

  useEffect(() => {
    // Remove existing axis for same scale+side
    store.axisConfigs = store.axisConfigs.filter(
      a => !(a.scale === props.scale && a.side === props.side),
    );
    store.axisConfigs.push({ ...props, show: props.show ?? true });
    store.scheduleRedraw();

    return () => {
      store.axisConfigs = store.axisConfigs.filter(
        a => !(a.scale === props.scale && a.side === props.side),
      );
      store.scheduleRedraw();
    };
  }, [store, props.scale, props.side, props.show, props.label, props.size, props.space, props.font, props.stroke, props.values, props.splits, props.grid, props.ticks, props.border, props.rotate, props.gap, props.incrs, props.labelFont, props.labelSize, props.labelGap]);

  return null;
}
