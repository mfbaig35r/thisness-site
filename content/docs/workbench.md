---
title: The Workbench
description: A local web app over the same API, for reading entities and answering reviews.
---

```bash
pip install 'thisness[ui]'
thisness ui identity.duckdb
```

The Workbench runs on your machine against a store file. Nothing leaves it unless you configure a model provider. Its layout follows Twenty's record table, show page and side panel, and its colors and type are Twenty's design tokens. The [explorer](/explorer) on this site is a read-only copy over real exported data.

## Entities

Each entity type has a list, largest first, with open-review counts and search. An entity's page shows:

- **Values.** Every attribute's values, how many observations support each, and from which sources. The value shown is the best supported, so "Zalbalt Consulting LLC 24/29" reads as twenty-four of twenty-nine observations.
- **Observations.** The member records with their sources. Click one for its own history.
- **Relationships.** Recorded relationships and possible ones, with the signals behind them.
- **History.** The ledger for this entity, one item per commit: created, observations joined, merged, split, related. Click a commit for the decisions it cites.
- **Context.** Exactly the text a language model would be given about this entity, within a budget, with local-only attributes withheld.

## The review queue

Reviews are ranked by impact. A review is a board: one column per current entity, one card per record (R1, R2, ...). Drag cards between columns to regroup, then answer:

- **All the same entity**, **Different entities**, **Related** (with a relation), or **Save grouping**.
- Every answer needs a reason and is stored with it. A wrong answer is undone like any other commit.

Below the board, the comparisons (C1, C2, ...) are listed strongest first, each with its levels and weight. **Why this was raised** shows the decision that opened the review.

If a model is configured, **Ask the model** requests a suggestion from the review assistant. It appears above the board with a rationale that cites the board's own labels ("R1 and R3 share a postcode, C2"), and the comparisons it relied on are marked. **Apply to the board** moves the cards to its grouping for you to confirm. Whether reviewers' answers matched the suggestions they were shown is recorded (`engine.assistant_agreement()`).

## Possible relationships

Entity pairs linked by relationship signals (a shared brand, a group's sibling companies, a household) and not yet related. They are grouped into neighborhoods of at most thirty entities, largest first, fifty to a page. Open a pair to relate the two entities, or to merge them if they are the same.

## Model calls

Every model invocation: what was sent, what came back, tokens, cost and latency, with totals per run. With `--record`, the same exchanges are in a cassette you can replay.
