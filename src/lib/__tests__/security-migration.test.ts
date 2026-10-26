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

// 2026-10-21 live policy snapshot (supabase/live-security-snapshot.md).
describe("20261022_tighten_rls.sql", () => {
  const sql = readFileSync(
    path.resolve(import.meta.dirname, "../../../supabase/migrations/20261022_tighten_rls.sql"),
    "utf8",
  );

  it("account-admin functions are service role only", () => {
    expect(sql).toMatch(/REVOKE ALL ON FUNCTION public\.admin_update_user_email\(uuid, text\) FROM PUBLIC, anon, authenticated;/);
    expect(sql).toMatch(/REVOKE ALL ON FUNCTION public\.admin_delete_user\(uuid\) FROM PUBLIC, anon, authenticated;/);
  });

  it("withdrawal admin access uses is_admin(), not user-editable metadata", () => {
    expect(sql).toMatch(/DROP POLICY IF EXISTS "Admins can manage all withdrawal requests"/);
    expect(sql).toMatch(/"Admins manage withdrawal requests"[\s\S]*USING \(public\.is_admin\(\)\)/);
    expect(sql.replace(/^--.*$/gm, "")).not.toMatch(/user_metadata/);
  });

  it("browsers can't insert orders or order items", () => {
    for (const p of ["Anyone can create orders", "Users can create orders", "Anyone can insert order items"]) {
      expect(sql).toContain(`DROP POLICY IF EXISTS "${p}"`);
    }
    expect(sql.replace(/^--.*$/gm, "")).not.toMatch(/ON public\.(orders|order_items)\s+FOR INSERT/);
  });

  it("store approval, commission and visibility are admin-only", () => {
    expect(sql).toMatch(/NEW\.is_approved := OLD\.is_approved;/);
    expect(sql).toMatch(/NEW\.commission_rate := OLD\.commission_rate;/);
    expect(sql).toMatch(/NEW\.is_live := OLD\.is_live;/);
  });

  it("anonymous visitors can't read commission or AI settings, or drafts", () => {
    expect(sql).toMatch(/NOT IN \('commission_rate', 'ai_enabled', 'ai_instructions', 'representative_name'\)/);
    expect(sql).toMatch(/"Published products are viewable by everyone"[\s\S]*USING \(status = 'published'\)/);
  });
});

describe("vendor live stream", () => {
  it("doesn't write store visibility (vendor_profiles.is_live)", () => {
    const src = readFileSync(path.resolve(import.meta.dirname, "../../components/vendor/VendorLiveStream.tsx"), "utf8");
    expect(src).not.toMatch(/from\("vendor_profiles"\)/);
  });
});

describe("20261022_restrict_content_publishing.sql", () => {
  const sql = readFileSync(
    path.resolve(import.meta.dirname, "../../../supabase/migrations/20261022_restrict_content_publishing.sql"),
    "utf8",
  );
  const code = sql.replace(/^--.*$/gm, "");

  it("publishing requires an admin or an approved store, not the self-assignable vendor role", () => {
    expect(code).toMatch(/public\.is_admin\(\)\s+OR EXISTS \(SELECT 1 FROM public\.vendor_profiles WHERE id = auth\.uid\(\) AND is_approved\)/);
    expect(code).not.toMatch(/role = 'vendor'/);
  });

  it("removes the old ownership-only FOR ALL policies", () => {
    for (const [p, t] of [
      ["Authors can manage their articles", "articles"],
      ["Authors can manage their recipes", "recipes"],
      ["Vendors can manage own galleries", "galleries"],
      ["Vendors can manage own gallery items", "gallery_items"],
    ]) {
      expect(code).toContain(`DROP POLICY IF EXISTS "${p}" ON public.${t};`);
    }
    expect(code).not.toMatch(/FOR ALL/);
  });

  it("creating and editing need can_publish(); deleting your own doesn't", () => {
    for (const t of ["articles", "recipes", "galleries", "gallery_items"]) {
      expect(code).toMatch(new RegExp(`ON public\\.${t} FOR INSERT TO authenticated\\s+WITH CHECK \\([\\s\\S]*?can_publish\\(\\)`));
      expect(code).toMatch(new RegExp(`ON public\\.${t} FOR DELETE TO authenticated`));
    }
  });
});

describe("20261022_order_items_vendor_columns.sql", () => {
  const sql = readFileSync(
    path.resolve(import.meta.dirname, "../../../supabase/migrations/20261022_order_items_vendor_columns.sql"),
    "utf8",
  );
  it("vendors can change only status and tracking_number", () => {
    expect(sql).toMatch(/jsonb_populate_record\(OLD, jsonb_build_object\('status', NEW\.status, 'tracking_number', NEW\.tracking_number\)\)/);
    expect(sql).toMatch(/BEFORE UPDATE ON public\.order_items/);
  });
  it("matches the only fields the vendor dashboard updates", () => {
    const tab = readFileSync(path.resolve(import.meta.dirname, "../../components/vendor/OrdersTab.tsx"), "utf8");
    const fields = [...tab.matchAll(/updateOrderItem\(item\.id, \{ (\w+):/g)].map((m) => m[1]);
    expect(new Set(fields)).toEqual(new Set(["tracking_number", "status"]));
  });
});

describe("20261023_media_uploads_own_folder.sql", () => {
  const sql = readFileSync(
    path.resolve(import.meta.dirname, "../../../supabase/migrations/20261023_media_uploads_own_folder.sql"),
    "utf8",
  );
  it("signed-in users upload only into their own folder; admins anywhere", () => {
    expect(sql).toMatch(/DROP POLICY IF EXISTS "Auth Upload" ON storage\.objects;/);
    expect(sql).toMatch(/\(storage\.foldername\(name\)\)\[2\] = auth\.uid\(\)::text OR public\.is_admin\(\)/);
  });
  it("every non-admin upload in the app puts the user's id second", () => {
    const { execSync } = require("child_process");
    const calls: string[] = execSync(
      `grep -rhoE 'uploadMedia\\([^,]+, *[^,)]+' app src --include='*.tsx' --include='*.ts'`,
      { cwd: path.resolve(import.meta.dirname, "../../..") },
    ).toString().trim().split("\n");
    const folders = calls.map((c) => c.replace(/^uploadMedia\([^,]+, */, "").trim());
    const adminOnly = ['"admin_uploads"', '"affiliates"', "`products/${productForm.vendor_id}`"];
    for (const f of folders) {
      if (adminOnly.includes(f)) continue;
      expect(f, f).toMatch(/^`[a-z]+\/\$\{(userId|user\.id)\}/);
    }
  });
});

describe("20261027_popups_policies.sql", () => {
  const sql = readFileSync(path.resolve(import.meta.dirname, "../../../supabase/migrations/20261027_popups_policies.sql"), "utf8");
  it("visitors read active popups only; admins manage them", () => {
    expect(sql).toMatch(/FOR SELECT USING \(is_active = true\)/);
    expect(sql).toMatch(/FOR ALL TO authenticated USING \(public\.is_admin\(\)\) WITH CHECK \(public\.is_admin\(\)\)/);
  });
});
