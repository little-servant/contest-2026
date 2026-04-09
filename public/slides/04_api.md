# 활용 API

## 1. HonGa 내부 API

- `POST /api/location/update`: 아이 위치/도착 상태 업로드 (10초 주기)
- `GET /api/location/poll?code=####`: 부모 모니터링 위치 조회 (5초 폴링)
- `GET /api/library?stdgCd=...`: 도서관 열람실 현황 조회
- `GET /api/bus?stdgCd=...`: 전국 초정밀 버스 노선·차량 위치 조회
- `GET /api/signal?stdgCd=...`: 교통안전 실시간 신호등 상태 조회
- `GET /api/facilities`: 아동 보호시설 좌표 조회
- `POST /api/voice-guide`: Gemini 기반 아동 친화 안내 문구 생성 (실패 시 fallback)

## 2. 외부 공공데이터 API

- `https://apis.data.go.kr/B551982/rte` (전국 초정밀 버스 실시간 정보)
- `https://apis.data.go.kr/B551982/lib_v2` (공공도서관 열람실 현황)
- `https://apis.data.go.kr/B551982/tsi_v2` (교통안전 실시간 신호등 정보)
- `https://apis.data.go.kr/1383000/idis/serviceInstitutionService` (아이돌봄 서비스 기관)
