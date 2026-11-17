# SysDes — System Design, Deeply

**Live site:** https://sysdes.jayantkapoor.com

A bilingual (**English + Hinglish**) system design learning resource, organised chapter-by-chapter around
Alex Xu's *System Design Interview – An Insider's Guide* and extended with deeper explanations, original
diagrams, Java code, interactive widgets, interviewer follow-ups and practice problems.

> This is an independent study companion. All text, diagrams, code and examples are original — nothing is
> copied from the book. If it helps you, please buy the book to support the author.

## Contents

| Part | Chapters |
|---|---|
| Foundations | 01 Scale from zero to millions · 02 Back-of-the-envelope estimation · 03 Interview framework |
| Building blocks | 04 Rate limiter · 05 Consistent hashing · 06 Key-value store · 07 Unique ID generator |
| Case studies | 08 URL shortener · 09 Web crawler · 10 Notifications · 11 News feed · 12 Chat · 13 Autocomplete · 14 YouTube · 15 Google Drive |
| Revise & beyond | 16 Cheat sheet · 17 Glossary · 18 The learning continues |

Interactive widgets (in `docs/assets/javascripts/widgets.js`): estimation calculator, availability/nines,
token-bucket simulator, consistent-hashing ring, Snowflake ID builder/decoder, base-62 encoder, trie autocomplete.

## Run locally

```bash
pip install -r requirements.txt
mkdocs serve            # http://127.0.0.1:8000  (Hinglish at /hi/)
```

## How it's built & deployed

- [MkDocs Material](https://squidfunk.github.io/mkdocs-material/) + [mkdocs-static-i18n](https://github.com/ultrabug/mkdocs-static-i18n).
- Each page has two files: `page.en.md` (English) and `page.hi.md` (Hinglish).
- Diagrams use Mermaid (rendered in the browser) plus a few hand-written SVGs.
- Every push to `main` runs `.github/workflows/deploy.yml`, which builds with `--strict` and publishes to the
  `gh-pages` branch. `docs/CNAME` sets the custom domain.

### DNS for the custom domain

Add a `CNAME` record `sysdes` → `jaykap-git.github.io` (DNS only, not proxied), then tick
**Settings → Pages → Enforce HTTPS** once the certificate is issued.
