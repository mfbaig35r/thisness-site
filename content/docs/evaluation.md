---
title: Evaluation
description: Benchmarks with known truth, and what the numbers mean.
---

`thisness eval` builds a benchmark with known truth, resolves it in a fresh store, and reports:

- **Precision and recall** over pairs of records (B3), and their F1.
- **False-merge clusters**: entities holding records of more than one true thing, with how many records are contaminated and the largest.
- **Reviews** opened and records held in review.
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

## With a model

```bash
thisness eval --source uk --adjudicator openai --model gpt-6-luna --mode decide --budget 2 \
  --record luna.jsonl --save luna.duckdb
thisness eval --source uk --adjudicator openai --model gpt-6-luna --mode decide --replay luna.jsonl
thisness ui luna.duckdb                                                # see what it did
```

`--adjudicator oracle` answers from the truth, which bounds what any model could add. `--oracle-error` makes the oracle wrong at a given rate. The report adds the model's accuracy against the truth: wrongly apart, wrongly different, wrongly same, and the confusion between answers.

## Known limits

- **Memory grows with candidate pairs.** 46,565 records took 7.5 minutes of CPU and 7.8 GB peak memory.
- **No embedding candidates yet.** Records that share no blocking key are never compared directly.
- **The truth is incomplete for relationships.** GLEIF records parents only between companies with LEIs, so a model's "related" for two group siblings can be right and still count against it.
