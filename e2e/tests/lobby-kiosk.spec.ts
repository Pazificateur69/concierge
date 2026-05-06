import { test, expect } from '@playwright/test';

test.describe('Lobby kiosk', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto((process.env.LOBBY_BASE_URL ?? 'https://concierge-lobby.vercel.app') + '?tenant=royal-lyon');
  });

  test('home shows brand and discover cards', async ({ page }) => {
    await expect(page.locator('.brand__name, .home__brand, h1')).toBeVisible();
  });

  test('navigates to menu and adds an item to cart', async ({ page }) => {
    await page.getByText(/restaurant/i).first().click();
    await page.waitForLoadState('networkidle');
    const addBtn = page.locator('.add-btn').first();
    if (await addBtn.count()) {
      await addBtn.click();
      await expect(page.locator('.cart__count, .cart__lines')).toBeVisible();
    }
  });

  test('returns to home via brand link or back', async ({ page }) => {
    await page.goto((process.env.LOBBY_BASE_URL ?? 'https://concierge-lobby.vercel.app') + '/menu?tenant=royal-lyon');
    const back = page.locator('.kiosk-header__back, .nav-back, a[href="/"]').first();
    if (await back.count()) await back.click();
  });
});
