# 홈페이지 통계

2026-10-20. 홈페이지는 GitHub Pages의 `main` 루트에서 배포하며 운영 주소는 https://onestep-games.com/ 이다.

- GA4: `OneStep Studio Website`, 속성 `559735954`, 웹 스트림 `16165005093`, 측정 ID `G-JHM93VNNYP`.
- `analytics.js`가 페이지 조회와 `game_select`·`store_click`을 보낸다. 게임(`game_id`), 스토어(`store`), 버튼 위치(`link_position`), 표시 언어(`site_language`), 페이지 종류(`page_type`)를 구분한다. GA4에서 같은 이름의 이벤트 범위 맞춤 측정기준을 등록했다.
- 기본 외부 링크의 `click`과 맞춤 `store_click`은 별도 이벤트다. 스토어 성과를 볼 때 둘을 합산하지 않는다. 클릭은 실제 설치·구매를 뜻하지 않는다.
- 운영 호스트만 수집하며 localhost·Tailscale 미리보기는 제외한다. 임의 쿼리와 fragment는 전송 URL에서 제거하고 표준 UTM 캠페인 값만 보존한다. 광고 개인화·Google Signals는 사용하지 않는다. 방문자 수는 기기·브라우저와 차단 설정에 따라 실제 사람 수와 다를 수 있다.
- 한국어·영어·일본어 홈, 게임 소개, 이야기와 체험을 포함한14개 HTML에 공통 스크립트가 있다. `tools/site_analytics.py`와 각 페이지 생성기·`tools/build-static.py`가 재생성 후에도 포함을 유지한다.
- 수집 코드 검증: `node tests/analytics.test.js`. 링크·소개 회귀: `node tests/homepage-store-link.test.js`, `node tests/eosa-preview.test.js`.
- 통계 확인: 비공개 OneStep 관리의 `#/website`, 또는 https://analytics.google.com/analytics/web/#/a412295330p559735954/reports/intelligenthome . 관리 화면은 기존 로그인 후 사용할 수 있으며 서버의 Google 읽기 권한이 필요하다.
- 관리 조회는 별도 Cloud 프로젝트 `onestep-studio-analytics`의 `website-analytics-reader` 계정으로 연결했다. 홈페이지 속성에만 Viewer를 부여하고 비용·수익 접근을 제외했다. 기존 게임 배포 계정은 사용하지 않으며 인증키는 이 저장소에 저장하지 않는다.
- 2026-10-20 실측: 운영 홈→Tiny Defense→Google Play 방문을 진행해 GA4 실시간 보고서의 페이지 조회·`game_select`·`store_click` 수신을 확인했다. 이 방문은 에이전트의 점검 기록이다. 전용 계정을 통한 서버 보고서 조회도 성공했으며 최초 일반 집계는 아직 비어 있었다. [Google 데이터 갱신 안내](https://support.google.com/analytics/answer/11198161)에 따라 실시간 수신과 일반 보고서의 반영 지연을 구분한다.
