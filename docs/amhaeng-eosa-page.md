# 암행어사 소개 페이지

2026-10-17. `/games/amhaeng-eosa/`, `/en/games/amhaeng-eosa/`, `/ja/games/amhaeng-eosa/`.

기존 스튜디오 홈페이지와 Tiny Defense 소개는 유지한다. 암행어사는 실제 게임의 남색·금빛 붓글씨·한지·조선 배경을 이어받는다. 밤의 주막에서 윤서와 도겸을 만나는 첫 화면, 직접 장소를 골라 단서 여섯 개를 읽는 잠행 수첩, 여정 지도와 여섯 장, 인물 소개, 판결의 의미, 출시 안내로 구성한다. 새로운 생성 이미지·영상·음악은 사용하지 않는다.

- 게임 진실: `C:/OneStep/amhaeng-eosa/Assets/Scripts/Eosa/CaseData.cs`의 `Cases.Load` → `Assets/Resources/Eosa/campaign.json`. 현재 여섯 사건. 첫 사건 첫 세 장소의 단서와 대응 증거 삽화를 웹용으로 요약·번역했다. 본편의 해금 조건·재판은 재현하지 않는 웹 미리보기라고 표시한다. 범인과 최종 판결 정답은 포함하지 않는다.
- 시각 기준: 게임 `Game.Lobby.cs`의 `ShowTitle`, `Art.cs`, `Assets/Resources/Eosa/Art`. 모바일은 게임의 세로 전용 로비 원화를 쓴다. 얼굴·복장을 새로 그리거나 색을 바꾸지 않는다. 원본 수정 없이 WebP로 내보내며 `assets/amhaeng-eosa/sources.json`에 원본 경로와 SHA-256을 기록한다.
- 게임 방식: `Game.Investigation.cs`의 `ShowLocation`/`RenderLocation`, `Game.Arguments.cs`, `Game.cs`를 따른다. 페이지의 장소 전환은 명시적인 장소 버튼으로만 실행한다.
- 음악: 게임 `Game.Music.cs`의 타이틀 큐 `title`에 연결된 기존 `Audio/title.wav`를 MP3로 변환한다. 방문 시 자동재생하지 않고, 사용자가 켠 상태에서만 재생한다. 숨겨진 탭에서는 멈춘다.
- 글꼴: 실제 게임의 Gowun Batang Regular와 Pretendard Regular를 WOFF2 서브셋으로 배포한다. OFL 고지를 함께 둔다. 일본어는 시스템의 일본어 서체로 부족한 글리프를 보완한다.
- 팔레트: 밤 `#081c27`, 먹 `#102b38`, 한지 `#f2e6cc`, 금 `#e6c382`. 본문 Eosa Sans, 제목 Eosa Batang. 과장된 통계·가격·날짜를 추가하지 않는다.
- 출시 상태: Steam·모바일은 모두 출시 예정. 구매·다운로드 링크는 만들지 않는다. 실제 게임 언어가 한국어임을 모든 언어 페이지에 표시한다.

재생성: `tools/build-eosa-pages.py` → `tools/build-eosa-assets.py` → `tools/build-static.py`. 첫 스크립트는 세 언어 홈페이지의 게임 카드·목록 구조화 데이터와 sitemap도 함께 갱신한다. 자산 스크립트는 Pillow·fontTools·Brotli·FFmpeg가 필요하며 게임 저장소는 읽기만 한다. 검증은 `node tests/eosa-preview.test.js`와 기존 홈페이지·브랜드 검사, 실제 PC/모바일 브라우저에서 한다.

공유 CSS는 게임 목록의 간격과 암행어사 카드에만 추가한다. 게임 전용 스타일·동작은 `/games/amhaeng-eosa/eosa.css`, `eosa.js`에 격리한다. `brand-hero.css`도 정적 배포 대상에 포함해 Tiny Defense의 기존 첫 화면이 빠지지 않게 한다.

화면 검수에서 인물 이미지의 HTML 높이 속성이 모바일 축소 뒤에도 남아 세로로 늘어나는 문제를 발견했다. 반응형 인물 원화는 CSS `height:auto`를 명시한다. 전체 페이지 캡처는 지연 로딩 이미지를 실제로 본 뒤 저장해, 빈 이미지 영역을 완성 화면으로 오인하지 않는다.
