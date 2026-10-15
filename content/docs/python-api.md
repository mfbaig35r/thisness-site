---
title: Python API
description: The Thisness engine's main methods.
---

```python
from thisness import Thisness
from thisness.profiles.organization import organization

engine = Thisness("identity.duckdb", profiles=[organization()])
```

`Thisness(store=":memory:", *, profiles=(), ...)` opens or creates a DuckDB store. The API is alpha and will change.

## Ingest and resolve

| Method | |
|---|---|
| `observe(entity_type, attributes, source)` | Build an observation. `source` is a dict with `type`, `id` and an optional `locator`. |
| `ingest(observations)` | Store observations and their features. Returns their ids. |
| `resolve_many(entity_type, observations=None, *, commit=True, adjudicator=None)` | Resolve every unresolved observation of a type (or the ones given). Fits a model on first use. Returns a `RunResult` with `stats`. |
| `resolve(entity_type, attributes, source)` | Observe, ingest and resolve one record against the store. Returns an outcome: `ATTACH_TO_EXISTING`, `CREATE_ENTITY` or `REQUIRES_REVIEW`, with the entity and decision. |
| `fit(entity_type)` | Train the Fellegi-Sunter model on every observation of the type and make it active. |

## Read

| Method | |
|---|---|
| `entities(entity_type, *, state=None, query=None, offset=0, limit=50)` | A page of live entities, largest first. |
| `dossier(entity_id)` | Everything believed about one entity, with the support for each value. `.to_context(chars)` renders it for a model. |
| `members(entity_id)`, `entity_of(observation_id)` | Memberships, optionally `as_of_seq`. |
| `explain(decision_id)` | A decision with the evidence and pair judgments it rests on. |
| `history(entity_id=..., observation_id=...)` | Ledger events. |
| `search(q)` | Entities by name, or any record by its id. |
| `overview()` | Counts for the store. |
| `mapping(entity_type, as_of_seq=None)` | Every record, its entity, the entity's name and a status, as a pyarrow table. |

## Review

| Method | |
|---|---|
| `reviews(kind=None)` | Open reviews, most impactful first. |
| `review_case(review_id)` | A review's records, current entities and comparisons. |
| `resolve_review(review_id, resolution, *, groups=None, relation=None, reason)` | Answer it: `same`, `different`, `related` (with `relation`) or `groups` (a partition of its records). |
| `recommend(review_id, *, assistant)`, `recommend_open(limit=50, assistant=...)` | Ask the review assistant. |
| `relationship_candidates(entity_id=None)` | Entity pairs with relationship signals, not yet related. |

## Change identity

Every change takes a `reason` and is a reversible ledger commit.

| Method | |
|---|---|
| `merge_entities(survivor, others, *, reason)` | Retire `others` into `survivor`. |
| `split_entity(entity_id, observations, *, reason)` | Move observations out into a new entity. |
| `relate(subject, relation, object_, *, reason)` | Record a relationship between two entities. |
| `promote(entity_id, *, reason)` | Make a provisional entity active. |
| `revoke_constraint(constraint_id, *, reason)` | Lift a must-link or cannot-link. |
| `label(entity_id, name, *, reason)`, `clear_label(entity_id, *, reason)` | Set or remove an entity's display name. |

## Display names

| Method | |
|---|---|
| `suggest_labels(entity_type, *, assistant, limit=100)` | Ask a model (`thisness.display_names.LabelAssistant`) for readable names for entities written in capitals. Records suggestions only. |
| `label_suggestions(entity_ids)` | The latest suggestion for each entity. |
| `accept_label_suggestion(suggestion_id)` | Label the entity, or its survivor if it has since been merged. |
| `display_labels(entity_ids)` | Accepted names. |
