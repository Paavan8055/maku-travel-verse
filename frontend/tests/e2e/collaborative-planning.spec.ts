import { test, expect } from '@playwright/test';

/**
 * Test Suite: Collaborative Planning
 * Critical Path: Create trip, invite participants, vote on destinations, pool budget
 */

test.describe('Collaborative Planning - Trip Creation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/collaborative-planning');
  });

  test('should load collaborative planning page', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Plan Your Trip');
    await expect(page.locator('text=Together')).toBeVisible();
  });

  test('should show trip creation form', async ({ page }) => {
    await expect(page.locator('text=Trip Name')).toBeVisible();
    const input = page.locator('input[placeholder*="Summer Europe"]');
    await expect(input).toBeVisible();
  });

  test('should create a new trip', async ({ page }) => {
    const tripName = 'Test Trip ' + Date.now();
    
    // Fill trip name
    const input = page.locator('input[placeholder*="Summer Europe"]');
    await input.fill(tripName);

    // Click create button
    const createButton = page.locator('button', { hasText: /Create Collaborative Trip/i });
    await createButton.click();

    // Verify trip created
    await expect(page.locator(`text=${tripName}`)).toBeVisible({ timeout: 5000 });
    
    // Verify initial state
    await expect(page.locator('text=1 collaborator')).toBeVisible();
  });

  test('should show participant section after creation', async ({ page }) => {
    // Create trip
    const input = page.locator('input[placeholder*="Summer Europe"]');
    await input.fill('Quick Test Trip');
    
    const createButton = page.locator('button', { hasText: /Create Collaborative Trip/i });
    await createButton.click();
    
    await page.waitForTimeout(1000);

    // Verify participant section
    await expect(page.locator('text=Collaborators')).toBeVisible();
    await expect(page.locator('text=You')).toBeVisible();
  });

  test('should show budget section with $0.00 initial', async ({ page }) => {
    // Create trip
    const input = page.locator('input[placeholder*="Summer Europe"]');
    await input.fill('Budget Test Trip');
    
    const createButton = page.locator('button', { hasText: /Create Collaborative Trip/i });
    await createButton.click();
    
    await page.waitForTimeout(1000);

    // Verify budget section
    await expect(page.locator('text=Trip Budget')).toBeVisible();
    await expect(page.locator('text=$0.00')).toBeVisible();
  });
});

test.describe('Collaborative Planning - Invitations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/collaborative-planning');
    
    // Create a trip first
    const input = page.locator('input[placeholder*="Summer Europe"]');
    await input.fill('Invitation Test Trip');
    
    const createButton = page.locator('button', { hasText: /Create Collaborative Trip/i });
    await createButton.click();
    
    await page.waitForTimeout(1000);
  });

  test('should have invite input field', async ({ page }) => {
    const inviteInput = page.locator('input[placeholder*="friend@email"]');
    await expect(inviteInput).toBeVisible();
  });

  test('should invite a participant', async ({ page }) => {
    const email = 'friend@example.com';
    
    // Fill email
    const inviteInput = page.locator('input[placeholder*="friend@email"]');
    await inviteInput.fill(email);

    // Click invite button (look for user plus icon or submit)
    const inviteButton = page.locator('button').filter({ has: page.locator('svg') }).first();
    await inviteButton.click();

    // Verify participant added
    await expect(page.locator('text=friend')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=2 collaborator')).toBeVisible();
  });

  test('should show success toast after invitation', async ({ page }) => {
    const inviteInput = page.locator('input[placeholder*="friend@email"]');
    await inviteInput.fill('test@example.com');

    const inviteButton = page.locator('button').filter({ has: page.locator('svg') }).first();
    await inviteButton.click();

    await expect(page.locator('text=Invitation Sent')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Collaborative Planning - Destination Voting', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/collaborative-planning');
    
    // Create trip
    const input = page.locator('input[placeholder*="Summer Europe"]');
    await input.fill('Destination Test Trip');
    const createButton = page.locator('button', { hasText: /Create Collaborative Trip/i });
    await createButton.click();
    await page.waitForTimeout(1000);
  });

  test('should have destination input field', async ({ page }) => {
    const destInput = page.locator('input[placeholder*="Suggest a destination"]');
    await expect(destInput).toBeVisible();
  });

  test('should add a destination', async ({ page }) => {
    const destination = 'Paris, France';
    
    const destInput = page.locator('input[placeholder*="Suggest a destination"]');
    await destInput.fill(destination);

    const addButton = page.locator('button').filter({ has: page.locator('svg') }).nth(1);
    await addButton.click();

    await expect(page.locator(`text=${destination}`)).toBeVisible({ timeout: 5000 });
  });

  test('should show vote count for destination', async ({ page }) => {
    const destInput = page.locator('input[placeholder*="Suggest a destination"]');
    await destInput.fill('Rome, Italy');

    const addButton = page.locator('button').filter({ has: page.locator('svg') }).nth(1);
    await addButton.click();

    await page.waitForTimeout(1000);

    // Should have 1 vote (from creator)
    await expect(page.locator('text=1').first()).toBeVisible();
  });

  test('should toggle vote on destination', async ({ page }) => {
    // Add destination
    const destInput = page.locator('input[placeholder*="Suggest a destination"]');
    await destInput.fill('Barcelona, Spain');
    const addButton = page.locator('button').filter({ has: page.locator('svg') }).nth(1);
    await addButton.click();
    await page.waitForTimeout(1000);

    // Find and click vote button (heart icon)
    const voteButton = page.locator('button').filter({ hasText: '1' }).first();
    await voteButton.click();

    // Vote should decrease to 0
    await page.waitForTimeout(500);
    await expect(page.locator('button').filter({ hasText: '0' })).toBeVisible();
  });
});

