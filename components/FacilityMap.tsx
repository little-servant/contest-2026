"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Facility } from "@/lib/types";

declare global {
  interface Window {
    __kakaoMapsReady?: boolean;
    kakao?: {
      maps?: {
        load: (cb: () => void) => void;
        Map: new (node: HTMLDivElement, options: Record<string, unknown>) => {
          setCenter: (center: unknown) => void;
          setLevel: (level: number) => void;
          relayout: () => void;
          setRotation: (angle: number) => void;
          getRotation: () => number;
        };
        LatLng: new (lat: number, lng: number) => unknown;
        Marker: new (options: Record<string, unknown>) => {
          setMap: (map: unknown | null) => void;
          setImage: (image: unknown) => void;
          setZIndex: (index: number) => void;
        };
        MarkerImage: new (
          src: string,
          size: unknown,
          options?: Record<string, unknown>,
        ) => unknown;
        Size: new (width: number, height: number) => unknown;
        Point: new (x: number, y: number) => unknown;
        event?: {
          addListener: (
            target: unknown,
            eventName: string,
            handler: () => void,
          ) => void;
        };
      };
    };
  }
}

type Props = {
  facilities: Facility[];
  activeId?: string;
  onSelectFacility?: (id: string) => void;
};

type MapStatus = "loading" | "ready" | "fallback";

