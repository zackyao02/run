import { notFound } from "next/navigation";
import { GenericRunner } from "@/src/components/generic-runner";
import { ProgramRunner } from "@/src/components/program-runner";
import { fixtureRuns, fixtureSources } from "@/src/data/fixture";

/** Product interaction lab. It is a user-facing experience route, but its
 * synthetic sources are never included in the published Zhihu Run catalog. */
export default async function PlayPage({ params }: { params: Promise<{ runId: string }> }) {
  if (process.env.NODE_ENV === "production") notFound();
  const { runId } = await params;
  const run = fixtureRuns.find((item) => item.sourceRef.sourceId === runId);
  const source = fixtureSources[runId];
  if (!run || !source) notFound();
  const endpoint = `/api/v1/dev/fixtures/${runId}/sessions`;
  if (run.program && run.program.model !== "verification") return <ProgramRunner run={run} source={source} sessionEndpoint={endpoint} usageEndpoint={endpoint} prototype />;
  return <GenericRunner run={run} source={source} sessionEndpoint={endpoint} usageEndpoint={endpoint} />;
}
