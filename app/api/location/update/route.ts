import { NextResponse } from "next/server";
import type { LocationPayload } from "@/lib/types";

// 인메모리 스토어 (데모용 — Vercel 함수 lifecycle 내 유지)
// 프로덕션에서는 Vercel KV 또는 Redis로 교체
declare global {
  // eslint-disable-next-line no-var
  var __locationStore: Map<string, { lat: number; lng: number; ts: number; arrived?: boolean }> | undefined;
}
const store: Map<string, { lat: number; lng: number; ts: number; arrived?: boolean }> =
  (globalThis.__locationStore ??= new Map());

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: true, message: "Invalid JSON" }, { status: 400 });
  }

  const payload = body as Partial<LocationPayload>;
  const { code, lat, lng, ts, arrived } = payload;

  if (
    typeof code !== "string" ||
    !/^\d{4}$/.test(code) ||
    typeof lat !== "number" ||
    typeof lng !== "number" ||
    typeof ts !== "number"
  ) {
    return NextResponse.json({ error: true, message: "Invalid payload" }, { status: 400 });
  }

  store.set(code, { lat, lng, ts, arrived: arrived === true });

  // 5분 이상 된 항목 정리
  const cutoff = Date.now() - 300_000;
  for (const [k, v] of store) {
    if (v.ts < cutoff) store.delete(k);
  }

  return NextResponse.json({ ok: true });
}
