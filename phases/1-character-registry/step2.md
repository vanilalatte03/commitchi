# 단계 2: species-id-and-ghost-variant

## 읽어야 할 파일

- `docs/adr/0002-dex-and-character-registry.md` (특히 "Migration" 절)
- `phases/1-character-registry/README.md`
- `src/characters.ts`, `src/sprites.ts`, `src/types.ts`, `src/evolution.ts`,
  `src/render.ts`, `src/i18n.ts`, `src/state.ts`

## 작업

ghost를 종족에서 떼어내 **방치 변형**으로 정리하고, 표시명을 매니페스트로 옮기고, 하위호환을 보장한다.

- **ghost를 종족이 아니라 활성 캐릭터의 방치 변형으로** 만든다. `Species`에서 `"ghost"`를 제거하고,
  방치 상태(`resolveEvolution`이 이미 계산)와 활성 캐릭터 id로부터 ghost 렌더를 파생시킨다.
  각 캐릭터 폴더가 제공하는 `ghost.png`와 매니페스트의 `ghostName`을 사용한다.
- **표시명을 `i18n.ts`에서 매니페스트로 이전**한다: 종족 이름(Yuki)·ghost 이름(Yurei)은
  `character.json`의 `displayName`/`ghostName`에서 온다. `i18n.ts`에는 일반 UI 문구
  (stage 이름, 스탯 라벨, 기분, 진화/streak/방문자 문구 등)만 남긴다. `ko`/`en` 둘 다 동작 유지.
- **마이그레이션(필수)**: `loadState`가 기존 `pet-state.json`을 안전하게 읽어야 한다.
  저장된 `species: "ghost"`(또는 알 수 없는 종족)는 `DEFAULT_SPECIES`("yuki")로 정규화한다.
  (ghost는 이제 파생 변형이지 저장 종족이 아니다.) 절대 크래시하거나 펫을 리셋하지 않는다 —
  기존 `normalizeStat` 방어적 로드 패턴을 따른다. `lockedSpecies` 의미는 유지하되 id로 다룬다.

## 인수 기준

```bash
npm run build
npm run demo
npm run preview
git diff --check
```

추가 확인:

- `species: "yuki"`인 기존 `pet-state.json`이 정상 로드되고 Yuki 출력이 동일하다.
- `species: "ghost"`가 저장된 옛 `pet-state.json`이 **리셋 없이** 로드된다(→ yuki로 정규화).
- `language: "ko"`와 `"en"` 모두에서 카드 텍스트가 한 언어로만 출력된다(혼합 없음).

## 검증 절차

1. 위 AC 명령을 실행한다.
2. 옛 형식 `pet-state.json`(특히 `species:"ghost"`)으로 로드 테스트를 한다.
3. 체크리스트:
   - ghost가 종족이 아니라 방치 변형으로 정리되었는가?
   - 표시명이 매니페스트에서 오고 i18n에는 일반 문구만 남았는가?
   - 마이그레이션이 동작하고 Yuki 출력이 동일한가?
4. `phases/1-character-registry/index.json`의 step 2를 갱신한다(완료/에러/blocked 규칙 동일).

## 금지사항

- 멀티펫 로스터, 활성 펫 전환, 비활성 동결을 구현하지 마라. 이유: 후속 phase 범위다.
- 개인 도감 진행도(`dex[id].maxStage`)나 단계 표시 고정을 구현하지 마라. 이유: 후속 phase 범위다.
- `dex:assign` 스크립트나 기여 검증 CI를 추가하지 마라. 이유: 후속 phase 범위다.
- 신규 캐릭터를 추가하지 마라. 이유: phase 제외 범위(Yuki만 출시).
- `pet.svg` / `pet-state.json`을 손으로 수정하지 마라.
