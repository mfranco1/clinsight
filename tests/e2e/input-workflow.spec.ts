import { expect, test } from "./fixtures";

test("opens the input workflow and resets an unsaved draft", async ({
  page,
}) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("clinsight_default_model", "legacy-model");
  });
  await page.goto("/");

  await page.getByRole("button", { name: "Add Patient" }).first().click();

  await expect(page.locator("header").getByText("New Patient")).toBeVisible();
  await expect(page.getByText("Model", { exact: true })).toHaveCount(0);

  const editor = page.getByRole("textbox", {
    name: /Patient is a 56-year-old male/,
  });
  await editor.fill("A test note that is long enough to save as a draft.");
  await expect(editor).toHaveText(
    "A test note that is long enough to save as a draft.",
  );

  await page.getByRole("button", { name: "Reset Form" }).click();
  const resetConfirmation = page.getByRole("dialog", {
    name: "Clear current data?",
  });
  await expect(resetConfirmation).toBeVisible();
  await resetConfirmation
    .getByRole("button", { name: "Confirm Reset" })
    .click();

  await expect(editor).toHaveText("");

  await page.getByRole("button", { name: "Suggestions" }).click();
  const suggestionsPanel = page.getByRole("dialog", { name: "Suggestions" });
  await expect(suggestionsPanel).toBeVisible();
  await expect(
    suggestionsPanel.getByText(
      "Please type more notes to get meaningful suggestions",
    ),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(suggestionsPanel).toBeVisible();
  await suggestionsPanel
    .getByRole("button", { name: "Close Suggestions" })
    .click();
  await expect(suggestionsPanel).toHaveCount(0);

  await page.getByRole("button", { name: "Lookup" }).click();
  const lookupDialog = page.getByRole("dialog", { name: "Lookup" });
  await expect(lookupDialog).toBeVisible();
  await expect(
    lookupDialog.getByPlaceholder(/Ask about diagnostic criteria/),
  ).toBeVisible();
  await lookupDialog.getByRole("button", { name: "Close modal" }).click();
  await expect(lookupDialog).toHaveCount(0);
});

test("uses anchored template and draft popovers without losing note content", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Add Patient" }).first().click();

  const editor = page.getByRole("textbox", {
    name: /Patient is a 56-year-old male/,
  });
  const originalNote = "A test note retained while choosing a template.";
  await editor.fill(originalNote);

  await page.getByRole("button", { name: "Templates" }).click();
  const templates = page.getByRole("dialog", { name: "Input templates" });
  await expect(templates).toBeVisible();
  await editor.click();
  await expect(templates).toHaveCount(0);

  await page.getByRole("button", { name: "Templates" }).click();
  await page
    .getByRole("dialog", { name: "Input templates" })
    .getByRole("button", { name: "Adult Comprehensive H&P" })
    .click();
  await expect(editor).toContainText("GENERAL DATA:");

  await page.getByRole("button", { name: "Drafts" }).click();
  const drafts = page.getByRole("dialog", { name: "Input drafts" });
  await expect(drafts).toBeVisible();
  await drafts.getByRole("button").filter({ hasText: originalNote }).click();
  await expect(editor).toHaveText(originalNote);
});

test("settings no longer exposes a default model preference", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Settings" }).click();
  await expect(page.getByText("Default Model", { exact: true })).toHaveCount(0);
  await expect(
    page.getByText("Default Specialization", { exact: true }),
  ).toBeVisible();
});
