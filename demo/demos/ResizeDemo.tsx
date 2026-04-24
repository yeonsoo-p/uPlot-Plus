import { useState, useMemo } from 'react';
import { Chart, Series, Legend } from 'uplot-plus';

export default function ResizeDemo() {
  const [width, setWidth] = useState(800);
  const [height, setHeight] = useState(400);

  const data = useMemo(() => {
    const n = 200;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = x.map(i => Math.sin(i * 0.05) * 40 + 50 + (Math.random() - 0.5) * 5);
    return [{ x, series: [y] }];
  }, []);

  return (
    <div>
      <div className="mb-3 flex gap-6 items-center">
        <label>
          Width: {width}px
          <input
            type="range"
            min={300}
            max={1200}
            value={width}
            onChange={e => setWidth(Number(e.target.value))}
            className="ml-2 w-50"
          />
        </label>
        <label>
          Height: {height}px
          <input
            type="range"
            min={150}
            max={600}
            value={height}
            onChange={e => setHeight(Number(e.target.value))}
            className="ml-2 w-50"
          />
        </label>
      </div>
      <div className="inline-block border border-dashed border-gray-300">
        <Chart width={width} height={height} data={data} xlabel="Index" ylabel="Value">
          <Series label="Signal" />
          <Legend />
        </Chart>
      </div>
    </div>
  );
}