test.describe('Collaborative Planning - Budget Pooling', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/collaborative-planning');
    
    // Create trip
    const input = page.locator('input[placeholder*="Summer Europe"]');
    await input.fill('Budget Pool Test');
    const createButton = page.locator('button', { hasText: /Create Collaborative Trip/i });
    await createButton.click();
    await page.waitForTimeout(1000);
  });

  test('should have contribution input field', async ({ page }) => {
    const contributionInput = page.locator('input[placeholder*="Amount"]');
    await expect(contributionInput).toBeVisible();
  });

  test('should add budget contribution', async ({ page }) => {
    const amount = '500';
    
    const contributionInput = page.locator('input[placeholder*="Amount"]');
    await contributionInput.fill(amount);

    const addButton = page.locator('button', { hasText: /Add/i });
    await addButton.click();

    await expect(page.locator('text=$500.00')).toBeVisible({ timeout: 5000 });
  });

  test('should show total pool after contribution', async ({ page }) => {
    const contributionInput = page.locator('input[placeholder*="Amount"]');
    await contributionInput.fill('250');
    const addButton = page.locator('button', { hasText: /Add/i });
    await addButton.click();

    await page.waitForTimeout(1000);

    // Verify total pool shows $250
    await expect(page.locator('text=Total Pool')).toBeVisible();
    await expect(page.locator('text=$250.00')).toBeVisible();
  });

  test('should show contribution breakdown', async ({ page }) => {
    const contributionInput = page.locator('input[placeholder*="Amount"]');
    await contributionInput.fill('100');
    const addButton = page.locator('button', { hasText: /Add/i });
    await addButton.click();

    await page.waitForTimeout(1000);

    // Check for contributions section
    await expect(page.locator('text=Contributions')).toBeVisible();
    await expect(page.locator('text=You')).toBeVisible();
    await expect(page.locator('text=$100.00')).toBeVisible();
  });
});

test.describe('Collaborative Planning - Responsive Design', () => {
  test('should be mobile responsive', async ({ page, isMobile }) => {
    await page.goto('/collaborative-planning');
    
    if (isMobile) {
      // Verify key elements are visible on mobile
      await expect(page.locator('h1')).toBeVisible();
      
      const input = page.locator('input[placeholder*="Summer Europe"]');
      await expect(input).toBeVisible();
      
      const createButton = page.locator('button', { hasText: /Create Collaborative Trip/i });
      await expect(createButton).toBeVisible();
    }
  });
});
