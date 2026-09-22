# Tiny Defense YouTube Shorts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 최신 Tiny Defense 게임 화면으로 한국어 YouTube Shorts 3편과 재편집 가능한 무자막 원본 클립 세트를 제작한다.

**Architecture:** 기존 Windows 빌드가 생성한 `Build/Screenshots/anim` 프레임 시퀀스를 FFmpeg로 장면별 MP4로 변환한다. 무자막 원본을 단일 소스로 삼고, 완성본은 원본 구간을 잘라 한국어 자막, 게임 BGM·효과음, 공통 엔드카드를 합성한다. 결과와 재현 스크립트는 Git에서 제외되는 날짜별 마케팅 출력 폴더에 함께 둔다.

**Tech Stack:** PowerShell 7, FFmpeg/FFprobe, Unity 캡처 프레임, H.264/AAC

## Global Constraints

- 완성본은 서로 다른 메시지의 한국어 쇼츠 3편이다.
- 완성본과 원본은 `1080x1920`, `30fps`, H.264 High, AAC 스테레오다.
- 오디오는 게임에 포함된 BGM과 효과음만 사용한다.
- 원본 클립에는 홍보 자막, 로고, 전환, 엔드카드를 넣지 않는다.
- 픽셀 아트 확대는 FFmpeg `flags=neighbor`를 사용한다.
- 완성본 자막은 한 화면 최대 두 줄이며 플랫폼 UI 안전 영역 안에 둔다.
- 출력 루트는 `C:/OneStep/tiny_defense/output/marketing/youtube-shorts/2026-08-04/`다.
- 기존 게임 소스와 기존 마케팅 파일을 변경하거나 삭제하지 않는다.

---

## File Structure

- Create: `C:/OneStep/tiny_defense/output/marketing/youtube-shorts/2026-08-04/build.ps1`
  - 원본 클립, 엔드카드, 완성본, 검수 자료를 재생성하는 단일 진입점이다.
- Create: `C:/OneStep/tiny_defense/output/marketing/youtube-shorts/2026-08-04/raw_clips/*.mp4`
  - 자막과 홍보 요소가 없는 편집용 게임 장면이다.
- Create: `C:/OneStep/tiny_defense/output/marketing/youtube-shorts/2026-08-04/01_strategy_twist.mp4`
  - 낮과 밤의 반전을 보여주는 완성본이다.
- Create: `C:/OneStep/tiny_defense/output/marketing/youtube-shorts/2026-08-04/02_combat_impact.mp4`
  - 대규모 전투와 특수 시스템을 보여주는 완성본이다.
- Create: `C:/OneStep/tiny_defense/output/marketing/youtube-shorts/2026-08-04/03_gameplay_explainer.mp4`
  - 낮 준비부터 밤 방어까지의 루프를 설명하는 완성본이다.
- Create: `C:/OneStep/tiny_defense/output/marketing/youtube-shorts/2026-08-04/README.md`
  - 원본 위치, 길이, 장면 설명, 완성본 사용처, 재생 규격을 기록한다.
- Create: `C:/OneStep/tiny_defense/output/marketing/youtube-shorts/2026-08-04/verification/*`
  - FFprobe 요약과 육안 검수용 연락 시트를 보관한다.

---

### Task 1: 입력 자산 사전 검증

**Files:**
- Read: `C:/OneStep/tiny_defense/Build/Screenshots/anim/*.png`
- Read: `C:/OneStep/tiny_defense/Build/Screenshots/03_popup_tool.png`
- Read: `C:/OneStep/tiny_defense/Build/Screenshots/04b_barracks_soldiers.png`
- Read: `C:/OneStep/tiny_defense/Build/Screenshots/04c_tower_workshop.png`
- Read: `C:/OneStep/tiny_defense/Build/Screenshots/24_relic_draft.png`
- Read: `C:/OneStep/tiny_defense/Assets/Resources/TinyDefense/Audio/*`

**Interfaces:**
- Consumes: 기존 Unity 캡처 프레임과 게임 오디오
- Produces: 장면별 소스, 입력 fps, 프레임 수, 오디오 매핑 목록

