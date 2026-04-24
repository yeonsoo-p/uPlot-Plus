import type { AxisConfig } from '../types';
import { Side } from '../types';
import { useRegisterConfig } from '../hooks/useRegisterConfig';

export type AxisProps = Omit<AxisConfig, 'side'> & { side?: Side };

function resolveAxis(p: AxisProps): AxisConfig {
  const autoSide = p.side == null;
  return {
    ...p,
    side: p.side ?? (p.scale === 'x' ? Side.Bottom : Side.Left),
    show: p.show ?? true,
    _autoSide: autoSide,
  };
}

/**
 * Renderless component that registers an axis config with the chart store.
 * Must be a child of <Chart>.
 */
export function Axis(props: AxisProps): null {
  const resolved = resolveAxis(props);

  useRegisterConfig(
    resolved,
    [resolved.scale, resolved.side, resolved._autoSide],
    (store, cfg) => store.registerAxis(cfg),
    (store, cfg) => store.unregisterAxis(cfg),
    (store, cfg) => store.updateAxis(cfg),
  );
  return null;
}
