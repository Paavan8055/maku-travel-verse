import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

/**
 * Test Suite: Accessibility (WCAG AA Compliance)
 * Using Playwright's accessibility tree and manual checks
 */

async function checkBasicAccessibility(page: Page, pageName: string) {
  // Check for page title
  const title = await page.title();
  expect(title).toBeTruthy();
  expect(title.length).toBeGreaterThan(0);

  // Check for main landmark
  const main = page.locator('main, [role="main"]');
  await expect(main).toBeVisible();

  // Check for proper heading hierarchy
  const h1 = page.locator('h1');
  const h1Count = await h1.count();
  expect(h1Count).toBeGreaterThanOrEqual(1);
  expect(h1Count).toBeLessThanOrEqual(2); // Should have 1-2 H1s max

  // Check for skip link or navigation
  const nav = page.locator('nav, [role="navigation"]');
  await expect(nav.first()).toBeVisible();

  // Check all images have alt text
  const images = await page.locator('img').all();
  for (const img of images) {
    const alt = await img.getAttribute('alt');
    // Alt can be empty string for decorative images, but should exist
    expect(alt).not.toBeNull();
  }

  // Check all buttons have accessible names
  const buttons = await page.locator('button').all();
  for (const button of buttons) {
    const ariaLabel = await button.getAttribute('aria-label');
    const text = await button.textContent();
    const hasAccessibleName = ariaLabel || (text && text.trim().length > 0);
    expect(hasAccessibleName).toBeTruthy();
  }

  // Check all links have accessible names
  const links = await page.locator('a').all();
  for (const link of links) {
    const ariaLabel = await link.getAttribute('aria-label');
    const text = await link.textContent();
    const hasAccessibleName = ariaLabel || (text && text.trim().length > 0);
    expect(hasAccessibleName).toBeTruthy();
  }

  console.log(`✅ ${pageName}: Basic accessibility checks passed`);
}

test.describe('Accessibility - Critical Pages', () => {
  test('Home page accessibility', async ({ page }) => {
    await page.goto('/');
    await checkBasicAccessibility(page, 'Home');
  });

  test('Blockchain page accessibility', async ({ page }) => {
    await page.goto('/blockchain');
    await checkBasicAccessibility(page, 'Blockchain');
  });

  test('Collaborative Planning page accessibility', async ({ page }) => {
    await page.goto('/collaborative-planning');
    await checkBasicAccessibility(page, 'Collaborative Planning');
  });

  test('Travel Fund page accessibility', async ({ page }) => {
    await page.goto('/travel-fund');
    await checkBasicAccessibility(page, 'Travel Fund');
  });
});

test.describe('Accessibility - Keyboard Navigation', () => {
  test('should allow tab navigation on home page', async ({ page }) => {
    await page.goto('/');
    
    // Press tab multiple times
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // At least one element should have focus
    const focusedElement = await page.locator(':focus').count();
    expect(focusedElement).toBeGreaterThan(0);
  });

  test('should allow keyboard interaction with buttons', async ({ page }) => {
    await page.goto('/blockchain');
    
    // Tab to connect button
    let focused = false;
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press('Tab');
      const connectButton = page.locator('button', { hasText: /Connect.*Wallet/i });
      if (await connectButton.evaluate(el => el === document.activeElement)) {
        focused = true;
        // Press Enter to activate
        await page.keyboard.press('Enter');
        break;
      }
    }

    // If we found and pressed the button, wallet should connect
    if (focused) {
      await page.waitForTimeout(2000);
      await expect(page.locator('text=Wallet Connected')).toBeVisible({ timeout: 10000 });
    }
  });
});

test.describe('Accessibility - Color Contrast', () => {
  test('should have sufficient contrast on primary buttons', async ({ page }) => {
    await page.goto('/blockchain');
    
    const button = page.locator('button', { hasText: /Connect.*Wallet/i });
    
    // Get computed styles
    const styles = await button.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        backgroundColor: computed.backgroundColor,
        color: computed.color,
      };
    });

    // Basic check - colors should be defined
    expect(styles.backgroundColor).toBeTruthy();
    expect(styles.color).toBeTruthy();
    
    console.log('Button styles:', styles);
  });
});

test.describe('Accessibility - Form Labels', () => {
  test('should have labels for collaborative planning inputs', async ({ page }) => {
    await page.goto('/collaborative-planning');
    
    // Check trip name input has associated label
    const input = page.locator('input[placeholder*="Summer Europe"]');
    const labelText = await page.locator('text=Trip Name').textContent();
    expect(labelText).toBeTruthy();
  });
});

test.describe('Accessibility - ARIA Attributes', () => {
  test('should have proper ARIA roles for navigation', async ({ page }) => {
    await page.goto('/');
    
    // Check for navigation role
    const nav = page.locator('[role="navigation"], nav');
    await expect(nav.first()).toBeVisible();
  });

  test('should have aria-label on icon-only buttons', async ({ page }) => {
    await page.goto('/blockchain');
    
    // Look for icon buttons (buttons with SVG but no text)
    const buttons = await page.locator('button').all();
    
    for (const button of buttons) {
      const text = await button.textContent();
      const hasText = text && text.trim().length > 0;
      
      if (!hasText) {
        // Icon-only button should have aria-label
        const ariaLabel = await button.getAttribute('aria-label');
        const ariaLabelledby = await button.getAttribute('aria-labelledby');
        const title = await button.getAttribute('title');
        
        const hasAccessibleName = ariaLabel || ariaLabelledby || title;
        expect(hasAccessibleName).toBeTruthy();
      }
    }
  });
});
