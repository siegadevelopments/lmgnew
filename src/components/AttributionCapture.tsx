"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { captureAttribution } from "@/lib/attribution";

/** Records UTM tags / click ids from the landing URL (see src/lib/attribution.ts). Renders nothing. */
export function AttributionCapture() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  useEffect(() => {
    captureAttribution();
  }, [pathname, searchParams]);
  return null;
}
