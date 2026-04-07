import { NextResponse } from "next/server";
import {
  LIBRARY_BASE_URL,
  asArray,
  buildUrl,
  fetchWithTimeout,
  getPublicDataKey,
  safeJson,
  toNumber,
} from "@/lib/api";
import type { ApiErrorBody, LibraryApiResponse, LibraryRoomItem } from "@/lib/types";

export async function GET(request: Request) {
  try {
    const apiKey = getPublicDataKey();
    if (!apiKey) {
      return NextResponse.json<LibraryApiResponse>({
        items: [],
        totalCount: 0,
        source: "no-key",
      });
    }

    const url = new URL(request.url);
    const stdgCd = url.searchParams.get("stdgCd") || "4311000000";
    const apiUrl = buildUrl(LIBRARY_BASE_URL, "/info_readingroom_use_v2", {
      serviceKey: apiKey,
      pageNo: url.searchParams.get("pageNo") || "1",
      numOfRows: url.searchParams.get("numOfRows") || "10",
      type: "json",
      stdgCd,
    });

    const response = await fetchWithTimeout(apiUrl, { cache: "no-store" }, 10_000);
    const payload = await safeJson(response);
    const root =
      typeof payload.response === "object" && payload.response !== null
        ? (payload.response as Record<string, unknown>)
        : payload;
    const body =
      typeof root.body === "object" && root.body !== null
        ? (root.body as Record<string, unknown>)
        : {};
    const header =
      typeof root.header === "object" && root.header !== null
        ? (root.header as Record<string, unknown>)
        : {};
    const nestedItems =
      typeof body.items === "object" && body.items !== null
        ? (body.items as Record<string, unknown>)
        : {};
    const rawItems =
      typeof body.item === "object" && body.item !== null
        ? body.item
        : typeof nestedItems.item === "object" && nestedItems.item !== null
          ? nestedItems.item
          : undefined;

    const items = asArray<Record<string, unknown>>(
      rawItems as Record<string, unknown> | Record<string, unknown>[] | undefined,
    );

    const normalized: LibraryRoomItem[] = items.map((item) => ({
      totDt: typeof item.totDt === "string" ? item.totDt : undefined,
      stdgCd: typeof item.stdgCd === "string" ? item.stdgCd : stdgCd,
      lclgvNm: typeof item.lclgvNm === "string" ? item.lclgvNm : undefined,
      libNm: typeof item.libNm === "string" ? item.libNm : undefined,
      rdrmNm: typeof item.rdrmNm === "string" ? item.rdrmNm : undefined,
      totSeatCnt: toNumber(item.totSeatCnt),
      useSeatCnt: toNumber(item.useSeatCnt),
      avlSeatCnt: toNumber(item.avlSeatCnt),
    }));

    const result: LibraryApiResponse = {
      resultCode: typeof header?.resultCode === "string" ? header.resultCode : undefined,
      resultMsg: typeof header?.resultMsg === "string" ? header.resultMsg : undefined,
      totalCount:
        typeof body?.totalCount === "string"
          ? Number(body.totalCount)
          : normalized.length,
      items: normalized,
      source: "public-data",
    };

    if (!response.ok) {
      return NextResponse.json<ApiErrorBody>(
        {
          error: true,
          message: `Library API returned HTTP ${response.status}`,
          detail: JSON.stringify(result),
        },
        { status: response.status },
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown library proxy error";
    return NextResponse.json<ApiErrorBody>(
      {
        error: true,
        message: "도서관 API 프록시 오류.",
        detail: message,
      },
      { status: 500 },
    );
  }
}
