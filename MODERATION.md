# Content Moderation Policy

This policy covers all **community-contributed character art and metadata** hosted in
this repository. Because a character can be selected by other users and rendered on
**their** GitHub profiles, content here is held to a higher bar than a typical repo.

It complements [CONTRIBUTING.md](./CONTRIBUTING.md) (how to contribute) and
[ADR 0002](./docs/adr/0002-dex-and-character-registry.md) (the character/dex design).

## Prohibited content

A character submission is rejected (or removed) if it includes any of:

- **Non-original / IP infringement** — fan art, or anything derived from existing
  copyrighted or trademarked characters, logos, or traced/copied work. Art must be your
  own original creation.
- **Sexual / NSFW** content.
- **Hateful, harassing, violent, or discriminatory** content (including slurs and
  extremist symbols), targeting any race, gender, religion, nationality, etc.
- **Illegal** content.
- **Spam, low-effort, trolling, or deliberately misleading** submissions.
- **Impersonation**, or offensive text embedded in the art, `id`, or display name.

## How moderation works

### 1. Pre-merge gate (primary defense)

Every character pull request is reviewed by a maintainer **before** it is merged. CI
validates the *technical contract only* (files, format, manifest schema, dex-id
uniqueness); it cannot judge originality or appropriateness. The maintainer decides on
IP-safety, content, and quality. **Nothing is published without human approval.**

### 2. Reporting

Anyone can report an already-published character by opening an issue titled
`report: <character-id>` with the dex number and the reason. Reports are reviewed
promptly.

### 3. Takedown

- **Copyright complaints:** follow GitHub's
  [DMCA takedown process](https://docs.github.com/en/site-policy/content-removal-policies/dmca-takedown-policy)
  in addition to the report channel above.
- **Confirmed violations** are removed within **24–72 hours**: the character folder and
  its `catalog.json` entry are deleted.
- **The dex number is retired, not reused** (consistent with ADR 0002's "numbers are
  never reused"). The slot is shown as `#N — removed` rather than reassigned, so existing
  dex numbers never change meaning.

### 4. Enforcement

Contributors who repeatedly or maliciously submit prohibited content may be blocked from
future contributions.

## Maintainership

The gallery is currently moderated by the repository owner as a solo pre-merge gate.
Trusted reviewers may be added as the catalog grows.

## Note

Moderation is best-effort. If something inappropriate slips through, please report it and
it will be removed per the takedown process above.
