# 인수인계 — 원작 리소스 연결 작업 (로컬 세션용)

이 문서는 클라우드 세션(2026-09-16)에서 로컬 Claude Code 세션으로 작업을 넘기기 위한 요약이다. 새 세션은 이 대화 기록이 없으므로 여기부터 읽는다.

## 현재 상태
- 레포 `main`은 M13(D2 원작식 리디자인)까지 완료. 유닛 224, e2e 55/55(단일 워커, 약 11분). 플레이 페이지 아티팩트 v25.
- 그래픽은 전부 **Canvas 2D 코드 드로잉**이다. 원작(2003, 3D 프리렌더 아이소메트릭)과 비교하면 인상만 비슷하고 실제 그림은 다르다. 사용자 판단: 더 다듬지 말고 **원작 클라이언트의 실제 리소스를 연결**한다.
- 원작 참고 크롭(유튜브 플레이 영상 iAv29Xr1fiQ): `docs/ref/hud.jpg`(HUD 띠), `c_150.jpg`(역 구내), `c_270.jpg`(중곡역 플랫폼), `c_360.jpg`(하수도), `hud-compare.png`(원작/이전/현재 HUD 비교).
- 힉스필드·PixelLab 등 유료 도구는 사용자 결정으로 쓰지 않는다.

## 목표
사용자 PC에 있는 이터널시티 1 클라이언트 폴더에서 스프라이트·타일·UI 그림을 꺼내, 이 게임의 텍스처 키에 연결한다. 개인 비배포용.

## 이미 준비된 연결 지점
- `src/data/artOverrides.ts` — `ART_OVERRIDES: Partial<Record<TexKey, ArtOverride>>`.
  - 단일 이미지: `[TEX.face_elia]: 'art/face_elia.webp'`
  - 시트: `[TEX.zombie_casual_f]: { url: 'art/zombie_casual_f.png', frameW: 48, frameH: 48 }` — 프레임은 행=방향(8행, `systems/facing.ts`의 Dir 순서), 열=6(0 idle, 1~3 walk, 4 aim, 5 death). 열 수는 `FRAMES_PER_DIR`.
  - 파일은 `public/art/`에 두면 dev/preview/발행 모두에서 같은 상대 경로로 로드된다. 없으면 코드 드로잉으로 자동 폴백.
- `src/game/scenes/TextureGenScene.ts` — 오버라이드를 `load.image` / `load.spritesheet`로 먼저 읽고, 나머지를 `generateAllTextures`로 그린다.
- 타일은 아직 오버라이드 불가(아틀라스 하나를 `drawTilesAtlas`가 그림). 타일 원본이 나오면 `draw/tiles.ts`의 `drawTilesAtlas`에 "소스 이미지가 있으면 `drawImage`로 깔고 디테일만 위에" 분기를 추가한다(계획서 D2 "힉스필드 타일" 항목과 같은 구조, 소스만 원작 파일로).
- 텍스처 키 목록: `src/data/textureKeys.ts` (`TEX`, `TILE`). 피겨 스타일 목록: `src/game/textures/draw/figures.ts`(`FIGURE_STYLES`) — 어떤 몬스터/NPC 키가 있는지 여기서 본다.
- 프레임 크기: 현재 48px, 카메라 줌 1.5. 원작 스프라이트가 더 크면(예: 64~96px) `manifest.figure()`의 frameW/frameH와 `Enemy/Player`의 바디 오프셋(`entities/*.ts`의 setSize/setOffset)을 함께 조정한다.

## 작업 순서 제안
1. 클라이언트 폴더 구조 파악: `dir /s /b` 로 확장자 통계. 일반 포맷(png/bmp/tga/dds)이면 바로 사용, 독자 포맷(.pak/.dat/.res 등)이면 헤더를 열어 컨테이너/이미지 포맷을 분석해 `tools/extract-*.mjs` 추출기 작성.
2. 캐릭터 시트 1종(중곡동 기본 좀비 `zombie_casual_f`)을 먼저 연결해 필드에서 확인 → 방향 순서·프레임 매핑(`facing.ts`)을 원작 시트 규격에 맞춰 조정.
3. 플레이어·NPC·나머지 몬스터 순으로 확장. 없는 키는 코드 드로잉 폴백 유지.
4. 타일/배경: 원작은 아이소메트릭 배경이라 32px 정사각 타일과 다를 수 있다. 우선 바닥 질감(아스팔트·보도·플랫폼·하수도)만 잘라 `drawTilesAtlas` 소스로 깔고, 구조 변경(아이소메트릭 전환)은 별도 결정.
5. HUD/창 그림: `draw/ui.ts`의 패널·슬롯도 원작 UI 파일이 있으면 `ui_panel`/`ui_slot` 오버라이드로 대체(9-slice 크기 48px 기준, 다르면 UIScene의 nineslice 인자 조정).
6. 매 단계 `npx tsc --noEmit && npx vitest run && npm run build`, 스크린샷 비교, 커밋/푸시.

## 검증/실행
- `npm ci`, `npm run dev`(개발) 또는 `npm run build && npm run preview`(4173).
- e2e: `npx playwright test` (config: 크로뮴 기본 소프트웨어 WebGL, 단일 워커, 90초). ANGLE/SwiftShader 강제 플래그는 넣지 말 것(페이지당 15~20초 멈춤 유발).
- 커밋 규칙: 리소스 파일은 용량이 크면 `public/art/`에 필요한 것만(WebP/PNG로 변환·축소) 넣고, 원본 클라이언트는 레포에 넣지 않는다.

## 나머지 M14 항목(원작 리소스 작업 뒤)
2026-09-16 사용자 지시로 순서 변경: M14 잔여를 먼저 끝내고 원작 리소스 작업. (b) 총기 아이콘 밝기 보정, (c) 어설트 S등급 업적 2종, (d) 보관함 분류탭/정렬(`Window.filterSortBar`), README M14 — 완료. e2e·아티팩트 v26 — 진행 상태는 `작업기록/_다음에-이어서.md`.
