import { NextResponse } from "next/server";
import {
  NATIONAL_BUS_BASE_URL,
  asArray,
  buildUrl,
  getPublicDataKey,
} from "@/lib/api";
import type {
  ApiErrorBody,
  BusApiResponse,
  BusLocationItem,
  BusRouteItem,
} from "@/lib/types";

export async function GET(request: Request) {
  try {
    const apiKey = getPublicDataKey();
    if (!apiKey) {
      return NextResponse.json<BusApiResponse>({
        routes: [],
        positions: [],
        noArrivalTime: true,
        source: "no-key",
        message: "PUBLIC_DATA_API_KEY is not set.",
      });
    }

    const url = new URL(request.url);
    const stdgCd = url.searchParams.get("stdgCd") || "";
    const rteNo = url.searchParams.get("rteNo") || "";

    const commonParams: Record<string, string> = {
      serviceKey: apiKey,
      type: "json",
      pageNo: "1",
      numOfRows: "20",
      ...(stdgCd ? { stdgCd } : {}),
      ...(rteNo ? { rteNo } : {}),
    };

    const [routeRes, locRes] = await Promise.all([
      fetch(buildUrl(NATIONAL_BUS_BASE_URL, "/mst_info", commonParams), {
        cache: "no-store",
      }),
      fetch(buildUrl(NATIONAL_BUS_BASE_URL, "/rtm_loc_info", commonParams), {
        cache: "no-store",
      }),
    ]);

    if (!routeRes.ok && !locRes.ok) {
      return NextResponse.json<ApiErrorBody>(
        {
          error: true,
          message: `버스 API 오류 (노선: ${routeRes.status}, 위치: ${locRes.status})`,
        },
        { status: routeRes.status },
      );
    }

    const routeJson = routeRes.ok ? await routeRes.json() : {};
    const locJson = locRes.ok ? await locRes.json() : {};
    const routeRoot = routeJson?.response ?? routeJson;
    const locRoot = locJson?.response ?? locJson;

    const routeItems: BusRouteItem[] = asArray<Record<string, string>>(
      routeRoot?.body?.item ?? routeRoot?.body?.items?.item ?? [],
    ).map((item) => ({
      rteNo: item.rteNo,
      rteType: item.rteType,
      stpnt: item.stpnt,
      edpnt: item.edpnt,
      vhclFstTm: item.vhclFstTm,
      vhclLstTm: item.vhclLstTm,
    }));

    const locationItems: BusLocationItem[] = asArray<Record<string, string>>(
      locRoot?.body?.item ?? locRoot?.body?.items?.item ?? [],
    ).map((item) => ({
      rteNo: item.rteNo,
      vhclNo: item.vhclNo,
      gthrDt: item.gthrDt,
      lat: item.lat,
      lot: item.lot,
      oprDrct: item.oprDrct,
      oprSpd: item.oprSpd,
      evtCd: item.evtCd,
      evtType: item.evtType,
    }));

    const result: BusApiResponse = {
      stdgCd: stdgCd || undefined,
      rteNo: rteNo || undefined,
      routes: routeItems,
      positions: locationItems,
      noArrivalTime: true,
      message: "전국 초정밀 버스 API 문서 기준 도착예정시간은 제공되지 않습니다.",
      source: "national-bus",
    };

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown bus proxy error";
    return NextResponse.json<ApiErrorBody>(
      {
        error: true,
        message: "버스 API 프록시 오류.",
        detail: message,
      },
      { status: 500 },
    );
  }
}
