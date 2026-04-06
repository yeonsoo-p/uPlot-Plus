import React, { createContext, useMemo, useRef } from 'react';
import type { ChartTheme } from '../types/theme';
import { themeToVars } from '../rendering/theme';

/**
 * Revision counter incremented each time the ThemeProvider's `theme` prop
 * changes.  Chart consumes this context to trigger a canvas repaint when
 * ancestor CSS variables change.
 */
export const ThemeRevisionContext = createContext<number>(0);

export interface ThemeProviderProps {
  /** Theme overrides — mapped to CSS custom properties on a wrapper div. */
  theme: ChartTheme;
  children: React.ReactNode;
}

/**
 * ThemeProvider — sets CSS custom properties on a wrapper `<div>` and
 * provides a revision counter via React context so descendant Chart
 * components can detect ancestor theme changes and repaint the canvas.
 */
export function ThemeProvider({ theme, children }: ThemeProviderProps): React.ReactElement {
  const style = useMemo(() => themeToVars(theme), [theme]);
  const revRef = useRef(0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const revision = useMemo(() => ++revRef.current, [theme]);
  return (
    <ThemeRevisionContext.Provider value={revision}>
      <div style={style}>{children}</div>
    </ThemeRevisionContext.Provider>
  );
}
