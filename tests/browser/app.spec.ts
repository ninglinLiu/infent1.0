import { test, expect } from '@playwright/test'

test('landing chat renders real transport safely, exposes evidence, and fits viewport', async ({ page }) => {
  await page.route('**/api/chat', route => route.fulfill({ status: 200, contentType: 'text/plain; charset=utf-8', body:
    '<img src=x onerror="window.INFENT_XSS=true"> **Verified result**\n<<<INFENT_META>>>' + JSON.stringify({ strategyIds: [], sources: ['测试来源'], tools: [{ id: 'test', name: 'get_price', arguments: { symbol: 'BTC' }, durationMs: 10, result: { ok: true, source: 'Fixture (not live)', observedAt: '2026-01-01T00:00:00Z', data: { symbol: 'BTC-USD', price: 100, currency: 'USD' } } }] })
  }))
  await page.goto('/#live-agent')
  const section = page.locator('#live-agent')
  await section.locator('input').fill('BTC 价格？')
  await section.locator('button[type=submit]').click()
  await expect(section.getByText('Verified result', { exact: true })).toBeVisible()
  expect(await page.evaluate(() => 'INFENT_XSS' in window)).toBe(false)
  await expect(section.locator('img')).toHaveCount(0)
  await section.locator('summary').click()
  await expect(section.locator('pre')).toContainText('Fixture (not live)')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
  const button = await section.locator('button[type=submit]').boundingBox()
  const viewport = page.viewportSize()!
  expect(button!.x + button!.width).toBeLessThanOrEqual(viewport.width)
  await page.screenshot({ path: `test-results/landing-${test.info().project.name}.png`, fullPage: false })
})

test('dashboard navigation and Agent composer are usable at this viewport', async ({ page }) => {
  // This test exercises layout; API behavior is covered separately.
  await page.route('**/api/market/**', route => route.fulfill({ status: 503, contentType: 'application/json', body: '{"error":"Test fixture unavailable"}' }))
  await page.goto('/dashboard')
  const headerGroups = page.locator('header > div')
  const brand = await headerGroups.first().boundingBox()
  const controls = await headerGroups.last().boundingBox()
  expect(brand!.x + brand!.width).toBeLessThanOrEqual(controls!.x)
  if (page.viewportSize()!.width < 640) {
    await expect(page.locator('header').getByRole('button')).toHaveCount(2)
    await expect(page.locator('header').getByRole('button', { name: /重置|Reset/ })).not.toBeVisible()
  }
  const nav = page.locator('aside[aria-label="Dashboard navigation"]')
  const agentButton = nav.getByRole('button').nth(1)
  await agentButton.scrollIntoViewIfNeeded()
  await agentButton.click()
  const view = page.locator('[data-view="agent"]')
  await expect(view).toHaveCSS('opacity', '1')
  const input = view.locator('input[maxlength="4000"]')
  await expect(input).toBeVisible()
  await input.fill('How does risk budgeting work?')
  const rect = await input.boundingBox()
  expect(rect!.width).toBeGreaterThan(100)
  expect(rect!.x + rect!.width).toBeLessThanOrEqual(page.viewportSize()!.width)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
  await page.screenshot({ path: `test-results/dashboard-${test.info().project.name}.png`, fullPage: false })
})

test('PWA exposes PNG icon, installs a worker and serves its offline notice', async ({ page, context, request }) => {
  const manifest = await (await request.get('/manifest.webmanifest')).json()
  expect(manifest.display).toBe('standalone')
  const icon = await request.get(manifest.icons[0].src)
  expect(icon.headers()['content-type']).toContain('image/png')
  await page.goto('/')
  await page.evaluate(async () => { await navigator.serviceWorker.ready })
  await page.reload()
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true)
  await context.setOffline(true)
  await page.goto('/dashboard')
  await expect(page.getByRole('heading', { name: /You are offline/ })).toBeVisible()
  await context.setOffline(false)
})
