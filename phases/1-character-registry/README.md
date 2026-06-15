# Phase: 1-character-registry

> 데이터 주도 캐릭터 레지스트리 리팩터(ADR 0002의 **첫 구현 게이트**)를 STEP으로 나눈 phase 문서다.
> 코덱스가 step을 하나씩 구현하고, 각 step PR마다 방향이 맞는지 리뷰받는다.
>
> commitchi에는 project-ops 하니스(`scripts/checks.py`, `doctor.py`)가 통합돼 있지 않다.
> 따라서 검증은 npm 명령으로 대체하고, step 리뷰는 사람(Claude)이 stepN.md 기준으로 수행한다.

## 목표

- "캐릭터 추가 = `assets/sprites/<id>/` 폴더 + `character.json` 떨구기(+ `catalog.json` 항목)"가 되도록
  캐릭터를 **데이터 주도**로 만든다. `.ts` 수정 없이 둘째 캐릭터를 추가할 수 있어야 한다.
- 기존 **Yuki의 렌더 결과는 바뀌지 않는다**(의도된 문자열 출처 변경 제외).

## 작업 범위 (Must-have)

- `character.json` 매니페스트 스키마 + 검증
- `catalog.json` — 도감 번호 단일 진실원천(append-only), Yuki = #1
- 캐릭터 레지스트리/로더 (`src/characters.ts`)
- `sprites.ts`를 레지스트리 기반 자산 해석으로 전환
- `Species`를 고정 union → 등록된 캐릭터 id(string)로 일반화
- `ghost`를 종족이 아니라 **활성 캐릭터의 방치 변형**으로
- 기존 `pet-state.json` 하위호환(마이그레이션)

## 제외 범위 (→ 후속 phase, ADR 0002)

- 멀티펫 로스터 / 활성 펫 전환 / 비활성 동결
- 개인 도감 진행도(`dex[id].maxStage`), 단계 표시 고정(display-lock)
- `npm run dex:assign` 스크립트, 기여 검증 CI 워크플로
- 실제 신규 캐릭터 추가 (Yuki만 출시 — 둘째는 "데이터만으로 추가 가능"하면 충분)
- 캐릭터별 진화 임계값 (공유 stage 곡선 유지)

## Steps

| Step | Name | Range |
| ---: | --- | --- |
| 0 | manifest-and-catalog | Must-have |
| 1 | registry-driven-sprites | Must-have |
| 2 | species-id-and-ghost-variant | Must-have |

## Step PR 리뷰 원칙

- 각 step PR의 리뷰 기준은 현재 `stepN.md`의 작업·인수 기준·금지사항이다.
- 미래 step에 배정된 기능이 아직 없다는 사실은 현재 step의 blocker가 아니다.
- 현재 step이 미래 step 범위를 선행 구현하면 blocker로 본다.
- **Yuki 렌더 결과가 바뀌면(의도된 문자열 출처 변경 외) blocker로 본다.**
- 리뷰 실패는 같은 PR 브랜치에서 수정한다.

## 완료 기준

- 신규 캐릭터를 폴더 + `character.json` + `catalog.json` 항목만으로 추가할 수 있다(`.ts` 변경 없이).
- `npm run build` / `npm run demo` / `npm run preview` 통과, Yuki 카드 출력 동일.
- 기존 `pet-state.json`(`species: "ghost"` 포함)이 리셋 없이 로드된다.

## 검증 명령

```bash
npm run build
npm run demo
npm run preview
git diff --check
```
