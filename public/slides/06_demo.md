# 데모 시나리오 (심사위원 체험 플로우)

스크린샷 대신 배포 URL과 화면 설명으로 진행한다.

1. 홈 진입
- URL: `https://carepass-eight.vercel.app/`
- 확인: "아이로 시작" 클릭 후 `/child` 진입

2. 아이 화면 진입 + 목적지 선택
- URL: `https://carepass-eight.vercel.app/child`
- 확인: GPS 수신(또는 데모 시작) 후 목적지를 `도서관`으로 선택

3. 이동 정보 확인
- URL: `https://carepass-eight.vercel.app/child` (이동 화면)
- 확인:
  - 카카오맵에 출발-목적지 Polyline 표시
  - 버스 실시간 정보 카드 표시
  - 도서관 열람실 빈자리(가능 좌석) 표시

4. 세션코드 연결
- 아이 화면 상단의 4자리 세션코드 확인
- URL: `https://carepass-eight.vercel.app/parent`
- 확인: 부모 화면에서 코드 입력 후 연결 상태 전환

5. 부모 실시간 모니터링
- URL: `https://carepass-eight.vercel.app/parent`
- 확인: 5초 폴링으로 아이 위치 좌표와 갱신 시간 업데이트

6. 도착 확인
- URL: `https://carepass-eight.vercel.app/parent`
- 확인: 아이가 목적지 도착 시 "목적지에 도착했어요!" 배너 표시
