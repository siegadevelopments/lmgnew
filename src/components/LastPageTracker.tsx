'use client'

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { LAST_PAGE_KEY, isRememberablePath, sanitizeReturnPath } from "@/lib/auth-confirm";

/**
 * Remembers the last page the visitor viewed (excluding signup/login/auth pages) so a new
 * customer can be returned to it after confirming their email. Stored locally only.
 */
export function LastPageTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || !isRememberablePath(pathname)) return;
    const path = sanitizeReturnPath(pathname + window.location.search);
    if (!path) return;
    try {
      localStorage.setItem(LAST_PAGE_KEY, path);
    } catch {
      // storage unavailable (private mode etc.) - the feature just falls back to "/"
    }
  }, [pathname]);

  return null;
}
