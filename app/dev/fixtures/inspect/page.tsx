import { InspectRunner } from "@/src/components/inspect-runner";
import { inspectRun, inspectSource } from "@/src/data/fixture";

export default function InspectFixturePage() {
  if (process.env.NODE_ENV === "production") return null;
  return <InspectRunner run={inspectRun} source={inspectSource} sessionEndpoint="/api/v1/dev/fixtures/fixture_inspect/sessions" usageEndpoint="/api/v1/dev/fixtures/fixture_inspect/sessions" modeLabel="文章运行实验 / Inspect / 非 Hero" />;
}
