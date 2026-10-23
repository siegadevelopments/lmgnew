import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import path from "path";
import { newGuestToken } from "@/lib/guest-chat";

describe("guest chat token", () => {
  it("is 64 random hex characters (the database refuses anything under 32)", () => {
    const a = newGuestToken();
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(newGuestToken()).not.toBe(a);
  });
});

// Regression: every guest conversation was readable by anyone; the browser filtered by a
// guessable "guest_<random>" id.
describe("guest chat wiring", () => {
  const root = path.resolve(import.meta.dirname, "../../..");
  const chat = readFileSync(path.join(root, "src/components/chat/GlobalChat.tsx"), "utf8");
  const sql = readFileSync(path.join(root, "supabase/migrations/20261023_guest_chat_token.sql"), "utf8");

  it("all chat table access goes through the token-aware client", () => {
    expect(chat).not.toMatch(/supabase\.from\("chat_(conversations|messages)"/);
    expect(chat).not.toMatch(/lmg_support_guest_id/);
    expect(chat).toMatch(/guest_token: user \? null : guestToken/);
  });

  it("guests poll for replies (Realtime can't carry the header)", () => {
    expect(chat).toMatch(/setInterval\(poll, 5000\)/);
  });

  it("policies no longer allow every guest conversation", () => {
    const code = sql.replace(/^--.*$/gm, "");
    expect(code).not.toMatch(/OR \(customer_id IS NULL AND vendor_id IS NULL\)\s*\)/);
    expect(code).toMatch(/length\(p_token\) >= 32/);
    expect(code).toMatch(/p_token = public\.request_guest_token\(\)/);
  });
});
