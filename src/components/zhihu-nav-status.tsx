"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type AuthState = {
  authenticated: boolean;
  profile?: { name?: string; avatarUrl?: string } | null;
};

export function ZhihuNavStatus() {
  const [state, setState] = useState<AuthState>({ authenticated: false });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/status", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: AuthState | null) => {
        if (data) setState(data);
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  if (loading || !state.authenticated) {
    return <Link className="nav-login" href="/api/auth/zhihu/start?returnTo=/">登录知乎</Link>;
  }

  const name = state.profile?.name?.trim() || "知乎账号";
  return <span className="nav-account" aria-label={`已登录知乎账号：${name}`}>
    <span className="nav-avatar" aria-hidden="true">
      {state.profile?.avatarUrl ? <img src={state.profile.avatarUrl} alt="" /> : name.slice(0, 1)}
    </span>
    <span className="nav-account-name">{name}</span>
  </span>;
}
