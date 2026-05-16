import { test, expect } from "@playwright/test";

/**
 * Onboarding E2E — flow first-run wizard, navigasi antar step.
 * Stop sebelum submit terakhir (butuh Tauri SQL untuk save company).
 */
test.describe("doxpro onboarding wizard", () => {
  test("3 step wizard: identitas → branding → bank", async ({ page }) => {
    await page.goto("/onboarding");

    // Step 1: Identitas
    await expect(page.getByText(/identitas/i)).toBeVisible({ timeout: 5000 });
    const nameInput = page.locator("input#name");
    if (await nameInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await nameInput.fill("PT Test E2E");

      const addressTextarea = page.locator("textarea#address");
      await addressTextarea.fill("Jl. Test No. 1, Jakarta");

      // Klik Lanjut
      await page.getByRole("button", { name: /lanjut/i }).click();
    } else {
      test.skip(true, "onboarding sudah selesai — flow ini hanya untuk first-run");
    }

    // Step 2: Branding
    await expect(page.getByText(/branding/i)).toBeVisible({ timeout: 3000 });
    // Click Lanjut tanpa perubahan (default values valid)
    await page.getByRole("button", { name: /lanjut/i }).click();

    // Step 3: Bank (optional)
    await expect(page.getByText(/rekening|bank/i)).toBeVisible({ timeout: 3000 });

    // Tombol Selesai harus muncul
    await expect(page.getByRole("button", { name: /selesai/i })).toBeVisible();
  });

  test("tombol Kembali bekerja di antar step", async ({ page }) => {
    await page.goto("/onboarding");
    const nameInput = page.locator("input#name");
    if (!(await nameInput.isVisible({ timeout: 2000 }).catch(() => false))) {
      test.skip(true, "onboarding sudah selesai");
    }

    await nameInput.fill("Test");
    await page.locator("textarea#address").fill("Jl. Test");
    await page.getByRole("button", { name: /lanjut/i }).click();

    // Sekarang di step 2 — klik Kembali
    await expect(page.getByText(/branding/i)).toBeVisible({ timeout: 3000 });
    await page.getByRole("button", { name: /kembali/i }).click();

    // Harus balik ke step 1 dengan input masih terisi
    await expect(page.locator("input#name")).toHaveValue("Test");
  });
});
