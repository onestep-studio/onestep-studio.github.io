# 게임 공지사항

- `notice.json`은 게임의 `NoticeGate` → `UIManager.OpenNoticePanel`에서 읽는 운영 공지다. 새 내용을 넣을 때는 ko/en/zh/ja/de/fr/es/ru 8개 언어를 함께 수정하고, 기존에 읽은 사용자에게도 보여야 하면 `id`를 갱신한다.
- 영웅 명칭·전투 특징·해금 방법은 `C:/OneStep/tiny_defense/Assets/Scripts/TinyDefense/Loc.NewHeroes.cs`와 실제 호출 코드를 대조한다.
- Windows PowerShell에서 다국어 코드를 파이프로 전달하면 문자가 `?`로 바뀔 수 있다. UTF-8 파일로 저장해 실행하고 결과 JSON의 문자 보존을 확인한다.
