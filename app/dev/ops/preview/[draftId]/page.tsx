import { notFound } from "next/navigation";
import { GenericRunner } from "@/src/components/generic-runner";
import { ProgramRunner } from "@/src/components/program-runner";
import { InspectRunner } from "@/src/components/inspect-runner";
import { ExecutableWorkbench } from "@/src/components/executable-workbench";
import { getDraft } from "@/src/domain/operator-store";

export default async function DraftPreviewPage({ params }: { params: Promise<{ draftId: string }> }) {
  if (process.env.NODE_ENV === "production") notFound();
  const { draftId } = await params;
  const draft = await getDraft(draftId);
  if (!draft) notFound();
  const endpoint = `/api/v1/ops/drafts/${draftId}/preview-sessions`;
  if (draft.run.program && draft.run.program.model !== "verification") return <ProgramRunner run={draft.run} source={draft.source} sessionEndpoint={endpoint} />;
  if (draft.run.inputs?.length) return <ExecutableWorkbench run={draft.run} source={draft.source} sessionEndpoint={endpoint} modeLabel="内部人工预览 · 不计入公开数据" />;
  if (draft.run.capability === "inspect") return <InspectRunner run={draft.run} source={draft.source} sessionEndpoint={endpoint} />;
  return <GenericRunner run={draft.run} source={draft.source} sessionEndpoint={endpoint} />;
}
