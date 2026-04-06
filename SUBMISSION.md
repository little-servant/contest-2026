# CarePass Submission Index

## 슬라이드 파일 인덱스

1. [01_cover.md](C:\Users\lyb28\dev\contest-2026\public\slides\01_cover.md)
2. [02_problem.md](C:\Users\lyb28\dev\contest-2026\public\slides\02_problem.md)
3. [03_solution.md](C:\Users\lyb28\dev\contest-2026\public\slides\03_solution.md)
4. [04_api.md](C:\Users\lyb28\dev\contest-2026\public\slides\04_api.md)
5. [05_stack.md](C:\Users\lyb28\dev\contest-2026\public\slides\05_stack.md)
6. [06_demo.md](C:\Users\lyb28\dev\contest-2026\public\slides\06_demo.md)
7. [07_limit.md](C:\Users\lyb28\dev\contest-2026\public\slides\07_limit.md)
8. [08_run.md](C:\Users\lyb28\dev\contest-2026\public\slides\08_run.md)

## 심사 체크리스트

- [x] `npm run lint` 통과
- [x] `npm run build` 통과
- [x] no-key 폴백 동작 문서화
- [x] Vercel 배포 URL 입력
- [x] 실데이터 연동 재검증 (2026-04-05)
  - `/api/facilities` → `source: "child-care-api"`
  - `/api/transit?stdgCd=1111000000` → `resultCode: "K3" (NODATA_ERROR)`
  - `/api/transit?stdgCd=2600000000` → `avlVhclCntom` 값 확인 (`2`)
  - `/api/bus?stdgCd=1111000000` → `routes: []`, `positions: []`
- [x] `public/data/facilities.json` 실데이터 교체 완료 (97건)
  - `fallback-template` 항목 제거
  - 위경도 실좌표 + `stdgCd` 실값(시도 코드) 반영

Vercel 배포 URL:
- `https://carepass-eight.vercel.app`

## 스크린샷 캡처 순서 (2026-04-06 UI 개선 후)

> `public/screenshots/` 저장 — 파일명 정확히 일치해야 06_demo.md 슬라이드에 표시됨

| 순서 | 파일명 | URL | 캡처 포인트 |
|------|--------|-----|-------------|
| 1 | `home.png` | `/` | 홈 히어로 카드 + 기관 미리보기 3건 |
| 2 | `facilities.png` | `/facilities` | 기관 목록 + 지도 마커 |
| 3 | `route-summary.png` | `/route/{id}` | 기관 상세 + 이동수단 요약 카드 |
| 4 | `route-live.png` | `/route/{id}` (stdgCd=2600000000) | 교통약자 avlVhclCntom=2 표시 화면 |

권장 해상도: 390×844 (iPhone 14 기준) 또는 동일 비율

## 제출 메모

- 실데이터 키가 없거나 API 오류가 발생할 때, `/api/facilities`는 `static-json` 폴백으로 동작한다.
- 버스 API는 도착예정시간을 제공하지 않으므로, 제출 자료에도 이 한계를 명시한다.
- 슬라이드 6번 파일의 스크린샷 위치 표시는 자리표시자 상태이며, 최종 제출 전 실제 캡처로 교체 필요.
- 카카오 지도는 Kakao Developers 웹 플랫폼에 `http://localhost:3000`, `https://carepass-eight.vercel.app` 등록이 완료돼야 실제 지도 렌더링이 된다.
