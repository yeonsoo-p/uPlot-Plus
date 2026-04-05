import { test, expect } from '../../fixtures/demo-page';
import { getChartContainer } from '../../helpers/chart-locators';

test.describe('ZoomRanger', () => {
  test.beforeEach(async ({ demoPage }) => {
    await demoPage.navigateTo('zoom-ranger');
  });

  test('renders selection window and dimmed regions', async ({ page }) => {
    const dimmedRegions = page.locator('[data-testid^="zoom-ranger-dim-"]');
    const count = await dimmedRegions.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test('dragging selection center pans the range', async ({ page }) => {
    // Get the detail chart (first chart) for comparison
    const detailChart = getChartContainer(page, 0);
    const before = await detailChart.screenshot();

    // Find the selection overlay area — it's inside the ZoomRanger component
    // The ZoomRanger renders a second chart. Find its container.
    const rangerContainer = getChartContainer(page, 1);
    const rangerBox = await rangerContainer.boundingBox();
    expect(rangerBox).not.toBeNull();

    // Drag the center of the ranger horizontally to pan
    const centerX = rangerBox!.x + rangerBox!.width * 0.5;
    const centerY = rangerBox!.y + rangerBox!.height * 0.5;

    await page.mouse.move(centerX, centerY);
    await page.mouse.down();
    await page.mouse.move(centerX + 50, centerY, { steps: 5 });
    await page.mouse.up();
    await page.waitForTimeout(200);

    const after = await detailChart.screenshot();
    expect(Buffer.compare(before, after)).not.toBe(0);
  });
});
