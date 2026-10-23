import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Guest support chat (signed-out visitors). Each browser holds a long random secret, sent as the
// x-guest-token header; the database only lets a guest see conversations carrying the same
// secret (supabase/migrations/20261023_guest_chat_token.sql). The old guest id was guessable,
// and every guest conversation was readable by anyone.

const TOKEN_KEY = "lmg_support_guest_token";

export function newGuestToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join(""); // 64 hex chars
}

/** This browser's guest token, created on first use. */
export function getGuestToken(): string {
  try {
    const existing = localStorage.getItem(TOKEN_KEY);
    if (existing && existing.length >= 32) return existing;
    const token = newGuestToken();
    localStorage.setItem(TOKEN_KEY, token);
    return token;
  } catch {
    return newGuestToken(); // storage blocked: works for this page view only
  }
}

/** Starts a fresh guest conversation ("New chat"). */
export function resetGuestToken(): string {
  const token = newGuestToken();
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // storage blocked
  }
  return token;
}

const clients = new Map<string, SupabaseClient>();

/** A Supabase client that sends this guest's token with every request. */
export function guestChatClient(token: string): SupabaseClient {
  let client = clients.get(token);
  if (!client) {
    client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "", {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false, storageKey: "lmg-guest-chat" },
      global: { headers: { "x-guest-token": token } },
    });
    clients.set(token, client);
  }
  return client;
}
