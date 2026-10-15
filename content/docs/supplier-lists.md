---
title: Supplier lists
description: Vendor masters, accounts-payable extracts and spend cubes: names and little else, written the way real systems write them.
---

A supplier list is mostly names, and the names carry what the systems around them added: a card processor's prefix, a store number, a note that the vendor is inactive. Thisness cleans those off before it compares names, keeps what they say about the record, and gives you back a table of every record and the entity it belongs to.

```bash
thisness ingest vendors.csv --resolve
thisness export mapping > mapping.csv
```

## What is cleaned

The organization profile removes, before names are compared:

| What | Examples |
|---|---|
| Payment-processor prefixes | `SQ *JOES CAFE`, `PAYPAL *ACME`, `TST* BLUE DOOR` |
| Reference numbers | "Acme - 812773", "ACME CORP #4411", "Acme (Vendor 10233)", "Amazon, Inc. 4411" |
| Store and location suffixes | "WALGREENS STORE 1022", "SHELL OIL 57442 BLDG 3" |
| ERP notes | "ZZ Acme Corp", "Acme Inc (OLD)", "ACME CORP - DO NOT USE", "DUPLICATE OF 94858" |

The raw name is never changed: cleaning only shapes what is compared. Numbers that are part of a name stay: "3M", "7-Eleven", "Studio 54", "Omega Holdings II", "Landmark Mortgage Securities No. 3", "Intercede 2296 Ltd". A trailing number is removed only after a separator or a reference word, after a legal form, or when it has five or more digits.

**A note is the record's status.** "DO NOT USE", "INACTIVE", "(OLD)", "DUPLICATE OF" and "USE VENDOR" become `do_not_use`, `inactive`, `old`, `duplicate` and `use_other`, shown in the mapping export. They describe the vendor record, not the vendor, so they are never compared.

**A trade name is weak evidence.** "Acme Holdings LLC dba Acme Tools" has the trade name "Acme Tools". It proposes candidates, but a match on it is capped at 0 bits and read as a relationship signal: a trade name is often a group's brand, shared by sister companies.

**A card descriptor cut short is not a name.** Card statements cut descriptors at 22 characters, so "SQ *HOWDEN JOINERY PEO" may be any of several companies. A descriptor of exactly that length is never an exact match and is never collapsed with other names before a model sees it.

## How much it helps

On names-only benchmarks with junk added to a third of the records (`thisness eval --names-only --messy`), the cleaning rules took the name-only plan's recall from .865 to .964 on synthetic suppliers and from .803 to .93 on real UK companies. The measurements, and what the rules must not do, are in [design 08](/docs/design/supplier-lists).

## The mapping

```bash
thisness export mapping                          # CSV to standard output
thisness export mapping --format parquet --output mapping.parquet
thisness export mapping --as-of 4454             # as the ledger stood at seq 4454
```

| Column | |
|---|---|
| `source_type`, `source_id`, `locator` | the record as it was ingested |
| `name` | the record's name as written |
| `observation_id` | |
| `entity_id`, `entity_name` | its entity, and the entity's display name |
| `status` | `resolved`, `in_review`, `provisional` or `unresolved` |
| `record_status` | the note cleaning found, if any |
| `since_seq`, `decision_id` | when the record joined its entity, and the decision behind it |

`in_review` means the record or its entity is part of an open review, so its entity may still change. `--as-of` reproduces a past report exactly, after later merges and splits. In Python, `engine.mapping("organization", as_of_seq=None)` returns the same table as pyarrow, and the Workbench's entity lists have a **Mapping** download.

## Readable names

An entity's name is the most readable spelling of its most supported name: one with nothing cleaned off, then one in mixed case, then the most frequent. When every record writes the name in capitals, a model can suggest a readable one:

```bash
thisness labels suggest --provider openai --model gpt-6-luna --limit 300
thisness labels list
thisness labels accept --all        # or: thisness labels accept SUGGESTION_ID ...
thisness labels clear ENTITY_ID
```

A suggestion must be a spelling of the entity's own names, by the same key: casing, spacing and the legal form's spelling may change, words may not. It changes nothing until it is accepted. Accepting is a commit, shown in the entity's history and undone by `clear`; a later merge keeps the name, and an entity split off starts without one. In the Workbench, an entity with a suggestion shows it with **Use this name**.

On 548 real UK entities, gpt-6-luna named 300 in 15 calls for $0.0055, keeping acronyms ("DAE Aviation Holdings UK Limited", "GS Capital Partners UK LLP"); accepting every suggestion took the share of names written in capitals from 58% to 3%.
