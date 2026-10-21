import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import path from "path";

// Regression: the October hardening was never applied live, leaving admin self-promotion open
// (users could set profiles.role = 'admin' on their own row) and phone numbers readable by
// anonymous visitors. The behaviour was verified in Postgres; these checks stop the migration
// from silently losing its key statements or becoming unsafe to re-run.
const sql = readFileSync(
  path.resolve(import.meta.dirname, "../../../supabase/migrations/20261021_apply_security_hardening.sql"),
  "utf8",
);

describe("20261021_apply_security_hardening.sql", () => {
  it("blocks admin self-promotion on insert and role updates", () => {
    expect(sql).toMatch(/CREATE TRIGGER trg_prevent_admin_self_promotion\s+BEFORE INSERT OR UPDATE OF role ON public\.profiles/);
    expect(sql).toMatch(/RAISE EXCEPTION 'Only an admin can assign the admin role'/);
  });

  it("defines admin the same way the app does (profiles.role = 'admin')", () => {
    expect(sql).toMatch(/FROM public\.profiles WHERE id = auth\.uid\(\) AND role = 'admin'/);
  });

  it("limits anonymous profile reads to an allowlist without phone", () => {
    expect(sql).toMatch(/REVOKE SELECT ON public\.profiles FROM anon;/);
    const grant = sql.match(/GRANT SELECT \(([^)]*)\) ON public\.profiles TO anon;/);
    expect(grant).not.toBeNull();
    expect(grant![1]).not.toMatch(/phone/);
  });

  it("is safe to re-run: every created policy is dropped first", () => {
    const created = [...sql.matchAll(/CREATE POLICY "([^"]+)" ON (public\.\w+)/g)];
    expect(created.length).toBeGreaterThan(0);
    for (const [, name, table] of created) {
      expect(sql).toContain(`DROP POLICY IF EXISTS "${name}" ON ${table};`);
    }
  });
});
