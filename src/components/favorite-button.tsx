"use client";

import { useEffect, useState } from "react";

export function FavoriteButton({ runId }: { runId: string }) {
  const key = `zhihu-run-favorite:${runId}`;
  const [count, setCount] = useState(0);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setSaved(localStorage.getItem(key) === "saved");
    fetch(`/api/v1/runs/${runId}/favorite`)
      .then((response) => response.ok ? response.json() : null)
      .then((data) => { if (data && Number.isInteger(data.favorites)) setCount(data.favorites); })
      .catch(() => undefined);
  }, [key, runId]);

  async function save() {
    if (saved || busy) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/v1/runs/${runId}/favorite`, { method: "POST" });
      const data = await response.json();
      if (!response.ok) return;
      setCount(Number(data.favorites) || count + 1);
      setSaved(true);
      localStorage.setItem(key, "saved");
    } finally { setBusy(false); }
  }

  return <button type="button" className={`favorite-button ${saved ? "saved" : ""}`} aria-pressed={saved} disabled={busy} onClick={save} title={saved ? "已收藏" : "收藏这篇知识"}>
    <span aria-hidden="true">{saved ? "★" : "☆"}</span>{count} 次收藏
  </button>;
}
