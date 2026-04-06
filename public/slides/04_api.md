# 활용 공공 API

## 1. 교통약자 이동지원 현황 실시간 정보

- 출처: 공공데이터포털 / 행정안전부 한국지역정보개발원
- Base URL: `https://apis.data.go.kr/B551982/tsdo_v2`
- 엔드포인트: `/info_vehicle_use_v2`
- 활용 방식: 가용 차량 수, 운행 차량 수, 예약/대기 건수 확인

## 2. 전국 초정밀 버스 위치 실시간 정보

- 출처: 공공데이터포털 / 행정안전부 한국지역정보개발원
- Base URL: `https://apis.data.go.kr/B551982/rte`
- 엔드포인트:
  - `/mst_info`
  - `/ps_info`
  - `/rtm_loc_info`
- 활용 방식: 노선 기본 정보와 실시간 버스 위치 확인

## 3. 아이돌봄 서비스제공기관 정보 서비스

- 출처: 공공데이터포털 / 성평등가족부
- Base URL: `https://apis.data.go.kr/1383000/idis/serviceInstitutionService`
- 엔드포인트: `/getServiceInstitutionList`
- 활용 방식: 기관명, 주소, 위경도, 연락처 조회
