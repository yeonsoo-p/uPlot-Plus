import { Chart, Series, Legend } from 'uplot-plus';

function generateTempData() {
  const n = 200;
  const x = Array.from({ length: n }, (_, i) => i);
  const y = x.map(i => Math.sin(i * 0.05) * 30 + 50 + (Math.random() - 0.5) * 5);
  return [{ x, series: [y] }];
}

function generateHumidityData() {
  const n = 200;
  const x = Array.from({ length: n }, (_, i) => i);
  const y = x.map(i => Math.cos(i * 0.03) * 20 + 40 + (Math.random() - 0.5) * 8);
  return [{ x, series: [y] }];
}

export default function CursorBind() {
  const data1 = generateTempData();

  const data2 = generateHumidityData();

  return (
    <div>
      <div className="mb-4">
        <Chart width={800} height={200} data={data1} syncKey="bind" xlabel="Index" ylabel="Temperature">
          <Series group={0} index={0} label="Temp (C)" />
          <Legend />
        </Chart>
      </div>
      <Chart width={800} height={200} data={data2} syncKey="bind" xlabel="Index" ylabel="Humidity">
        <Series group={0} index={0} label="Humidity (%)" />
        <Legend />
      </Chart>
    </div>
  );
}
