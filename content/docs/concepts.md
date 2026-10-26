---
title: Core concepts
description: Observations, evidence, decisions, commits and reviews, and why each is its own record.
---

Thisness separates the steps that most matching tools fold into one score. Each step leaves its own record, so a conclusion can always be traced back to what supports it.

<div class="flow" aria-label="The resolution pipeline">
<div class="flow-row">
<span class="flow-step"><b>Observation</b><small>a source record</small></span><i></i>
<span class="flow-step"><b>Candidates</b><small>blocking keys</small></span><i></i>
<span class="flow-step"><b>Evidence</b><small>levels per attribute</small></span><i></i>
<span class="flow-step"><b>Pair decisions</b><small>weights in bits</small></span><i></i>
</div>
<div class="flow-split">
<span class="flow-step"><b>Consensus</b><small>what holds together</small></span><i class="stem"></i>
<div class="flow-fork">
<span class="flow-branch"><i></i><span class="flow-step strong"><b>Commit</b><small>ledger events</small></span><i></i><span class="flow-step strong"><b>Entity</b><small>a stable id</small></span></span>
<span class="flow-branch"><i></i><span class="flow-step review"><b>Review</b><small>contested</small></span><i></i><span class="flow-step review"><b>Answer</b><small>with a reason</small></span><i></i><span class="flow-step strong"><b>Commit</b><small>ledger events</small></span></span>
</div>
</div>
</div>

## Observations are not entities

An **observation** is one source record: a row in a vendor file, a CRM account, a registry entry. It carries its attributes and a source reference (type, id, locator), and it never changes. Observations of one kind of thing share an **entity type** such as `organization`, `person` or `taxon`.

An **entity** is a stable identity above observations. Its ID never changes when its name does, and its state is `active`, `provisional` (created from too little evidence to trust yet) or `retired` (merged into another). A **membership** says an observation belongs to an entity, from one ledger sequence number until another.

## Similarity is not identity

Resolution runs in stages, each with its own records:

1. **Candidates.** Blocking keys (a normalized name key, a website domain, a registration number, a postcode) propose which pairs are worth comparing. Two records that share no key are never compared directly.
2. **Evidence.** Each comparison of an attribute yields a level (`exact_key`, `token_typo`, `number_differs`, ...) with a direction: it supports a match, contradicts it, or says nothing.
3. **Pair decisions.** Fellegi-Sunter weights, fitted per store by EM, turn the levels into a weight in bits. A pair is a `MATCH`, `POSSIBLE_MATCH`, `NO_MATCH` or `REQUIRES_REVIEW`. Scores are typed, so there is no universal `confidence` float.
4. **Consensus.** Strong pairs form components. A component is committed only if it holds together: no contradiction inside, nothing contested at its edge. Otherwise it goes to review.

## Identity is not relationship

"Subsidiary of", "brand of", "same household as" are **relationships** between distinct entities, never merges. Some comparison levels are relationship signals: two companies whose names differ by a qualifier ("Haleon UK Finance" and "Haleon UK Capital") are capped at 0 bits and listed as possible relationships instead.

## Everything is reversible

Every change to identity is a **commit**: a set of ledger events (`ENTITY_CREATED`, `MEMBERSHIP_ACCEPTED`, `ENTITY_MERGED`, `ENTITY_SPLIT`, `RELATIONSHIP_CREATED`, ...) that cites the decisions behind it. Nothing is destructively collapsed. A merge retires one entity into another and keeps its history; a split moves observations out into a new entity. The ledger alone can rebuild current state, and `thisness check` verifies that it does.

## Models propose; policy decides

Rules, Fellegi-Sunter, language models and people all contribute **decisions**. Only a commit, citing those decisions, changes identity. A model's answer is one more decision with its own record: which model, what it was sent, what it said and what it cost.

**Constraints** record what a person has settled: a `cannot_link` between two observations holds against any later evidence, and a `must_link` keeps them together.

## Reviews

When consensus cannot settle a cluster, it opens a **review**:

| Kind | The question |
|---|---|
| `boundary` | Are these clusters the same entity, different ones, or related? |
| `cluster` | Is this new cluster one entity? |
| `merge` | Should these existing entities merge? |
| `split` | Should this entity be split? |

Reviews are ranked by impact. An answer is `same`, `different`, `related` (with a relation), or `groups` (a regrouping of the records), and it is stored with its reason. A **review assistant** can suggest answers, which a person accepts or overrides, one at a time or in bulk for the kinds a profile allows. See [The Workbench](/docs/workbench).

## Dossiers

A **dossier** is everything Thisness believes about one entity, assembled from stored records: each attribute's values and how many observations support each, contradictions, members, relationships, open reviews and lineage. `thisness dossier ID` prints it as context for a language model, within a character budget, withholding attributes a profile marks as local only.
