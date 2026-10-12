export type ValueSupport = { value: unknown; count: number; sources: [string, number][] };
export type Attribute = { attribute: string; canonical: unknown; observed: number; values: ValueSupport[] };
export type Member = { id: string; source: { type: string; id: string }; attributes: Record<string, unknown> };
export type HistoryLine = { icon: string; text: string; ref?: string; refName?: string | null };
export type Commit = { seq: number; actor: string; decisions: string[]; lines: HistoryLine[] };
export type Candidate = { other: string; label: string; signals: string[] };

export type Entity = {
  id: string;
  type: string;
  state: string;
  label: string;
  asOfSeq: number;
  memberCount: number;
  attributes: Attribute[];
  members: Member[];
  history: Commit[];
  reviews: string[];
  relationships: { other: string; label: string; relation: string }[];
  candidates: Candidate[];
};

export type Card = { ref: string; id: string; name: string; fields: Record<string, string>; source: string | null };
export type Column = { entityId: string; name: string; state: string; size: number; cards: Card[] };
export type Comparison = {
  label: string;
  left: string;
  right: string;
  weight: number | null;
  verdict: string;
  cited: boolean;
  evidence: { attribute: string; level: string; direction: string; weight: number | null }[];
};
export type Review = {
  id: string;
  kind: string;
  question: string;
  board: Column[];
  comparisons: Comparison[];
  suggestion: { resolution: string; relation: string | null; rationale: string; groups: string[][]; model: string } | null;
};

export type ExplorerData = {
  store: { observations: number; entities: number; openReviews: number };
  attribution: string;
  entities: Entity[];
  reviews: Review[];
};
