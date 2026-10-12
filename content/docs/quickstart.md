---
title: Quickstart
description: Install Thisness, resolve a file of records, and open the Workbench.
---

## Install

Thisness needs Python 3.12 or later.

```bash
pip install 'thisness[ui]'
```

The `ui` extra adds the Workbench. Add `openai` or `anthropic` for the [language-model layer](/docs/language-models): `pip install 'thisness[ui,openai]'`.

## Try it on synthetic data

```bash
thisness --store demo.duckdb demo
thisness ui demo.duckdb
```

`demo` generates a few hundred organizations with realistic noise (typos, abbreviations, missing fields), resolves them, and opens reviews for what it could not settle. The Workbench opens in your browser. Try people or real plant names too:

```bash
thisness --store people.duckdb demo --type person
thisness --store taxa.duckdb demo --type taxon --reference
```

`--store` goes before the command. It names the DuckDB file, and defaults to `$THISNESS_STORE` or `identity.duckdb`.

## Resolve your own records

A CSV with columns such as `name`, `website`, `email`, `registration_ids`, `country`, `city` and `postal_code`:

```bash
thisness ingest vendors.csv --resolve
thisness ui
```

`ingest` stores each row as an observation with its source (the file and row), and `--resolve` resolves them. Run `thisness reviews` to list what needs a decision, or answer it in the Workbench.

## From Python

```python
import csv
from thisness import Thisness
from thisness.profiles.organization import organization

engine = Thisness("identity.duckdb", profiles=[organization()])

with open("vendors.csv", newline="") as f:
    engine.ingest(
        [
            engine.observe(
                "organization", row, {"type": "csv", "id": "vendors.csv", "locator": {"row": i}}
            )
            for i, row in enumerate(csv.DictReader(f))
        ]
    )

result = engine.resolve_many("organization")  # fits a model on first use, then resolves
print(result.stats)  # pairs scored, clusters, reviews opened

# Later records resolve against what already exists.
outcome = engine.resolve(
    "organization",
    {"name": "IBM Corp.", "website": "https://www.ibm.com"},
    {"type": "crm", "id": "account-17"},
)
print(outcome.outcome, outcome.entity_id)  # ATTACH_TO_EXISTING / CREATE_ENTITY / REQUIRES_REVIEW
engine.explain(outcome.decision_id)  # the decision, its evidence, the pairs behind it
```

A store needs a few hundred records of a type to fit its own model. Below that, Thisness uses a shipped starter model, and replaces it with a fitted one on the first run with enough data.

## Check the store

```bash
thisness check
```

runs the invariant suite over the store: memberships, entities, relationships and reviews rebuilt from the ledger alone must equal the stored tables; an observation has at most one open membership; every membership, relationship and review cites a recorded decision; no live entity holds both sides of a cannot-link.
