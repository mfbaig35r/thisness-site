---
title: Introduction
description: Thisness decides which records refer to the same thing, and keeps the evidence, the decision and the history behind every conclusion.
---

For centuries, Hesperus (the evening star) and Phosphorus (the morning star) were two things. Then observation showed they were the same planet: two observations, from different times and contexts, of one underlying thing, and the identity established by evidence rather than by definition.

Thisness does that for data. It takes observations from many sources ("IBM", "IBM Corp.", "International Business Machines Corporation", an invoice line, a contract party) and decides what they refer to. Every conclusion keeps the evidence it rests on, the decision that made it, and its place in a history that can be replayed, explained, reviewed or reversed.

```bash
pip install 'thisness[ui]'
thisness --store demo.duckdb demo && thisness ui demo.duckdb
```

## What it does

- **Resolves records into stable entities.** Candidates come from blocking keys, pairs are compared attribute by attribute, Fellegi-Sunter weights fitted by EM score them, and a consensus step commits only what the evidence supports.
- **Opens a review for the rest.** Contested clusters go to a queue, ranked by impact, where a person (or a language model, as a suggestion) decides whether records are the same, different, or related.
- **Keeps everything.** Observations, evidence, decisions and ledger events are stored separately in DuckDB. Merges and splits are reversible events, and the ledger alone can rebuild current state.
- **Shows its work.** The [Workbench](/docs/workbench) is a local web app over the same API: entities with the evidence for every value, the review queue, possible relationships, and what a model was given and what it answered.

## Three domains ship

| Domain | What varies | What it keeps apart |
|---|---|---|
| Organizations | legal forms, abbreviations, acronyms, typos, shared addresses | a group's sibling companies, numbered vehicles, brands |
| People | nicknames, initials, spelling, partial addresses | a household; a parent and child with one name |
| Taxa | authorship, abbreviated genera, synonyms | homonyms; names two authorities place differently |

A domain is a resolution profile. See [Domains](/docs/domains).

## Measured on real data

On real UK companies from GLEIF and Companies House, with identifiers hidden, Thisness resolves 3,507 records at precision .9992 and recall .912, with one false-merge cluster. A cheap model deciding contested pairs lifts recall to .938 for $0.62. At 46,565 records: precision .9965, recall .934. See [Evaluation](/docs/evaluation).

## Where to go next

- [Quickstart](/docs/quickstart): ingest a CSV, resolve it, open the Workbench.
- [Core concepts](/docs/concepts): observations, evidence, decisions, commits, reviews.
- [Explorer](/explorer): real entities and reviews from the UK benchmark, in the browser.
- [Design documents](/docs/design/vision): why each part works the way it does.
