import { NextResponse } from "next/server";

type LocationEntry = { lat: number; lng: number; ts: number; arrived?: boolean };

// 인메모리 fallback (KV 미설정 환경용)
declare global {
  // eslint-disable-next-line no-var
  var __locationStore: Map<string, LocationEntry> | undefined;
}
const store: Map<string, LocationEntry> =
  (globalThis.__locationStore ??= new Map());

async function getLocation(code: string): Promise<LocationEntry | null> {
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    const { kv } = await import("@vercel/kv");
    return await kv.get<LocationEntry>(`loc:${code}`);
  }
  return store.get(code) ?? null;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code")?.trim();

  if (!code || !/^\d{4}$/.test(code)) {
    return NextResponse.json(
      { error: true, message: "code 파라미터가 필요합니다." },
      { status: 400 },
    );
  }

  try {
    const entry = await getLocation(code);
    if (!entry) {
      return NextResponse.json({ notFound: true }, { status: 404 });
    }

    const stale = Date.now() - entry.ts > 120_000; // 2분 이상 갱신 없으면 stale
    return NextResponse.json({
      lat: entry.lat,
      lng: entry.lng,
      ts: entry.ts,
      stale,
      arrived: entry.arrived ?? false,
    });
  } catch {
    return NextResponse.json(
      { error: true, message: "Storage error" },
      { status: 500 },
    );
  }
}
