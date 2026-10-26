import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "fs";
import path from "path";

const root = path.resolve(import.meta.dirname, "../../..");
const read = (p: string) => readFileSync(path.join(root, p), "utf8");

describe("admin vendor editing", () => {
  // Regression: app/actions/vendor.ts wrote vendor_profiles with the service role and no caller
  // check. Server actions are callable by anyone, so every action must verify the caller.
  const actions = readdirSync(path.join(root, "app/actions")).filter((f) => f.endsWith(".ts"));
  it.each(actions)("server action %s checks the caller is an admin", (f) => {
    const src = read(`app/actions/${f}`);
    expect(src).toMatch(/auth\.getUser\(\)/);
    expect(src).toMatch(/role !== "admin"/);
  });

  it("only writes the fields the vendor dialog edits", () => {
    const src = read("app/actions/vendor.ts");
    expect(src).toMatch(/EDITABLE_FIELDS/);
    expect(src).not.toMatch(/\.update\(updateData\)/);
  });

  it("the vendor dialog sends the admin's session", () => {
    expect(read("src/components/admin/VendorEditDialog.tsx")).toMatch(/adminUpdateVendorProfile\(session\.access_token,/);
  });

  // Regression: the admin page loaded vendors without is_live, so the dialog's Live tick box always
  // opened unticked and saving any vendor switched its store off.
  it("the admin page loads is_live for every vendor list it edits", () => {
    const page = read("app/admin/page.tsx");
    const selects = page.match(/"id, store_name, representative_name[^"]*"/g) ?? [];
    expect(selects.length).toBeGreaterThan(0);
    for (const s of selects) expect(s).toContain("is_live");
  });
});
