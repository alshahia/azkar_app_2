import { test, expect } from '@playwright/test';

test.describe('App Exploration', () => {
  test('should explore the app structure', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Get all buttons
    const buttons = await page.getByRole('button').all();
    console.log('Buttons found:', buttons.length);
    for (const button of buttons) {
      const text = await button.textContent().catch(() => '');
      console.log('Button:', text?.trim());
    }
    
    // Get all links
    const links = await page.getByRole('link').all();
    console.log('Links found:', links.length);
    
    // Get all inputs
    const inputs = await page.locator('input').all();
    console.log('Inputs found:', inputs.length);
    
    // Get all text content
    const bodyText = await page.locator('body').textContent();
    console.log('Body text (first 500 chars):', bodyText?.substring(0, 500));
  });

  test('should verify app renders content', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Root should have content
    const root = page.locator('#root');
    await expect(root).not.toBeEmpty();
    
    // Body should have content
    const bodyText = await page.locator('body').textContent();
    expect(bodyText?.length).toBeGreaterThan(100);
  });

  test('should verify no JavaScript errors', async ({ page }) => {
    const jsErrors: string[] = [];
    
    page.on('pageerror', error => {
      jsErrors.push(error.message);
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // No JavaScript errors should occur
    expect(jsErrors).toEqual([]);
  });

  test('should verify app is interactive', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // App should have clickable elements
    const clickableElements = await page.locator('button, a, [role="button"], [onclick]').count();
    expect(clickableElements).toBeGreaterThan(0);
  });
});
