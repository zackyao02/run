"use client";

import { useEffect, useState } from "react";
import { readDemoUsage, type DemoUsage } from "@/src/lib/demo-usage";

export function DemoUsageStats({ articleId, compact = false }: { articleId: string; compact?: boolean }) {
  const [usage, setUsage] = useState<DemoUsage>({ started: 0, completed: 0 });

  useEffect(() => {
    const refresh = () => {
      setUsage(readDemoUsage(articleId));
      fetch(`/api/v1/demo/${articleId}/usage`)
        .then((response) => response.ok ? response.json() : null)
        .then((data) => { if (data?.usage) setUsage(data.usage); })
        .catch(() => undefined);
    };
    const onUsage = (event: Event) => {
      if (event instanceof CustomEvent && event.detail === articleId) refresh();
    };
    refresh();
    window.addEventListener("zhihu-run-demo-usage", onUsage);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("zhihu-run-demo-usage", onUsage);
      window.removeEventListener("storage", refresh);
    };
  }, [articleId]);

  if (!usage.started) return <div className={compact ? "demo-usage demo-usage-compact" : "demo-usage"}><span>首批体验 · 从你的真实情况开始</span></div>;
  return <div className={compact ? "demo-usage demo-usage-compact" : "demo-usage"} aria-label={`运行 ${usage.started} 次，完成 ${usage.completed} 次`}>
    <span>▶ {usage.started} 次运行</span>
    <span>✓ {usage.completed} 次完成</span>
  </div>;
}
