import { useMemo, useReducer } from 'react';
import { Chart, Series, Band, Legend, Tooltip, HLine, Region, ThemeProvider } from 'uplot-plus';
import type { ChartTheme } from 'uplot-plus';

// --- Demo data: line series + band + annotation targets ---
const n = 50;
const x = Array.from({ length: n }, (_, i) => i);
const s1 = x.map(i => Math.sin(i * 0.12) * 25 + 55);
const s2 = x.map(i => Math.cos(i * 0.1) * 20 + 50);
const upper = s1.map(v => v + 6);
const lower = s1.map(v => v - 6);
const data = [{ x, series: [s1, s2, upper, lower] }];

// --- State shape ---
interface ThemeState {
  axisStroke: string;
  gridStroke: string;
  titleFill: string;
  bandFill: string;
  seriesColor1: string;
  seriesColor2: string;
  cursorStroke: string;
  cursorWidth: number;
  cursorPointRadius: number;
  cursorPointFill: string;
  selectFill: string;
  selectStroke: string;
  annotationStroke: string;
  annotationFill: string;
  annotationLabelFill: string;
  panelBg: string;
  panelBorder: string;
  bg: string;
}

const defaults: ThemeState = {
  axisStroke: '#ccc',
  gridStroke: 'rgba(255,255,255,0.08)',
  titleFill: '#e0e0e0',
  bandFill: 'rgba(100,181,246,0.12)',
  seriesColor1: '#64b5f6',
  seriesColor2: '#81c784',
  cursorStroke: '#90caf9',
  cursorWidth: 1,
  cursorPointRadius: 4,
  cursorPointFill: '#1e1e1e',
  selectFill: 'rgba(255,255,255,0.06)',
  selectStroke: 'rgba(255,255,255,0.15)',
  annotationStroke: '#ff6b6b',
  annotationFill: 'rgba(255,100,100,0.1)',
  annotationLabelFill: '#ff6b6b',
  panelBg: 'rgba(30,30,30,0.95)',
  panelBorder: '#555',
  bg: '#1e1e1e',
};

type Action = { key: keyof ThemeState; value: string | number };

function reducer(state: ThemeState, action: Action): ThemeState {
  return { ...state, [action.key]: action.value };
}

// --- Controls ---
function ColorCtrl({ label, value, field, dispatch }: { label: string; value: string; field: keyof ThemeState; dispatch: React.Dispatch<Action> }) {
  return (
    <label className="flex items-center gap-1.5 min-w-0">
      <input type="color" value={value.startsWith('rgba') || value.startsWith('#') && value.length > 7 ? '#888888' : value} onChange={e => dispatch({ key: field, value: e.target.value })} className="w-5 h-5 border-0 p-0 cursor-pointer" />
      <span className="text-[11px] font-mono truncate">{label}</span>
    </label>
  );
}

function NumCtrl({ label, value, field, min, max, dispatch }: { label: string; value: number; field: keyof ThemeState; min: number; max: number; dispatch: React.Dispatch<Action> }) {
  return (
    <label className="flex items-center gap-1.5 min-w-0">
      <input type="range" min={min} max={max} step={1} value={value} onChange={e => dispatch({ key: field, value: Number(e.target.value) })} className="w-14 h-3" />
      <span className="text-[11px] font-mono truncate">{label}</span>
      <span className="text-[10px] text-gray-500">{value}</span>
    </label>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <h5 className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-1.5">{title}</h5>
      <div className="flex flex-wrap gap-x-4 gap-y-1">{children}</div>
    </div>
  );
}

