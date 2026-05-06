import { test, expect } from '@playwright/test';

test.describe('Portal landing', () => {
  test('renders hero and live counters', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.hero__title')).toBeVisible();
    await expect(page.locator('#ls-total')).toBeVisible();
    // wait for live counters to populate (poll fires when section in view)
    await page.locator('.livestats').scrollIntoViewIfNeeded();
    await expect(page.locator('#ls-total')).not.toHaveText('—', { timeout: 10000 });
  });

  test('multi-tenant compare shows both hotels', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Le Royal Lyon')).toBeVisible();
    await expect(page.getByText('Le Negresco')).toBeVisible();
  });

  test('apps grid links to all four touchpoints', async ({ page }) => {
    await page.goto('/');
    const grid = page.locator('.apps__grid');
    await expect(grid).toBeVisible();
    await expect(grid.locator('a, button')).toHaveCount(4);
  });
});
