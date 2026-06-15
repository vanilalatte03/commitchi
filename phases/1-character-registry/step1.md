# 단계 1: registry-driven-sprites

## 읽어야 할 파일

- `docs/adr/0002-dex-and-character-registry.md`
- `phases/1-character-registry/README.md`
- `src/characters.ts` (단계 0에서 생성한 레지스트리)
- `src/sprites.ts`, `src/types.ts`, `src/evolution.ts`, `src/render.ts`, `src/state.ts`

단계 0에서 만든 레지스트리/매니페스트를 꼼꼼히 읽고 설계 의도를 이해한 뒤 작업하라.

## 작업

스프라이트 해석을 **캐릭터 id로 완전히 매개변수화**하고, `Species`를 등록된 id로 일반화한다.

- `Species`를 고정 union(`"yuki" | "ghost"`)에서 **등록된 캐릭터 id(string)**로 바꾼다.
  `DEFAULT_SPECIES = "yuki"`를 유지한다.
- `spriteFor(...)`가 주어진 캐릭터 id에 대해 **모든 stage/mood 스프라이트(+ ghost 스프라이트)**를
  레지스트리를 통해 해석하게 한다. `@3x` base64 임베드 동작은 그대로 유지한다.
- `types.ts` / `evolution.ts` / `render.ts` / `state.ts`가 캐릭터 id를 일관되게 다루도록 갱신한다.
- 이 단계까지는 `ghost`를 기존처럼 특수 처리해도 된다(완전 제거는 단계 2). 단, ghost 스프라이트도
  레지스트리(활성 캐릭터의 ghost)에서 가져온다.

## 인수 기준

```bash
npm run build
npm run demo
npm run preview
git diff --check
```

- 위가 모두 통과하고, **Yuki(및 방치 시 Yurei) 렌더 출력이 기존과 동일**해야 한다.

## 검증 절차

1. 위 AC 명령을 실행한다.
2. 체크리스트:
   - 스프라이트 해석이 더 이상 캐릭터를 하드코딩하지 않고 레지스트리를 통하는가?
   - `Species`가 id로 일반화되었고 타입이 strict하게 통과하는가?
   - `AGENTS.md` 규칙을 지키는가? Yuki/Yurei 출력이 동일한가?
3. `phases/1-character-registry/index.json`의 step 1을 갱신한다(완료/에러/blocked 규칙은 step 0과 동일).

## 금지사항

- `ghost`를 종족에서 완전히 제거하거나 방치 변형 모델로 재설계하지 마라. 이유: 단계 2의 범위다.
- 표시명(Yuki/Yurei)을 매니페스트로 옮기지 마라. 이유: 단계 2의 범위다.
- 멀티펫/도감 진행도/표시 고정 등 후속 기능을 선행 구현하지 마라. 이유: phase 제외 범위다.
- 신규 캐릭터를 추가하지 마라.
- `pet.svg` / `pet-state.json`을 손으로 수정하지 마라.