export default function ThemeExplorer() {
  const [state, dispatch] = useReducer(reducer, defaults);

  const theme: ChartTheme = useMemo(() => ({
    axisStroke: state.axisStroke,
    gridStroke: state.gridStroke,
    titleFill: state.titleFill,
    bandFill: state.bandFill,
    seriesColors: [state.seriesColor1, state.seriesColor2, state.seriesColor1, state.seriesColor2],
    cursor: {
      stroke: state.cursorStroke,
      width: state.cursorWidth,
      pointRadius: state.cursorPointRadius,
      pointFill: state.cursorPointFill,
    },
    select: { fill: state.selectFill, stroke: state.selectStroke },
    annotation: { stroke: state.annotationStroke, fill: state.annotationFill, labelFill: state.annotationLabelFill },
    overlay: { panelBg: state.panelBg, panelBorder: state.panelBorder },
  }), [state]);

  return (
    <div>
      <div className="grid grid-cols-[280px_1fr] gap-4">
        <div className="text-sm overflow-y-auto max-h-125 pr-2">
          <Section title="Axes & Grid">
            <ColorCtrl label="axisStroke" value={state.axisStroke} field="axisStroke" dispatch={dispatch} />
            <ColorCtrl label="gridStroke" value={state.gridStroke} field="gridStroke" dispatch={dispatch} />
            <ColorCtrl label="titleFill" value={state.titleFill} field="titleFill" dispatch={dispatch} />
          </Section>

          <Section title="Series">
            <ColorCtrl label="seriesColors[0]" value={state.seriesColor1} field="seriesColor1" dispatch={dispatch} />
            <ColorCtrl label="seriesColors[1]" value={state.seriesColor2} field="seriesColor2" dispatch={dispatch} />
            <ColorCtrl label="bandFill" value={state.bandFill} field="bandFill" dispatch={dispatch} />
          </Section>

          <Section title="Cursor">
            <ColorCtrl label="cursor.stroke" value={state.cursorStroke} field="cursorStroke" dispatch={dispatch} />
            <ColorCtrl label="cursor.pointFill" value={state.cursorPointFill} field="cursorPointFill" dispatch={dispatch} />
            <NumCtrl label="cursor.width" value={state.cursorWidth} field="cursorWidth" min={1} max={4} dispatch={dispatch} />
            <NumCtrl label="cursor.pointRadius" value={state.cursorPointRadius} field="cursorPointRadius" min={0} max={8} dispatch={dispatch} />
          </Section>

          <Section title="Selection">
            <ColorCtrl label="select.fill" value={state.selectFill} field="selectFill" dispatch={dispatch} />
            <ColorCtrl label="select.stroke" value={state.selectStroke} field="selectStroke" dispatch={dispatch} />
          </Section>

          <Section title="Annotations">
            <ColorCtrl label="annotation.stroke" value={state.annotationStroke} field="annotationStroke" dispatch={dispatch} />
            <ColorCtrl label="annotation.fill" value={state.annotationFill} field="annotationFill" dispatch={dispatch} />
            <ColorCtrl label="annotation.labelFill" value={state.annotationLabelFill} field="annotationLabelFill" dispatch={dispatch} />
          </Section>

          <Section title="Overlay">
            <ColorCtrl label="overlay.panelBg" value={state.panelBg} field="panelBg" dispatch={dispatch} />
            <ColorCtrl label="overlay.panelBorder" value={state.panelBorder} field="panelBorder" dispatch={dispatch} />
          </Section>

          <Section title="Background">
            <ColorCtrl label="container bg" value={state.bg} field="bg" dispatch={dispatch} />
          </Section>

          <button
            className="mt-2 px-3 py-1 rounded border text-xs text-gray-400 hover:text-gray-200 transition-colors"
            onClick={() => {
              for (const key of Object.keys(defaults)) {
                const k = key as keyof ThemeState; // eslint-disable-line @typescript-eslint/consistent-type-assertions -- iterating known keys of a const object
                dispatch({ key: k, value: defaults[k] });
              }
            }}
          >
            Reset to Defaults
          </button>
        </div>

        <ThemeProvider theme={theme}>
          <div style={{ background: state.bg, padding: 10, borderRadius: 6, transition: 'background 0.3s' }}>
            <Chart width={500} height={380} data={data} title="Theme Explorer Preview">
              <Series label="Series A" />
              <Series label="Series B" />
              <Series label="Upper" dash={[4, 4]} />
              <Series label="Lower" dash={[4, 4]} />
              <Band series={[2, 3]} group={0} />
              <HLine value={55} />
              <Region yMin={45} yMax={65} />
              <Legend />
              <Tooltip />
            </Chart>
          </div>
        </ThemeProvider>
      </div>
    </div>
  );
}
