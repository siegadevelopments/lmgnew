'use client'

import { Suspense, useState, useEffect } from "react";
import dynamic from "next/dynamic";

const BackToTop = dynamic(() => import("@/components/BackToTop").then((mod) => mod.BackToTop), { ssr: false });
const MessengerBubble = dynamic(() => import("@/components/chat/GlobalChat").then((mod) => mod.MessengerBubble), { ssr: false });
const GlobalPopup = dynamic(() => import("@/components/GlobalPopup").then((mod) => mod.GlobalPopup), { ssr: false });
const AppInstallPopup = dynamic(() => import("@/components/AppInstallPopup").then((mod) => mod.AppInstallPopup), { ssr: false });
const CacheBuster = dynamic(() => import("@/components/CacheBuster").then((mod) => mod.CacheBuster), { ssr: false });
const MarketingScripts = dynamic(() => import("@/components/MarketingScripts").then((mod) => mod.MarketingScripts), { ssr: false });

export function ClientOnlyOverlays() {
  const [shouldLoadDeferred, setShouldLoadDeferred] = useState(false);

  useEffect(() => {
    // Load deferred scripts and widgets after 3 seconds of inactivity
    const timer = setTimeout(() => {
      setShouldLoadDeferred(true);
    }, 3000);

    const handleInteraction = () => {
      setShouldLoadDeferred(true);
      clearTimeout(timer);
      removeListeners();
    };

    const removeListeners = () => {
      window.removeEventListener("scroll", handleInteraction);
      window.removeEventListener("mousemove", handleInteraction);
      window.removeEventListener("touchstart", handleInteraction);
      window.removeEventListener("keydown", handleInteraction);
    };

    window.addEventListener("scroll", handleInteraction, { passive: true });
    window.addEventListener("mousemove", handleInteraction, { passive: true });
    window.addEventListener("touchstart", handleInteraction, { passive: true });
    window.addEventListener("keydown", handleInteraction, { passive: true });

    return () => {
      clearTimeout(timer);
      removeListeners();
    };
  }, []);

  return (
    <>
      {shouldLoadDeferred && (
        <>
          <MarketingScripts />
          <MessengerBubble />
          <Suspense fallback={null}>
            <GlobalPopup />
          </Suspense>
        </>
      )}
      <CacheBuster />
      <BackToTop />
      <AppInstallPopup />
    </>
  );
}
