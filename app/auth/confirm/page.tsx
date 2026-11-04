'use client'

/**
 * Email confirmation landing page (signup, recovery, etc.).
 *
 * Auth model: public page. The one-time token_hash from the email is verified
 * client-side with supabase.auth.verifyOtp, which establishes the session in
 * this browser (the app keeps sessions in localStorage). Verification happens
 * in JS, not on page load of a GET handler, so email link scanners that don't
 * run JavaScript can't burn the single-use token.
 *
 * Email templates link here (our own domain) instead of the supabase.co
 * verify URL, which avoids a sender/link domain mismatch that triggers spam filters.
 */

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/integrations/supabase/client";
import { resolveOtpType, safeNextPath } from "@/lib/auth-confirm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function ConfirmContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [failed, setFailed] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return; // tokens are single-use; don't double-fire in StrictMode
    started.current = true;

    const tokenHash = searchParams?.get("token_hash");
    const type = resolveOtpType(searchParams?.get("type"));
    const next = safeNextPath(searchParams?.get("next"), "/");

    if (!tokenHash || !type) {
      setFailed(true);
      return;
    }

    supabase.auth.verifyOtp({ token_hash: tokenHash, type }).then(({ error }) => {
      if (error) {
        setFailed(true);
        return;
      }
      router.replace(type === "recovery" ? "/login?type=recovery" : next);
    });
  }, [router, searchParams]);

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle>{failed ? "This link has expired" : "Confirming your email…"}</CardTitle>
        <CardDescription>
          {failed
            ? "The confirmation link is invalid or has already been used."
            : "One moment while we verify your account."}
        </CardDescription>
      </CardHeader>
      {failed && (
        <CardContent className="text-center text-sm">
          <p className="mb-3">
            If you've already confirmed, you can{" "}
            <Link href="/login" className="underline">sign in</Link>. Otherwise, please{" "}
            <Link href="/signup" className="underline">register again</Link> to get a new link.
          </p>
        </CardContent>
      )}
    </Card>
  );
}

export default function AuthConfirmPage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <Suspense fallback={null}>
        <ConfirmContent />
      </Suspense>
    </div>
  );
}
