import { defineConfig, devices } from "@playwright/test";

const PORT = 4173;

/**
 * Every spec runs once per viewport. The builder is a desktop tool, but it
 * must stay usable - nothing clipped, nothing overlapping, no sideways page
 * scroll - down to a tablet held upright and a phone.
 */
export const VIEWPORTS = [
  { name: "desktop-1920", width: 1920, height: 1080 },
  { name: "desktop-1400", width: 1400, height: 1050 },
  { name: "laptop-1280", width: 1280, height: 800 },
  { name: "small-1024", width: 1024, height: 768 },
  { name: "tablet-768", width: 768, height: 1024 },
  { name: "phone-390", width: 390, height: 844 },
] as const;

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: VIEWPORTS.map(({ name, width, height }) => ({
    name,
    use: { ...devices["Desktop Chrome"], viewport: { width, height } },
  })),
  webServer: {
    command: `pnpm build && pnpm preview --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