export function FacilityMap({ facilities, activeId, onSelectFacility }: Props) {
  const router = useRouter();
  const ref = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<{
    setCenter: (center: unknown) => void;
    setLevel: (level: number) => void;
    relayout: () => void;
    setRotation: (angle: number) => void;
    getRotation: () => number;
  } | null>(null);
  const relayoutObserverRef = useRef<ResizeObserver | null>(null);
  const markersRef = useRef<
    Array<{
      id: string;
      marker: {
        setMap: (map: unknown | null) => void;
        setImage: (image: unknown) => void;
        setZIndex: (index: number) => void;
      };
    }>
  >([]);
  const markerImagesRef = useRef<{ active?: unknown; inactive?: unknown }>({});
  const [status, setStatus] = useState<MapStatus>("loading");
  const [fallbackReason, setFallbackReason] = useState(
    "Kakao 지도 SDK를 불러오는 중입니다.",
  );
  const rotationRef = useRef<number>(0);
  const gestureRef = useRef<{ initialAngle: number; initialRotation: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    let pollId: number | undefined;
    let timeoutId: number | undefined;
    let loadGuardId: number | undefined;

    const cleanupRelayoutObserver = () => {
      relayoutObserverRef.current?.disconnect();
      relayoutObserverRef.current = null;
    };

    const cleanupMarkers = () => {
      for (const entry of markersRef.current) {
        entry.marker.setMap(null);
      }
      markersRef.current = [];
    };

    const setFallback = (message: string) => {
      if (cancelled) {
        return;
      }

      cleanupRelayoutObserver();
      cleanupMarkers();
      mapRef.current = null;
      setStatus("fallback");
      setFallbackReason(message);
    };

    const initMap = () => {
      const kakao = window.kakao?.maps;
      if (!ref.current || !kakao) {
        setFallback("기관 데이터를 기반으로 지도를 구성할 수 없습니다.");
        return;
      }

      if (facilities.length === 0) {
        return;
      }

      cleanupMarkers();

      const activeFacility =
        facilities.find((facility) => facility.id === activeId) ?? facilities[0];
      const center = new kakao.LatLng(activeFacility.lat, activeFacility.lng);

      if (!mapRef.current) {
        const mapNode = ref.current;
        const { offsetHeight } = mapNode;

        if (offsetHeight <= 0) {
          // CSS height not yet resolved — force inline style and wait for layout
          mapNode.style.height = "50dvh";
          mapNode.style.minHeight = "320px";

          cleanupRelayoutObserver();
          if (typeof ResizeObserver === "function") {
            relayoutObserverRef.current = new ResizeObserver((entries) => {
              const h = Math.round(entries[0]?.contentRect.height ?? mapNode.offsetHeight);
              if (h > 0 && !cancelled) {
                cleanupRelayoutObserver();
                // Create map now that container has height, then re-run initMap for markers
                mapRef.current = new kakao.Map(mapNode, { center, level: 7 });
                initMap();
              }
            });
            relayoutObserverRef.current.observe(mapNode);
          }
          return; // markers will be added once ResizeObserver fires
        }

        mapRef.current = new kakao.Map(mapNode, {
          center,
          level: 7,
        });
      } else {
        mapRef.current.setCenter(center);
      }

      markerImagesRef.current = {
        active: new kakao.MarkerImage(
          "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_red.png",
          new kakao.Size(24, 35),
          {
            offset: new kakao.Point(12, 35),
          },
        ),
        inactive: new kakao.MarkerImage(
          "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png",
          new kakao.Size(24, 35),
          {
            offset: new kakao.Point(12, 35),
          },
        ),
      };

      for (const facility of facilities) {
        const isActive = facility.id === activeFacility.id;
        const marker = new kakao.Marker({
          position: new kakao.LatLng(facility.lat, facility.lng),
          image: isActive
            ? markerImagesRef.current.active
            : markerImagesRef.current.inactive,
        });
        marker.setMap(mapRef.current);
        marker.setZIndex(isActive ? 3 : 1);
        kakao.event?.addListener?.(marker, "click", () => {
          onSelectFacility?.(facility.id);
          router.push(`/route/${facility.id}`);
        });
        markersRef.current.push({ id: facility.id, marker });
      }

      setStatus("ready");
    };

    const boot = () => {
      const kakao = window.kakao?.maps;
      if (!kakao) {
        return false;
      }

      if (window.__kakaoMapsReady) {
        // SDK already initialized — skip kakao.maps.load to avoid missed callback
        initMap();
      } else if (typeof kakao.load === "function") {
        let loadFired = false;
        loadGuardId = window.setTimeout(() => {
          if (!loadFired && !cancelled) {
            setFallback(
              `Kakao 지도 인증 실패: 도메인(${window.location.hostname}) 또는 앱키를 확인하세요.`,
            );
          }
        }, 6000);

        kakao.load(() => {
          window.__kakaoMapsReady = true;
          loadFired = true;
          if (loadGuardId) {
            window.clearTimeout(loadGuardId);
            loadGuardId = undefined;
          }
          if (!cancelled) {
            initMap();
          }
        });
      } else {
        window.__kakaoMapsReady = true;
        initMap();
      }

      return true;
    };

    const clearTimers = () => {
      if (pollId) window.clearInterval(pollId);
      if (timeoutId) window.clearTimeout(timeoutId);
    };

    const onSdkLoaded = () => {
      clearTimers();
      if (!cancelled) boot();
    };

    const onSdkError = () => {
      clearTimers();
      if (!cancelled) setFallback("Kakao 지도 SDK를 불러오지 못했습니다. 네트워크를 확인하세요.");
    };

    window.addEventListener("kakao-sdk-loaded", onSdkLoaded, { once: true });
    window.addEventListener("kakao-sdk-error", onSdkError, { once: true });

    if (window.kakao?.maps) {
      boot();
    } else {
      pollId = window.setInterval(() => {
        if (window.kakao?.maps) {
          clearTimers();
          window.removeEventListener("kakao-sdk-loaded", onSdkLoaded);
          window.removeEventListener("kakao-sdk-error", onSdkError);
          boot();
        }
      }, 250);

      timeoutId = window.setTimeout(() => {
        if (pollId) window.clearInterval(pollId);
        window.removeEventListener("kakao-sdk-loaded", onSdkLoaded);
        window.removeEventListener("kakao-sdk-error", onSdkError);
        if (!cancelled) setFallback("Kakao 지도 SDK를 불러오지 못했습니다.");
      }, 10000);
    }

    return () => {
      cancelled = true;
      if (pollId) window.clearInterval(pollId);
      if (timeoutId) window.clearTimeout(timeoutId);
      if (loadGuardId) window.clearTimeout(loadGuardId);
      window.removeEventListener("kakao-sdk-loaded", onSdkLoaded);
      window.removeEventListener("kakao-sdk-error", onSdkError);
      cleanupRelayoutObserver();
      cleanupMarkers();
    };
  }, [facilities, onSelectFacility, router]);

  useEffect(() => {
    if (status !== "ready" || !mapRef.current || facilities.length === 0) {
      return;
    }

    const kakao = window.kakao?.maps;
    const activeFacility =
      facilities.find((facility) => facility.id === activeId) ?? facilities[0];

    if (!kakao || !activeFacility) {
      return;
    }

    const activeImage = markerImagesRef.current.active;
    const inactiveImage = markerImagesRef.current.inactive;

    for (const entry of markersRef.current) {
      const isActive = entry.id === activeFacility.id;
      entry.marker.setImage(isActive ? activeImage : inactiveImage);
      entry.marker.setZIndex(isActive ? 3 : 1);
    }

    mapRef.current.setCenter(new kakao.LatLng(activeFacility.lat, activeFacility.lng));
    mapRef.current.setLevel(activeId ? 6 : 7);
  }, [activeId, facilities, status]);

  // Two-finger rotation gesture
  useEffect(() => {
    const el = ref.current;
    if (!el || status !== "ready") return;

    const getTouchAngle = (touches: TouchList) => {
      const dx = touches[1].clientX - touches[0].clientX;
      const dy = touches[1].clientY - touches[0].clientY;
      return Math.atan2(dy, dx) * (180 / Math.PI);
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 2) return;
      gestureRef.current = {
        initialAngle: getTouchAngle(e.touches),
        initialRotation: rotationRef.current,
      };
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 2 || !gestureRef.current || !mapRef.current) return;
      const delta = getTouchAngle(e.touches) - gestureRef.current.initialAngle;
      const newRotation = gestureRef.current.initialRotation + delta;
      rotationRef.current = newRotation;
      mapRef.current.setRotation(newRotation);
    };

    const onTouchEnd = () => {
      gestureRef.current = null;
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: true });
    el.addEventListener("touchend", onTouchEnd);

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [status]);

  const visibleFacilities =
    status === "fallback" ? facilities.slice(0, 5) : facilities;

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="relative h-[50dvh] min-h-[320px]">
        <div
          ref={ref}
          className="w-full bg-[linear-gradient(135deg,#f0fdf9,#f8faf7)]"
          style={{ height: "50dvh", minHeight: "320px" }}
        />
        {status === "ready" ? null : (
          <div className="absolute inset-0 flex h-[50dvh] min-h-[320px] w-full flex-col justify-between bg-[linear-gradient(135deg,#f0fdf9,#f8faf7)] p-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                Facility Map
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-slate-950">
                {status === "fallback" ? "지도 대신 목록으로 확인" : "주변 돌봄 기관을 찾고 있습니다..."}
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
                {status === "fallback"
                  ? fallbackReason
                  : "기관 위치를 지도에 올리는 중입니다. SDK가 준비되면 마커를 표시합니다."}
              </p>
            </div>
            <div className="grid gap-2">
              {visibleFacilities.map((facility) => {
                const isActive = facility.id === activeId;

                return (
                  <button
                    key={facility.id}
                    type="button"
                    onClick={() => onSelectFacility?.(facility.id)}
                    className={`rounded-2xl border px-3 py-3 text-left transition ${
                      isActive
                        ? "border-slate-950 bg-white text-slate-950"
                        : "border-slate-200 bg-white/80 text-slate-700 hover:border-slate-400"
                    }`}
                  >
                    <p className="font-medium">{facility.name}</p>
                    <p className="mt-1 truncate text-xs text-slate-500">{facility.address}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
      {status === "ready" ? (
        <div className="border-t border-slate-200 px-4 py-3 text-sm text-slate-500">
          마커를 클릭하면 상세 페이지로 이동합니다.
        </div>
      ) : null}
    </div>
  );
}
