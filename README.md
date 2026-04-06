# CarePass

교통약자 이동지원과 아이돌봄 기관 정보를 연결해, 돌봄 가족이 현재 위치 기준으로 기관을 찾고 이동 가능성을 빠르게 판단할 수 있도록 돕는 Next.js 앱입니다.

## 핵심 기능

- 현재 위치 기준 근처 아이돌봄 기관 미리보기
- 기관 목록과 지도 연동
- 기관 상세에서 교통약자 차량 현황 요약
- 전국 초정밀 버스 노선/실시간 위치 확인
- API 키 미설정 시 정적 JSON 및 폴백 UI 유지

## 실행 방법

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:3000`을 엽니다.

## 환경 변수

`.env.local`에 아래 값을 설정합니다.

```env
NEXT_PUBLIC_KAKAO_MAP_KEY=
PUBLIC_DATA_API_KEY=
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

설명:

- `NEXT_PUBLIC_KAKAO_MAP_KEY`
  - 카카오 지도 SDK 로드에 사용합니다.
  - 비어 있으면 지도 대신 목록형 폴백 UI를 표시합니다.

- `PUBLIC_DATA_API_KEY`
  - 교통약자 이동지원 API와 전국 초정밀 버스 API, 아이돌봄 서비스제공기관 API 호출에 사용합니다.
  - 비어 있으면 정적 JSON 또는 no-key 배너 기준으로 동작합니다.

- `NEXT_PUBLIC_BASE_URL`
  - 서버 컴포넌트에서 내부 API를 호출할 때 사용합니다.
  - 로컬 기본값은 `http://localhost:3000`입니다.

## 품질 확인

```bash
npm run lint
npm run build
```

## Vercel 배포

이 프로젝트는 [vercel.json](C:\Users\lyb28\dev\contest-2026\vercel.json)로 Next.js 프레임워크 배포를 사용합니다.

배포 전 확인:

1. Vercel 프로젝트에 아래 환경 변수를 등록합니다.
   - `NEXT_PUBLIC_KAKAO_MAP_KEY`
   - `PUBLIC_DATA_API_KEY`
   - `NEXT_PUBLIC_BASE_URL`
2. `NEXT_PUBLIC_BASE_URL`은 실제 배포 URL로 맞춥니다.
3. 배포 후 `/facilities`, `/route/[id]`에서 폴백 없이 실데이터가 내려오는지 확인합니다.

### Vercel 환경변수 등록 방법

`PUBLIC_DATA_API_KEY`는 Vercel에 반드시 등록되어야 실데이터 API가 정상 동작합니다.

1. Vercel Dashboard
   - Project → `Settings` → `Environment Variables`
   - `PUBLIC_DATA_API_KEY`를 `Production`, `Preview`, `Development` 모두에 추가
   - 필요 시 `NEXT_PUBLIC_KAKAO_MAP_KEY`, `NEXT_PUBLIC_BASE_URL`도 동일하게 등록
2. Vercel CLI
   - `vercel env add PUBLIC_DATA_API_KEY production`
   - `vercel env add PUBLIC_DATA_API_KEY preview`
   - `vercel env add PUBLIC_DATA_API_KEY development`
   - `vercel env add NEXT_PUBLIC_BASE_URL production`
   - `vercel env add NEXT_PUBLIC_BASE_URL preview`
   - `vercel env add NEXT_PUBLIC_BASE_URL development`
3. 적용 확인
   - 배포 후 `/api/facilities` 응답의 `source`가 `child-care-api`인지 확인

보안 주의:
- `vercel.json`에는 비밀키를 넣지 않습니다.
- `.env.local`은 로컬 전용 파일이며 커밋하지 않습니다.

## 심사용 메모

- `PUBLIC_DATA_API_KEY`가 없으면 실데이터 대신 폴백 상태를 명시적으로 보여줍니다.
- 버스 API는 문서 기준으로 도착예정시간을 제공하지 않으므로 UI에도 동일하게 표시합니다.
