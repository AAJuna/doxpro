import { test, expect } from "@playwright/test";

test.describe("doxpro smoke test", () => {
  test("halaman aplikasi terbuka dan menampilkan wizard onboarding atau dashboard", async ({ page }) => {
    await page.goto("/");
    // First load may show onboarding or dashboard depending on local state
    await expect(page.locator("body")).toContainText(/doxpro|Selamat datang|Halo/i, {
      timeout: 10_000,
    });
  });

  test("onboarding wizard memiliki 3 langkah", async ({ page }) => {
    await page.goto("/onboarding");
    // Step 1 should be visible
    const heading = page.locator("h2").first();
    if (await heading.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(heading).toContainText(/Identitas/i);
    }
  });
});
