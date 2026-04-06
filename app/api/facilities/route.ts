import { NextResponse } from "next/server";
import { loadFacilities } from "@/lib/facilities";
import type { ApiErrorBody } from "@/lib/types";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id") ?? undefined;

  try {
    const { items, source } = await loadFacilities(id);
    return NextResponse.json({
      items,
      totalCount: items.length,
      source,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown facilities error";
    return NextResponse.json<ApiErrorBody>(
      {
        error: true,
        message: "기관 데이터를 불러오지 못했습니다.",
        detail: message,
      },
      { status: 500 },
    );
  }
}
