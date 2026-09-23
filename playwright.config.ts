import { defineConfig, devices } from '@playwright/test'
export default defineConfig({
  testDir: './tests/browser', fullyParallel: false, workers: 1, timeout: 60_000,
  use: { baseURL: 'http://localhost:3107', trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], channel: 'msedge' } },
    { name: 'tablet', use: { ...devices['Desktop Chrome'], viewport: { width: 768, height: 1024 }, channel: 'msedge' } },
    { name: 'mobile', use: { ...devices['iPhone 13'], defaultBrowserType: 'chromium', channel: 'msedge' } },
  ],
  webServer: { command: 'node node_modules/next/dist/bin/next start -p 3107', url: 'http://localhost:3107', reuseExistingServer: true, timeout: 60_000 },
})
