"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Refresh usage badges when returning from a completed Run, including BFCache. */
export function HomeRefresh() {
  const router = useRouter();
  useEffect(() => {
    const onPageShow = (event: PageTransitionEvent) => { if (event.persisted) router.refresh(); };
    const onVisibility = () => { if (document.visibilityState === "visible") router.refresh(); };
    window.addEventListener("pageshow", onPageShow);
    document.addEventListener("visibilitychange", onVisibility);
    return () => { window.removeEventListener("pageshow", onPageShow); document.removeEventListener("visibilitychange", onVisibility); };
  }, [router]);
  return null;
}
