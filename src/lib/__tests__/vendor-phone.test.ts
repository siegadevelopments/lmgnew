import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import path from "path";

const root = path.resolve(import.meta.dirname, "../../..");
const read = (p: string) => readFileSync(path.join(root, p), "utf8");

// Vendors used to sign up with only an email, so LMG had no way to call most of them.
describe("vendor business phone", () => {
  const vendorPage = read("app/vendor/page.tsx");

  it("store setup requires a valid phone and saves it to the vendor's profile", () => {
    expect(vendorPage).toMatch(/name="phone"[^>]*required/);
    expect(vendorPage).toMatch(/normalisePhone\(formData\.get\("phone"\)\)/);
    expect(vendorPage).toMatch(/\{ id: user\.id, role: "vendor", phone \}/);
  });

  it("the dashboard prompts vendors who have no phone yet", () => {
    expect(vendorPage).toMatch(/<VendorPhoneField userId=\{user!\.id\} mode="prompt" \/>/);
    expect(read("src/components/vendor/SettingsTab.tsx")).toMatch(/<VendorPhoneField userId=\{userId\} mode="settings" \/>/);
  });

  it("reads the phone via get_my_profile and only ever updates the vendor's own row", () => {
    const field = read("src/components/vendor/VendorPhoneField.tsx");
    expect(field).toMatch(/fetchMyProfile\(\)/);
    expect(field).toMatch(/\.update\(\{ phone \}\)\.eq\("id", userId\)/);
  });

  it("admins see vendor phones via admin_list_profiles", () => {
    expect(read("app/admin/page.tsx")).toMatch(/adminListProfiles\(\)\.in\("id", vendorIds\)/);
  });
});
