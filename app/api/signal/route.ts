import { NextResponse } from "next/server";
import {
  SIGNAL_BASE_URL,
  asArray,
  buildUrl,
  fetchWithTimeout,
  getPublicDataKey,
  safeJson,
  toNumber,
} from "@/lib/api";
import type { ApiErrorBody, SignalApiResponse, SignalItem } from "@/lib/types";

const DEMO_SIGNALS: SignalItem[] = [
  {
    sigId: "SIG001",
    crossNm: "강남대로/논현로 교차로",
    lat: 37.5085,
    lng: 127.0253,
    sigStt: "RED",
    remTime: 23,
    dangerYn: "Y",
  },
  {
    sigId: "SIG002",
    crossNm: "선릉로/테헤란로 교차로",
    lat: 37.5112,
    lng: 127.0351,
    sigStt: "GREEN",
    remTime: 8,
    dangerYn: "N",
  },
  {
    sigId: "SIG003",
    crossNm: "영동대로/삼성로 교차로",
    lat: 37.5148,
    lng: 127.0423,
    sigStt: "RED",
    remTime: 45,
    dangerYn: "Y",
  },
];

export async function GET(request: Request) {
  try {
    const apiKey = getPublicDataKey();
    if (!apiKey) {
      return NextResponse.json<SignalApiResponse>({
        items: DEMO_SIGNALS,
        source: "demo",
      });
    }

    const url = new URL(request.url);
    const stdgCd = url.searchParams.get("stdgCd") || "1100000000";

    const apiUrl = buildUrl(SIGNAL_BASE_URL, "/info_signal_v2", {
      serviceKey: apiKey,
      pageNo: url.searchParams.get("pageNo") || "1",
      numOfRows: url.searchParams.get("numOfRows") || "10",
      type: "json",
      stdgCd,
    });

    const response = await fetchWithTimeout(apiUrl, { cache: "no-store" }, 10_000);

    if (!response.ok) {
      // API endpoint not available — fall back to demo
      return NextResponse.json<SignalApiResponse>({
        items: DEMO_SIGNALS,
        source: "demo",
        message: `Signal API returned HTTP ${response.status}`,
      });
    }

    const payload = await safeJson(response);
    const root =
      typeof payload.response === "object" && payload.response !== null
        ? (payload.response as Record<string, unknown>)
        : payload;
    const body =
      typeof root.body === "object" && root.body !== null
        ? (root.body as Record<string, unknown>)
        : {};
    const nestedItems =
      typeof body.items === "object" && body.items !== null
        ? (body.items as Record<string, unknown>)
        : {};
    const rawItems =
      typeof body.item !== "undefined"
        ? body.item
        : typeof nestedItems.item !== "undefined"
          ? nestedItems.item
          : undefined;

    const items = asArray<Record<string, unknown>>(
      rawItems as Record<string, unknown> | Record<string, unknown>[] | undefined,
    );

    if (items.length === 0) {
      return NextResponse.json<SignalApiResponse>({
        items: DEMO_SIGNALS,
        source: "demo",
        message: "No signal data returned by API",
      });
    }

    const normalized: SignalItem[] = items.map((item) => ({
      sigId: typeof item.sigId === "string" ? item.sigId : undefined,
      crossNm: typeof item.crossNm === "string" ? item.crossNm : undefined,
      lat: toNumber(item.lat),
      lng: toNumber(item.lng ?? item.lot),
      sigStt: typeof item.sigStt === "string" ? item.sigStt : undefined,
      remTime: toNumber(item.remTime),
      dangerYn: typeof item.dangerYn === "string" ? item.dangerYn : undefined,
    }));

    return NextResponse.json<SignalApiResponse>({
      items: normalized,
      source: "public-data",
    });
  } catch {
    return NextResponse.json<ApiErrorBody>(
      { error: true, message: "Failed to proxy signal API." },
      { status: 500 },
    );
  }
}
