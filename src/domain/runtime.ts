import { randomUUID } from "node:crypto";
import { getPublishedRuns } from "@/src/data/catalog";
import { getSessionDocument, getUsageDocument, incrementUsageDocument, listSessionDocumentsForAccount, saveSessionDocument } from "@/src/domain/persistence";
import type { ExecutableRun, ProgramState, ProgressValue, ResultArtifact, RunComponent, SessionSnapshot } from "@/src/domain/types";

const actionableTypes = new Set(["check", "task", "choice", "input", "timer"]);

async function getRun(runId: string): Promise<ExecutableRun | undefined> {
  return (await getPublishedRuns()).find((run) => run.sourceRef.sourceId === runId);
}

async function getRunForSession(session: SessionSnapshot): Promise<ExecutableRun | undefined> {
  return session.runSnapshot ?? getRun(session.runId);
}

export async function createSession(runId: string, runSnapshot?: ExecutableRun, accountKey?: string): Promise<SessionSnapshot> {
  if (!runSnapshot && !await getRun(runId)) throw new Error("RUN_NOT_FOUND");
  const session: SessionSnapshot = {
    id: randomUUID(), runId, status: "created", progress: {}, started: false,
    ...(accountKey ? { accountKey } : {}),
    ...(runSnapshot ? { runSnapshot } : {}),
  };
  await saveSessionDocument(session);
  return session;
}

export async function createPreviewSession(run: ExecutableRun): Promise<SessionSnapshot> {
  return createSession(`preview:${run.sourceRef.sourceId}:${randomUUID()}`, run);
}

/**
 * Dev fixtures are always carried as a private session snapshot. They never
 * enter the published Run lookup used by public API routes or Runtime.
 */
export async function createFixtureSession(run: ExecutableRun): Promise<SessionSnapshot> {
  return createSession(run.sourceRef.sourceId, run);
}

export async function getSession(sessionId: string): Promise<SessionSnapshot | undefined> { return getSessionDocument(sessionId); }
export async function getSessionForAccount(sessionId: string, accountKey?: string): Promise<SessionSnapshot | undefined> {
  const session = await getSessionDocument(sessionId);
  if (!session || (session.accountKey && session.accountKey !== accountKey)) return undefined;
  return session;
}
export async function listSessionsForAccount(accountKey: string) { return listSessionDocumentsForAccount(accountKey); }
export async function getRunUsage(runId: string) { return getUsageDocument(runId); }

function isChoiceValue(value: ProgressValue): value is `choice:${string}` { return value.startsWith("choice:"); }

function assertValueIsValid(component: RunComponent, value: ProgressValue) {
  if (component.type === "choice") {
    const optionId = isChoiceValue(value) ? value.slice("choice:".length) : "";
    if (!optionId || !component.options?.some((option) => option.id === optionId)) throw new Error("INVALID_CHOICE_OPTION");
    return;
  }
  if (component.type === "check" && !["normal", "risk", "unchecked", "matched", "not_matched", "needs_review"].includes(value)) throw new Error("INVALID_CHECK_VALUE");
  if (["task", "input", "timer"].includes(component.type) && !["matched", "not_matched", "needs_review", "unchecked"].includes(value)) throw new Error("INVALID_ACTION_VALUE");
}

export async function updateProgress(sessionId: string, componentId: string, value: ProgressValue, accountKey?: string): Promise<SessionSnapshot> {
  const session = await getSessionDocument(sessionId);
  if (!session) throw new Error("SESSION_NOT_FOUND");
  if (session.accountKey && session.accountKey !== accountKey) throw new Error("SESSION_NOT_FOUND");
  const run = await getRunForSession(session);
  if (!run) throw new Error("RUN_NOT_FOUND");
  const component = run.components.find((item) => item.id === componentId);
  if (!component || !actionableTypes.has(component.type)) throw new Error("INVALID_COMPONENT");
  assertValueIsValid(component, value);
  const firstInteraction = !session.started && value !== "unchecked";
  session.progress[componentId] = value;
  if (value !== "unchecked") { session.started = true; session.status = "engaged"; }
  await saveSessionDocument(session);
  if (firstInteraction && !session.runSnapshot) await incrementUsageDocument(session.runId, "started");
  return session;
}

/** Follow source-declared branches. Linear Runs simply use component order. */
export function getActiveActionPath(run: ExecutableRun, progress: Record<string, ProgressValue>): RunComponent[] {
  const actions = run.components.filter((component) => actionableTypes.has(component.type));
  if (!actions.length) return [];
  const byId = new Map(actions.map((component) => [component.id, component]));
  const indexById = new Map(actions.map((component, index) => [component.id, index]));
  const path: RunComponent[] = [];
  const visited = new Set<string>();
  let current: RunComponent | undefined = actions[0];
  while (current && !visited.has(current.id)) {
    visited.add(current.id); path.push(current);
    if (current.type === "choice") {
      const selected: ProgressValue | undefined = progress[current.id];
      if (!isChoiceValue(selected)) break;
      const nextId: string | undefined = current.options?.find((option) => option.id === selected.slice("choice:".length))?.nextId;
      current = nextId ? byId.get(nextId) : undefined;
      continue;
    }
    current = current.nextId ? byId.get(current.nextId) : actions[(indexById.get(current.id) ?? -1) + 1];
  }
  return path;
}

