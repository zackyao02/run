# 多角度评审与范围裁决 V1.4

## 结论

项目值得继续，但必须从“能力展示平台”收敛为一个用户一眼能懂的执行工具。获奖优势来自三件事：真实知乎来源、AI 编译的必要性、运行时稳定可追溯；不是功能数量。

## 评审矩阵

| 角度 | V1.3 主要问题 | V1.4 裁决 |
|---|---|---|
| 用户 | “方法型知识用户”过宽 | 锁定求职与初入职场人群 |
| 痛点 | 技术概念先于用户时刻 | 锁定“读完后真正照做”的执行摩擦 |
| AI 必要性 | 容易被理解为 JSON 抽取 | 强调判断可执行性、交互结构化、来源对齐与拒绝机制 |
| 知乎契合 | 任意网页也能做 | P0 只接受知乎 Full Source，保留作者、原文与社区知识语境 |
| 创新 | 与 Checklist、RAG、Agent 容易撞 | 用 Compile Once、Source-bound、Deterministic Runtime、Result Artifact 形成组合差异 |
| UX | 三种 Grammar、多个 Hero 增加解释成本 | 一个 Hero、一个首要 Grammar，Supporting 只证明泛化 |
| 工程 | 固定数量 Run、排行、7 个 Admin 端点过度 | 目标 3–5 个 Run、数量受 Full Source 门禁约束、内部 Preview/Publish 最小闭环 |
| Demo | 现场编译容易超时且抢占用户价值 | 前 20 秒先展示用户价值；编译证据短展示，Hero 使用预发布版本 |
| 安全 | 公开编译入口带来费用和滥用 | 编译流程仅内部受保护，不提供公共入口 |
| 合规 | 把赛前公开部署写成任务存在风险 | 部署是提交前验收门禁；日志保持真实，不修改时间线 |

## 被删除或降级的范围

- 固定 6–10 个 Run → 至少 1 个真实 Hero、目标 3–5 个，完整性通过后再扩展。
- 3 个 Grammar → Inspect P0，Diagnose 单个 Supporting，Mission P2。
- 排行榜 → 删除。
- 完整 Admin UI 和 7 个端点 → 最小受保护 Preview/Publish 流程。
- 公开实时编译页 → 删除；现场编译只作可选证明。
- OAuth → P1。
- Generic LLM Baseline → 离线答辩材料，不进入产品。
- CI、Docker、监控、Redis、微服务 → 不做。

## 最大剩余风险

真实内容池可能没有适合默认 Hero 的 Full Source。解决方式不是预先做更多 Grammar，而是在保持用户、低风险、Inspect 与 Source Anchor 不变的前提下替换具体职业成长题材。
