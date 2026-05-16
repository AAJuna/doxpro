import { test, expect } from "@playwright/test";

/**
 * Navigation E2E — verify routing, command palette, dan keyboard shortcuts
 * jalan tanpa crash. Skip flow yang butuh Tauri SQL plugin (browser test env
 * tidak punya akses ke `Database.load`).
 */
test.describe("doxpro navigation", () => {
  test("Ctrl+K membuka command palette", async ({ page }) => {
    await page.goto("/");
    // Tunggu app fully loaded (onboarding atau dashboard)
    await expect(page.locator("body")).toContainText(/doxpro|Selamat datang|Halo/i, {
      timeout: 10_000,
    });

    // Skip kalau masih di onboarding (sidebar belum render)
    const sidebar = page.locator("aside").first();
    const sidebarVisible = await sidebar.isVisible({ timeout: 2000 }).catch(() => false);
    test.skip(!sidebarVisible, "onboarding belum selesai — skip navigation test");

    await page.keyboard.press("Control+K");
    await expect(page.getByPlaceholder(/cari|search/i)).toBeVisible({ timeout: 3000 });

    // Esc menutup palette
    await page.keyboard.press("Escape");
    await expect(page.getByPlaceholder(/cari|search/i)).not.toBeVisible({ timeout: 3000 });
  });

  test("? membuka keyboard shortcuts dialog", async ({ page }) => {
    await page.goto("/");
    const sidebar = page.locator("aside").first();
    const sidebarVisible = await sidebar.isVisible({ timeout: 2000 }).catch(() => false);
    test.skip(!sidebarVisible, "onboarding belum selesai — skip");

    await page.keyboard.press("?");
    await expect(page.getByText(/keyboard shortcuts/i)).toBeVisible({ timeout: 3000 });
    await page.keyboard.press("Escape");
  });

  test("sidebar collapse toggle disimpan di localStorage", async ({ page }) => {
    await page.goto("/");
    const sidebar = page.locator("aside").first();
    const sidebarVisible = await sidebar.isVisible({ timeout: 2000 }).catch(() => false);
    test.skip(!sidebarVisible, "onboarding belum selesai — skip");

    // Klik chevron toggle
    const toggleBtn = sidebar.locator("button[aria-label*='sidebar' i]").first();
    if (await toggleBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await toggleBtn.click();
      // Tunggu collapse animation
      await page.waitForTimeout(300);
      // State harus persist di localStorage
      const collapsedState = await page.evaluate(() => {
        const raw = localStorage.getItem("doxpro-app");
        if (!raw) return null;
        return JSON.parse(raw).state?.sidebarCollapsed;
      });
      expect(collapsedState).toBe(true);
    }
  });

  test("navigasi antar route via sidebar", async ({ page }) => {
    await page.goto("/");
    const sidebar = page.locator("aside").first();
    const sidebarVisible = await sidebar.isVisible({ timeout: 2000 }).catch(() => false);
    test.skip(!sidebarVisible, "onboarding belum selesai — skip");

    // Klik link Klien
    await sidebar.getByRole("link", { name: /klien/i }).first().click();
    await expect(page).toHaveURL(/\/clients/);

    // Klik link Produk
    await sidebar.getByRole("link", { name: /produk/i }).first().click();
    await expect(page).toHaveURL(/\/products/);

    // Kembali ke dashboard
    await sidebar.getByRole("link", { name: /dashboard/i }).first().click();
    await expect(page).toHaveURL(/\/$/);
  });
});
