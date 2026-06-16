# 🐣 Commitchi

[English](./README.md) · **한국어**

GitHub 프로필 README 안에 살면서 당신의 커밋을 먹고 자라는 다마고치 스타일 펫이에요.

오너마다 자기 펫에게 개별 이름을 붙이고, 키울 등록 캐릭터를 고를 수 있어요. 설정의 캐릭터를 바꾸면 로스터 안의 활성 펫이 전환돼요. 이전 펫은 그 상태로 동결되고, 다시 고르면 이어서 키울 수 있어요. 기본값은 눈올빼미 픽셀 스프라이트인 **Yuki**예요.

- **커밋하면** 펫이 배부르고 행복해져요.
- **활동이 뜸하면** 펫이 배고파지고, 결국 아파요.
- 협업(PR·리뷰·이슈)은 펫의 **행복도**를 올리고, 꾸준한 커밋 리듬은 **체력**을 올려요.
- **기본 4일 이상 사라지면** 펫이 해당 캐릭터의 유령 형태로 희미해져요 — 다시 커밋하는 순간 돌아와요.
- 펫은 시간이 지나며 **성장**해요: 알 → 아기 → 어린이 → 청소년 → 성체.
- 키운 캐릭터는 더 높은 단계에 도달할수록 개인 도감 진행도가 채워져요.
- 카드에는 도감 진행도가 키운 캐릭터 수 / 전체 카탈로그 수로 표시돼요.
- 카드가 현재 상태의 이유와 회복 방법을 한 줄로 보여줘요.
- 진화와 7/30/100일 연속 기여 마일스톤은 한 틱 동안 **축하** 배지와 반짝임 효과를 띄워요.

GitHub Action이 스케줄에 맞춰 틱을 돌려 `pet.svg`와 `dex.svg`를 새로 만들고 다시 커밋해서, README가 항상 현재 펫과 수집 현황을 보여줘요.

<p align="center">
  <img src="./docs/assets/ghost-nari.ko.svg" alt="커밋치 유령 형태 — 방치되면 Nari가 Yeong으로 희미해져요" width="480" />
  <br/>
  <sub>너무 오래 잠수하면 펫이 유령 형태로 희미해져요(예: Nari → Yeong) — 다시 커밋하는 순간 돌아옵니다.</sub>
</p>

## 성장 단계

단계는 오로지 나이에 따라 올라가요:

| 단계 | 나이 |
|---|---|
| 알 (egg) | 0일차 |
| 아기 (baby) | 1일차+ |
| 어린이 (child) | 3일차+ |
| 청소년 (teen) | 7일차+ |
| 성체 (adult) | 14일차+ |

기분(`기분 좋음` / `배고픔` / `아파요`)은 포만감, 치명적으로 낮은 스탯, 체력 30 이하, 가장 최근 커밋 시점에 따라 정해져요. 각 단계마다 고유한 기분 스프라이트가 있어요. 방치(기본 4일 이상 기여 없음) 시에는 활성 캐릭터의 유령 변형이 표시돼요.

> 캐릭터 시스템은 **데이터 주도**(`catalog.json` + 캐릭터별 `character.json` 레지스트리)라, 새 캐릭터를 데이터로 추가할 수 있어요. config 기반 캐릭터 선택은 지금 사용할 수 있고, 코딩 패턴 기반 종족 선택(`pickSpecies`)은 나중의 특수/한정 캐릭터 규칙을 위해 보류되어 있어요.

## 동작 방식

```
GitHub Actions (스케줄)
  → 기여 활동 가져오기 (GraphQL)
  → pet-state.json 갱신   (로스터 기억: 활성 펫, 스탯, 단계, 마일스톤, 도감, 상태 일기)
  → pet.svg + dex.svg 렌더 (SVG + 알맞은 픽셀 스프라이트, base64 PNG로 임베드)
  → pet.svg + dex.svg + pet-state.json 을 저장소에 다시 커밋
README가 pet.svg + dex.svg 를 임베드
```

스프라이트를 SVG 안에 base64 데이터 URI로 임베드하는 건 의도된 선택이에요 — SVG 내부의 상대/외부 이미지 참조는 GitHub의 이미지 프록시를 통과하지 못하지만, 자체 완결형 SVG는 안정적으로 렌더돼요.

현재 상태의 이유는 `pet-state.json`에 구조화된 note로 저장되고, 최근 이유 변화는 짧은 일기(log)로 누적돼요.

