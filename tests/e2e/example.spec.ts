import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test.describe('Homepage', () => {
  test('loads with correct title', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/OPEN PF/)
  })

  test('has no critical a11y violations', async ({ page }) => {
    await page.goto('/')
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()
    expect(results.violations.filter((v) => v.impact === 'critical')).toHaveLength(0)
  })

  test('hero CTA links are present', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('link', { name: /Rejoindre OPEN/i }).first()).toBeVisible()
    await expect(page.getByRole('link', { name: /Explorer l'annuaire/i })).toBeVisible()
  })
})

test.describe('Annuaire des adhérents', () => {
  test('loads member cards', async ({ page }) => {
    await page.goto('/adherents')
    await expect(page.locator('h1')).toBeVisible()
    const cards = page.locator('article.member-card')
    await expect(cards.first()).toBeVisible()
  })

  test('has no critical a11y violations', async ({ page }) => {
    await page.goto('/adherents')
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()
    expect(results.violations.filter((v) => v.impact === 'critical')).toHaveLength(0)
  })
})

test.describe("Formulaire d'adhésion", () => {
  test('Adhérer button navigates to /adhesion', async ({ page }) => {
    await page.goto('/')
    await page
      .getByRole('link', { name: /Adhérer/i })
      .first()
      .click()
    await expect(page).toHaveURL(/adhesion/, { timeout: 8000 })
  })

  test('full page adhesion renders step 1', async ({ page }) => {
    await page.goto('/adhesion')
    await expect(page.locator('h1')).toBeVisible()
  })

  test('step 1 validates required fields', async ({ page }) => {
    await page.goto('/adhesion')
    await page.getByRole('button', { name: /suivant/i }).click()
    await expect(page.getByText(/requis/i).first()).toBeVisible()
  })
})

test.describe('Login admin', () => {
  test('login page renders', async ({ page }) => {
    await page.goto('/admin/login')
    await expect(page.locator('h1')).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
  })

  test('redirects unauthenticated access to login', async ({ page }) => {
    await page.goto('/admin')
    await expect(page).toHaveURL(/admin\/login/)
  })
})
