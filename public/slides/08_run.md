# 실행 및 배포 방법

## 로컬 실행

```bash
npm install
npm run dev
```

- 기본 주소: `http://localhost:3000`

## 환경 변수

```env
NEXT_PUBLIC_KAKAO_MAP_KEY=
PUBLIC_DATA_API_KEY=
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

## 배포

- 프레임워크: Next.js
- 설정 파일: `vercel.json`
- 배포 전 확인:
  - `NEXT_PUBLIC_KAKAO_MAP_KEY`
  - `PUBLIC_DATA_API_KEY`
  - `NEXT_PUBLIC_BASE_URL`

## 검증 명령

```bash
npm run lint
npm run build
```
