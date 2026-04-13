import { NextResponse } from "next/server";
import type { LocationPayload } from "@/lib/types";

type LocationEntry = { lat: number; lng: number; ts: number; arrived?: boolean };

// 인메모리 fallback (KV 미설정 환경용)
declare global {
  // eslint-disable-next-line no-var
  var __locationStore: Map<string, LocationEntry> | undefined;
}
const store: Map<string, LocationEntry> =
  (globalThis.__locationStore ??= new Map());

async function setLocation(code: string, entry: LocationEntry): Promise<void> {
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    const { kv } = await import("@vercel/kv");
    await kv.set(`loc:${code}`, entry, { ex: 300 }); // 5분 TTL
    return;
  }
  store.set(code, entry);
  // 5분 이상 된 항목 정리
  const cutoff = Date.now() - 300_000;
  for (const [k, v] of store) {
    if (v.ts < cutoff) store.delete(k);
  }
}

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

  try {
    await setLocation(code, { lat, lng, ts, arrived: arrived === true });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: true, message: "Storage error" }, { status: 500 });
  }
}
