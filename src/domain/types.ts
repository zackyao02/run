export type ComponentType =
  | "intro"
  | "check"
  | "task"
  | "choice"
  | "input"
  | "warning"
  | "timer"
  | "result";

export type CheckValue = "normal" | "risk" | "unchecked";
export type RuleStatus = "matched" | "not_matched" | "needs_review";
/** A choice keeps the selected option id, so a Run can follow its declared path. */
export type ChoiceValue = `choice:${string}`;
export type ProgressValue = CheckValue | RuleStatus | ChoiceValue;

export type RuleOperator =
  | "required"
  | "contains_number"
  | "length_between"
  | "value_between"
  | "manual_evidence";

/**
 * The features that make a Run a small declarative program rather than a
 * re-skinned list of article bullets.  They are declared by the compiler and
 * checked before a Run can enter human preview.
 */
export type ProgramPrimitive =
  | "observable_state"
  | "source_backed_branch"
  | "deterministic_evaluation"
  | "feedback_loop"
  | "repeatable_experiment"
  | "material_artifact";

/** Seven source-selected program models. `gated_path` is the action orchestrator. */
export type ProgramModel =
  | "verification"
  | "gated_path"
  | "diagnosis"
  | "scenario_simulator"
  | "micro_lab"
  | "rule_tester"
  | "dialogue_rehearsal"
  | "parameter_sandbox"
  | "practice_cycle";

export interface ProgramState {
  id: string;
  label: string;
  description?: string;
}

export interface ProgramTransition {
  from: string;
  componentId: string;
  /** `completed` for an action, or `choice:<optionId>` for a declared branch. */
  when: "completed" | ChoiceValue;
  to: string;
  effects?: ProgramStateEffect[];
}

export interface ProgramStateEffect {
  variableId: string;
  /** Declarative numeric delta, never executable code. */
  delta: number;
}

export interface ProgramVariable {
  id: string;
  label: string;
  initialValue: number;
  min: number;
  max: number;
  unit?: string;
  /** Human-readable, declared meanings for discrete state values. */
  valueLabels?: Record<string, string>;
}

export interface RunProgram {
  model: ProgramModel;
  primitives: ProgramPrimitive[];
  initialState: string;
  terminalState: string;
  states: ProgramState[];
  transitions: ProgramTransition[];
  variables?: ProgramVariable[];
}

export interface RunInput {
  id: string;
  type: "textarea" | "text" | "number";
  label: string;
  description?: string;
  required?: boolean;
  maxLength?: number;
  placeholder?: string;
}

export interface EvaluationRule {
  inputId: string;
  operator: RuleOperator;
  params?: { min?: number; max?: number };
}

export interface SourceAnchor {
  blockId: string;
  quote: string;
  startOffset: number;
  endOffset: number;
  blockHash: string;
}

export interface SourceBlock {
  id: string;
  text: string;
  blockHash: string;
}

export interface SourceCoverage {
  type: "full" | "bounded_excerpt";
  startOffset: number;
  endOffset: number;
  providerLimit?: number;
  disclosure?: string;
}

export interface SourceRecord {
  id: string;
  title: string;
  authorName: string;
  url?: string | null;
  blocks: SourceBlock[];
  coverage?: SourceCoverage;
  /** How the verified text entered the protected content pipeline. */
  provenance?: "hackathon_event_api" | "creator_analysis_api";
}

export interface ChoiceOption {
  id: string;
  label: string;
  nextId: string;
  value?: number;
  response?: string;
}

export interface RunComponent {
  id: string;
  type: ComponentType;
  required?: boolean;
  title?: string;
  description?: string;
  options?: ChoiceOption[];
  source?: SourceAnchor;
  evaluation?: EvaluationRule;
  durationSeconds?: number;
  speaker?: string;
  utterance?: string;
  /** Explicit continuation for a non-choice action. Keeps branch paths declarative. */
  nextId?: string;
}

export interface ExecutableRun {
  schemaVersion: "1.2" | "1.3";
  title: string;
  description: string;
  capability: "inspect" | "mission" | "diagnose" | "practice" | "configure" | "compare";
  category?: string | null;
  estimatedMinutes?: number | null;
  usage?: { started: number; completed: number };
  inputs?: RunInput[];
  /** Required for newly compiled Runs. Legacy engineering fixtures may omit it. */
  program?: RunProgram;
  sourceRef: { sourceId: string; contentHash: string };
  components: RunComponent[];
  completion: { type: "all_required_completed" | "result_reached" | "stage_completed"; targetId?: string | null };
  resultArtifact: { type: "inspect_summary" | "mission_snapshot" | "diagnose_trace" | "generic_summary"; fields?: string[] };
}

export interface SessionSnapshot {
  id: string;
  runId: string;
  status: "created" | "engaged" | "completed" | "abandoned";
  progress: Record<string, ProgressValue>;
  started: boolean;
  result?: ResultArtifact;
  /** Internal human-preview sessions carry an unpublished schema snapshot. */
  runSnapshot?: ExecutableRun;
}

export interface ResultArtifact {
  type: "inspect_summary" | "mission_snapshot" | "diagnose_trace" | "generic_summary";
  normalCount: number;
  riskCount: number;
  uncheckedCount: number;
  items: Array<{
    componentId: string;
    title: string;
    status: ProgressValue;
    source?: SourceAnchor;
  }>;
  completedAt: string;
  matchedCount?: number;
  notMatchedCount?: number;
  needsReviewCount?: number;
  /** Deterministic wording derived from the selected grammar and progress only. */
  headline?: string;
  summary?: string;
  finalState?: ProgramState;
  variables?: Array<{ id: string; label: string; value: number; unit?: string; valueLabels?: Record<string, string> }>;
}
