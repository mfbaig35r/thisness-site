---
title: Domains
description: Organizations, people and taxa. A domain is a resolution profile.
---

A **resolution profile** describes one entity type: its attributes and their sensitivity, normalizers, blocking keys, comparisons, constraints, weight caps, relationship signals, and the guidance a language model is given. Three profiles ship, each with a starter model for stores too small to fit their own.

```python
from thisness import Thisness
from thisness.profiles.organization import organization
from thisness.profiles.person import person
from thisness.profiles.taxon import taxon

engine = Thisness("identity.duckdb", profiles=[organization(), person(), taxon()])
```

## Organizations

Attributes: `name`, `registration_ids`, `domain`, `website`, `email`, `country`, `city`, `postal_code`, `address_line`.

Names are compared after removing legal forms and normalizing case, punctuation and common abbreviations. The name comparison distinguishes:

| Level | Example | Effect |
|---|---|---|
| `exact_key` | "Haleon UK Finance Limited" and "HALEON UK FINANCE LTD" | strong support |
| `number_differs` | "Omega Holdings II" and "Omega Holdings III" | evidence against |
| `token_typo` | "Zalbalt Consulting" and "Zalblt Consulting" | support |
| `token_subset` | "Castle Hearing" and "Castle Hearing Group" | 0 bits; a relationship signal |
| `qualifier_differs` | "Bridgepoint Advisers UK" and "Bridgepoint Advisers Europe" | 0 bits; a relationship signal |
| `acronym` | "IBM" and "International Business Machines" | support |

Common values are adjusted for how common they are: a frequent name says less than a rare one, and a postcode shared by hundreds of companies (a formation agent's address) says almost nothing. The postcode adjustment only discounts, since a rare shared postcode is already worth its full weight.

A model **decides** contested organization pairs when one is configured (`model_role="decide"`).

## People

Attributes: `name`, `given_name`, `family_name`, `email`, `phone`, `date_of_birth`, `employer`, `address_line`, `city`, `country`, `postal_code`, `identifiers`.

Nicknames ("Bob" for Robert), initials and spelling variants of one name are the same person when nothing contradicts it. Different dates of birth, or different identifiers in one scheme, mean different people. A household (one family name, one address, often one phone) is a relationship signal, not a match: a parent and child can share a full name.

Dates of birth are never sent to an external model, and contact details go out hashed. A model only **suggests** answers to people reviews (`model_role="suggest"`): measured on people, a model was both too cautious and too credulous to decide pairs on its own.

## Taxa

Scientific plant names, parsed into genus, epithets, rank and authorship ("*Quercus robur* L.", "Q. robur subsp. pedunculiflora (K.Koch) Menitsky").

An authority's rows (World Flora Online, the Catalogue of Life) can be loaded as observations. Their accepted name decides which taxon a synonym belongs to, and the label of every entity says which authority supplied it. Homonyms (one binomial, two authors) are capped as evidence against.

```bash
thisness --store taxa.duckdb demo --type taxon --reference   # WFO's rows too
thisness --store taxa.duckdb demo --type taxon --col         # and the Catalogue of Life's
```

The fixture for three plant families ships with the package. Other families are fetched from ChecklistBank on demand and cached under `~/.cache/thisness/wfo`.

## Writing a profile

A profile is a `ResolutionProfile` from `thisness.profiles.base`. The three shipped profiles are the reference: start from the one closest to your entity type, and see [design 03](/docs/design/resolution-pipeline) for how candidates, comparisons and the edge policy fit together.
