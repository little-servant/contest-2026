import type { Facility } from "./types";

export const PUBLIC_DATA_BASE_URL =
  "https://apis.data.go.kr/B551982/tsdo_v2";
export const NATIONAL_BUS_BASE_URL = "https://apis.data.go.kr/B551982/rte";
export const LIBRARY_BASE_URL = "https://apis.data.go.kr/B551982/lib_v2";
export const CHILD_CARE_BASE_URL =
  "https://apis.data.go.kr/1383000/idis/serviceInstitutionService";
export const SIGNAL_BASE_URL = "https://apis.data.go.kr/B551982/tsi_v2";

export function getPublicDataKey() {
  return process.env.PUBLIC_DATA_API_KEY?.trim() ?? "";
}

export function getBaseUrl() {
  return process.env.NEXT_PUBLIC_BASE_URL?.trim() || "http://localhost:3000";
}

export function buildUrl(baseUrl: string, path: string, params: Record<string, string>) {
  const normalizedPath = path.startsWith("/") ? path.slice(1) : path;
  const url = new URL(normalizedPath, baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`);
  for (const [key, value] of Object.entries(params)) {
    if (value) {
      url.searchParams.set(key, value);
    }
  }
  return url.toString();
}

export function toNumber(value: unknown) {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
}

export function asArray<T>(value: T | T[] | null | undefined): T[] {
  if (value == null) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

export function distanceKm(
  first: Pick<Facility, "lat" | "lng">,
  second: Pick<Facility, "lat" | "lng">,
) {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRad(second.lat - first.lat);
  const dLng = toRad(second.lng - first.lng);
  const lat1 = toRad(first.lat);
  const lat2 = toRad(second.lat);
  const haversine =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);

  return 2 * earthRadiusKm * Math.asin(Math.sqrt(haversine));
}

export function decodeXml(text: string) {
  return text
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'");
}

export function parseXmlList(xml: string, itemTag = "itemList") {
  const items: Record<string, string>[] = [];
  const itemPattern = new RegExp(`<${itemTag}>([\\s\\S]*?)</${itemTag}>`, "g");

  for (const match of xml.matchAll(itemPattern)) {
    const chunk = match[1];
    const item: Record<string, string> = {};
    const fieldPattern = /<([A-Za-z0-9_]+)>([\s\S]*?)<\/\1>/g;

    for (const fieldMatch of chunk.matchAll(fieldPattern)) {
      item[fieldMatch[1]] = decodeXml(fieldMatch[2].trim());
    }

    if (Object.keys(item).length > 0) {
      items.push(item);
    }
  }

  return items;
}

export async function fetchWithTimeout(
  input: string | URL | Request,
  init?: RequestInit,
  timeoutMs = 10000,
) {
  const controller = new AbortController();
  const timerId = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timerId);
  }
}

export async function safeJson(response: Response): Promise<Record<string, unknown>> {
  const text = await response.text();
  if (!text.trim()) {
    return {};
  }

  try {
    const parsed = JSON.parse(text);
    return typeof parsed === "object" && parsed !== null
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}
