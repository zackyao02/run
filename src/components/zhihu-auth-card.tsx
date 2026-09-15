"use client";

import { useEffect, useState } from "react";

interface AuthState { authenticated: boolean; }

export function ZhihuAuthCard() {
  const [state, setState] = useState<AuthState>({ authenticated: false });
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch("/api/auth/status", { cache: "no-store" }).then((response) => response.ok ? response.json() : null).then((data) => data && setState(data)).catch(() => undefined).finally(() => setLoading(false));
  }, []);
  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setState({ authenticated: false });
  }
  return <article className="card auth-card"><div className="meta"><span className="pill">可选 P1</span><span className="pill">知乎账号</span></div><h3>{state.authenticated ? "知乎账号已连接" : "连接知乎账号"}</h3><p>{loading ? "正在检查登录状态…" : state.authenticated ? "登录状态已保存，可用于后续用户能力。" : "用于登录和读取授权用户基础信息；不影响文章 Run 主流程。"}</p>{state.authenticated ? <button className="secondary auth-action" onClick={logout}>退出登录</button> : <a className="secondary auth-action" href="/api/auth/zhihu/start">部署后授权知乎 →</a>}</article>;
}
