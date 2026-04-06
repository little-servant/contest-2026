import { NextResponse } from "next/server";
import { loadFacilities } from "@/lib/facilities";
import type { ApiErrorBody } from "@/lib/types";

function sanitizeFacilityId(rawId: string | null) {
  const trimmed = rawId?.trim();
  if (!trimmed) {
    return undefined;
  }

  if (!/^[A-Za-z0-9_-]{1,32}$/.test(trimmed)) {
    return null;
  }

  return trimmed;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const id = sanitizeFacilityId(url.searchParams.get("id"));

  if (id === null) {
    return NextResponse.json<ApiErrorBody>(
      {
        error: true,
        message: "잘못된 기관 ID 형식입니다.",
      },
      { status: 400 },
    );
  }

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
