"use client";
import { useEffect } from "react";

// Every page here renders session-dependent UI. When a page is restored from
// the browser's back/forward cache (pressing "back"), it comes back exactly as
// it was — which can show a stale session (e.g. a demo user landing on a
// logged-out-looking home page). The `pageshow` event fires with
// `persisted === true` only on a bfcache restore, so that's the moment to
// force a fresh load that reflects the real current session.
export default function BfcacheGuard() {
  useEffect(() => {
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) window.location.reload();
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);
  return null;
}
