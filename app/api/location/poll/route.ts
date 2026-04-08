import { NextResponse } from "next/server";

declare global {
  // eslint-disable-next-line no-var
  var __locationStore: Map<string, { lat: number; lng: number; ts: number; arrived?: boolean }> | undefined;
}
const store: Map<string, { lat: number; lng: number; ts: number; arrived?: boolean }> =
  (globalThis.__locationStore ??= new Map());

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code")?.trim();

  if (!code || !/^\d{4}$/.test(code)) {
    return NextResponse.json({ error: true, message: "code 파라미터가 필요합니다." }, { status: 400 });
  }

  const entry = store.get(code);
  if (!entry) {
    return NextResponse.json({ notFound: true }, { status: 404 });
  }

  const stale = Date.now() - entry.ts > 120_000; // 2분 이상 갱신 없으면 stale
  return NextResponse.json({ lat: entry.lat, lng: entry.lng, ts: entry.ts, stale, arrived: entry.arrived ?? false });
}
