import { NextResponse } from "next/server";
import { listPublishedRunBundles, publishRunBundle } from "@/src/data/catalog";
import { isOperatorRequest } from "@/src/domain/operator-auth";
import { getDraft, saveDraft } from "@/src/domain/operator-store";
import { validateExecutableRun } from "@/src/domain/source-anchor";

function programErrors(run: { program?: { primitives: string[]; states: Array<{ id: string }>; initialState: string; terminalState: string; transitions: Array<{ componentId: string }> }; components: Array<{ id: string; required?: boolean; type: string }> }) {
  const program = run.program;
  if (!program || program.primitives.length < 2 || new Set(program.primitives).size !== program.primitives.length) return ["PROGRAM_MODEL_REQUIRED"];
  const states = new Set(program.states.map((state) => state.id));
  if (!states.has(program.initialState) || !states.has(program.terminalState)) return ["PROGRAM_STATE_INVALID"];
  const transitions = new Set(program.transitions.map((transition) => transition.componentId));
  if (run.components.some((component) => component.required && ["check", "task", "choice", "input"].includes(component.type) && !transitions.has(component.id))) return ["PROGRAM_TRANSITION_MISSING"];
  return [];
}

export async function POST(request: Request, context: { params: Promise<{ draftId: string }> }) {
  if (!isOperatorRequest(request)) return NextResponse.json({ error: "OPERATOR_AUTH_REQUIRED" }, { status: 401 });
  const body: unknown = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || (body as Record<string, unknown>).approved !== true) return NextResponse.json({ error: "HUMAN_PREVIEW_APPROVAL_REQUIRED" }, { status: 409 });
  const role = (body as Record<string, unknown>).role;
  if (role !== "hero" && role !== "supporting") return NextResponse.json({ error: "PUBLISH_ROLE_REQUIRED" }, { status: 400 });
  const { draftId } = await context.params;
  const draft = await getDraft(draftId);
  if (!draft) return NextResponse.json({ error: "DRAFT_NOT_FOUND" }, { status: 404 });
  const validationErrors = validateExecutableRun(draft.run, draft.source);
  if (validationErrors.length) return NextResponse.json({ error: "VALIDATION_FAILED" }, { status: 409 });
  const programValidationErrors = programErrors(draft.run);
  if (programValidationErrors.length) return NextResponse.json({ error: programValidationErrors[0] }, { status: 409 });
  if (role === "hero" && draft.source.completeness !== "full") return NextResponse.json({ error: "HERO_REQUIRES_FULL_SOURCE" }, { status: 409 });
  if (role === "supporting" && !(await listPublishedRunBundles()).some((bundle) => bundle.role === "hero")) {
    // Keep human approval without making an excerpt a public surrogate Hero.
    draft.state = "ready";
    draft.approvedRole = "supporting";
    await saveDraft(draft);
    return NextResponse.json({ published: false, ready: true, role, runId: draft.run.sourceRef.sourceId, detail: "Supporting 已通过人工预览，等待 Full Source Hero 发布后再公开。" });
  }
  await publishRunBundle({ run: draft.run, source: draft.source, role });
  draft.state = "published";
  draft.approvedRole = role;
  await saveDraft(draft);
  return NextResponse.json({ published: true, role, runId: draft.run.sourceRef.sourceId, source: { title: draft.source.title, coverage: draft.source.coverage } });
}
