# 기술 스택

## Frontend / Backend

- Next.js 16 App Router
- React 19 + TypeScript
- Tailwind CSS
- SWR (주기 폴링/캐싱)

## 지도 / 데이터 / AI

- Kakao Maps SDK (아이/부모 지도 화면)
- 공공데이터포털 API (버스, 도서관, 신호등, 보호시설)
- Gemini API (`gemini-2.0-flash`) + Web Speech API

## 데모 안정화 설계

- API 키 미설정/응답 실패 시 `no-key`, `demo`, `fallback` 소스로 흐름 유지
- 부모-아이 연동은 4자리 세션코드 + 인메모리 스토어로 즉시 체험 가능