- [ ] **Step 1: 필수 모션 시퀀스의 프레임 수 확인**

Run:

```powershell
$anim = 'C:/OneStep/tiny_defense/Build/Screenshots/anim'
'day_peace','gather_wood','gather_iron_memory','deploy_drag','horde_showcase','rally_buff','whirl_slash','duel_swipe','season_gate','castle_fall' | ForEach-Object {
  $count = (Get-ChildItem "$anim/$($_)_*.png").Count
  "$_=$count"
}
```

Expected: 모든 항목이 1개 이상이며 각각 `60, 60, 70, 72, 150, 60, 44, 60, 64, 150` 프레임이다.

- [ ] **Step 2: 정지 장면과 오디오 존재 여부 확인**

Run:

```powershell
$root = 'C:/OneStep/tiny_defense'
@(
  "$root/Build/Screenshots/03_popup_tool.png",
  "$root/Build/Screenshots/04b_barracks_soldiers.png",
  "$root/Build/Screenshots/04c_tower_workshop.png",
  "$root/Build/Screenshots/24_relic_draft.png",
  "$root/Assets/Resources/TinyDefense/Audio/bgm_day.wav",
  "$root/Assets/Resources/TinyDefense/Audio/bgm_night.wav"
) | ForEach-Object { if (-not (Test-Path $_)) { throw "Missing input: $_" } }
```

Expected: exit code 0.

### Task 2: 재현 가능한 영상 빌드 스크립트

**Files:**
- Create: `C:/OneStep/tiny_defense/output/marketing/youtube-shorts/2026-08-04/build.ps1`

**Interfaces:**
- Consumes: Task 1의 프레임·정지 이미지·오디오
- Produces: `New-RawMotionClip`, `New-RawStillClip`, `New-Short`, `Test-Video` PowerShell 함수와 전체 빌드 실행부

- [ ] **Step 1: 스크립트에 공통 경로와 인코딩 규격 정의**

`$GameRoot`, `$OutputRoot`, `$RawRoot`, `$AnimRoot`, `$AudioRoot`, `$Font`를 절대 경로로 지정한다. 각 FFmpeg 호출은 `-c:v libx264 -profile:v high -pix_fmt yuv420p -crf 18 -preset slow -r 30 -g 60 -c:a aac -b:a 192k -ar 48000 -movflags +faststart`를 공유한다.

- [ ] **Step 2: 무자막 모션·정지 클립 함수 구현**

`New-RawMotionClip(Name, Source, InputFps, FrameCount, Music, Sfx)`는 PNG 시퀀스를 `scale=1080:1920:flags=neighbor,setsar=1,fps=30`으로 변환한다. `New-RawStillClip(Name, Source, Duration, Music)`는 정지 이미지를 2.4초 영상으로 만들고 미세한 `zoompan`을 적용하되 자막과 전환은 넣지 않는다.

- [ ] **Step 3: 원본 10개 생성 매핑 추가**

```text
day_gather             <- gather_wood, 16.67fps, 60f, bgm_day
day_resource_minigame  <- gather_iron_memory, 16.67fps, 70f, bgm_day
tool_upgrade           <- 03_popup_tool.png, 2.4s, bgm_day
unit_deploy            <- deploy_drag, 15fps, 72f, bgm_night
tower_battle           <- horde_showcase, 16.67fps, 100f, bgm_night
hero_skill             <- whirl_slash, 12.5fps, 44f, bgm_night
boss_duel              <- duel_swipe, 12.5fps, 60f, bgm_night
relic_select           <- 24_relic_draft.png, 2.4s, bgm_day
season_gate            <- season_gate, 12.5fps, 64f, bgm_day
castle_fall            <- castle_fall, 15fps, 70f, bgm_night
```

타격, 참격, 보스, 계절, 함락 장면에는 `Assets/Resources/TinyDefense/Audio`의 대응 효과음을 `adelay`와 `amix=normalize=0`으로 합성한다.

- [ ] **Step 4: 스크립트 구문 검증**

Run:

```powershell
[scriptblock]::Create((Get-Content -Raw 'C:/OneStep/tiny_defense/output/marketing/youtube-shorts/2026-08-04/build.ps1')) | Out-Null
```

