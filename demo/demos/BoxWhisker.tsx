import { Chart, Axis, BoxWhisker, fmtLabels } from 'uplot-plus';
import type { ChartData } from 'uplot-plus';

interface BoxData {
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
}

function generateBoxData(categories: number): { boxes: BoxData[]; chartData: ChartData } {
  const boxes: BoxData[] = [];

  for (let i = 0; i < categories; i++) {
    const center = 30 + Math.random() * 60;
    const spread = 5 + Math.random() * 20;
    const min = center - spread - Math.random() * 10;
    const q1 = center - spread * 0.5;
    const median = center + (Math.random() - 0.5) * spread * 0.3;
    const q3 = center + spread * 0.5;
    const max = center + spread + Math.random() * 10;
    boxes.push({ min, q1, median, q3, max });
  }

  // Minimal placeholder data for axis rendering
  const x = Array.from({ length: categories }, (_, i) => i + 1);
  return { boxes, chartData: [{ x, series: [x.map(() => 0)] }] };
}

const CATEGORIES = 10;
const categoryLabels = Array.from({ length: CATEGORIES }, (_, i) => `Cat ${i + 1}`);

export default function BoxWhiskerDemo() {
  const { boxes, chartData } = generateBoxData(CATEGORIES);

  return (
    <Chart width="auto" height={400} data={chartData} ylabel="Value">
      <Axis scale="x" label="Category" values={fmtLabels(categoryLabels, 1)} />
      <Axis scale="y" />
      <BoxWhisker boxes={boxes} />
    </Chart>
  );
}
