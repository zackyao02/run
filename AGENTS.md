# AGENTS.md — 知乎 Run V1.8

## 开工门禁

先读取 `00-governance/PRODUCT-FREEZE.md`。其 `Status` 不是 `APPROVED` 时，只允许只读核对、运行现有合约检查和报告冲突，不得创建产品代码、部署或改动机器契约。

## 必须先读

1. `00-governance/PRODUCT-FREEZE.md`
2. `spec/product-constraints.json`
3. `01-product/01-PRD.md`
4. `02-engineering/00-SRS.md`
5. `spec/executable-run.schema.json`
6. `spec/judge-result.schema.json`
7. `spec/openapi.yaml`
8. `04-delivery/00-IMPLEMENTATION-PLAN.md`

## 不允许自行改变

- 产品类别是 Executable Knowledge。
- Hero 与 Supporting Run 不预设职业、简历或租房等固定场景；真实内容由官方可验证 Source Scope 与 Grammar 决定程序形态。赛事模拟知识可使用完整预置原文，但必须在用户界面明确标为“赛事模拟知识”。
- AI 只在编译期，Runtime 不调用 LLM。
- Search 摘要不能进入 Compiler；只有 Full Source 或赛事详情接口提供、范围明确的 Bounded Source Excerpt 可以进入。
- 关键 Action 必须 Source-bound。
- Started 是首次有效组件交互，不是打开或点击开始。
- Completed 是 Schema 完成条件满足，不是现实结果已实现。
- P0 一份 Source 只维护一个 canonical Run，更新生成新 Version。
- P0 至少交付 1 个 Full Source Hero，目标 3–5 个 Published Run；Supporting 可使用官方 Bounded Source Excerpt，但必须披露覆盖范围，至少两种 Grammar。

## P0 禁止新增

- 公开编译页、完整 Admin UI。
- Chat、Action Agent、多 Agent、个性化下一步。
- 社交、评论、复杂推荐、积分、徽章、打卡。
- 任意 HTML、JS、SQL、Shell 或 Python 生成与执行。
- CI、Docker、监控平台、微服务、Redis、成套企业级基建。

非 P0 fixture 或枚举只用于兼容与测试，不构成实现授权。

## 可选 P1：OAuth

- OAuth 仅作为可选 P1 登录能力，不阻塞文章 Run 主流程。
- App ID 可进入公开配置；App Key、OAuth Token 只能留在服务端 Secret/内存会话。
- 真实授权必须使用公网 HTTPS `/auth/callback`，本地地址只允许页面预览。
- 不得把 OAuth 用户数据混入官方知识 Source，也不得让登录改变 Source-bound 规则。

## 实现顺序

Contract Check → Migration/Types → Runtime → Session/Result → Public API/UI → Provider → Compiler/Validator → Protected Preview/Publish → Real Content → Deployment → Demo QA。

每个阶段先验证验收证据，再进入下一阶段。遇到冲突时记录冲突文件、条款、影响和最小替代建议，等待产品负责人裁决。
