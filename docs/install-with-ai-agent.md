# Install Commitchi with an AI agent (Codex / Claude Code)

Don't want to wire up the workflow files by hand? If you use an AI coding agent
(Codex CLI, Claude Code, etc.), open it **inside your profile repository**
(`<your-username>/<your-username>`) and paste one of the prompts below. The agent
creates the workflow files, adds the README embed, and triggers the first run.

The manual step-by-step is still in the main [README](../README.md#setup) if you'd rather do it yourself.

## English prompt

```text
Set up "Commitchi" (a GitHub profile pet) in THIS repository.

Commitchi is a published GitHub Action (`vanilalatte03/commitchi@v1`) that renders a
pixel pet into an SVG committed to this repo, fed by my GitHub contribution activity.
Please do all of the following:

1) Create `.github/workflows/commitchi.yml` with exactly this content:
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

2) Create `.github/workflows/commitchi-visitor.yml` with exactly this content:
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

3) In my profile README.md, add these two lines where I want the pet shown
   (create README.md if it doesn't exist):
   ![pet](./pet.svg)
   ![dex](./dex.svg)

4) OPTIONAL config — ask me for a pet name / character / language; if I don't care,
   skip this (defaults: Yuki, Korean). If I do, create `commitchi.config.json` at the
   repo root, e.g.: { "petName": "Mochi", "character": "yuki", "language": "en" }

5) Commit and push everything to the default branch.

6) Trigger the first run so pet.svg/dex.svg get generated:
   run `gh workflow run commitchi.yml`, then confirm the run succeeds and that
   pet.svg + dex.svg were committed. (If gh isn't available, tell me to open the
   Actions tab -> "commitchi" -> "Run workflow".)

Important:
- Use `@v1` exactly — it's a floating tag that auto-updates, so I always get the latest engine.
- Never hand-edit pet.svg / dex.svg / pet-state.json; the Action generates and commits them.
```

## 한국어 프롬프트

```text
이 저장소(내 GitHub 프로필 레포)에 "Commitchi"(프로필 펫)를 설치해줘.

Commitchi는 마켓플레이스에 공개된 GitHub Action(`vanilalatte03/commitchi@v1`)으로,
내 기여 활동을 먹고 자라는 픽셀 펫을 SVG로 렌더해 이 저장소에 커밋해. 아래를 모두 해줘:

1) `.github/workflows/commitchi.yml` 파일을 정확히 이 내용으로 생성:
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

2) `.github/workflows/commitchi-visitor.yml` 파일을 정확히 이 내용으로 생성:
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

3) 내 프로필 README.md에서 펫을 보여줄 위치에 아래 두 줄 추가
   (README.md가 없으면 새로 만들어):
   ![pet](./pet.svg)
   ![dex](./dex.svg)

4) 선택 설정 — 펫 이름 / 캐릭터 / 언어를 물어봐줘. 상관없으면 건너뛰어
   (기본: Yuki, 한국어). 원하면 루트에 `commitchi.config.json` 생성, 예:
   { "petName": "Mochi", "character": "yuki", "language": "ko" }

5) 변경사항을 기본 브랜치에 커밋하고 푸시해줘.

6) 첫 실행을 트리거해서 pet.svg/dex.svg가 생성되게 해줘:
   `gh workflow run commitchi.yml` 실행 후, 실행이 성공하고 pet.svg + dex.svg가
   커밋됐는지 확인해줘. (gh가 없으면 Actions 탭 -> "commitchi" -> "Run workflow"를
   누르라고 알려줘.)

중요:
- 반드시 `@v1`을 그대로 사용 — 떠다니는 태그라 자동으로 최신 엔진을 받아.
- pet.svg / dex.svg / pet-state.json은 직접 수정하지 마. Action이 생성·커밋해.
```
