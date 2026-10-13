"use client";

import { Fragment, useMemo, useState, type ReactNode } from "react";
import { Icon } from "../Icon";
import type { Attribute, Comparison, Entity, ExplorerData, Review } from "./types";

type View =
  | { kind: "entities" }
  | { kind: "entity"; id: string; tab: "values" | "observations" | "history" | "relationships" }
  | { kind: "reviews" }
  | { kind: "review"; id: string };

const FIELD_ICONS: Record<string, string> = {
  name: "id", registration_ids: "fingerprint", domain: "world", website: "link", email: "mail",
  country: "world", city: "map-pin", postal_code: "hash", address_line: "map-pin", phone: "phone",
};
const SOURCES: Record<string, [string, string]> = {
  companies_house: ["Companies House", "tone-blue"],
  gleif: ["GLEIF", "tone-purple"],
  erp: ["ERP", "tone-gray"],
  crm: ["CRM", "tone-sky"],
  accounts_payable: ["Accounts payable", "tone-amber"],
};
const VERDICTS: Record<string, [string, string]> = {
  MATCH: ["match", "tone-green"],
  POSSIBLE_MATCH: ["possible", "tone-amber"],
  NO_MATCH: ["no match", "tone-red"],
  REQUIRES_REVIEW: ["review", "tone-gray"],
};

const fieldTitle = (a: string) => a.replace(/_/g, " ");
const fmt = (v: unknown): string => (Array.isArray(v) ? v.map(fmt).join(", ") : v == null ? "" : String(v));
const initial = (label: string) => (label.replace(/^the\s+/i, "").trim()[0] ?? "?").toUpperCase();
const PLURALS: Record<string, string> = { entity: "entities" };
const plural = (n: number, noun: string) => `${n.toLocaleString()} ${n === 1 ? noun : PLURALS[noun] ?? `${noun}s`}`;

function SourceChip({ type }: { type: string }) {
  const [name, tone] = SOURCES[type] ?? [type, "tone-gray"];
  return <span className={`chip ${tone}`}>{name}</span>;
}

export function Explorer({
  data,
  initial: start = { kind: "entities" },
  height,
  storeName = "uk-companies.duckdb",
}: {
  data: ExplorerData;
  initial?: View;
  height?: number | string;
  storeName?: string;
}) {
  const [view, setView] = useState<View>(start);
  const entities = useMemo(() => new Map(data.entities.map((e) => [e.id, e])), [data]);
  const reviews = useMemo(() => new Map(data.reviews.map((r) => [r.id, r])), [data]);

  const openEntity = (id: string) => entities.has(id) && setView({ kind: "entity", id, tab: "values" });
  const openReview = (id: string) => reviews.has(id) && setView({ kind: "review", id });

  let crumbs: ReactNode = null;
  let body: ReactNode = null;
  if (view.kind === "entities") {
    crumbs = <><Icon name="building" size={15} className="muted" /><span className="title">Organizations</span></>;
    body = <EntityList data={data} onOpen={openEntity} />;
  } else if (view.kind === "entity") {
    const e = entities.get(view.id)!;
    crumbs = (
      <>
        <a className="crumb" onClick={() => setView({ kind: "entities" })}><Icon name="building" size={15} /> Organizations</a>
        <span className="crumb-sep">/</span><span className="title">{e.label}</span>
      </>
    );
    body = <EntityPage e={e} tab={view.tab} setTab={(tab) => setView({ ...view, tab })} onEntity={openEntity}
                       onReview={openReview} reviews={reviews} known={new Set(entities.keys())} />;
  } else if (view.kind === "reviews") {
    crumbs = <><Icon name="list-check" size={15} className="muted" /><span className="title">Review queue</span></>;
    body = <ReviewQueue data={data} onOpen={openReview} />;
  } else {
    const r = reviews.get(view.id)!;
    crumbs = (
      <>
        <a className="crumb" onClick={() => setView({ kind: "reviews" })}><Icon name="list-check" size={15} /> Review queue</a>
        <span className="crumb-sep">/</span><span className="title">Boundary review</span>
        <span className="mono light" style={{ marginLeft: 4 }}>{r.id}</span>
      </>
    );
    body = <ReviewPage r={r} onEntity={openEntity} known={entities} />;
  }

  return (
    <div className="wb explorer" style={height ? { height } : undefined}>
      <div className="shell">
        <nav className="sidebar">
          <div className="workspace"><span className="mark">T</span> Thisness <span className="store">{storeName}</span></div>
          <div className="nav-section">Entities</div>
          <a className={`nav-item ${view.kind === "entities" || view.kind === "entity" ? "active" : ""}`}
             onClick={() => setView({ kind: "entities" })}>
            <Icon name="building" /> Organizations <span className="count num">{data.store.entities.toLocaleString()}</span>
          </a>
          <div className="nav-section">Decide</div>
          <a className={`nav-item ${view.kind === "reviews" || view.kind === "review" ? "active" : ""}`}
             onClick={() => setView({ kind: "reviews" })}>
            <Icon name="list-check" /> Review queue <span className="badge">{data.store.openReviews}</span>
          </a>
          <div className="explorer-note">
            <Icon name="eye" size={14} /> A read-only copy of the Workbench: {plural(data.entities.length, "entity")} and{" "}
            {plural(data.reviews.length, "review")} from a resolved store of {data.store.observations.toLocaleString()} records.
          </div>
        </nav>
        <main className="main">
          <header className="topbar">{crumbs}</header>
          <div className="content">{body}</div>
        </main>
      </div>
    </div>
  );
}

