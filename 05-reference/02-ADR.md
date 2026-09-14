# ADR V1.4

## ADR-001 — LLM 只生成 Schema
Accepted。

## ADR-002 — Runtime 不依赖 LLM
Accepted。

## ADR-003 — Started 必须有效交互
Accepted。

## ADR-004 — Completed 不等于 Outcome
Accepted。

## ADR-005 — Hero 锁定用户与 Grammar，Source 数据驱动
Accepted。锁定职业成长用户与 Inspect；默认简历自检，真实内容不达标时仅在同一用户与 Grammar 内替换题材。

## ADR-006 — Source Anchor 采用 block + offset + hash
Accepted。

## ADR-007 — Candidate 与 Run 发布状态分离
Accepted。

## ADR-008 — Schema 只存 run_versions
Accepted。run_apps 通过 active_version_id 指向当前版本。

## ADR-009 — Result Artifact 属于 P0
Accepted。否则用户完成后的直接收益过弱。

## ADR-010 — Published Run 搜索属于 P0-lite
Accepted。只查本地数据库，不实时请求知乎。

## ADR-011 — P0 内容规模
Superseded。V1.4 改为 1 个精修 Hero + 2 个 Supporting Run。数量不再作为完整性的代理指标。

## ADR-012 — 官方 Skill 版本锁定
Accepted：`0.7.2-beta.20260911131715`。

## ADR-013 — 产品类别锁定为 Executable Knowledge
Accepted。

## ADR-014 — P0 禁止 Runtime LLM
Accepted。既是稳定性决策，也是与 Action Agent 的产品边界。

## ADR-015 — P0 Source → Canonical Run 1:1
Accepted。版本变化进入 run_versions。

## ADR-016 — “从内容到行动”不再作为主创新语言
Accepted。主创新改为 Knowledge Object → Executable Version。

## ADR-017 — P0 不提供公共编译与排行
Accepted。编译只在受保护的内部流程进行；排行不支撑核心价值。

## ADR-018 — 部署属于提交前门禁
Accepted。公网 Demo 是硬性交付，但不把赛前公开写成规避原创要求的方案。
