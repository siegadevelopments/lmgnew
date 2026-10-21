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

  it("skips tables that don't exist instead of aborting (marketing_plan_state is missing live)", () => {
    for (const t of ["notifications", "marketing_plan_state", "chat_conversations"]) {
      expect(sql).toContain(`to_regclass('public.${t}') IS NULL`);
    }
  });

  it("is safe to re-run: every created policy is dropped first", () => {
    const created = [...sql.matchAll(/CREATE POLICY "([^"]+)" ON (public\.\w+)/g)];
    expect(created.length).toBeGreaterThan(0);
    for (const [, name, table] of created) {
      expect(sql).toContain(`DROP POLICY IF EXISTS "${name}" ON ${table};`);
    }
  });
});

// 20260903 created this table world-readable/writable and was never applied live; the catch-up
// must create it admin-only and remove the open policies if they ever existed.
describe("20261021_create_marketing_plan_state_secure.sql", () => {
  const mkt = readFileSync(
    path.resolve(import.meta.dirname, "../../../supabase/migrations/20261021_create_marketing_plan_state_secure.sql"),
    "utf8",
  );

  it("creates the table with RLS and only the admin policy", () => {
    expect(mkt).toMatch(/CREATE TABLE IF NOT EXISTS public\.marketing_plan_state/);
    expect(mkt).toMatch(/ENABLE ROW LEVEL SECURITY/);
    expect(mkt).toMatch(/CREATE POLICY "Admins manage marketing_plan_state"[\s\S]*USING \(public\.is_admin\(\)\) WITH CHECK \(public\.is_admin\(\)\)/);
    expect(mkt.match(/CREATE POLICY/g)).toHaveLength(1);
    expect(mkt).toContain('DROP POLICY IF EXISTS "Allow write access to marketing_plan_state"');
  });
});
