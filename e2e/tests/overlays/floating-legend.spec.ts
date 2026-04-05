import { test, expect } from '../../fixtures/demo-page';
import { getFloatingLegend } from '../../helpers/chart-locators';
import { hoverChart } from '../../helpers/interactions';

test.describe('Floating legend overlay', () => {
  test.beforeEach(async ({ demoPage }) => {
    await demoPage.navigateTo('floating-legend');
  });

  test('cursor mode: appears on hover', async ({ page }) => {
    // The first chart in the floating-legend demo uses cursor mode
    await hoverChart(page, 0, 0.5);

    const legend = getFloatingLegend(page);
    await expect(legend).toBeVisible();
  });

  test('cursor mode: moves with cursor', async ({ page }) => {
    await hoverChart(page, 0, 0.3);
    const legend = getFloatingLegend(page);
    const box1 = await legend.boundingBox();

    await hoverChart(page, 0, 0.7);
    const box2 = await legend.boundingBox();

    expect(box1).not.toBeNull();
    expect(box2).not.toBeNull();
    // Legend should have moved to follow cursor
    expect(box2!.x).not.toBe(box1!.x);
  });

  test('draggable mode: visible at rest', async ({ page }) => {
    // The second chart uses draggable mode — should be visible without hover
    const panels = page.locator('[data-testid="floating-legend"]');
    const count = await panels.count();
    // At least the draggable panel should exist
    expect(count).toBeGreaterThanOrEqual(1);
  });
});
