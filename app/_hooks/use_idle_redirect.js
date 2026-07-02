"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const ACTIVITY_EVENTS = [
  "mousedown",
  "mousemove",
  "touchstart",
  "keydown",
  "scroll",
  "wheel",
];

export default function useIdleRedirect(timeoutMs, redirectPath) {
  const router = useRouter();
  const timerRef = useRef(null);

  useEffect(() => {
    const resetTimer = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        router.push(redirectPath);
      }, timeoutMs);
    };

    resetTimer();
    ACTIVITY_EVENTS.forEach((event) =>
      document.addEventListener(event, resetTimer, { passive: true }),
    );

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      ACTIVITY_EVENTS.forEach((event) =>
        document.removeEventListener(event, resetTimer),
      );
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeoutMs, redirectPath]);
}
