---
title: Command line
description: Every thisness command, with the options that matter.
---

```text
thisness [--store STORE] COMMAND ...
```

`--store` names the DuckDB file and comes before the command. It defaults to `$THISNESS_STORE`, then `identity.duckdb`.

## Build a store

| Command | What it does |
|---|---|
| `thisness ingest FILE [--type T] [--source-type S] [--resolve]` | Store each CSV row as an observation of type `T` (default `organization`), with the file and row as its source. `--resolve` resolves them after. |
| `thisness resolve [--type T]` | Resolve every unresolved observation. Fits a model on first use. |
| `thisness demo [--type T] [--size N] [--seed S] [--reference] [--col]` | Build a store from synthetic organizations or people, or real plant names. `--reference` (taxa) adds World Flora Online's own rows; `--col` adds the Catalogue of Life's. |

## Look at it

| Command | What it does |
|---|---|
| `thisness ui [PATH] [--port P] [--no-browser]` | Open the [Workbench](/docs/workbench) on a store. |
| `thisness reviews` | Open reviews, most impactful first. |
| `thisness dossier ID [--chars N]` | An entity's dossier as language-model context, within N characters. |
| `thisness history ID` | Ledger events for an entity or an observation. |
| `thisness check` | Run the invariant suite. Exits 1 on any violation. |

## Use a model

`resolve`, `recommend` and `ui` take the same model options. See [Language models](/docs/language-models).

| Option | Meaning |
|---|---|
| `--provider none\|anthropic\|openai` | Which provider. `openai` covers any OpenAI-compatible server. |
| `--model M` | The model. Default `claude-sonnet-5`. |
| `--budget USD` | Stop spending at this many US dollars. There is no default limit. |
| `--base-url URL` | For `--provider openai`; default `https://api.openai.com/v1`. |
| `--local` | The OpenAI-compatible server is yours, so attributes marked local-only may be sent. |
| `--record FILE` | Append every exchange to a cassette. |
| `--replay FILE` | Answer from a cassette instead of calling the model: free and offline. |
| `--concurrency N` | Model requests in flight. |
| `--model-role auto\|decide\|shadow\|suggest\|off` | `resolve` only: what the model does. `auto` follows each profile. |

```bash
thisness resolve --provider openai --model gpt-6-luna --budget 2
thisness recommend --provider anthropic --limit 50 --kind boundary
```

## Measure it

```bash
thisness eval [--type T] [--size N ...] [--seeds S ...] [--source synthetic|uk] [--json]
```

See [Evaluation](/docs/evaluation) for the benchmarks and the adjudicator options.
