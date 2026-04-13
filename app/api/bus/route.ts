import { NextResponse } from "next/server";
import {
  NATIONAL_BUS_BASE_URL,
  asArray,
  buildUrl,
  fetchWithTimeout,
  getPublicDataKey,
  safeJson,
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

    const rawNumOfRows = Number(url.searchParams.get("numOfRows")) || 20;
    const numOfRows = Math.min(Math.max(1, rawNumOfRows), 50).toString();

    const commonParams: Record<string, string> = {
      serviceKey: apiKey,
      type: "json",
      pageNo: "1",
      numOfRows,
      ...(stdgCd ? { stdgCd } : {}),
      ...(rteNo ? { rteNo } : {}),
    };

    const [routeRes, locRes] = await Promise.all([
      fetchWithTimeout(buildUrl(NATIONAL_BUS_BASE_URL, "/mst_info", commonParams), {
        cache: "no-store",
      }, 10_000),
      fetchWithTimeout(buildUrl(NATIONAL_BUS_BASE_URL, "/rtm_loc_info", commonParams), {
        cache: "no-store",
      }, 10_000),
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

    const routeJson = routeRes.ok ? await safeJson(routeRes) : {};
    const locJson = locRes.ok ? await safeJson(locRes) : {};
    const routeRootCandidate =
      typeof routeJson.response === "object" && routeJson.response !== null
        ? routeJson.response
        : routeJson;
    const locRootCandidate =
      typeof locJson.response === "object" && locJson.response !== null
        ? locJson.response
        : locJson;
    const routeRoot =
      typeof routeRootCandidate === "object" && routeRootCandidate !== null
        ? (routeRootCandidate as Record<string, unknown>)
        : {};
    const locRoot =
      typeof locRootCandidate === "object" && locRootCandidate !== null
        ? (locRootCandidate as Record<string, unknown>)
        : {};
    const routeBody =
      typeof routeRoot.body === "object" && routeRoot.body !== null
        ? (routeRoot.body as Record<string, unknown>)
        : {};
    const routeNestedItems =
      typeof routeBody.items === "object" && routeBody.items !== null
        ? (routeBody.items as Record<string, unknown>)
        : {};
    const routeRawItems =
      typeof routeBody.item === "object" && routeBody.item !== null
        ? routeBody.item
        : typeof routeNestedItems.item === "object" && routeNestedItems.item !== null
          ? routeNestedItems.item
          : undefined;
    const locBody =
      typeof locRoot.body === "object" && locRoot.body !== null
        ? (locRoot.body as Record<string, unknown>)
        : {};
    const locNestedItems =
      typeof locBody.items === "object" && locBody.items !== null
        ? (locBody.items as Record<string, unknown>)
        : {};
    const locRawItems =
      typeof locBody.item === "object" && locBody.item !== null
        ? locBody.item
        : typeof locNestedItems.item === "object" && locNestedItems.item !== null
          ? locNestedItems.item
          : undefined;

    const routeItems: BusRouteItem[] = asArray<Record<string, string>>(
      routeRawItems as Record<string, string> | Record<string, string>[] | undefined,
    ).map((item) => ({
      rteNo: item.rteNo,
      rteType: item.rteType,
      stpnt: item.stpnt,
      edpnt: item.edpnt,
      vhclFstTm: item.vhclFstTm,
      vhclLstTm: item.vhclLstTm,
    }));

    const locationItems: BusLocationItem[] = asArray<Record<string, string>>(
      locRawItems as Record<string, string> | Record<string, string>[] | undefined,
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
