import { defineConfig, devices } from '@playwright/test'
import './tests/e2e/helpers/env'
import { BASE_URL } from './tests/e2e/helpers/env'

// Production smoke suite. Writes real (marked) rows to the prod DB, verifies them
// via service role, then deletes them. Serial + no retries so behavior against
// prod is predictable and cleanup is ordered.
export default defineConfig({
  testDir: './tests/e2e',
  globalSetup: './tests/e2e/global-setup.ts',
  globalTeardown: './tests/e2e/global-teardown.ts',
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    // Public flows run logged-out (no storageState).
    { name: 'public', testMatch: /(homepage|signup)\.spec\.ts/, use: { ...devices['Desktop Chrome'] } },
    // Posting flows reuse the authenticated session from the setup project.
    {
      name: 'authed',
      testMatch: /(partnership|aircraft|seeker)\.spec\.ts/,
      dependencies: ['setup'],
      use: { ...devices['Desktop Chrome'], storageState: 'tests/e2e/.auth/state.json' },
    },
  ],
})
