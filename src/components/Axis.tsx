import type { AxisConfig } from '../types';
import { Side } from '../types';
import { useRegisterConfig } from '../hooks/useRegisterConfig';

export type AxisProps = Omit<AxisConfig, 'side'> & { side?: Side };

function resolveAxis(p: AxisProps): AxisConfig {
  return { ...p, side: p.side ?? (p.scale === 'x' ? Side.Bottom : Side.Left), show: p.show ?? true };
}

/**
 * Renderless component that registers an axis config with the chart store.
 * Must be a child of <Chart>.
 */
export function Axis(props: AxisProps): null {
  const resolved = resolveAxis(props);

  useRegisterConfig(
    resolved,
    [resolved.scale, resolved.side],
    (store, cfg) => store.registerAxis(cfg),
    (store, cfg) => store.unregisterAxis(cfg.scale, cfg.side),
    (store, cfg) => store.updateAxis(cfg),
  );
  return null;
}
