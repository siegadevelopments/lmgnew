import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import path from "path";

// The Shopify import relies on three database guarantees: no duplicate imports, no publishing a
// product whose images failed to copy, and a store table only admins can touch. These checks stop
// the migration losing them or becoming unsafe to re-run.
const sql = readFileSync(
  path.resolve(import.meta.dirname, "../../../supabase/migrations/20261101_shopify_import.sql"),
  "utf8",
);

describe("20261101_shopify_import.sql", () => {
  it("makes a re-import unable to duplicate a product, without touching hand-made ones", () => {
    expect(sql).toMatch(
      /CREATE UNIQUE INDEX IF NOT EXISTS products_vendor_source_unique\s+ON public\.products \(vendor_id, source_platform, source_ref\)\s+WHERE source_ref IS NOT NULL/,
    );
  });

  it("refuses to publish a product that has an import problem", () => {
    expect(sql).toMatch(/NEW\.status = 'published' AND NEW\.import_issue IS NOT NULL/);
    expect(sql).toMatch(/RAISE EXCEPTION 'This product cannot be published/);
    expect(sql).toMatch(/BEFORE INSERT OR UPDATE OF status, import_issue ON public\.products/);
  });

  it("locks the store table to admins", () => {
    expect(sql).toMatch(/ALTER TABLE public\.vendor_shopify_stores ENABLE ROW LEVEL SECURITY/);
    expect(sql).toMatch(/USING \(public\.is_admin\(\)\) WITH CHECK \(public\.is_admin\(\)\)/);
    expect(sql).not.toMatch(/USING \(true\)|WITH CHECK \(true\)/i);
  });

  it("can be run more than once", () => {
    for (const stmt of sql.split(";").map((s) => s.trim()).filter((s) => /^(CREATE|ALTER TABLE .* ADD COLUMN)/i.test(s))) {
      const ok =
        /IF NOT EXISTS/i.test(stmt) ||
        /CREATE OR REPLACE/i.test(stmt) ||
        /CREATE TRIGGER|CREATE POLICY/i.test(stmt) ||
        /ENABLE ROW LEVEL SECURITY/i.test(stmt);
      expect(ok, stmt.slice(0, 80)).toBe(true);
    }
    expect(sql).toMatch(/DROP TRIGGER IF EXISTS trg_block_publishing_flagged_product/);
    expect(sql).toMatch(/DROP POLICY IF EXISTS "Admins manage shopify stores"/);
  });
});
