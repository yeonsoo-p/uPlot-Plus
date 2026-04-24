import { Chart, Scale, Series } from 'uplot-plus';

function generateData() {
  const n = 80;
  const x = Array.from({ length: n }, (_, i) => i);
  const y = x.map(i => Math.sin(i * 0.1) * 30 + 50);
  return [{ x, series: [y] }];
}

export default function ScalePadding() {
  const data = generateData();

  return (
    <div>
      <div className="mb-4">
        <Chart width="auto" height={200} data={data} title="With padding (10%)">
          <Scale
            id="y"
            auto
           
           
            range={{
              min: { pad: 0.1 },
              max: { pad: 0.1 },
            }}
          />
          <Series label="Padded" />
        </Chart>
      </div>
      <div>
        <Chart width="auto" height={200} data={data} title="Without padding (default)">
          <Series label="Default" />
        </Chart>
      </div>
    </div>
  );
}
