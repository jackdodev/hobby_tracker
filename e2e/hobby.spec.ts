import { test, expect } from '@playwright/test'
import fs from 'fs'
import path from 'path'

const DATA_PATH = path.join(process.cwd(), 'data', 'tracker.json')
const EMPTY_DATA = JSON.stringify({ hobbies: [], routines: [], logEntries: [] }, null, 2)

// Reset tracker data before each test so tests are independent
test.beforeEach(() => {
  fs.writeFileSync(DATA_PATH, EMPTY_DATA, 'utf-8')
})

// ---------------------------------------------------------------------------
// Add hobby → check off today → verify history
// ---------------------------------------------------------------------------
test('add hobby, check off today, verify in history', async ({ page }) => {
  // 1. Add a boolean hobby on the hobbies page
  await page.goto('/hobbies')
  await page.getByRole('button', { name: '+ Add hobby' }).click()
  // Use the custom form to add a named boolean hobby
  await page.getByPlaceholder('Hobby name').fill('Journaling')
  await page.getByRole('button', { name: 'Add hobby', exact: true }).click()
  await expect(page.getByText('Journaling')).toBeVisible()

  // 2. Check it off on Today's page
  await page.goto('/')
  await expect(page.getByText('Journaling')).toBeVisible()
  await page.getByText('Journaling').click()
  // After toggling, the card should look done (green border/bg)
  await expect(page.locator('[class*="green"]').first()).toBeVisible()

  // 3. Verify it shows as completed (✓) in History
  await page.goto('/history')
  const today = new Date().getDate().toString()
  // Find the row for Journaling
  const row = page.getByRole('row').filter({ hasText: 'Journaling' })
  await expect(row).toBeVisible()
  // The cell for today's date should contain ✓
  const todayCell = row.getByText('✓')
  await expect(todayCell).toBeVisible()
})

// ---------------------------------------------------------------------------
// Add hobby → verify on hobbies page → remove → verify gone everywhere
// ---------------------------------------------------------------------------
test('remove hobby disappears from hobbies, today, and history', async ({ page }) => {
  // 1. Add a hobby
  await page.goto('/hobbies')
  await page.getByRole('button', { name: '+ Add hobby' }).click()
  await page.getByPlaceholder('Hobby name').fill('Running')
  await page.getByRole('button', { name: 'Add hobby', exact: true }).click()
  await expect(page.getByText('Running')).toBeVisible()

  // 2. Remove it (confirm dialog)
  await page.getByRole('button', { name: 'Remove' }).click()
  await page.getByRole('button', { name: 'Yes' }).click()
  await expect(page.getByText('Running')).not.toBeVisible()

  // 3. Not on Today page
  await page.goto('/')
  await expect(page.getByText('Running')).not.toBeVisible()

  // 4. Not on History page
  await page.goto('/history')
  await expect(page.getByText('Running')).not.toBeVisible()
})
