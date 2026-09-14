import { notFound } from "next/navigation";
import { InspectRunner } from "@/src/components/inspect-runner";
import { ExecutableWorkbench } from "@/src/components/executable-workbench";
import { GenericRunner } from "@/src/components/generic-runner";
import { ProgramRunner } from "@/src/components/program-runner";
import { getPublishedRunBundle } from "@/src/data/catalog";

export default async function RunPage({ params }: { params: Promise<{ runId: string }> }) {
  const { runId } = await params;
  const bundle = await getPublishedRunBundle(runId);
  if (!bundle) notFound();
  // A published program always goes through the state-machine runner.  In
  // particular, editorial rule-test Runs may contain input and choice nodes;
  // sending those nodes to the legacy form workbench prevents their progress
  // (and therefore genuine usage) from being recorded.
  if (bundle.run.program && bundle.run.program.model !== "verification") return <ProgramRunner run={bundle.run} source={bundle.source} sessionEndpoint={`/api/v1/runs/${runId}/sessions`} usageEndpoint={`/api/v1/runs/${runId}`} />;
  if (bundle.run.inputs?.length) return <ExecutableWorkbench run={bundle.run} source={bundle.source} sessionEndpoint={`/api/v1/runs/${runId}/sessions`} />;
  if (bundle.run.capability === "inspect") return <InspectRunner run={bundle.run} source={bundle.source} sessionEndpoint={`/api/v1/runs/${runId}/sessions`} usageEndpoint={`/api/v1/runs/${runId}`} />;
  return <GenericRunner run={bundle.run} source={bundle.source} sessionEndpoint={`/api/v1/runs/${runId}/sessions`} usageEndpoint={`/api/v1/runs/${runId}`} />;
}
