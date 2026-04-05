import { measureLabelWidth } from './textMeasure';
import {
  PANEL_BORDER,
  PANEL_PAD_X,
  PANEL_PAD_Y,
  ROW_PAD_X,
  SWATCH_W as ROW_SWATCH_W,
  ROW_GAP,
  PANEL_FONT,
  PANEL_BOLD_FONT,
  ROW_LINE_H,
} from '../components/overlay/tokens';

export interface PanelContent {
  header?: string;
  rows: Array<{ label: string; value?: string }>;
}

export function estimatePanelSize(content: PanelContent): { w: number; h: number } {
  let maxRowW = 0;
  for (const row of content.rows) {
    const labelW = measureLabelWidth(row.label, PANEL_FONT);
    const valueW = row.value ? measureLabelWidth(row.value, PANEL_BOLD_FONT) : 0;
    const rowW = ROW_PAD_X * 2 + ROW_SWATCH_W + ROW_GAP + labelW + (row.value ? ROW_GAP + valueW : 0);
    if (rowW > maxRowW) maxRowW = rowW;
  }

  let headerW = 0;
  let headerH = 0;
  if (content.header) {
    headerW = measureLabelWidth(content.header, PANEL_BOLD_FONT) + 8;
    headerH = ROW_LINE_H + 2;
  }

  return {
    w: PANEL_BORDER * 2 + PANEL_PAD_X * 2 + Math.max(maxRowW, headerW),
    h: PANEL_BORDER * 2 + PANEL_PAD_Y * 2 + headerH + content.rows.length * ROW_LINE_H,
  };
}