/* -- entity list ------------------------------------------------------------------------- */

function EntityList({ data, onOpen }: { data: ExplorerData; onOpen: (id: string) => void }) {
  return (
    <>
      <div className="viewbar">
        <span className="view"><Icon name="list-check" size={14} /> {plural(data.entities.length, "entity")} in this export</span>
        <span className="spacer" />
        <span className="light">of {data.store.entities.toLocaleString()} in the store</span>
      </div>
      <table className="records">
        <thead>
          <tr>
            <th><Icon name="building" size={14} />Name</th>
            <th className="num"><Icon name="users" size={14} />Observations</th>
            <th><Icon name="database" size={14} />Sources</th>
            <th><Icon name="map-pin" size={14} />Postcode</th>
            <th className="num"><Icon name="list-check" size={14} />Reviews</th>
          </tr>
        </thead>
        <tbody>
          {data.entities.map((e) => {
            const sources = [...new Set(e.members.map((m) => m.source.type))];
            const postal = e.attributes.find((a) => a.attribute === "postal_code");
            return (
              <tr key={e.id} onClick={() => onOpen(e.id)}>
                <td><span className="name-chip"><span className="avatar">{initial(e.label)}</span><span>{e.label}</span></span></td>
                <td className="num">{e.memberCount}</td>
                <td><span className="chips-inline">{sources.map((s) => <SourceChip key={s} type={s} />)}</span></td>
                <td className="muted">{postal ? fmt(postal.canonical) : ""}</td>
                <td className="num">{e.reviews.length ? <span className="chip tone-amber">{e.reviews.length}</span> : ""}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
}

/* -- entity page ------------------------------------------------------------------------- */

function supportOf(a: Attribute) {
  const top = a.values[0];
  return top ? `${top.count}/${a.observed}` : "";
}

function EntityPage({ e, tab, setTab, onEntity, onReview, reviews, known }: {
  e: Entity;
  tab: "values" | "observations" | "history" | "relationships";
  setTab: (t: "values" | "observations" | "history" | "relationships") => void;
  onEntity: (id: string) => void;
  onReview: (id: string) => void;
  reviews: Map<string, Review>;
  known: Set<string>;
}) {
  const tabs = [
    ["values", "chart-dots", "Values"],
    ["observations", "users", "Observations"],
    ["relationships", "link", "Relationships"],
    ["history", "history", "History"],
  ] as const;
  return (
    <div className="record">
      <div className="record-fields">
        <div className="record-head">
          <span className="avatar lg">{initial(e.label)}</span>
          <h1>{e.label}</h1>
          <div className="meta">
            <span className="chip tone-green">{e.state}</span>
            <span className="mono light">{e.id}</span>
          </div>
          <div className="muted">{plural(e.memberCount, "observation")} · as of ledger seq {e.asOfSeq.toLocaleString()}</div>
        </div>
        <div className="section-title">Fields</div>
        {e.attributes.map((a) => (
          <div className="field" key={a.attribute}>
            <span className="label"><Icon name={FIELD_ICONS[a.attribute] ?? "circle-dashed"} size={14} /> {fieldTitle(a.attribute)}</span>
            <span className="value">
              {fmt(a.canonical)}
              <span className="support">{supportOf(a)}{a.values.length > 1 ? ` · ${a.values.length - 1} other${a.values.length > 2 ? "s" : ""}` : ""}</span>
            </span>
          </div>
        ))}
        {e.reviews.length > 0 && (
          <>
            <div className="section-title">Open reviews</div>
            {e.reviews.map((id) => (
              <div className="field" key={id}>
                <span className="label"><Icon name="list-check" size={14} /> boundary</span>
                <span className="value">
                  {reviews.has(id)
                    ? <a className="name-chip" onClick={() => onReview(id)}><span>Review {plural(reviews.get(id)!.board.reduce((n, c) => n + c.cards.length, 0), "record")}</span></a>
                    : <span className="light">not in this export</span>}
                </span>
              </div>
            ))}
          </>
        )}
      </div>
      <div>
        <div className="tabs">
          {tabs.map(([key, icon, title]) => (
            <a key={key} className={`tab ${tab === key ? "active" : ""}`} onClick={() => setTab(key)}>
              <Icon name={icon} size={14} /> {title}
            </a>
          ))}
        </div>
        <div className={`tab-body ${tab === "observations" ? "flush" : ""}`}>
          {tab === "values" && <Values e={e} />}
          {tab === "observations" && <Observations e={e} />}
          {tab === "relationships" && <Relationships e={e} onEntity={onEntity} known={known} />}
          {tab === "history" && <History e={e} onEntity={onEntity} />}
        </div>
      </div>
    </div>
  );
}

function Values({ e }: { e: Entity }) {
  return (
    <div className="values">
      {e.attributes.map((a) => (
        <div key={a.attribute}>
          <h3>
            <Icon name={FIELD_ICONS[a.attribute] ?? "circle-dashed"} size={14} /> {fieldTitle(a.attribute)}{" "}
            <span className="muted" style={{ fontWeight: 400 }}>
              {plural(a.values.length, "value")} across {plural(a.observed, "observation")}
            </span>
          </h3>
          {a.values.map((v, i) => (
            <div className="bar-row" key={i}>
              <span>{fmt(v.value)}</span>
              <div className="bar"><div style={{ width: `${Math.max(2, Math.round((100 * v.count) / a.observed))}%` }} /></div>
              <span className="muted num" style={{ textAlign: "right" }}>{v.count} / {a.observed}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function Observations({ e }: { e: Entity }) {
  const cols = ["name", "address_line", "city", "postal_code", "country"].filter((c) =>
    e.members.some((m) => m.attributes[c] != null && m.attributes[c] !== ""));
  return (
    <table className="records">
      <thead>
        <tr>
          <th><Icon name="database" size={14} />Source</th>
          {cols.map((c) => <th key={c}><Icon name={FIELD_ICONS[c] ?? "circle-dashed"} size={14} />{fieldTitle(c)}</th>)}
        </tr>
      </thead>
      <tbody>
        {e.members.map((m) => (
          <tr key={m.id} style={{ cursor: "default" }}>
            <td><SourceChip type={m.source.type} /> <span className="mono light">{m.source.id}</span></td>
            {cols.map((c) => <td key={c}>{fmt(m.attributes[c])}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const SIGNALS: Record<string, string> = {
  "name/token_subset": "one name is the other with words added",
  "name/qualifier_differs": "the names differ by a qualifier",
  "name/brand_only": "same brand, different company",
  model_said_related: "a model said related",
};

function Relationships({ e, onEntity, known }: { e: Entity; onEntity: (id: string) => void; known: Set<string> }) {
  if (!e.relationships.length && !e.candidates.length) return <div className="empty">No relationships or possible ones.</div>;
  return (
    <div className="cards">
      {e.candidates.length > 0 && (
        <div className="muted" style={{ marginBottom: 2 }}>
          Possible relationships: entity pairs linked by relationship signals, never merged by them.
        </div>
      )}
      {e.candidates.map((c) => (
        <div className="card cand" key={c.other}>
          {known.has(c.other) ? (
            <a className="name-chip" onClick={() => onEntity(c.other)}>
              <span className="avatar">{initial(c.label)}</span><span>{c.label}</span>
            </a>
          ) : (
            <span className="name-chip static" title="Not in this export">
              <span className="avatar">{initial(c.label)}</span><span>{c.label}</span>
            </span>
          )}
          <div className="chips-inline">
            {c.signals.map((s) => <span key={s} className="chip tone-sky">{SIGNALS[s] ?? s.replace("/", ": ").replace(/_/g, " ")}</span>)}
          </div>
        </div>
      ))}
    </div>
  );
}

function History({ e, onEntity }: { e: Entity; onEntity: (id: string) => void }) {
  return (
    <div className="timeline">
      {e.history.map((c) => (
        <div className="tl-item" key={c.seq}>
          <span className="tl-dot"><Icon name="git-branch" size={13} /></span>
          <div className="lines">
            {c.lines.map((l, i) => (
              <div key={i}>
                <Icon name={l.icon} size={14} className="muted" /> {l.text}
                {l.ref && <a className="name-chip" onClick={() => onEntity(l.ref!)}><span>{l.refName ?? l.ref}</span></a>}
              </div>
            ))}
            <div className="refs">
              <span className="chip">{c.actor.startsWith("resolver:") ? "resolution run" : c.actor}</span>
              {c.decisions.map((d) => <span key={d} className="mono light">{d}</span>)}
            </div>
          </div>
          <span className="when">seq {c.seq.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

/* -- reviews ---------------------------------------------------------------------------- */

function ReviewQueue({ data, onOpen }: { data: ExplorerData; onOpen: (id: string) => void }) {
  return (
    <>
      <div className="viewbar">
        <span className="view"><Icon name="list-check" size={14} /> {plural(data.reviews.length, "review")} in this export</span>
        <span className="spacer" />
        <span className="light">of {data.store.openReviews} open in the store, each with a model&apos;s suggestion</span>
      </div>
      <table className="records">
        <thead>
          <tr>
            <th><Icon name="list-check" size={14} />Review</th>
            <th className="num"><Icon name="users" size={14} />Records</th>
            <th className="num"><Icon name="building" size={14} />Entities</th>
            <th><Icon name="sparkles" size={14} />Suggestion</th>
          </tr>
        </thead>
        <tbody>
          {data.reviews.map((r) => (
            <tr key={r.id} onClick={() => onOpen(r.id)}>
              <td><span className="name-chip"><span className="avatar">{initial(r.board[0]?.name ?? "?")}</span><span>{r.board.map((c) => c.name).join(" · ")}</span></span></td>
              <td className="num">{r.board.reduce((n, c) => n + c.cards.length, 0)}</td>
              <td className="num">{r.board.length}</td>
              <td>{r.suggestion && <span className="chip tone-purple">{suggestionLabel(r)}</span>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

function suggestionLabel(r: Review) {
  const s = r.suggestion!;
  if (s.resolution === "groups") return `regroup into ${s.groups.length}`;
  if (s.resolution === "related") return `related${s.relation ? `: ${s.relation.replace(/_/g, " ")}` : ""}`;
  return s.resolution;
}

// The rationale cites the board's labels (R1, C3); each becomes hoverable.
function Rationale({ text, onHover }: { text: string; onHover: (label: string | null) => void }) {
  const parts = text.split(/\b([RC]\d+(?:[–-][RC]?\d+)?)\b/);
  return (
    <>
      {parts.map((p, i) => {
        if (i % 2 === 0) return <Fragment key={i}>{p}</Fragment>;
        const [a, b] = p.split(/[–-]/);
        const prefix = a[0];
        const labels = b ? range(prefix, +a.slice(1), +b.replace(/^[RC]/, "")) : [a];
        return (
          <span key={i} className="cite-ref" onMouseEnter={() => onHover(labels.join(" "))} onMouseLeave={() => onHover(null)}>{p}</span>
        );
      })}
    </>
  );
}
function range(prefix: string, from: number, to: number) {
  const out: string[] = [];
  for (let n = from; n <= Math.min(to, from + 30); n++) out.push(`${prefix}${n}`);
  return out;
}

function ReviewPage({ r, onEntity, known }: { r: Review; onEntity: (id: string) => void; known: Map<string, Entity> }) {
  const [hover, setHover] = useState<string | null>(null);
  const lit = new Set(hover ? hover.split(" ") : []);
  const records = r.board.reduce((n, c) => n + c.cards.length, 0);
  const comparedRefs = new Set<string>();
  for (const c of r.comparisons) if (lit.has(c.label)) { comparedRefs.add(c.left); comparedRefs.add(c.right); }
  const s = r.suggestion;
  return (
    <div className="review">
      <div className="question">{r.question}</div>
      <div className="question-sub">
        {plural(records, "record")} in {plural(r.board.length, "entity")} today. In the Workbench you drag cards between columns to regroup; every answer is stored with its reason and can be undone.
      </div>
      {s && (
        <div className="suggestion">
          <div className="suggestion-head">
            <Icon name="sparkles" size={15} /> <b>Suggestion</b>
            <span className="chip tone-purple">{suggestionLabel(r)}</span>
            <span className="light">{s.model}</span>
          </div>
          <div className="suggestion-body"><Rationale text={s.rationale} onHover={setHover} /></div>
          {s.groups.length > 0 && (
            <div className="suggestion-codes">
              {s.groups.map((g, i) => <span key={i} className="chip">{g.join(", ")}</span>)}
              <span className="light">its grouping</span>
            </div>
          )}
        </div>
      )}
      <div className="board">
        {r.board.map((col) => (
          <div className="column" key={col.entityId}>
            <div className="column-head">
              <span className="avatar">{initial(col.name)}</span>
              {known.has(col.entityId)
                ? <a className="title" onClick={() => onEntity(col.entityId)} title={col.name}>{col.name}</a>
                : <span className="title">{col.name}</span>}
              <span className="chip tone-green">{col.state}</span>
              <span className="count num">{col.size}</span>
            </div>
            <div className="column-body">
              {col.cards.map((card) => (
                <div key={card.id} className={`node-card ${lit.has(card.ref) || comparedRefs.has(card.ref) ? "lit" : ""}`}
                     onMouseEnter={() => setHover(card.ref)} onMouseLeave={() => setHover(null)}>
                  <div className="nm"><span>{card.name}</span><span className="ref">{card.ref}</span></div>
                  {(card.fields.city || card.fields.postal_code) && (
                    <div className="ln"><Icon name="map-pin" size={13} /> {[card.fields.address_line, card.fields.city, card.fields.postal_code].filter(Boolean).join(", ")}</div>
                  )}
                  {card.source && <div className="ln"><Icon name="database" size={13} /> {card.source}</div>}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="pairs">
        <h3>Comparisons, strongest first</h3>
        <table className="records layout-fixed cmp">
          <thead>
            <tr>
              <th className="ref-col"></th>
              <th style={{ width: 118 }}>Records</th>
              <th>Evidence</th>
              <th className="num" style={{ width: 72 }}>Weight</th>
              <th style={{ width: 110 }}>Verdict</th>
            </tr>
          </thead>
          <tbody>
            {r.comparisons.map((c) => <ComparisonRow key={c.label} c={c} lit={lit} onHover={setHover} />)}
          </tbody>
        </table>
      </div>
      <div className="answer readonly">
        <Icon name="eye" size={15} className="muted" />
        <span className="muted">Read-only. In the Workbench you answer here:</span>
        <button className="btn primary" disabled><Icon name="git-merge" size={14} /> All the same entity</button>
        <button className="btn" disabled><Icon name="arrows-split" size={14} /> Different entities</button>
        <button className="btn" disabled><Icon name="link" size={14} /> Related</button>
      </div>
    </div>
  );
}

function ComparisonRow({ c, lit, onHover }: { c: Comparison; lit: Set<string>; onHover: (l: string | null) => void }) {
  const [vName, vTone] = VERDICTS[c.verdict] ?? [c.verdict, "tone-gray"];
  const on = lit.has(c.label) || (lit.has(c.left) && lit.has(c.right)) || (lit.size === 1 && (lit.has(c.left) || lit.has(c.right)));
  return (
    <tr className={`${c.cited ? "cited" : ""} ${on ? "lit" : ""}`} onMouseEnter={() => onHover(c.label)} onMouseLeave={() => onHover(null)}>
      <td className="ref-col"><span className="ref">{c.label}</span></td>
      <td><span className="ref">{c.left}</span> <span className="light">↔</span> <span className="ref">{c.right}</span></td>
      <td><div className="ev">
        {c.evidence.map((ev, i) => (
          <span key={i} className={`chip ${ev.direction === "contradicts" ? "tone-red" : ev.weight && ev.weight > 0 ? "" : "tone-gray"}`}>
            {fieldTitle(ev.attribute)} <b>{ev.level.replace(/_/g, " ")}</b>
            {ev.weight != null && <span className={`weight ${ev.weight >= 0 ? "pos" : "neg"}`}>{ev.weight > 0 ? "+" : ""}{ev.weight}</span>}
          </span>
        ))}
      </div></td>
      <td className="num"><span className={`weight ${(c.weight ?? 0) >= 0 ? "pos" : "neg"}`}>{c.weight ?? ""}</span></td>
      <td><span className={`chip ${vTone}`}>{vName}</span>{c.cited && <Icon name="sparkles" size={13} className="cite" />}</td>
    </tr>
  );
}
