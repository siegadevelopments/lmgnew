import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "fs";
import path from "path";

// Signed-in users can't read profiles.phone directly any more (column permission). Code that
// needs phone or a full profile row must use get_my_profile() / admin_list_profiles() via
// src/lib/profile-reads.ts, or the query fails with "permission denied".
const ROOT = path.resolve(import.meta.dirname, "../../..");

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    if (name === "node_modules" || name === "__tests__" || name.startsWith(".")) return [];
    const full = path.join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : /\.(ts|tsx)$/.test(name) ? [full] : [];
  });
}

const files = [...walk(path.join(ROOT, "app")), ...walk(path.join(ROOT, "src"))];

describe("profiles reads", () => {
  it.each(files.map((f) => path.relative(ROOT, f)))("%s does not read phone or * from profiles directly", (rel) => {
    const src = readFileSync(path.join(ROOT, rel), "utf8");
    // A direct table read: .from("profiles") followed by .select(...) mentioning * or phone.
    for (const m of src.matchAll(/\.from\(["']profiles["']\)[\s\S]{0,80}?\.select\(\s*["'`]([^"'`]*)["'`]/g)) {
      expect(m[1]).not.toMatch(/\*|phone/);
    }
    // An embedded join: profiles(...) / profiles!fk(...) selecting phone or *.
    for (const m of src.matchAll(/(?<!vendor_)profiles(?:![\w]+)?\(([^)]*)\)/g)) {
      expect(m[1]).not.toMatch(/\*|phone/);
    }
  });
});

describe("profile migrations", () => {
  const read = (f: string) => readFileSync(path.join(ROOT, "supabase/migrations", f), "utf8");

  it("step 1 creates the two functions for authenticated users only", () => {
    const s = read("20261021_profile_read_functions.sql");
    expect(s).toMatch(/FUNCTION public\.get_my_profile\(\)[\s\S]*WHERE id = auth\.uid\(\)/);
    expect(s).toMatch(/FUNCTION public\.admin_list_profiles\(\)[\s\S]*WHERE public\.is_admin\(\)/);
    expect(s).toMatch(/GRANT EXECUTE ON FUNCTION public\.get_my_profile\(\) TO authenticated;/);
    expect(s).not.toMatch(/TO anon/);
    // Supabase's default privileges grant new functions to anon; it must be revoked explicitly.
    expect(s).toMatch(/REVOKE ALL ON FUNCTION public\.get_my_profile\(\) FROM PUBLIC, anon;/);
    expect(s).toMatch(/REVOKE ALL ON FUNCTION public\.admin_list_profiles\(\) FROM PUBLIC, anon;/);
  });

  it("step 2 grants every profiles column except phone", () => {
    const s = read("20261021_hide_phone_from_signed_in_users.sql");
    expect(s).toMatch(/REVOKE SELECT ON public\.profiles FROM authenticated;/);
    expect(s).toMatch(/column_name <> 'phone'/);
  });
});
