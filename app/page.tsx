import Link from "next/link";
import { Header } from "@/components/Header";
import { Icon } from "@/components/Icon";
import { Explorer } from "@/components/explorer/Explorer";
import type { ExplorerData } from "@/components/explorer/types";
import { CopyCommand } from "@/components/landing/CopyCommand";
import { highlight } from "@/lib/highlight";
import data from "@/data/explorer.json";

const PRINCIPLES = [
  { icon: "fingerprint", title: "Observations are not entities", body: "A source record is an observation of something. Entities are stable identities above them, with IDs that never change when names do." },
  { icon: "scale", title: "Similarity is not identity", body: "Candidates, evidence, decisions and identity are separate steps with separate records. Scores are typed; there is no universal confidence float." },
  { icon: "link", title: "Identity is not relationship", body: "“Subsidiary of” and “brand of” relate distinct entities. A group's sibling companies are never merged for sharing a name." },
  { icon: "arrow-back-up", title: "Everything is reversible", body: "Merges and splits are ledger events over memberships. Nothing is destructively collapsed, and the ledger alone rebuilds current state." },
  { icon: "sparkles", title: "Models propose; policy decides", body: "Rules, Fellegi-Sunter, language models and people all contribute decisions. Only a commit, citing them, changes identity." },
];

const DOMAINS = [
  {
    icon: "building", name: "Organizations",
    records: ["Haleon UK Finance Limited", "HALEON UK FINANCE LTD", "HALEON UK FINANCE LIMITaED"],
    entity: "Haleon UK Finance Limited",
    apart: "Haleon UK Capital PLC, same address: related, not the same",
  },
  {
    icon: "user", name: "People",
    records: ["Robert J. Smith, 1971-04-02", "Bob Smith", "R. J. Smith, same email"],
    entity: "Robert J. Smith",
    apart: "Robert Smith Jr., same address: a household, not a match",
  },
  {
    icon: "leaf", name: "Taxa",
    records: ["Quercus robur L.", "Q. robur", "Quercus pedunculata Ehrh."],
    entity: "Quercus robur L. (accepted, WFO)",
    apart: "Quercus ilex Lour., a later homonym of Q. ilex L.",
  },
];

const PYTHON = `
from thisness import Thisness
from thisness.profiles.organization import organization

engine = Thisness("identity.duckdb", profiles=[organization()])
engine.ingest([engine.observe("organization", r, src) for r, src in rows])

result = engine.resolve_many("organization")  # fit, then resolve
outcome = engine.resolve("organization", {"name": "IBM Corp."}, src)
engine.explain(outcome.decision_id)  # the decision and its evidence
`;

const SHELL = `
pip install 'thisness[ui]'
thisness ingest vendors.csv --resolve
thisness ui   # the Workbench

# a model decides contested pairs
thisness resolve --provider openai \\
  --model gpt-6-luna --budget 2
`;

