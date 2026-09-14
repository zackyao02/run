import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import { InspectRunner } from "@/src/components/inspect-runner";
import { ExecutableWorkbench } from "@/src/components/executable-workbench";
import { GenericRunner } from "@/src/components/generic-runner";
import { ProgramRunner } from "@/src/components/program-runner";
import { getPublishedRunBundle } from "@/src/data/catalog";
import { getSession, OAUTH_IDENTITY_COOKIE, OAUTH_SESSION_COOKIE } from "@/src/domain/oauth";

export default async function RunPage({ params }: { params: Promise<{ runId: string }> }) {
  const { runId } = await params;
  const bundle = await getPublishedRunBundle(runId);
  if (!bundle) notFound();
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(OAUTH_SESSION_COOKIE)?.value;
  if (!getSession(sessionId, cookieStore.get(OAUTH_IDENTITY_COOKIE)?.value)) redirect(`/api/auth/zhihu/start?returnTo=${encodeURIComponent(`/runs/${runId}`)}`);
  // A published program always goes through the state-machine runner.  In
  // particular, editorial rule-test Runs may contain input and choice nodes;
  // sending those nodes to the legacy form workbench prevents their progress
  // (and therefore genuine usage) from being recorded.
  if (bundle.run.program && bundle.run.program.model !== "verification") return <ProgramRunner run={bundle.run} source={bundle.source} sessionEndpoint={`/api/v1/runs/${runId}/sessions`} usageEndpoint={`/api/v1/runs/${runId}`} />;
  if (bundle.run.inputs?.length) return <ExecutableWorkbench run={bundle.run} source={bundle.source} sessionEndpoint={`/api/v1/runs/${runId}/sessions`} />;
  if (bundle.run.capability === "inspect") return <InspectRunner run={bundle.run} source={bundle.source} sessionEndpoint={`/api/v1/runs/${runId}/sessions`} usageEndpoint={`/api/v1/runs/${runId}`} />;
  return <GenericRunner run={bundle.run} source={bundle.source} sessionEndpoint={`/api/v1/runs/${runId}/sessions`} usageEndpoint={`/api/v1/runs/${runId}`} />;
}
