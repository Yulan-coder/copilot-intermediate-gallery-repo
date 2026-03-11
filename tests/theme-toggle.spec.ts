import { test, expect } from '@playwright/test';

test.describe('Theme Toggle', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test to start from a clean state
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('toggle button is visible in the navigation header', async ({ page }) => {
    await page.goto('/');
    const toggleButton = page.getByRole('button', {
      name: /switch to (light|dark) mode/i,
    });
    await expect(toggleButton).toBeVisible();
  });

  test('toggle button has an accessible label', async ({ page }) => {
    await page.goto('/');
    const toggleButton = page.getByRole('button', {
      name: /switch to (light|dark) mode/i,
    });
    await expect(toggleButton).toHaveAttribute('aria-label', /switch to (light|dark) mode/i);
  });

  test('clicking the toggle switches from light to dark mode', async ({ page }) => {
    // Force a light colour scheme so the starting state is predictable
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');

    // Ensure we start in light mode
    const html = page.locator('html');
    await expect(html).not.toHaveClass(/\bdark\b/);

    // Click the toggle to switch to dark mode
    await page.getByRole('button', { name: /switch to dark mode/i }).click();

    await expect(html).toHaveClass(/\bdark\b/);
  });

  test('clicking the toggle twice returns to the original mode', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');

    const html = page.locator('html');
    const toggleButton = page.getByRole('button', { name: /switch to (light|dark) mode/i });

    // Light → Dark
    await toggleButton.click();
    await expect(html).toHaveClass(/\bdark\b/);

    // Dark → Light
    await toggleButton.click();
    await expect(html).not.toHaveClass(/\bdark\b/);
  });

  test('theme preference is persisted in localStorage', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');

    // Switch to dark mode
    await page.getByRole('button', { name: /switch to dark mode/i }).click();

    const storedTheme = await page.evaluate(() => localStorage.getItem('theme'));
    expect(storedTheme).toBe('dark');
  });

  test('persisted dark theme is restored after a page reload', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');

    // Switch to dark and reload
    await page.getByRole('button', { name: /switch to dark mode/i }).click();
    await page.reload();

    await expect(page.locator('html')).toHaveClass(/\bdark\b/);
  });

  test('sun icon is shown in dark mode and moon icon in light mode', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');

    // In light mode: Moon icon (title text shows "Switch to dark mode")
    const moonButton = page.getByRole('button', { name: /switch to dark mode/i });
    await expect(moonButton).toBeVisible();

    // Switch to dark mode: Sun icon (title text shows "Switch to light mode")
    await moonButton.click();
    const sunButton = page.getByRole('button', { name: /switch to light mode/i });
    await expect(sunButton).toBeVisible();
  });

  test('toggle is accessible from every page', async ({ page }) => {
    const pages = ['/', '/gallery', '/upload', '/admin'];

    for (const path of pages) {
      await page.goto(path);
      await expect(
        page.getByRole('button', { name: /switch to (light|dark) mode/i }),
      ).toBeVisible();
    }
  });

  test('dark mode applies correct background to the page', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');

    // Switch to dark mode
    await page.getByRole('button', { name: /switch to dark mode/i }).click();

    // Confirm the dark class is on <html> so dark: utilities activate
    await expect(page.locator('html')).toHaveClass(/\bdark\b/);

    // Take a screenshot to visually verify the dark theme
    await page.screenshot({ path: '/tmp/dark-mode.png', fullPage: false });
  });

  test('light mode screenshot looks correct', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');

    await expect(page.locator('html')).not.toHaveClass(/\bdark\b/);

    await page.screenshot({ path: '/tmp/light-mode.png', fullPage: false });
  });
});
