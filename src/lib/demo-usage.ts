export type DemoUsage = { started: number; completed: number };

const usageKey = (articleId: string) => `zhihu-run-demo-usage:${articleId}`;
const pendingSync = new Map<string, Promise<void>>();

export function readDemoUsage(articleId: string): DemoUsage {
  if (typeof window === "undefined") return { started: 0, completed: 0 };
  try {
    const saved = JSON.parse(window.localStorage.getItem(usageKey(articleId)) ?? "{}") as Partial<DemoUsage>;
    return {
      started: Number.isFinite(saved.started) ? Math.max(0, Number(saved.started)) : 0,
      completed: Number.isFinite(saved.completed) ? Math.max(0, Number(saved.completed)) : 0,
    };
  } catch {
    return { started: 0, completed: 0 };
  }
}

/**
 * Keep a local optimistic value for instant feedback, while also sending the
 * event to the shared usage endpoint so different devices see one total.
 */
export function incrementDemoUsage(articleId: string, field: keyof DemoUsage): DemoUsage {
  const previous = readDemoUsage(articleId);
  const next = { ...previous, [field]: previous[field] + 1 };
  window.localStorage.setItem(usageKey(articleId), JSON.stringify(next));
  window.dispatchEvent(new CustomEvent("zhihu-run-demo-usage", { detail: articleId }));
  const pending = pendingSync.get(articleId) ?? Promise.resolve();
  const nextSync = pending.then(() => fetch(`/api/v1/demo/${articleId}/usage`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ field }) }).then(() => undefined)).catch(() => undefined);
  pendingSync.set(articleId, nextSync);
  return next;
}