export default async function Home() {
  const explorer = data as unknown as ExplorerData;
  const gym = explorer.reviews.find((r) => r.board.some((c) => c.name.startsWith("THE GYM GROUP")))?.id;
  const [python, shell] = await Promise.all([highlight(PYTHON, "python"), highlight(SHELL, "bash")]);
  return (
    <div className="landing">
      <Header overWhite />

      <section className="hero">
        <div className="eyebrow">Open source · Apache-2.0 · Python 3.12+</div>
        <h1 className="display">
          Identity resolution for{" "}<br className="desk" />
          imperfect <span className="sans">observations</span>
        </h1>
        <p className="lede">
          Thisness decides which records refer to the same thing, and keeps the evidence, the decision and the history
          behind every conclusion, so any of them can be explained, reviewed or reversed.
        </p>
        <div className="hero-ctas">
          <CopyCommand command="pip install 'thisness[ui]'" />
          <Link href="/docs" className="cta light">Read the docs</Link>
        </div>
      </section>

      <section className="stage">
        <div className="window">
          <div className="window-bar">
            <span className="lights"><i /><i /><i /></span>
            <span className="window-title">Thisness Workbench</span>
            <Link href="/explorer" className="window-open">Open the explorer <Icon name="arrow-right" size={13} /></Link>
          </div>
          <Explorer data={explorer} initial={gym ? { kind: "review", id: gym } : undefined} height={640} />
        </div>
        <p className="stage-caption">Hover a label in the suggestion to see the records and comparisons it cites.</p>
      </section>

      <section className="band">
        <div className="split">
          <div>
            <div className="kicker">Hesperus is Phosphorus</div>
            <h2 className="display small">Two observations.<br />One planet.</h2>
            <p>
              For centuries the evening star and the morning star were two things. Then observation showed they were the same
              planet: identity established by evidence rather than by definition.
            </p>
            <p>
              Thisness does that for data. It takes observations from many sources (&ldquo;IBM&rdquo;, &ldquo;IBM Corp.&rdquo;, an invoice
              line, a contract party) and decides what they refer to, with a record of why.
            </p>
            <Link href="/docs/concepts" className="text-link">Core concepts <Icon name="arrow-right" size={14} /></Link>
          </div>
          <div className="venus" aria-label="Two observations resolved into one entity">
            <div className="obs-card"><span className="ref">O1</span><b>Hesperus</b><small>seen at dusk, in the west</small></div>
            <div className="obs-card"><span className="ref">O2</span><b>Phosphorus</b><small>seen at dawn, in the east</small></div>
            <div className="evidence-col">
              <span className="chip ok">orbit <b>same</b></span>
              <span className="chip ok">period <b>same</b></span>
              <span className="chip">time seen <b>differs</b>, says nothing</span>
            </div>
            <div className="entity-card">
              <span className="avatar">V</span>
              <div><b>Venus</b><small>2 observations · committed with its evidence</small></div>
              <span className="state">active</span>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <div className="kicker">Principles</div>
          <h2 className="display small">Every conclusion keeps its reasons</h2>
        </div>
        <div className="principles">
          {PRINCIPLES.map((p) => (
            <div className="principle" key={p.title}>
              <span className="principle-icon"><Icon name={p.icon} size={20} stroke={1.5} /></span>
              <h3>{p.title}</h3>
              <p>{p.body}</p>
            </div>
          ))}
          <Link className="principle more" href="/docs/design/vision">
            <h3>Read the design</h3>
            <p>Nine design documents, from the core model to real people, with every measurement.</p>
            <span className="text-link">The design documents <Icon name="arrow-right" size={14} /></span>
          </Link>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <div className="kicker">Three domains ship</div>
          <h2 className="display small">Records in, entities out</h2>
          <p className="section-lede">A domain is a resolution profile: attributes, comparisons, constraints and the guidance a model is given.</p>
        </div>
        <div className="domains">
          {DOMAINS.map((d) => (
            <div className="domain" key={d.name}>
              <div className="domain-head"><Icon name={d.icon} size={16} /> {d.name}</div>
              <div className="domain-records">
                {d.records.map((r) => <div key={r} className="rec">{r}</div>)}
              </div>
              <div className="domain-arrow"><Icon name="git-merge" size={14} /> one entity</div>
              <div className="domain-entity">{d.entity}</div>
              <div className="domain-apart"><Icon name="arrows-split" size={14} /> {d.apart}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <div className="kicker">Measured</div>
          <h2 className="display small">Precision first, at scale</h2>
          <p className="section-lede">Company-registry records with supplier-file variants and identifiers hidden. Every number is in the design documents.</p>
        </div>
        <div className="stats">
          <div className="stat-card"><div className="big">.9992</div><div className="what">precision</div><div className="note">3,507 records, no model</div></div>
          <div className="stat-card"><div className="big">.912</div><div className="what">recall</div><div className="note">one false-merge cluster</div></div>
          <div className="stat-card accent"><div className="big">.938</div><div className="what">recall with a model</div><div className="note">gpt-6-luna deciding contested pairs, $0.62</div></div>
          <div className="stat-card"><div className="big">46,565</div><div className="what">records at scale</div><div className="note">precision .9965, recall .934</div></div>
        </div>
        <div className="center"><Link href="/docs/evaluation" className="text-link">How it is measured <Icon name="arrow-right" size={14} /></Link></div>
      </section>

      <section className="section">
        <div className="section-head">
          <div className="kicker">Start</div>
          <h2 className="display small">A library, a command line and a Workbench</h2>
        </div>
        <div className="code-pair">
          <div className="code-card">
            <div className="code-title"><Icon name="code" size={14} /> Python</div>
            <div className="prose" dangerouslySetInnerHTML={{ __html: python }} />
          </div>
          <div className="code-card">
            <div className="code-title"><Icon name="terminal-2" size={14} /> Command line</div>
            <div className="prose" dangerouslySetInnerHTML={{ __html: shell }} />
          </div>
        </div>
      </section>

      <section className="closing">
        <h2 className="display">Know what your records refer to</h2>
        <div className="hero-ctas">
          <CopyCommand command="pip install 'thisness[ui]'" />
          <Link href="/docs/quickstart" className="cta light">Quickstart</Link>
        </div>
      </section>

      <footer className="footer">
        <div className="footer-cols">
          <div>
            <div className="brand"><span className="mark">T</span> Thisness</div>
            <p>Identity resolution for imperfect observations. Apache-2.0.</p>
          </div>
          <div>
            <h4>Docs</h4>
            <Link href="/docs/quickstart">Quickstart</Link>
            <Link href="/docs/concepts">Core concepts</Link>
            <Link href="/docs/language-models">Language models</Link>
            <Link href="/explorer">Explorer</Link>
          </div>
          <div>
            <h4>Project</h4>
            <a href="https://github.com/mfbaig35r/thisness" target="_blank" rel="noreferrer">GitHub</a>
            <a href="https://pypi.org/project/thisness/" target="_blank" rel="noreferrer">PyPI</a>
            <Link href="/docs/changelog">Changelog</Link>
            <Link href="/docs/design/vision">Design</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
