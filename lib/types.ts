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

export type ApiErrorBody = {
  error: true;
  message: string;
  detail?: string;
};
