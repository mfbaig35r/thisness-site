---
title: Evaluation
description: Benchmarks with known truth, and what the numbers mean.
---

`thisness eval` builds a benchmark with known truth, resolves it in a fresh store, and reports:

- **Precision and recall** over pairs of records (B3), and their F1.
- **False-merge clusters**: entities holding records of more than one true thing, with how many records are contaminated and the largest.
- **Reviews** opened, per 1,000 records, and records held in review.
- **Candidate recall**: how many true pairs blocking proposed at all, the ceiling on recall.

```bash
thisness eval --size 805 4000                  # synthetic organizations
thisness eval --type person --size 1000        # synthetic people
thisness eval --type taxon --reference         # WFO plant names, with WFO's rows
```

## Real UK companies

```bash
python -m thisness.benchmark uk-stage          # GLEIF and Companies House, about 1 GB, once
thisness eval --source uk --size 400           # identifiers hidden
thisness eval --source uk --size 400 --identifiers partial
```

The benchmark samples companies with an LEI joined to Companies House, adds every live near-namesake and parent, and writes up to three supplier-file records for each (ERP, accounts payable, CRM): the current, a previous or a shortened name, abbreviated legal forms, a typo, a full or partial address. Truth is the company number. The hard cases are real: 62% of live UK companies share a registered address, and a record that says only "Sports Direct" sits beside four real Sports Direct companies.

| | Records | Precision | Recall | False-merge clusters |
|---|---|---|---|---|
| 400 sampled, identifiers hidden | 3,507 | .9992 | .912 | 1 |
| 6,400 sampled | 46,565 | .9965 | .934 | 63 |
| Synthetic organizations, 4,000 | | .9995 | .938 | 4 |

## Real people

```bash
python -m thisness.benchmark edgar-stage --store persons.duckdb   # from an edgar-persons-pool store
thisness eval --type person --source edgar --size 1000
```

SEC Section 16 insiders (directors, officers, holders of more than 10%) and their real namesakes, each with their EDGAR records, written family first, and up to three records from other systems (a CRM, a board list, a screening list) with nicknames, initials, dropped suffixes, typos, former names and employers written their own way. Truth is the CIK, audited: one insider name in sixteen is shared, and a father and son often sit on one board. A fixture of about 150 insiders is kept with the tests in the source repository, not in the installed package.

| | Records | Precision | Recall | False-merge clusters |
|---|---|---|---|---|
| 1,000 people | 2,893 | 1.0000 | .521 | 0 |
| 10,000 people | 28,692 | .9985 | .715 | 29 |
| 10,000, every contested pair answered correctly | 28,692 | .9992 | .948 | 15 |

Most of the gap between the last two rows is reviews: the records of real people carry little besides a name, an employer and a city.

## With a model

```bash
thisness eval --source uk --adjudicator openai --model gpt-6-luna --mode decide --budget 2 \
  --record luna.jsonl --save luna.duckdb
thisness eval --source uk --adjudicator openai --model gpt-6-luna --mode decide --replay luna.jsonl
thisness ui luna.duckdb                                                # see what it did
```

`--assistant openai` (or `anthropic`, or `oracle`) has the review assistant answer every review a run leaves open and scores its suggestions as if accepted: right, would merge different entities, would leave a match apart. Add `--accept` to accept the kinds each profile accepts in bulk and report precision, recall, false merges and the reviews left.

`--answer N` is design 10's calibration experiment: the oracle answers the N most impactful reviews, their labels set new thresholds, and the other reviews are triaged again. It reports leverage, reviews closed per review answered; it was 0 and 0.1 on the UK and EDGAR benchmarks, so answers stay labels and change no thresholds ([design 10](/docs/design/scale-review-loop) §10.5).

`--adjudicator oracle` answers from the truth, which bounds what any model could add. `--oracle-error` makes the oracle wrong at a given rate. The report adds the model's accuracy against the truth: wrongly apart, wrongly different, wrongly same, and the confusion between answers.

## Supplier extracts

```bash
thisness eval --names-only --messy                        # junk on a third of the names
thisness eval --names-only --plan rewrite --rewrite-order sorted   # a rewrite-and-hash baseline
```

`--messy` adds what real extracts carry to a share of names: card descriptors (half cut at 22 characters), ERP notes, store suffixes, reference numbers and trade names. `--plan rewrite` runs the method many supplier-consolidation pipelines use, a model rewriting names in chunks and equal rewrites meaning one supplier, so it can be measured against the name-only plan: precision is the same, and it needs its passes ordered by name to match the plan's recall ([design 05](/docs/design/llm-layer) §11.5; [design 08](/docs/design/supplier-lists)).

## Known limits

- **Memory grows with candidate pairs.** A run keeps Python state for every candidate pair, about 1.9 KB each. With a file-backed store, 86,136 organization records (2 million pairs) resolve in 200 s at a 3.77 GB peak, and 217,337 (5.5 million pairs), the largest run so far, in 9 minutes at 10.7 GB ([design 10](/docs/design/scale-review-loop) §10.3); 28,692 people records, 67 seconds and 2.5 GB.
- **No embedding candidates yet.** Records that share no blocking key are never compared directly.
- **The truth is incomplete for relationships.** GLEIF records parents only between companies with LEIs, so a model's "related" for two group siblings can be right and still count against it.
