# 기술 스택과 폴백 설계

## 기술 스택

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS
- SWR

## 폴백 설계

- `PUBLIC_DATA_API_KEY`가 없을 때:
  - 교통약자 API는 `200` + `source: "no-key"` 반환
  - 버스 API도 no-key 상태를 명시적으로 반환
  - UI는 amber 배너와 정적 JSON 폴백으로 흐름을 유지
- `NEXT_PUBLIC_KAKAO_MAP_KEY`가 없을 때:
  - 지도 대신 목록형 폴백 UI 제공

## 의미

- 심사 환경에서 API 키가 빠져도 앱이 깨지지 않는다.
- 실데이터 연결 전/후 상태를 사용자에게 명확히 보여줄 수 있다.
