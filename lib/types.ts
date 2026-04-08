export type Facility = {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  stdgCd: string;
  busRouteId?: string;
  phone?: string;
  hours?: string;
  region?: string;
  source?: string;
};

export type FacilitiesApiResponse = {
  items: Facility[];
  totalCount: number;
  source: string;
};

export type TransitVehicleStatus = {
  totDt?: string;
  stdgCd?: string;
  lclgvNm?: string;
  cntrId?: string;
  cntrNm?: string;
  tvhclCntom?: number;
  oprVhclCntom?: number;
  avlVhclCntom?: number;
  rsvtNocs?: number;
  wtngNocs?: number;
};

export type TransitApiResponse = {
  error?: boolean;
  message?: string;
  resultCode?: string;
  resultMsg?: string;
  items?: TransitVehicleStatus[];
  totalCount?: number;
  source?: "public-data" | "no-key";
};

/** 전국 초정밀 버스 API — 노선 기본 정보 (/mst_info) */
export type BusRouteItem = {
  rteNo?: string;      // 노선 번호
  rteType?: string;    // 노선 유형
  stpnt?: string;      // 기점
  edpnt?: string;      // 종점
  vhclFstTm?: string;  // 첫차 시간
  vhclLstTm?: string;  // 막차 시간
};

/** 전국 초정밀 버스 API — 실시간 위치 정보 (/rtm_loc_info) */
export type BusLocationItem = {
  rteNo?: string;    // 노선 번호
  vhclNo?: string;   // 차량 번호
  gthrDt?: string;   // 수집 일시
  lat?: string;      // 위도
  lot?: string;      // 경도 (lot = longitude)
  oprDrct?: string;  // 운행 방향 (0: 정방향, 1: 역방향)
  oprSpd?: string;   // 운행 속도 (km/h)
  evtCd?: string;    // 이벤트 코드
  evtType?: string;  // 이벤트 유형
};

export type BusApiResponse = {
  error?: boolean;
  message?: string;
  stdgCd?: string;
  rteNo?: string;
  routes?: BusRouteItem[];
  positions?: BusLocationItem[];
  /** 전국 초정밀 버스 API는 도착 예정 시간을 제공하지 않음 */
  noArrivalTime: true;
  source?: "national-bus" | "no-key";
};

/** 공공도서관 열람실 현황 실시간 정보 */
export type LibraryRoomItem = {
  totDt?: string;       // 기준 일시
  stdgCd?: string;      // 행정구역 코드
  lclgvNm?: string;     // 지자체명
  libNm?: string;       // 도서관명
  rdrmNm?: string;      // 열람실명
  totSeatCnt?: number;  // 총 좌석 수
  useSeatCnt?: number;  // 사용 좌석 수
  avlSeatCnt?: number;  // 이용 가능 좌석 수
};

export type LibraryApiResponse = {
  error?: boolean;
  message?: string;
  resultCode?: string;
  resultMsg?: string;
  items?: LibraryRoomItem[];
  totalCount?: number;
  source?: "public-data" | "no-key";
};

export type ApiErrorBody = {
  error: true;
  message: string;
  detail?: string;
};

/** 아이 위치 공유 페이로드 */
export type LocationPayload = {
  code: string;
  lat: number;
  lng: number;
  ts: number;
  arrived?: boolean;
};

export type LocationPollResponse = {
  lat: number;
  lng: number;
  ts: number;
  stale: boolean;
  arrived?: boolean;
} | { notFound: true };

/** 교통안전 실시간 신호등 정보 */
export type SignalItem = {
  sigId?: string;    // 신호등 ID
  crossNm?: string;  // 교차로명
  lat?: number;      // 위도
  lng?: number;      // 경도
  sigStt?: string;   // 현재 신호 (RED / GREEN / YELLOW)
  remTime?: number;  // 잔여 시간 (초)
  dangerYn?: string; // 위험 여부 (Y/N)
};

export type SignalApiResponse = {
  items?: SignalItem[];
  source?: "public-data" | "demo" | "no-key";
  error?: boolean;
  message?: string;
};
