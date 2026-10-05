import { test, expect } from '@playwright/test';

test.describe('App Smoke Tests', () => {
  test('should load the app', async ({ page }) => {
    await page.goto('/');
    
    // App should load without errors
    await expect(page.locator('body')).toBeVisible();
  });

  test('should have a root element with content', async ({ page }) => {
    await page.goto('/');
    
    // Root element should exist and have content
    const root = page.locator('#root');
    await expect(root).toBeVisible();
    // Root should have some content (app rendered)
    await expect(root).not.toBeEmpty();
  });

  test('should render without critical console errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Filter out known non-critical errors (external API failures, favicon, etc.)
    const criticalErrors = consoleErrors.filter(err => 
      !err.includes('favicon') &&
      !err.includes('DevTools') &&
      !err.includes('Download the React DevTools') &&
      !err.includes('401') && // External API auth errors
      !err.includes('Unauthorized') &&
      !err.includes('Failed to load resource') // Resource loading errors
    );
    
    expect(criticalErrors).toEqual([]);
  });

  test('should be responsive', async ({ page }) => {
    await page.goto('/');
    
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('body')).toBeVisible();
    
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('body')).toBeVisible();
    
    // Set desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });
    await expect(page.locator('body')).toBeVisible();
  });

  test('should have correct page title', async ({ page }) => {
    await page.goto('/');
    
    // Page title should be set
    await expect(page).toHaveTitle(/Azkar App/);
  });

  test('should have correct language direction', async ({ page }) => {
    await page.goto('/');
    
    // HTML should have RTL direction for Arabic
    const html = page.locator('html');
    await expect(html).toHaveAttribute('dir', 'rtl');
    await expect(html).toHaveAttribute('lang', 'ar');
  });
});
