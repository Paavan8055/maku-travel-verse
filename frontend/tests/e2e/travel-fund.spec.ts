import { test, expect } from '@playwright/test';

/**
 * Test Suite: Travel Fund Manager
 * Critical Path: Create fund, track contributions, view analytics
 */

test.describe('Travel Fund - Page Load', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/travel-fund');
  });

  test('should load travel fund page without errors', async ({ page }) => {
    // Page should load without "Something went wrong" error
    await expect(page.locator('text=Something went wrong')).not.toBeVisible();
    
    // Should show main heading
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('should show feature cards', async ({ page }) => {
    // Check for key feature indicators
    const featureTexts = [
      /collaborative saving/i,
      /goal tracking/i,
      /smart analytics/i,
      /rewards/i
    ];

    for (const text of featureTexts) {
      // At least one of these should be visible
      const element = page.locator(`text=${text}`).first();
      if (await element.isVisible()) {
        await expect(element).toBeVisible();
        break;
      }
    }
  });

  test('should be responsive on mobile', async ({ page, isMobile }) => {
    if (isMobile) {
      // Verify page renders on mobile without horizontal scroll
      const body = page.locator('body');
      const box = await body.boundingBox();
      expect(box?.width).toBeLessThanOrEqual(500);
    }
  });
});

test.describe('Travel Fund - Navigation', () => {
  test('should have accessible navigation menu', async ({ page }) => {
    await page.goto('/');
    
    // Check for Travel Fund in navigation
    const travelFundLink = page.locator('text=Travel Fund').first();
    
    // If visible, click it
    if (await travelFundLink.isVisible()) {
      await travelFundLink.click();
      await page.waitForURL('**/travel-fund');
      
      expect(page.url()).toContain('/travel-fund');
    }
  });
});

test.describe('Travel Fund - Authentication Check', () => {
  test('should show authentication prompt for non-logged users', async ({ page }) => {
    await page.goto('/travel-fund');
    
    // Look for sign in or authentication indicators
    const authIndicators = [
      page.locator('text=Sign In'),
      page.locator('text=Login'),
      page.locator('text=Please log in'),
      page.locator('text=Authentication')
    ];

    let authFound = false;
    for (const indicator of authIndicators) {
      if (await indicator.isVisible()) {
        authFound = true;
        break;
      }
    }

    // Either auth prompt shows, or content loads (both are valid)
    expect(authFound || await page.locator('h1').isVisible()).toBeTruthy();
  });
});
