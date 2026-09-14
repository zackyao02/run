import { notFound } from "next/navigation";
import { GenericRunner } from "@/src/components/generic-runner";
import { ProgramRunner } from "@/src/components/program-runner";
import { ExecutableWorkbench } from "@/src/components/executable-workbench";
import { fixtureRuns, fixtureSources } from "@/src/data/fixture";

export default async function FixtureRunPage({ params }: { params: Promise<{ runId: string }> }) {
  if (process.env.NODE_ENV === "production") return null;
  const { runId } = await params;
  const run = fixtureRuns.find((item) => item.sourceRef.sourceId === runId);
  if (!run || runId === "fixture_inspect") notFound();
  const source = fixtureSources[runId];
  if (run.program?.model === "rule_tester") return <ExecutableWorkbench run={run} source={source} sessionEndpoint={`/api/v1/dev/fixtures/${runId}/sessions`} modeLabel="规则压力测试器 / 非 Hero" />;
  return run.program && run.program.model !== "verification"
    ? <ProgramRunner run={run} source={source} sessionEndpoint={`/api/v1/dev/fixtures/${runId}/sessions`} usageEndpoint={`/api/v1/dev/fixtures/${runId}/sessions`} />
    : <GenericRunner run={run} source={source} sessionEndpoint={`/api/v1/dev/fixtures/${runId}/sessions`} usageEndpoint={`/api/v1/dev/fixtures/${runId}/sessions`} />;
}
