import { NextResponse } from "next/server";
import {
  PUBLIC_DATA_BASE_URL,
  asArray,
  buildUrl,
  getPublicDataKey,
  toNumber,
} from "@/lib/api";
import type { ApiErrorBody, TransitApiResponse, TransitVehicleStatus } from "@/lib/types";

export async function GET(request: Request) {
  try {
    const apiKey = getPublicDataKey();
    if (!apiKey) {
      return NextResponse.json<TransitApiResponse>({
        items: [],
        totalCount: 0,
        source: "no-key",
      });
    }

    const url = new URL(request.url);
    const stdgCd = url.searchParams.get("stdgCd") || "4311000000";
    const apiUrl = buildUrl(PUBLIC_DATA_BASE_URL, "/info_vehicle_use_v2", {
      serviceKey: apiKey,
      pageNo: url.searchParams.get("pageNo") || "1",
      numOfRows: url.searchParams.get("numOfRows") || "10",
      type: "json",
      stdgCd,
    });

    const response = await fetch(apiUrl, { cache: "no-store" });
    const payload = (await response.json()) as unknown;
    const payloadRecord =
      typeof payload === "object" && payload !== null
        ? (payload as Record<string, unknown>)
        : {};
    const root =
      typeof payloadRecord.response === "object" && payloadRecord.response !== null
        ? (payloadRecord.response as Record<string, unknown>)
        : payloadRecord;
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

    const normalized: TransitVehicleStatus[] = items.map((item) => ({
      totDt: typeof item.totDt === "string" ? item.totDt : undefined,
      stdgCd: typeof item.stdgCd === "string" ? item.stdgCd : stdgCd,
      lclgvNm: typeof item.lclgvNm === "string" ? item.lclgvNm : undefined,
      cntrId: typeof item.cntrId === "string" ? item.cntrId : undefined,
      cntrNm: typeof item.cntrNm === "string" ? item.cntrNm : undefined,
      tvhclCntom: toNumber(item.tvhclCntom),
      oprVhclCntom: toNumber(item.oprVhclCntom),
      avlVhclCntom: toNumber(item.avlVhclCntom),
      rsvtNocs: toNumber(item.rsvtNocs),
      wtngNocs: toNumber(item.wtngNocs),
    }));

    const result: TransitApiResponse = {
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
          message: `Transit API returned HTTP ${response.status}`,
          detail: JSON.stringify(result),
        },
        { status: response.status },
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown transit proxy error";
    return NextResponse.json<ApiErrorBody>(
      {
        error: true,
        message: "Failed to proxy transit API.",
        detail: message,
      },
      { status: 500 },
    );
  }
}
