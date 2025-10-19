import { test, expect } from '@playwright/test';

/**
 * Test Suite: Wallet Connection Flow
 * Critical Path: User connects wallet, views balances, claims cashback
 */

test.describe('Blockchain Rewards - Wallet Connection', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/blockchain');
  });

  test('should load blockchain rewards page', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('MAKU Blockchain Rewards');
    await expect(page.locator('text=Connect Your Wallet')).toBeVisible();
  });

  test('should show connect wallet button', async ({ page }) => {
    const connectButton = page.locator('button', { hasText: /Connect.*Wallet|Use Mock Wallet/i });
    await expect(connectButton).toBeVisible();
    await expect(connectButton).toBeEnabled();
  });

  test('should connect mock wallet and display balance', async ({ page }) => {
    // Click connect button
    const connectButton = page.locator('button', { hasText: /Connect.*Wallet|Use Mock Wallet/i });
    await connectButton.click();

    // Wait for wallet to connect
    await page.waitForTimeout(2000);

    // Verify connected state
    await expect(page.locator('text=Wallet Connected')).toBeVisible({ timeout: 10000 });
    
    // Verify balance display
    await expect(page.locator('text=MAKU Balance')).toBeVisible();
    await expect(page.locator('text=MATIC Balance')).toBeVisible();
  });

  test('should display wallet address after connection', async ({ page }) => {
    const connectButton = page.locator('button', { hasText: /Connect.*Wallet|Use Mock Wallet/i });
    await connectButton.click();
    
    await page.waitForTimeout(2000);

    // Check for wallet address display (0x...)
    const addressElement = page.locator('code').filter({ hasText: /0x[a-fA-F0-9]{6}/ });
    await expect(addressElement).toBeVisible({ timeout: 10000 });
  });

  test('should show NFT section after connection', async ({ page }) => {
    const connectButton = page.locator('button', { hasText: /Connect.*Wallet|Use Mock Wallet/i });
    await connectButton.click();
    
    await page.waitForTimeout(2000);

    await expect(page.locator('text=Your NFT Memberships')).toBeVisible({ timeout: 10000 });
  });

  test('should display tier information', async ({ page }) => {
    // Check tier cards are visible
    await expect(page.locator('text=Bronze')).toBeVisible();
    await expect(page.locator('text=Silver')).toBeVisible();
    await expect(page.locator('text=Gold')).toBeVisible();
    await expect(page.locator('text=Platinum')).toBeVisible();

    // Check cashback percentages
    await expect(page.locator('text=1%')).toBeVisible();
    await expect(page.locator('text=3%')).toBeVisible();
    await expect(page.locator('text=6%')).toBeVisible();
    await expect(page.locator('text=10%')).toBeVisible();
  });

  test('should show disconnect button after connection', async ({ page }) => {
    const connectButton = page.locator('button', { hasText: /Connect.*Wallet|Use Mock Wallet/i });
    await connectButton.click();
    
    await page.waitForTimeout(2000);

    const disconnectButton = page.locator('button', { hasText: /Disconnect/i });
    await expect(disconnectButton).toBeVisible({ timeout: 10000 });
  });

  test('should allow disconnect and return to initial state', async ({ page }) => {
    // Connect wallet
    const connectButton = page.locator('button', { hasText: /Connect.*Wallet|Use Mock Wallet/i });
    await connectButton.click();
    await page.waitForTimeout(2000);

    // Disconnect
    const disconnectButton = page.locator('button', { hasText: /Disconnect/i });
    await disconnectButton.click();

    // Verify back to initial state
    await expect(page.locator('text=Connect Your Wallet')).toBeVisible({ timeout: 5000 });
  });

  test('should be responsive on mobile', async ({ page, isMobile }) => {
    if (isMobile) {
      const connectButton = page.locator('button', { hasText: /Connect.*Wallet|Use Mock Wallet/i });
      await expect(connectButton).toBeVisible();
      
      // Verify button is full width on mobile
      const buttonBox = await connectButton.boundingBox();
      expect(buttonBox?.width).toBeGreaterThan(200);
    }
  });
});

test.describe('Cashback Claiming Flow', () => {
  test('should display claim button when cashback is available', async ({ page }) => {
    await page.goto('/blockchain');
    
    // Connect wallet
    const connectButton = page.locator('button', { hasText: /Connect.*Wallet|Use Mock Wallet/i });
    await connectButton.click();
    await page.waitForTimeout(2000);

    // Check for pending cashback section
    const pendingCashback = page.locator('text=Pending Cashback');
    
    // If pending cashback exists, verify claim button
    if (await pendingCashback.isVisible()) {
      const claimButton = page.locator('button', { hasText: /Claim Now/i });
      await expect(claimButton).toBeVisible();
      await expect(claimButton).toBeEnabled();
    }
  });

  test('should show success toast after claiming cashback', async ({ page }) => {
    await page.goto('/blockchain');
    
    const connectButton = page.locator('button', { hasText: /Connect.*Wallet|Use Mock Wallet/i });
    await connectButton.click();
    await page.waitForTimeout(2000);

    // If claim button exists, click it
    const claimButton = page.locator('button', { hasText: /Claim Now/i });
    
    if (await claimButton.isVisible()) {
      await claimButton.click();
      
      // Wait for success toast
      await expect(page.locator('text=Cashback Claimed')).toBeVisible({ timeout: 5000 });
    }
  });
});
