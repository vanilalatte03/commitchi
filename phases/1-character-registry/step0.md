# 단계 0: manifest-and-catalog

## 읽어야 할 파일

먼저 아래를 읽고 아키텍처와 설계 의도를 파악하라:

- `docs/adr/0002-dex-and-character-registry.md` (이 phase가 구현하는 설계 — 단일 진실원천)
- `AGENTS.md` (저장소 규칙, 인코딩, 검증 명령)
- `phases/1-character-registry/README.md`
- `src/sprites.ts` (현재 `assets/sprites/yuki` 하드코딩, stage/mood→스프라이트 맵, `@3x` base64 임베드)
- `src/types.ts` (`Species` 고정 union), `src/config.ts` (검증 패턴 참고)

## 작업

캐릭터를 **데이터로 기술하기 위한 계약과 로더**를 만든다. (아직 렌더 경로 전면 교체는 하지 않는다.)

- `CharacterManifest` 타입과 검증 함수를 정의한다. 검증 실패 시 `config.ts`처럼 **명확한 에러**를 던진다.
- `assets/sprites/yuki/character.json`을 생성한다:
  ```jsonc
  {
    "id": "yuki",            // 폴더명과 동일, 소문자
    "displayName": "Yuki",   // 카드/도감에 표시되는 종족명(고유명사, 언어 중립)
    "ghostName": "Yurei",    // 이 캐릭터의 방치 형태 이름
    "author": "vanilalatte03",
    "license": "CC-BY-4.0"
  }
  ```
- 루트에 `catalog.json`을 생성한다(도감 번호 단일 진실원천, append-only). Yuki를 `#1`로 시드한다.
- `src/characters.ts` 레지스트리를 만든다: 카탈로그/매니페스트를 로드·검증하고
  `getCharacter(id)`, 캐릭터별 **스프라이트 디렉터리** 등을 노출한다.
- `sprites.ts`가 Yuki의 **자산 디렉터리**(`SPRITE_DIR`)를 하드코딩 대신 레지스트리에서 가져오게 한다.
  (최소 연결 — 동작은 보존)

## 인수 기준

```bash
npm run build
npm run demo
npm run preview
git diff --check
```

- 위가 모두 통과하고, **Yuki `pet.svg`/preview 출력이 기존과 동일**해야 한다.
- 잘못된 `character.json` 또는 `catalog.json`은 명확한 에러로 거부돼야 한다.

## 검증 절차

1. 위 AC 명령을 실행한다.
2. 체크리스트:
   - ADR 0002의 매니페스트/카탈로그 계약을 따르는가?
   - `AGENTS.md` 규칙(strict TS, 신규 의존성 추가 금지, 모듈 책임 분리)을 지키는가?
   - Yuki 렌더 결과가 동일한가?
3. `phases/1-character-registry/index.json`의 step 0을 갱신한다:
   - 성공 → `"status": "completed"`, `"summary": "산출물 한 줄 요약"`
   - 3회 수정 후에도 실패 → `"status": "error"`, `"error_message": "..."`
   - 사용자 개입 필요 → `"status": "blocked"`, `"blocked_reason": "..."` 후 즉시 중단

## 금지사항

- `Species` 타입을 바꾸지 마라. 이유: 단계 1의 범위다.
- `ghost` 처리 방식을 바꾸지 마라. 이유: 단계 2의 범위다.
- 표시명(Yuki/Yurei)을 `i18n.ts`에서 매니페스트로 옮기지 마라. 이유: 단계 2의 범위다.
- 신규 캐릭터를 추가하지 마라. 이유: phase 제외 범위(Yuki만 출시).
- `pet.svg` / `pet-state.json`을 손으로 수정하지 마라. 렌더 경로로만 갱신한다.
