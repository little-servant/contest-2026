# contest-2026 — 작업 로그

## 작업 로그
| 날짜 | 내용 | 상태 |
|------|------|------|
| 2026-04-01 | 프로젝트 방향 확정, CLAUDE.md 작성 | 완료 |
| 2026-04-01 | D1 API 조사 완료 + 코드/문서 반영 | 완료 |
| 2026-04-01 | D2 완료: 기관 목록을 `/api/facilities` 기반으로 지도와 연동하고, 마커/목록에서 상세 페이지 이동, 교통약자·버스 패널 30초 폴링, 홈 소개 문구 정리까지 반영 | 완료 |
| 2026-04-02 | D3 완료: 상세 페이지를 `/api/facilities?id=...` 기반으로 보강하고 `TransportSummary`를 추가했으며, 홈 현재 위치 사용 버튼/nearest 가드, `stdgCd` 없는 버스 UI 안내까지 반영 | 완료 |
| 2026-04-02 | D4 수정: 시설 응답 타입 통일, 상세 조회 로직 보정, fetcher의 HTTP 상태 체크, 위치 권한 에러 코드 분기, 빈 `stdgCd` 태그 제거, 의존성 재설치 후 lint/build 검증 진행 | 완료 |
| 2026-04-02 | D5 완료: 리스크 해결(transit no-key 200 처리), 반응형 모바일 UI, BottomNav | 완료 |
| 2026-04-02 | D6 완료: vercel.json 생성, README.md에 서비스 개요/실행 방법/API 키 설정/배포 절차 문서화 | 완료 |
| 2026-04-02 | D7 완료: 제출 자료(슬라이드 MD 8개, SUBMISSION.md) 생성 | 완료 |
| 2026-04-02 | D8 완료: BottomNav 아이콘, 폴링 인디케이터, 마커 강조, stdgCd 폴백 UX, 콜센터 안내, 재시도 버튼, facilities 데이터 보강, OG 태그, BackButton fallback, 버스 갱신시각 | 완료 |
| 2026-04-02 | D9 완료: Vercel 배포, 환경변수 등록, URL 반영 | 완료 |

## D1 API 조사 결과 (2026-04-01)

### 1. 교통약자 이동지원 현황 (CarePass 방향 근거)
- **데이터셋**: 행정안전부 한국지역정보개발원 — 교통약자 이동지원 현황 실시간 정보
- **URL**: https://www.data.go.kr/data/15140825/openapi.do
- **Base URL**: `https://apis.data.go.kr/B551982/tsdo_v2`
- **핵심 엔드포인트**: `/info_vehicle_use_v2`
- **업데이트 주기**: 실시간
- **응답 필드**: `avlVhclCntom`(가용 차량), `oprVhclCntom`(운행 차량), `rsvtNocs`(예약), `wtngNocs`(대기)
- **무인증 호출**: 401 Unauthorized (서비스키 필수)
- **판단**: 문서상 실시간 가용 차량 수 제공 확인 → **CarePass 방향 유지 합리적**
- **미완료**: 실제 서비스키 기반 실데이터 검증 아직 안 함 (`PUBLIC_DATA_API_KEY` 미설정)

### 2. 전국 초정밀 버스 실시간 위치
- **데이터셋**: 행정안전부 한국지역정보개발원 — 전국 통합데이터 초정밀버스 위치 실시간 정보
- **URL**: https://www.data.go.kr/data/15157601/openapi.do
- **Base URL**: `https://apis.data.go.kr/B551982/rte`
- **엔드포인트**:
  - `/mst_info` — 노선 기본 정보 (rteNo, rteType, stpnt, edpnt, vhclFstTm, vhclLstTm)
  - `/ps_info` — 노선 경유지 정보
  - `/rtm_loc_info` — 실시간 위치 (rteNo, vhclNo, gthrDt, lat, lot, oprDrct, oprSpd, evtCd, evtType)
- **무인증 호출**: 401 Unauthorized
- **판단**:
  - "노선 정보 + 실시간 위치"는 가능
  - **도착 예정 시간 필드 없음** → 컴포넌트에 "도착예정시간 미제공" 명시
  - `/api/bus`를 서울 버스 API에서 이 API로 교체 완료

### 3. 아이돌봄 서비스 제공기관 현황
- **데이터셋**: 성평등가족부 — 아이돌봄 서비스제공기관 정보 서비스
- **URL**: https://www.data.go.kr/data/15078130/openapi.do
- **Base URL**: `https://apis.data.go.kr/1383000/idis/serviceInstitutionService`
- **엔드포인트**: `/getServiceInstitutionList`
- **응답 필드**: childCareInstNo, childCareInstNm, addr, lot(경도), lat(위도), rprsTelno
- **무인증 호출**: 401 Unauthorized
- **판단**:
  - 기관 위경도 포함 → "API 없으면 CSV 변환" 경로 불필요
  - `/api/facilities`: API 키 있으면 공식 API 우선, 실패 시 `public/data/facilities.json` 폴백

## 반영된 코드 변경사항

| 파일 | 변경 내용 |
|------|-----------|
| `lib/api.ts` | `SEOUL_BUS_BASE_URL` → `NATIONAL_BUS_BASE_URL`, `CHILD_CARE_BASE_URL` 추가 |
| `lib/types.ts` | `BusRouteItem`, `BusLocationItem` 타입 추가; `BusApiResponse` 재정의 |
| `app/api/bus/route.ts` | 서울 버스 API → 전국 초정밀 버스 API (`/mst_info` + `/rtm_loc_info` 병렬 호출) |
| `app/api/facilities/route.ts` | 아이돌봄 API 우선 시도 → 실패 시 static JSON 폴백 |
| `components/BusArrival.tsx` | 新 타입 기반 UI + "도착예정시간 미제공" 경고 문구 추가 |
| `.env.local` | 템플릿 생성 (KAKAO_MAP_KEY, PUBLIC_DATA_API_KEY, BASE_URL) |

## HonGa 전환 작업 로그 (2026-04-08~)

| 날짜 | 내용 | 상태 |
|------|------|------|
| 2026-04-08 | CarePass → HonGa 브랜드 전환 (layout, 홈 역할 선택) | 완료 |
| 2026-04-08 | /child 화면: GPS → 목적지 선택 → 카카오맵 Polyline + LibraryStatus + BusArrival | 완료 |
| 2026-04-08 | /parent 화면: 세션코드 → 5초 폴링 → 정지/연결끊김 경보 | 완료 |
| 2026-04-08 | /api/location/update + poll (인메모리 위치 공유) | 완료 |
| 2026-04-08 | BottomNav → 홈/아이/부모 3탭 | 완료 |
| 2026-04-08 | HONGA_SUBMISSION.md: 기획서 (7종 데이터 명시) | 완료 |

## 다음 할 일 (Apr 9-11)
- [ ] Apr 9: 두 기기 실제 위치 공유 테스트
- [ ] Apr 9: Vercel NEXT_PUBLIC_DEMO_MODE=true 환경변수 설정
- [ ] Apr 10: 데모 시나리오 리허설 (심사위원 체험 플로우)
- [ ] Apr 10: 스크린샷 4장 캡처 → 06_demo.md 교체
- [ ] Apr 11: 제출 서류 (참가신청서·서약서·기획서) 작성 + opendata@klid.or.kr 제출
