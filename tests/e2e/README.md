# E2E Tests

End-to-end tests using Playwright.

## Status

✅ **10/10 tests passing**

## Running Tests

```bash
# Run all tests
npm run test:e2e

# Run tests in UI mode (recommended for development)
npm run test:e2e:ui

# Run tests in headed mode (see the browser)
npm run test:e2e:headed

# Run tests with debug mode
npm run test:e2e:debug

# Show test report
npm run test:e2e:report
```

## Test Structure

### Working Tests

- `smoke.spec.ts` - Basic app functionality tests
  - App loads correctly
  - Root element has content
  - No critical console errors
  - Responsive design
  - Correct page title
  - Correct language direction (RTL)

- `exploration.spec.ts` - App structure exploration
  - Explores app structure (buttons, links, inputs)
  - Verifies app renders content
  - Verifies no JavaScript errors
  - Verifies app is interactive

## Configuration

See `playwright.config.ts` for full configuration including:
- Browser projects (Chromium, Firefox, WebKit)
- Mobile device emulation (Pixel 5, iPhone 12)
- Web server configuration (port 5173)

## CI/CD

E2E tests run automatically on:
- Push to main/develop branches
- Pull requests to main

See `.github/workflows/e2e.yml` for CI configuration.

## Adding New Tests

To add new feature-specific tests:

1. **Explore the app structure** using the exploration test
2. **Identify the correct selectors** for the elements you want to test
3. **Write tests** using the correct selectors
4. **Run tests** to verify they pass

Example:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test('should do something', async ({ page }) => {
    await page.goto('/');
    
    // Use the correct selector
    await page.getByRole('button', { name: 'Button Text' }).click();
    
    // Verify the result
    await expect(page.getByText('Expected Text')).toBeVisible();
  });
});
```

## Troubleshooting

### Tests fail with "element not found"

The selector doesn't match the actual app UI. Use the exploration test to find the correct selectors.

### Tests timeout

The app might be slow to load. Increase the timeout in the test or check if the dev server is running correctly.

### Dev server doesn't start

Make sure port 5173 is available. The Playwright config uses port 5173 by default.
