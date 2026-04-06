import fallbackFacilitiesJson from "../public/data/facilities.json";
import { CHILD_CARE_BASE_URL, buildUrl, getPublicDataKey } from "./api";
import type { Facility } from "./types";

type ChildCareItem = {
  childCareInstNo?: string;
  childCareInstNm?: string;
  addr?: string;
  lot?: string | number;
  lat?: string | number;
  rprsTelno?: string;
  ctpvNm?: string;
};

export type FacilityDataSource = "child-care-api" | "static-json";

const fallbackFacilities = fallbackFacilitiesJson as Facility[];

const STDG_CD_BY_REGION: Record<string, string> = {
  서울: "1100000000",
  부산: "2600000000",
  대구: "2700000000",
  인천: "2800000000",
  광주: "2900000000",
  대전: "3000000000",
  울산: "3100000000",
  세종: "3600000000",
  경기: "4100000000",
  강원: "4200000000",
  충북: "4300000000",
  충남: "4400000000",
  전북: "4500000000",
  전남: "4600000000",
  경북: "4700000000",
  경남: "4800000000",
  제주: "5000000000",
};

function toCoordinate(value?: string | number) {
  const parsed =
    typeof value === "number"
      ? value
      : Number.parseFloat(value ?? "");
  return Number.isFinite(parsed) ? parsed : null;
}

function isValidCoordinatePair(lat: number, lng: number) {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180 &&
    !(lat === 0 && lng === 0)
  );
}

function normalizeRegionToken(token?: string) {
  if (!token) {
    return "";
  }

  return token
    .trim()
    .replaceAll("특별자치도", "")
    .replaceAll("특별자치시", "")
    .replaceAll("광역시", "")
    .replaceAll("특별시", "")
    .replaceAll("도", "");
}

function inferStdgCd(item: ChildCareItem) {
  const directRegion = normalizeRegionToken(item.ctpvNm);
  if (directRegion && directRegion in STDG_CD_BY_REGION) {
    return STDG_CD_BY_REGION[directRegion];
  }

  const fallbackSource = `${item.addr ?? ""} ${item.childCareInstNm ?? ""}`.trim();
  const firstToken = normalizeRegionToken(fallbackSource.split(/\s+/)[0]);
  if (firstToken && firstToken in STDG_CD_BY_REGION) {
    return STDG_CD_BY_REGION[firstToken];
  }

  return "";
}

function normalizeCoordinates(item: ChildCareItem) {
  const rawLat = toCoordinate(item.lat);
  const rawLot = toCoordinate(item.lot);

  if (rawLat == null || rawLot == null) {
    return null;
  }

  // 아이돌봄 원본 응답은 lat/lot 값이 문서 설명과 반대로 내려오는 케이스가 존재한다.
  if (Math.abs(rawLat) > 90 && Math.abs(rawLot) <= 90) {
    if (!isValidCoordinatePair(rawLot, rawLat)) {
      return null;
    }

    return { lat: rawLot, lng: rawLat };
  }

  if (!isValidCoordinatePair(rawLat, rawLot)) {
    return null;
  }

  return { lat: rawLat, lng: rawLot };
}

function normalizeChildCareItem(item: ChildCareItem): Facility | null {
  const coordinates = normalizeCoordinates(item);
  const id = item.childCareInstNo?.trim() ?? "";
  const name = item.childCareInstNm?.trim() ?? "";

  if (!id || !name || !coordinates) {
    return null;
  }

  return {
    id,
    name,
    address: item.addr?.trim() ?? "",
    lat: coordinates.lat,
    lng: coordinates.lng,
    phone: item.rprsTelno?.trim(),
    stdgCd: inferStdgCd(item),
    source: "child-care-api",
  };
}

export function loadStaticFacilities(id?: string): Facility[] {
  if (!id) {
    return fallbackFacilities;
  }

  return fallbackFacilities.filter((facility) => facility.id === id);
}

async function fetchFacilitiesFromApi(apiKey: string, id?: string): Promise<Facility[]> {
  const params: Record<string, string> = {
    serviceKey: apiKey,
    type: "json",
    pageNo: "1",
    numOfRows: "100",
    ...(id ? { childCareInstNo: id } : {}),
  };

  const url = buildUrl(CHILD_CARE_BASE_URL, "/getServiceInstitutionList", params);
  const response = await fetch(url, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`아이돌봄 API HTTP ${response.status}`);
  }

  const json = await response.json();
  const rawItems = json?.response?.body?.items?.item;
  const items = Array.isArray(rawItems)
    ? (rawItems as ChildCareItem[])
    : rawItems
      ? [rawItems as ChildCareItem]
      : [];

  const normalized = items
    .map(normalizeChildCareItem)
    .filter((item): item is Facility => item !== null);

  const deduped = new Map<string, Facility>();
  for (const item of normalized) {
    if (!deduped.has(item.id)) {
      deduped.set(item.id, item);
    }
  }

  return Array.from(deduped.values());
}

export async function loadFacilities(id?: string): Promise<{
  items: Facility[];
  source: FacilityDataSource;
}> {
  const apiKey = getPublicDataKey();

  if (apiKey) {
    try {
      const items = await fetchFacilitiesFromApi(apiKey, id);
      if (items.length > 0) {
        return {
          items,
          source: "child-care-api",
        };
      }
    } catch {
      // API 실패 시 정적 JSON 폴백
    }
  }

  return {
    items: loadStaticFacilities(id),
    source: "static-json",
  };
}

export async function loadFacilityById(id: string): Promise<Facility | undefined> {
  const { items, source } = await loadFacilities(id);
  const exactMatch = items.find((facility) => facility.id === id);
  if (exactMatch) {
    return exactMatch;
  }

  if (source === "child-care-api") {
    return loadStaticFacilities(id)[0];
  }

  return undefined;
}
