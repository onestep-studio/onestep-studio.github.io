# 게임 공지사항

- `notice.json`은 게임의 `NoticeGate` → `UIManager.OpenNoticePanel`에서 읽는 운영 공지다. 새 내용을 넣을 때는 ko/en/zh/ja/de/fr/es/ru 8개 언어를 함께 수정하고, 기존에 읽은 사용자에게도 보여야 하면 `id`를 갱신한다.
- 영웅 명칭·전투 특징·해금 방법은 `C:/OneStep/tiny_defense/Assets/Scripts/TinyDefense/Loc.NewHeroes.cs`와 실제 호출 코드를 대조한다.
- Windows PowerShell에서 다국어 코드를 파이프로 전달하면 문자가 `?`로 바뀔 수 있다. UTF-8 파일로 저장해 실행하고 결과 JSON의 문자 보존을 확인한다.
- 공지는 주제별 제목 아래에 `<b>항목명</b>: 짧은 설명` 형식으로 한 불릿에 한 요소를 쓴다. 해금 조건·초기화·구매 유지 안내는 각각 분리한다.

# 게임 소개 페이지

- 새 게임을 추가하면 ko/en/ja의 게임 목록·언어별 경로·구조화 데이터·sitemap과 `tools/build-static.py`의 배포 자산을 함께 확인한다. 소개 자료는 해당 게임의 실제 호출 코드와 채택 원화를 기준으로 하고, 미출시 스토어에 구매 링크를 만들지 않는다.
- 홈은 `tools/build-home-pages.py`와 `home.css`가 소유한다. 게임 전용 생성기가 홈을 예전 카드로 덮어쓰지 않게 하고, 원화에 포함된 제목·인물 위에 출시 배지를 겹치지 않는다.
- 암행어사 홈 키아트는 배포관리 `banner`의 잘리기 전 원본을 쓰며 3:2 전체 구도·원본 색을 유지한다. `cover`·호버 확대·별도 로고·그라데이션으로 다시 자르거나 가리지 않는다. 출처·픽셀 보존 검사는 `tools/build-home-keyart.py`를 따른다.