Expected: exit code 0.

### Task 3: 원본 클립 생성 및 검수

**Files:**
- Create: `C:/OneStep/tiny_defense/output/marketing/youtube-shorts/2026-08-04/raw_clips/*.mp4`

**Interfaces:**
- Consumes: `New-RawMotionClip`, `New-RawStillClip`
- Produces: 완성본 편집의 단일 소스가 되는 원본 MP4 10개

- [ ] **Step 1: 원본 클립 생성**

Run:

```powershell
pwsh -File 'C:/OneStep/tiny_defense/output/marketing/youtube-shorts/2026-08-04/build.ps1' -Stage Raw
```

Expected: `raw_clips`에 정확히 10개의 MP4가 생성된다.

- [ ] **Step 2: 원본 기술 규격 검사**

각 파일에 FFprobe를 실행해 `width=1080`, `height=1920`, `r_frame_rate=30/1`, `codec_name=h264`, 오디오 `codec_name=aac`, `channels=2`를 확인한다.

- [ ] **Step 3: 원본 홍보 요소 부재 검사**

각 클립의 시작·중간·끝 프레임을 추출해 연락 시트를 만들고, 홍보 자막, 엔드카드, 로고 오버레이, 크롭이 없는지 육안 확인한다. 게임 자체 UI와 게임 로고는 원본 화면의 일부로 허용한다.

### Task 4: 엔드카드와 전략 반전형 완성본

**Files:**
- Create: `C:/OneStep/tiny_defense/output/marketing/youtube-shorts/2026-08-04/endcard.png`
- Create: `C:/OneStep/tiny_defense/output/marketing/youtube-shorts/2026-08-04/01_strategy_twist.mp4`

**Interfaces:**
- Consumes: `day_gather`, `tower_battle`, `unit_deploy`, `castle_fall`
- Produces: 약 18초의 전략 반전형 쇼츠

- [ ] **Step 1: 공통 엔드카드 생성**

기존 `output/marketing/shortform/_endcard.png`의 브랜드 자산을 사용해 1080x1920 PNG를 만들고, `TINY DEFENSE`, `당신은 몇 번째 밤까지?`, `Google Play · App Store · ONE store`만 표시한다.

- [ ] **Step 2: 컷과 자막 합성**

```text
0.00-2.70  day_gather    "낮에는 자원을 모으고"
2.70-6.10  tower_battle  "밤이 오기 전에 준비하세요"
6.10-10.10 unit_deploy   "병사와 타워로 버티고"
10.10-14.80 castle_fall  "막지 못하면 성이 무너집니다"
14.80-16.40 endcard      CTA
```

자막은 `Jua-Regular.ttf`, 흰색 또는 금색, 검정 테두리 7px, 수평 중앙, y=1380을 기본으로 한다.

- [ ] **Step 3: 1편 재생·오디오 검사**

FFprobe로 길이 `15.8~17.2초`와 규격을 확인하고, `volumedetect` 평균 음량이 `-60dB`보다 큰지 확인한다.

### Task 5: 전투 임팩트형 완성본

**Files:**
- Create: `C:/OneStep/tiny_defense/output/marketing/youtube-shorts/2026-08-04/02_combat_impact.mp4`

**Interfaces:**
- Consumes: `tower_battle`, `hero_skill`, `unit_deploy`, `boss_duel`, `season_gate`
- Produces: 약 16초의 전투 임팩트형 쇼츠

- [ ] **Step 1: 컷과 자막 합성**

```text
0.00-2.60  tower_battle "쏟아지는 적을"
2.60-5.40  hero_skill   "영웅 기술로 쓸어내고"
5.40-8.20  unit_deploy  "부대를 직접 지휘하고"
8.20-12.40 boss_duel    "보스와는 일기토"
12.40-15.00 season_gate "계절 너머까지 살아남으세요"
15.00-16.60 endcard     CTA
```

첫 프레임부터 적 무리가 보이게 하고, 컷 전환은 3프레임 이하의 하드컷 또는 짧은 플래시만 사용한다.

- [ ] **Step 2: 2편 재생·오디오 검사**

