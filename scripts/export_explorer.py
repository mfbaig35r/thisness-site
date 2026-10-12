"""Export a few real entities and reviews from a Thisness store for the site's explorer.

    uv run --project ../thisness python scripts/export_explorer.py STORE data/explorer.json

The store is the UK benchmark resolved with no model, with the review assistant's
suggestions (design 07 §13.3). Everything shown is read from the store: the values and
their support, the observations, the ledger, the comparisons and their levels, and the
model's suggested answer with its rationale.
"""

from __future__ import annotations

import json
import sys
from collections import defaultdict
from pathlib import Path
from typing import Any

from thisness import Thisness
from thisness.assistant import review_labels
from thisness.profiles.organization import organization

REVIEWS = [
    "rev_01M3253RW623V1SP4SGCNAQ7GA",  # Royal London Pooled Pensions: same
    "rev_01M3253RP6NTBFGVNHRFNA9XR4",  # The Gym Group: different
    "rev_01M3253RKPYFYPV49BNP222E2M",  # Associated British Ports: related
    "rev_01M3253RRAYKQE6A9GSRD052HK",  # Haleon UK Finance: regrouped
    "rev_01M3253RM46ZCRKV10J4VBNWTM",  # SSE: different
]
EXTRA_ENTITY_NAMES = ["HISCOX INSURANCE COMPANY LIMITED"]
MAX_MEMBERS = 40
MAX_COMPARISONS = 12
CARD_FIELDS = ("address_line", "city", "postal_code", "country")


def clean(value: Any) -> Any:
    if isinstance(value, (list, tuple)):
        return [clean(v) for v in value]
    if isinstance(value, dict):
        return {k: clean(v) for k, v in value.items()}
    if isinstance(value, (str, int, float, bool)) or value is None:
        return value
    return str(value)


def weight_of(j) -> float | None:
    return next((float(s.value) for s in j.scores if s.kind == "fellegi_sunter_weight"), None)


def timeline(engine: Thisness, entity_id: str, name_of) -> list[dict]:
    by_commit: dict[str, list] = defaultdict(list)
    for event in engine.history(entity_id=entity_id):
        by_commit[event.commit_id].append(event)
    items = []
    for events in by_commit.values():
        lines, joined, left = [], 0, 0
        for e in events:
            t = e.event_type.value
            if t == "MEMBERSHIP_ACCEPTED":
                joined += 1
            elif t == "MEMBERSHIP_ENDED":
                left += 1
            elif t == "ENTITY_CREATED":
                lines.append({"icon": "plus", "text": f"Created as {e.payload.get('state', 'active')}"})
            elif t == "ENTITY_MERGED":
                other = e.related_entity_id if e.entity_id == entity_id else e.entity_id
                verb = "Merged into" if e.entity_id == entity_id else "Absorbed"
                lines.append({"icon": "git-merge", "text": verb, "ref": other, "refName": name_of(other)})
            elif t == "RELATIONSHIP_CREATED":
                other = e.related_entity_id if e.entity_id == entity_id else e.entity_id
                lines.append({"icon": "link", "text": "Related to", "ref": other, "refName": name_of(other)})
            else:
                lines.append({"icon": "circle-dashed", "text": t.replace("_", " ").capitalize()})
        if joined:
            lines.append({"icon": "users", "text": f"{joined} observation{'s' if joined != 1 else ''} joined"})
        if left:
            lines.append({"icon": "users", "text": f"{left} observation{'s' if left != 1 else ''} left"})
        first = events[0]
        items.append({
            "seq": first.seq,
            "actor": f"{first.actor.kind}:{first.actor.id}",
            "decisions": sorted({e.decision_id for e in events if e.decision_id})[:3],
            "lines": lines,
        })
    return sorted(items, key=lambda x: -x["seq"])


def export_entity(engine: Thisness, entity_id: str, name_of) -> dict:
    d = engine.dossier(entity_id, members_limit=MAX_MEMBERS)
    return {
        "id": d.entity.entity_id,
        "type": d.entity.entity_type,
        "state": d.entity.state.value if hasattr(d.entity.state, "value") else str(d.entity.state),
        "label": d.label,
        "asOfSeq": d.as_of_seq,
        "memberCount": d.member_count,
        "attributes": [
            {
                "attribute": a.attribute,
                "canonical": clean(a.canonical),
                "observed": a.observed,
                "values": [
                    {"value": clean(v.value), "count": len(v.observations), "sources": clean(v.sources)}
                    for v in a.values
                ],
            }
            for a in d.attributes
        ],
        "members": [
            {
                "id": m.observation_id,
                "source": {"type": m.source.type, "id": m.source.id},
                "attributes": clean(m.attributes or {}),
            }
            for m in d.members
        ],
        "history": timeline(engine, entity_id, name_of),
        "reviews": [r.review_id for r in d.open_reviews],
        "relationships": [
            {"other": r.other_id, "label": r.other_label, "relation": str(r.relationship.relation_type)}
            for r in d.relationships
        ],
        "candidates": [
            {"other": c.right_entity if c.left_entity == entity_id else c.left_entity,
             "label": label, "signals": list(c.signals)}
            for c, label in d.relationship_candidates
        ][:8],
    }