## 설정 방법

> **붙여넣기 한 번으로 끝내고 싶다면?** Codex / Claude Code 같은 AI 에이전트를 쓴다면
> [AI 에이전트로 설치](./docs/install-with-ai-agent.md)를 참고하세요 — 프롬프트 하나로 전부 설정돼요.
> 아래는 수동 단계입니다.

본인 프로필 저장소(`<your-username>/<your-username>`)에
`.github/workflows/commitchi.yml`을 추가하세요:

```yaml
name: commitchi

on:
  schedule:
    - cron: "0 */6 * * *"
  workflow_dispatch: {}

permissions: { contents: write }

concurrency:
  group: commitchi-pet-state
  cancel-in-progress: false

jobs:
  commitchi:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: vanilalatte03/commitchi@v1
        # with: { github-token: ${{ secrets.PET_TOKEN }} }  # 비공개 기여까지 세려면
```

그다음 프로필 `README.md`에 펫을 임베드하세요:

```md
![pet](./pet.svg)
![dex](./dex.svg)
```

**Actions** 탭에서 워크플로를 한 번 수동 실행(`workflow_dispatch`)하면 첫
`pet.svg`, `dex.svg`, `pet-state.json`이 생성돼요. 이후에는 스케줄이
자동으로 펫을 갱신합니다. 프로필 저장소에 이 저장소의 소스를 복사할 필요는
없고, `@v1` 태그가 이동되면 워크플로가 최신 v1 엔진을 자동으로 사용해요.
도감 갤러리도 함께 생성되어 전체 카탈로그의 수집 현황을 보여주며, 미수집은
실루엣과 `???`로 표시됩니다. 미수집 캐릭터를 키우려면 `character`에 그 도감
번호를 적으면 돼요(예: `"character": 3`) — 키우면서 정체를 알아가는 재미가 있어요.

방문자가 이슈를 열어 펫에게 밥을 주거나 놀아줄 수 있게 하려면
`.github/workflows/commitchi-visitor.yml`도 추가하세요:

```yaml
name: commitchi-visitor

on:
  issues:
    types: [opened]

permissions: { contents: write, issues: write }

concurrency:
  group: commitchi-pet-state
  cancel-in-progress: false

jobs:
  visitor:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: vanilalatte03/commitchi@v1
        with: { mode: visitor }
```

