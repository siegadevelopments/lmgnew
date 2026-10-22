import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, existsSync } from "fs";
import path from "path";

const FN_DIR = path.resolve(import.meta.dirname, "../../../supabase/functions");
const functions = readdirSync(FN_DIR).filter((d) => existsSync(path.join(FN_DIR, d, "index.ts")));
const config = readFileSync(path.resolve(FN_DIR, "../config.toml"), "utf8");
const src = (fn: string) => readFileSync(path.join(FN_DIR, fn, "index.ts"), "utf8");

describe("edge functions", () => {
  it("finds the functions", () => {
    expect(functions.length).toBeGreaterThan(10);
  });

  // std@0.168.0 serve() calls Deno.core.runMicrotasks(), which the current Supabase runtime
  // rejects ("event loop error" in the logs after every request).
  it.each(functions)("%s uses Deno.serve, not the old std http server", (fn) => {
    expect(src(fn)).not.toMatch(/deno\.land\/std@[\d.]+\/http\/server\.ts/);
    expect(src(fn)).toMatch(/Deno\.serve\(/);
  });

  // Functions called without a Supabase session (webhooks, Stripe) authenticate themselves and
  // must have verify_jwt = false, or a CLI deploy makes every call fail with 401.
  it.each(functions.filter((fn) => /requireWebhookSecret\(|constructEventAsync\(/.test(src(fn))))(
    "%s has verify_jwt = false in supabase/config.toml",
    (fn) => {
      expect(config).toMatch(new RegExp(`\\[functions\\.${fn}\\]\\s*\\nverify_jwt = false`));
    },
  );
});