def export_review(engine: Thisness, review_id: str, name_of) -> tuple[dict, set[str]]:
    case = engine.review_case(review_id)
    refs, labelled = review_labels(engine, case)
    columns: dict[str, list] = {}
    for node in case.nodes:
        columns.setdefault(node.entity_id or node.node_id, []).append(node)
    board = [
        {
            "entityId": e,
            "name": name_of(e),
            "state": nodes[0].entity_state,
            "size": nodes[0].size,
            "cards": [
                {
                    "ref": refs[n.node_id],
                    "id": n.node_id,
                    "name": n.attributes.get("name"),
                    "fields": {f: n.attributes.get(f) for f in CARD_FIELDS if n.attributes.get(f)},
                    "source": f"{n.source['type']}:{n.source['id']}" if n.source else None,
                }
                for n in nodes
            ],
        }
        for e, nodes in sorted(columns.items(), key=lambda kv: (-kv[1][0].size, kv[0]))
    ]
    rec = (engine.recommendations(review_id) or [None])[-1]
    cited = set(rec.cited_judgments) if rec else set()
    comparisons = []
    for label, j, a, b, w in labelled[:MAX_COMPARISONS]:
        evidence = engine.explain(j.decision_id)["evidence"]
        comparisons.append({
            "label": label,
            "left": a,
            "right": b,
            "weight": round(w, 1) if w is not None else None,
            "verdict": j.verdict.value,
            "cited": j.decision_id in cited,
            "evidence": [
                {"attribute": ev["attribute"], "level": ev["level"], "direction": ev["direction"],
                 "weight": round(float(ev["score"]["value"]), 1) if ev.get("score") else None}
                for ev in evidence
            ],
        })
    node_ref = refs
    suggestion = None
    if rec:
        suggestion = {
            "resolution": rec.resolution,
            "relation": rec.relation,
            "rationale": rec.rationale,
            "groups": [[node_ref.get(n, n) for n in g] for g in (rec.groups or [])],
            "model": rec.actor.id,
        }
    entities = {e for e in columns if e.startswith("org_")}
    return {
        "id": review_id,
        "kind": case.review.kind,
        "question": case.question,
        "board": board,
        "comparisons": comparisons,
        "suggestion": suggestion,
    }, entities


def main(store: str, out: str) -> None:
    engine = Thisness(store, profiles=[organization()])
    labels: dict[str, str] = {}

    def name_of(entity_id: str | None) -> str | None:
        if not entity_id:
            return None
        if entity_id not in labels:
            labels[entity_id] = engine.names([entity_id]).get(entity_id, entity_id)
        return labels[entity_id]

    reviews, entity_ids = [], []
    for rid in REVIEWS:
        review, entities = export_review(engine, rid, name_of)
        reviews.append(review)
        entity_ids += [e for e in sorted(entities) if e not in entity_ids]
    for name in EXTRA_ENTITY_NAMES:
        listing = engine.entities("organization", query=name, limit=1)
        for row in listing.rows[:1]:
            eid = row.entity_id
            if eid not in entity_ids:
                entity_ids.insert(0, eid)
    entities = [export_entity(engine, e, name_of) for e in entity_ids]
    overview = engine.overview()
    data = {
        "store": {
            "observations": overview["observations"].get("organization"),
            "entities": sum(overview["entities"].get("organization", {}).values()),
            "openReviews": overview["open_reviews"],
        },
        "attribution": "Real UK companies from the GLEIF Golden Copy (CC0 1.0) and Companies House "
        "(Open Government Licence v3.0). Supplier-file records are generated from the true company.",
        "entities": entities,
        "reviews": reviews,
    }
    Path(out).parent.mkdir(parents=True, exist_ok=True)
    Path(out).write_text(json.dumps(data, indent=1, ensure_ascii=False))
    print(f"{len(entities)} entities, {len(reviews)} reviews -> {out}")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
