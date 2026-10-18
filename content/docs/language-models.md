---
title: Language models
description: An optional layer. A model decides contested pairs, or suggests answers to reviews, and every answer is recorded.
---

The engine never needs a model. Where one helps, it is given the contested pairs or the open reviews, with the evidence for each, and its answers are recorded like any other decision: which model, the exact request, the response, tokens and cost.

```bash
pip install 'thisness[ui,openai]'
export OPENAI_API_KEY=...
```

The default model is gpt-6-luna, the model behind every measurement on this site; `--model` picks another. An Anthropic provider is included (`[ui,anthropic]`, `--provider anthropic`, `ANTHROPIC_API_KEY`) but has not been measured.

## Two roles

**The adjudicator** answers contested pairs during resolution: `same`, `different`, `related` or `unsure`. In `decide` mode a "same" becomes a strong edge and a "different" a negative one. A model's "same" yields to its own "different" in the same component and to a person's cannot-link, so one wrong answer cannot pull two entities together over the model's other answers. In `shadow` mode answers are recorded but change nothing, so a model can be measured before it is trusted.

**The review assistant** suggests an answer to an open review: `same`, `different`, `related`, a regrouping, or `unsure`, with a rationale that cites the board's labels. A person accepts or overrides it.

Each profile states which role a model plays (`model_role`): organizations and taxa `decide`, people `suggest`. `--model-role` overrides it for a run.

```bash
thisness resolve --provider openai --budget 2
thisness recommend --limit 50
thisness ui --provider openai      # Ask the model, from the Workbench
```

## What a model is sent

The prompts are domain-neutral, with each profile's guidance appended. The review assistant sees records and comparisons under short labels (R1, C1), the same ones the Workbench shows. Attributes a profile marks `local_only` (a person's date of birth, an address line) are withheld from external providers; contact details go out hashed. With `--local`, the OpenAI-compatible server is yours and they may be sent.

## Cost and control

- `--budget` stops spending at a limit. There is no default limit, so set one.
- `--record cassette.jsonl` keeps every exchange; `--replay cassette.jsonl` answers from it, free and offline, which is how evaluations are re-run.
- Transient errors are retried three times with backoff; a permanent error is not.
- `--concurrency` sets requests in flight.

## Measured

On real UK companies (400 sampled, 3,507 records, identifiers hidden):

| | Precision | Recall | False-merge clusters | Cost |
|---|---|---|---|---|
| No model | .9992 | .912 | 1 | |
| gpt-6-luna deciding contested pairs | .9965 | .938 | 5 | $0.62 |
| A perfect oracle deciding | 1.000 | .948 | 0 | |

As a review assistant on the same benchmark's 177 open reviews ($0.11), 93% of its decided suggestions would have been right if accepted, and accepting all of them would have merged different companies in none. Judging a whole review, a model is far more careful than judging one pair. The numbers and their caveats are in [design 07](/docs/design/real-organizations).

On 1,000 real company insiders the difference decides the role. Deciding pairs, gpt-6-luna called namesakes the same person whenever nothing contradicted it, and false-merge clusters went from 2 to 18 ($0.55). As the review assistant ($0.25), 86% of its decided suggestions would have been right, "same" 96%. People stay at `suggest` ([design 09](/docs/design/real-people)).
