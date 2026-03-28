import { Chart } from './Chart';
import { Scale } from './Scale';
import { Series } from './Series';
import { Axis } from './Axis';
import type { DataInput, ColorValue } from '../types';
import type { PathBuilder } from '../paths/types';

export interface SparklineProps {
  /** Chart data — accepts {x,y}, [{x,y}], or [{x, series:[...]}] */
  data: DataInput;
  /** Width in CSS pixels (default: 150) */
  width?: number;
  /** Height in CSS pixels (default: 30) */
  height?: number;
  /** Line/bar color (default: '#03a9f4') */
  stroke?: ColorValue;
  /** Fill color */
  fill?: ColorValue;
  /** Line width in CSS pixels (default: 1) */
  lineWidth?: number;
  /** Path builder — pass bars() for bar sparklines (default: linear) */
  paths?: PathBuilder;
  /** Fill target value (e.g. 0 for bars) */
  fillTo?: number;
  /** CSS class name for the wrapper div */
  className?: string;
}

/**
 * Compact inline chart with no axes or interaction.
 * Ideal for sparklines in tables and dashboards.
 */
export function Sparkline({
  data,
  width = 150,
  height = 30,
  stroke = '#03a9f4',
  fill,
  lineWidth = 1,
  paths,
  fillTo,
  className,
}: SparklineProps): React.JSX.Element {
  return (
    <div style={{ pointerEvents: 'none' }} className={className}>
      <Chart width={width} height={height} data={data}>
        <Scale id="x" />
        <Scale id="y" />
        <Axis scale="x" show={false} />
        <Axis scale="y" show={false} />
        <Series
          group={0}
          index={0}
          yScale="y"
          stroke={stroke}
          fill={fill}
          width={lineWidth}
          paths={paths}
          fillTo={fillTo}
        />
      </Chart>
    </div>
  );
}