function valueIsCompleted(value: ProgressValue | undefined) { return Boolean(value && value !== "unchecked"); }

/**
 * Replays only compiler-declared transitions. No model reasoning happens here:
 * this is the runtime state machine shown to the user and saved in Result.
 */
export function getProgramSnapshot(run: ExecutableRun, progress: Record<string, ProgressValue>) {
  const program = run.program;
  if (!program) return { state: undefined, variables: [] as Array<{ id: string; label: string; value: number; unit?: string }> };
  const byId = new Map(program.states.map((state) => [state.id, state]));
  const variables = new Map((program.variables ?? []).map((variable) => [variable.id, { id: variable.id, label: variable.label, value: variable.initialValue, unit: variable.unit, min: variable.min, max: variable.max }]));
  let stateId = program.initialState;
  const consumedTransitions = new Set<number>();
  while (consumedTransitions.size < program.transitions.length) {
    const transitionIndex = program.transitions.findIndex((item, index) => {
      if (consumedTransitions.has(index)) return false;
      if (item.from !== stateId) return false;
      const value = progress[item.componentId];
      return item.when === "completed" ? valueIsCompleted(value) : value === item.when;
    });
    if (transitionIndex < 0) break;
    const transition = program.transitions[transitionIndex];
    consumedTransitions.add(transitionIndex);
    for (const effect of transition.effects ?? []) {
      const variable = variables.get(effect.variableId);
      if (variable) variable.value = Math.max(variable.min, Math.min(variable.max, variable.value + effect.delta));
    }
    stateId = transition.to;
  }
  return { state: byId.get(stateId), variables: [...variables.values()].map(({ min: _min, max: _max, ...variable }) => variable) };
}

export function getProgramState(run: ExecutableRun, progress: Record<string, ProgressValue>): ProgramState | undefined {
  return getProgramSnapshot(run, progress).state;
}

function buildResult(session: SessionSnapshot, run: ExecutableRun): ResultArtifact {
  const items = getActiveActionPath(run, session.progress)
    .filter((component) => component.required)
    .map((component) => ({ componentId: component.id, title: component.title ?? component.id, status: session.progress[component.id] ?? "unchecked", source: component.source }));
  const completed = items.filter((item) => valueIsCompleted(item.status)).length;
  const snapshot = getProgramSnapshot(run, session.progress);
  const finalState = snapshot.state;
  const model = run.program?.model;
  const headline = model === "micro_lab"
    ? "本轮实验记录已生成"
    : model === "parameter_sandbox" || model === "rule_tester"
      ? "本次规则信号已形成"
      : model === "dialogue_rehearsal"
        ? "本次谈话准备路径已形成"
        : model === "diagnosis"
          ? "本次观察路径已形成"
          : finalState && finalState.id === run.program?.terminalState
            ? "本次知识运行已完成"
    : run.capability === "inspect"
    ? `已完成 ${completed} 项原文检查`
    : run.capability === "mission"
      ? `已推进 ${completed} 个行动阶段`
      : run.capability === "diagnose"
        ? "已保存本次判断路径"
        : `已完成 ${completed} 个练习步骤`;
  return {
    type: run.resultArtifact.type,
    normalCount: items.filter((item) => item.status === "normal").length,
    riskCount: items.filter((item) => item.status === "risk").length,
    uncheckedCount: items.filter((item) => item.status === "unchecked").length,
    matchedCount: items.filter((item) => item.status === "matched" || isChoiceValue(item.status)).length,
    notMatchedCount: items.filter((item) => item.status === "not_matched").length,
    needsReviewCount: items.filter((item) => item.status === "needs_review").length,
    headline,
    summary: finalState
      ? `你走完了本次选择的有限路径，当前结果为「${finalState.label}」。它只记录你的操作和原文锚定规则，不评价现实能力或处境。`
      : `本次记录包含 ${completed} 个已完成、由原文锚定的步骤。`,
    finalState,
    variables: snapshot.variables,
    items,
    completedAt: new Date().toISOString(),
  };
}

export async function completeSession(sessionId: string, accountKey?: string): Promise<SessionSnapshot> {
  const session = await getSessionDocument(sessionId);
  if (!session) throw new Error("SESSION_NOT_FOUND");
  if (session.accountKey && session.accountKey !== accountKey) throw new Error("SESSION_NOT_FOUND");
  const run = await getRunForSession(session);
  if (!run) throw new Error("RUN_NOT_FOUND");
  if (session.result) return session;
  const activePath = getActiveActionPath(run, session.progress);
  const required = activePath.filter((component) => component.required);
  const pathHasUnresolvedChoice = activePath.some((component) => component.type === "choice" && !isChoiceValue(session.progress[component.id] ?? "unchecked"));
  const complete = required.length > 0 && !pathHasUnresolvedChoice && required.every((component) => valueIsCompleted(session.progress[component.id]));
  if (!complete) throw new Error("COMPLETION_RULE_NOT_MET");
  session.result = buildResult(session, run);
  session.status = "completed";
  await saveSessionDocument(session);
  if (!session.runSnapshot) await incrementUsageDocument(session.runId, "completed");
  return session;
}
