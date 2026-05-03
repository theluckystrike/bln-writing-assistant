# BeLikeNative Writing Assistant

[![Writing Quality](https://img.shields.io/badge/Writing%20Quality-A%20Excellent-brightgreen)](https://github.com/theluckystrike/bln-writing-assistant)
[![GitHub Action](https://img.shields.io/badge/GitHub%20Action-v1-blue)](https://github.com/marketplace)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Comprehensive writing quality analysis for documentation and markdown files in pull requests.** Goes beyond basic grammar to check readability, structure, clarity, inclusivity, and L1-aware patterns.

Part of the [BeLikeNative](https://belikenative.com) ecosystem -- AI-powered writing tools for non-native English speakers.

---

## What It Does

Every pull request that changes markdown, MDX, or text files gets analyzed across **5 quality dimensions**:

### 1. Readability (30% weight)

- **Flesch-Kincaid Grade Level** -- target: grade 8-10 for technical docs
- **Flesch Reading Ease** -- higher is better (60-70 = standard, 70+ = easy)
- **Sentence length** -- flags sentences over 25 words
- **Paragraph length** -- flags paragraphs over 150 words
- Syllable-based complexity analysis

### 2. Structure (20% weight)

- **Heading hierarchy** -- catches h1 to h3 skips (missing h2)
- **Code blocks** -- flags missing language tags for syntax highlighting
- **Image accessibility** -- detects images without alt text
- **Internal links** -- catches potentially broken relative links
- **Document length** -- suggests headings for long documents

### 3. Clarity (25% weight)

- **Passive voice** -- detects 50+ be-verb + past-participle patterns
- **Filler words** -- "basically", "actually", "really", "very", "just", "quite", etc.
- **Hedge words** -- "might", "perhaps", "possibly", "maybe", "could potentially"
- **Jargon** -- 20 patterns with simpler alternatives ("utilize" -> "use", "leverage" -> "use")
- **Wordy phrases** -- 24 patterns ("in order to" -> "to", "due to the fact that" -> "because")

### 4. Inclusivity (15% weight)

- **Gender-neutral language** -- 18 patterns ("he/she" -> "they", "mankind" -> "humankind", "chairman" -> "chairperson")
- **Ableist language** -- 16 patterns ("crazy" -> "unexpected", "blind spot" -> "oversight", "sanity check" -> "confidence check")

### 5. L1 Awareness (10% weight)

BeLikeNative's unique differentiator. Identifies common patterns from non-native English speakers, with attribution to which language groups typically make each error:

- **Missing articles** -- "I went to store" -> "I went to the store" (CJK, Slavic, Arabic)
- **Double subjects** -- "The system it processes" -> "The system processes" (CJK, French)
- **Preposition errors** -- "arrive to" -> "arrive at", "discuss about" -> "discuss" (Romance, Hindi)
- **Pluralization** -- "informations" -> "information", "equipments" -> "equipment" (French, German)
- **Calques** -- "I am agree" -> "I agree" (French), "open the light" -> "turn on the light" (French, Arabic, Chinese)
- 23 patterns total with L1 group attribution

---

## Usage

Add to your workflow file (`.github/workflows/writing-quality.yml`):

```yaml
name: Writing Quality Check

on:
  pull_request:
    paths:
      - '**/*.md'
      - '**/*.mdx'
      - '**/*.txt'
      - 'docs/**'

permissions:
  contents: read
  pull-requests: write

jobs:
  writing-quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: BeLikeNative Writing Assistant
        uses: theluckystrike/bln-writing-assistant@v1
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          min-score: 70
          severity-threshold: warning
          file-patterns: '**/*.md,**/*.mdx,**/*.txt'
```

## Inputs

| Input | Description | Default |
|-------|-------------|---------|
| `github-token` | GitHub token for posting review comments | `${{ github.token }}` |
| `severity-threshold` | Minimum severity to report: `info`, `warning`, or `error` | `warning` |
| `file-patterns` | Comma-separated glob patterns for files to analyze | `**/*.md,**/*.mdx,**/*.txt` |
| `min-score` | Minimum overall writing quality score (0-100) to pass | `70` |

## Outputs

| Output | Description |
|--------|-------------|
| `overall-score` | The overall writing quality score (0-100) |
| `readability-score` | Readability sub-score (0-100) |
| `structure-score` | Structure sub-score (0-100) |
| `clarity-score` | Clarity sub-score (0-100) |
| `inclusivity-score` | Inclusivity sub-score (0-100) |
| `l1-awareness-score` | L1 awareness sub-score (0-100) |

## Example Output

The action posts a comment on your PR with a score card like this:

```
## Writing Quality Score Card

**Overall: 82/100 -- B (Good)**

| Category     | Score   | Weight | Status |
|--------------|---------|--------|--------|
| Readability  | 85/100  | 30%    | PASS   |
| Structure    | 92/100  | 20%    | PASS   |
| Clarity      | 74/100  | 25%    | WARN   |
| Inclusivity  | 80/100  | 15%    | PASS   |
| L1 Awareness | 88/100  | 10%    | PASS   |
```

Followed by expandable details for each category with specific line-level suggestions.

## Scoring

- **90-100 (A)** -- Excellent writing quality
- **80-89 (B)** -- Good, minor improvements possible
- **70-79 (C)** -- Acceptable, some issues to address
- **60-69 (D)** -- Needs work before merging
- **0-59 (F)** -- Significant quality issues

The check **fails** if the worst file score falls below `min-score` (default: 70).

## Architecture

Built with NASA Power of 10 coding rules:

- All functions under 60 lines
- 2+ assertions per function
- Bounded loops (no unbounded iteration)
- No global mutable state
- const/let only (no var)
- Every return value checked

## BeLikeNative Ecosystem

This action is part of the BeLikeNative suite of writing tools:

- **[BeLikeNative](https://belikenative.com)** -- AI-powered writing assistant for non-native English speakers
- **[Chrome Extension](https://chromewebstore.google.com/detail/belikenative)** -- Real-time writing assistance in your browser
- **Writing Assistant** (this action) -- Automated PR quality checks
- **Commit Message Reviewer** -- Convention and grammar checks for git commits

## License

MIT