README에 아래 이슈 링크를 넣으면 방문자가 워크플로를 실행할 수 있어요:
[🍖 Feed](https://github.com/<owner>/<repo>/issues/new?title=commitchi%3A%20feed)
/ [🎾 Play](https://github.com/<owner>/<repo>/issues/new?title=commitchi%3A%20play).
Commitchi는 이슈 제목이 정확히 `commitchi: feed` 또는 `commitchi: play`일
때만 반응합니다.

선택 설정은 프로필 저장소 루트의 `commitchi.config.json`에 둡니다. 파일이
없으면 기본값을 쓰며, 기본 캐릭터는 Yuki예요.

```json
{
  "petName": "Mochi",
  "language": "ko",
  "displayStage": "auto",
  "theme": "dark",
  "economy": {
    "feedPerContrib": 12,
    "decayPerDay": 22
  }
}
```

## 로컬에서 실행

```bash
npm install
npm run demo      # DEMO 모드: 샘플 데이터 → pet.svg + dex.svg + pet-state.json 생성
npm run visitor   # 이슈-op 모드: ISSUE_TITLE + ISSUE_AUTHOR 를 읽어, 인식되면 펫 갱신
npm run preview   # 모든 단계 + 기분(+ 유령)을 ./preview/*.svg 로 렌더
```

실제 데이터로:

```powershell
$env:GH_USERNAME = "your-username"   # PowerShell
$env:GH_TOKEN    = "ghp_xxx"         # read:user 권한 토큰
npm run build; npm run tick
```

## 설정 (Configuration)

기본값을 바꾸고 싶을 때 저장소 루트에 `commitchi.config.json`을 만드세요:

```json
{
  "petName": "Mochi",
  "character": "yuki",
  "language": "ko",
  "displayStage": "auto",
  "theme": "dark",
  "economy": {
    "feedPerContrib": 12,
    "decayPerDay": 22,
    "happinessDecayPerDay": 8,
    "staminaDecayPerDay": 8,
    "startFullness": 60
  },
  "thresholds": {
    "hungryFullness": 45,
    "sickFullness": 15,
    "sickStamina": 30,
    "neglectDays": 4
  }
}
```

설정 파일은 선택이며 부분 오버라이드를 지원해요. 생략한 항목은 기본값을 사용합니다.

| 항목 | 의미 | 기본값 |
|---|---|---|
| `petName` | 표시되는 개별 펫 이름; 구버전 `name` 키도 허용 | `Mochi` |
| `character` | 키울 캐릭터: 카드에 표시된 **도감 번호**(예: `3`) 또는 등록된 id(예: `"yuki"`); 값을 바꾸면 로스터 펫 전환 | `yuki` |
| `language` | 카드 + 댓글 언어: `"ko"`(완전 한국어) 또는 `"en"`(완전 영어) | `ko` |
| `displayStage` | 카드에 고정 표시할 단계 스프라이트; `"auto"`는 실제 단계 자동 표시 | `auto` |
| `economy.feedPerContrib` | 새 기여 1건당 오르는 포만감 | 12 |
| `economy.decayPerDay` | 먹이 없이 하루당 줄어드는 포만감 | 22 |
| `economy.happinessDecayPerDay` | 하루당 줄어드는 행복도 | 8 |
| `economy.staminaDecayPerDay` | 하루당 줄어드는 체력 | 8 |
| `economy.startFullness` | 갓 태어났을 때 포만감·행복도·체력의 시작값 | 60 |
| `thresholds.hungryFullness` | 포만감이 이 값 이하일 때 펫이 배고파짐 | 45 |
| `thresholds.sickFullness` | 이 스탯 값 이하에서 펫이 아파짐 | 15 |
| `thresholds.sickStamina` | 체력이 이 값 이하면 펫이 아파짐(쇠약); 포만감과 무관 | 30 |
| `thresholds.neglectDays` | 활성 펫이 유령 형태가 되기까지 기여 없는 일수 | 4 |

## 프로젝트 구조

```
src/
  config.ts     선택적 commitchi.config.json 로더 + 검증
  index.ts      한 번의 틱을 조율
  visitor.ts    이슈-op 방문자 밥주기/놀아주기 CLI
  github.ts     GraphQL fetch → 기여 활동
  state.ts      pet-state.json 로드/갱신/저장 (스탯 + 이코노미 + 상태 일기)
  evolution.ts  단계 진행 + 방치 → 유령 변형
  characters.ts 데이터 주도 캐릭터 레지스트리: catalog.json과 각
                assets/sprites/<id>/character.json 로드·검증
  sprites.ts    단계/기분 → 알맞은 픽셀 스프라이트(캐릭터별) 매핑, base64 임베드
  render.ts     pet.svg 카드 조립 (스프라이트, 둥실 애니메이션, 축하 효과)
  render-dex.ts 도감 갤러리 SVG 생성
  i18n.ts       일반 UI 문구의 한국어/영어 번들 (캐릭터 이름은 character.json에서)
  preview.ts    개발 전용 갤러리 생성기
  types.ts      공용 타입
catalog.json                 도감 레지스트리: 도감 번호 → 캐릭터 id
assets/sprites/<id>/character.json  캐릭터별 매니페스트 (id, displayName, ghostName, author, license)
assets/sprites/<id>/         픽셀 스프라이트 (PNG) + character.json
action.yml                   스케줄 tick용 재사용 composite 액션
.github/workflows/character-validation.yml 캐릭터 카탈로그 검증
.github/workflows/release.yml  머지 시 dist/ 빌드 + @v1 태그 자동 이동
```

> `pet-state.json`은 첫 실행 전에 없어도 돼요. Commitchi가 로스터와 활성 펫을
> 만든 뒤 생성된 `pet.svg`, `dex.svg`, `pet-state.json`을 프로필 저장소에 커밋합니다.
> 나중에 Commitchi를 업데이트할 때는 저장소의 `pet-state.json`을 유지해야
> 로스터와 도감 진행도가 처음부터 다시 시작하지 않아요. 최근 상태 일기도 여기에 유지돼요.

## 라이선스

- 소스 코드: [MIT](./LICENSE)
- 캐릭터/스프라이트 아트: [CC BY 4.0](./LICENSE-ASSETS.md) — [재사용·어트리뷰션 안내](./docs/asset-attribution.md)

직접 만든 캐릭터를 추가하고 싶다면 [CONTRIBUTING.md](./CONTRIBUTING.md)를 참고하세요.
