"use client";

import { useEffect } from "react";

export function KakaoSdkScript({ kakaoKey }: { kakaoKey: string }) {
  useEffect(() => {
    if (!kakaoKey) {
      return;
    }

    let cancelled = false;
    let retryTimerId: number | undefined;
    let loadTimeoutId: number | undefined;

    const scriptId = "carepass-kakao-sdk";
    const maxAttempts = 12;
    const timeoutMs = 7000;
    const retryBaseDelayMs = 1200;

    const clearTimers = () => {
      if (retryTimerId) {
        window.clearTimeout(retryTimerId);
        retryTimerId = undefined;
      }

      if (loadTimeoutId) {
        window.clearTimeout(loadTimeoutId);
        loadTimeoutId = undefined;
      }
    };

    const emitLoaded = () => {
      window.dispatchEvent(new CustomEvent("kakao-sdk-loaded"));
    };

    const emitError = (error: unknown) => {
      console.error("[CarePass] Kakao SDK script failed to load:", error);
      window.dispatchEvent(new CustomEvent("kakao-sdk-error"));
    };

    const removeExistingScript = () => {
      const existing = document.getElementById(scriptId);
      if (existing) {
        existing.remove();
      }
    };

    const loadWithRetry = (attempt: number) => {
      if (cancelled) {
        return;
      }

      if (window.kakao?.maps) {
        emitLoaded();
        return;
      }

      removeExistingScript();

      const script = document.createElement("script");
      script.id = scriptId;
      script.async = true;
      script.defer = true;
      script.src =
        `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(kakaoKey)}` +
        `&autoload=false&_retry=${attempt}`;

      const retry = (reason: unknown) => {
        emitError(reason);

        if (cancelled || attempt >= maxAttempts) {
          return;
        }

        retryTimerId = window.setTimeout(() => {
          loadWithRetry(attempt + 1);
        }, retryBaseDelayMs * attempt);
      };

      script.onload = () => {
        clearTimers();
        window.setTimeout(() => {
          if (cancelled) {
            return;
          }

          if (window.kakao?.maps) {
            emitLoaded();
            return;
          }

          retry(new Error("SDK loaded but window.kakao.maps is unavailable."));
        }, 0);
      };

      script.onerror = (event) => {
        clearTimers();
        retry(event);
      };

      loadTimeoutId = window.setTimeout(() => {
        clearTimers();
        retry(new Error("Kakao SDK load timeout."));
      }, timeoutMs);

      document.head.appendChild(script);
    };

    loadWithRetry(1);

    return () => {
      cancelled = true;
      clearTimers();
    };
  }, [kakaoKey]);

  return null;
}
