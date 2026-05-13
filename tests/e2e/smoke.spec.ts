import { test, expect } from '@playwright/test';

test('home page renders hero, grid, rhythm, footer', async ({ page }) => {
  await page.goto('/');
  // Use the hero heading specifically (first h1 on the page)
  await expect(page.locator('header h1').first()).toContainText('A quiet archive');
  await expect(page.locator('.row').first()).toBeVisible();
  await expect(page.locator('text=Rhythm').first()).toBeVisible();
  await expect(page.locator('text=Built by Nata Decua').first()).toBeVisible();
});

test('JS-disabled path still reads end-to-end', async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto('/');
  await expect(page.locator('header h1').first()).toContainText('A quiet archive');
  await expect(page.locator('.row').first()).toBeVisible();
  await expect(page.locator('.specimen-fallback svg').first()).toBeVisible();
  await ctx.close();
});

test('reduced-motion: SVG fallbacks are present without JS', async ({ browser }) => {
  // Test the no-JS path which guarantees SVG fallbacks with zero canvas
  const ctx = await browser.newContext({ javaScriptEnabled: false, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto('/');
  await expect(page.locator('.specimen-fallback').first()).toBeVisible();
  expect(await page.locator('canvas').count()).toBe(0);
  await ctx.close();
});