FFprobe로 길이 `16.0~17.2초`와 규격을 확인하고, `volumedetect` 평균 음량이 `-60dB`보다 큰지 확인한다.

### Task 6: 게임 설명형 완성본

**Files:**
- Create: `C:/OneStep/tiny_defense/output/marketing/youtube-shorts/2026-08-04/03_gameplay_explainer.mp4`

**Interfaces:**
- Consumes: `day_gather`, `tool_upgrade`, `relic_select`, `unit_deploy`, `tower_battle`, `boss_duel`
- Produces: 약 20초의 게임 설명형 쇼츠

- [ ] **Step 1: 컷과 자막 합성**

```text
0.00-2.80  day_gather    "낮엔 직접 모으고"
2.80-5.20  tool_upgrade  "도구를 성장시키고"
5.20-7.60  relic_select  "유물을 선택하고"
7.60-10.80 unit_deploy   "내 방식대로 배치하고"
10.80-14.40 tower_battle "밤엔 성을 지킵니다"
14.40-18.20 boss_duel    "매일 더 강해지는 생존 디펜스"
18.20-19.80 endcard      CTA
```

정지 UI 컷에는 2% 이하의 느린 확대만 적용하고, 선택 화면의 글자를 가리는 추가 자막은 하단 안전 영역으로 이동한다.

- [ ] **Step 2: 3편 재생·오디오 검사**

FFprobe로 길이 `19.2~20.6초`와 규격을 확인하고, `volumedetect` 평균 음량이 `-60dB`보다 큰지 확인한다.

### Task 7: 최종 검수와 전달 문서

**Files:**
- Create: `C:/OneStep/tiny_defense/output/marketing/youtube-shorts/2026-08-04/README.md`
- Create: `C:/OneStep/tiny_defense/output/marketing/youtube-shorts/2026-08-04/verification/ffprobe.txt`
- Create: `C:/OneStep/tiny_defense/output/marketing/youtube-shorts/2026-08-04/verification/contact-sheet-*.jpg`

**Interfaces:**
- Consumes: 원본 10개와 완성본 3개
- Produces: 전달 가능한 폴더와 검수 증거

- [ ] **Step 1: 전체 FFprobe 리포트 생성**

완성본과 원본의 파일명, 길이, 크기, fps, 영상·오디오 코덱을 `verification/ffprobe.txt`에 기록한다. 실패 항목이 있으면 빌드를 중단한다.

- [ ] **Step 2: 완성본 연락 시트 확인**

각 완성본의 시작, 25%, 50%, 75%, 끝 프레임을 추출해 연락 시트를 만들고 다음을 육안 확인한다.

```text
영상이 비어 있지 않음
세로 화면이 프레임 안에 맞음
자막이 잘리지 않음
자막과 게임 UI가 읽기 어렵게 겹치지 않음
엔드카드가 마지막에만 등장함
세 완성본의 첫 장면과 메시지가 서로 다름
```

- [ ] **Step 3: README 작성**

README 첫 부분에 아래 두 경로를 명시한다.

```text
완성본: C:/OneStep/tiny_defense/output/marketing/youtube-shorts/2026-08-04/
원본 클립: C:/OneStep/tiny_defense/output/marketing/youtube-shorts/2026-08-04/raw_clips/
```

이어서 파일별 장면 설명, 길이, 사용된 쇼츠 번호, 재빌드 명령을 표로 기록한다.

- [ ] **Step 4: 최종 파일 수와 재생 가능성 검사**

Run:

```powershell
$out = 'C:/OneStep/tiny_defense/output/marketing/youtube-shorts/2026-08-04'
if ((Get-ChildItem "$out/raw_clips" -Filter *.mp4).Count -ne 10) { throw 'raw clip count mismatch' }
if ((Get-ChildItem $out -Filter '0*.mp4').Count -ne 3) { throw 'short count mismatch' }
Get-ChildItem $out -Recurse -Filter *.mp4 | ForEach-Object {
  ffmpeg -v error -i $_.FullName -f null -
  if ($LASTEXITCODE -ne 0) { throw "decode failed: $($_.FullName)" }
}
```

Expected: 원본 10개, 완성본 3개, 모든 파일 디코드 exit code 0.
