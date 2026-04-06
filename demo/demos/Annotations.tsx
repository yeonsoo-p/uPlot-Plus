import { Chart, Scale, Series, HLine, VLine, Region, VRegion, AnnotationLabel } from 'uplot-plus';

function generateData() {
  const n = 150;
  const x = Array.from({ length: n }, (_, i) => i);
  const y = x.map(i => Math.sin(i * 0.04) * 30 + 50 + (Math.random() - 0.5) * 8);
  return [{ x, series: [y] }];
}

export default function Annotations() {
  const data = generateData();

  return (
    <div>
      <Chart width={800} height={400} data={data} xlabel="Sample" ylabel="Value">
        <Scale id="y" auto={false} min={10} max={90} />
        <Series group={0} index={0} label="Signal" />

        {/* Shaded region between y=40 and y=60 */}
        <Region yMin={40} yMax={60} fill="rgba(46,204,113,0.12)" stroke="rgba(46,204,113,0.4)" strokeWidth={1} dash={[3, 3]} />

        {/* Vertical region between x=100 and x=130 */}
        <VRegion xMin={100} xMax={130} fill="rgba(52,152,219,0.1)" stroke="rgba(52,152,219,0.3)" strokeWidth={1} dash={[3, 3]} />

        {/* Horizontal threshold lines */}
        <HLine value={65} stroke="#e74c3c" width={1.5} dash={[6, 4]} label="Upper threshold" />
        <HLine value={35} stroke="#3498db" width={1.5} dash={[6, 4]} label="Lower threshold" />

        {/* Vertical marker */}
        <VLine value={75} stroke="#8e44ad" dash={[4, 4]} />

        {/* Labels */}
        <AnnotationLabel x={76} y={80} text="Event" fill="#8e44ad" font="11px sans-serif" />
      </Chart>
    </div>
  );
}
