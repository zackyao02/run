# Changelog

## V1.10 — Seven Source-bound Program Models

- Runtime 增加情境模拟器、诊断路径图、微型实验室、规则压力测试器、行动编排器、对话排练器、参数沙盘七种模型。
- 新增有限状态变量、受限 transition effect、计时器、有限参数值与有限对话展示；它们都是 Schema 数据，绝不执行代码或调用运行时 AI。
- 真实文章的模型选择改为硬门禁：没有对应原文结构就拒绝，不能把线性文章包装成高级交互。
- 增加 7 个明确标注非 Hero 的工程 fixture 和模型目录文档。

## V1.9 — Program, not Checklist

- 产品规则升级：可发布 Run 至少要有两种可锚定的程序原语，且每个 required Action 必须触发状态迁移。
- 新增声明式 `program`（状态、转移、原语）；Runtime 只回放已发布 Schema，继续保持 0 次运行时 LLM 调用。
- Candidate Screener / Programability Judge 直接拒绝普通线性待办；不再把“能拆出几步”当作可编译理由。
- Generic Runner 改为显示当前程序状态、状态地图、最终状态和迁移记录。

## V1.7 — 2026-09-13

- 产品负责人批准 Source Scope 分级：Full Source 用于 Hero，赛事官方详情的 Bounded Source Excerpt 可用于 Supporting Run。
- Provider 不再把 3000 字符响应简单拒绝，而是标记 `bounded_excerpt`，附带精确覆盖范围和强制披露文案。
- Compiler 边界新增：不得补全截断句、推断后文、跨覆盖范围生成行动，或把片段描述成整篇文章。
- 搜索摘要、列表 description、详情 introduction 与模型补写仍禁止进入 Compiler。

## 2026-09-13 — Zhihu Skill 0.7.2

- 升级官方 `zhihu-cli-skill` 到 `0.7.2-beta.20260911131715`。
- 安装并验证 Windows CLI `0.6.0-beta.20260908125143`，满足新版 Skill 最低版本要求。
- 工程包版本标记、来源事实和 ADR 已同步更新。
- 实测修正知识详情接口：当前知识列表 `work_id` 使用 `/knowledge/{work_id}` 返回 Full Source；新版 Skill 中的 `/story/{work_id}` 对知识 ID 返回 404，已记录为运行时 Go/No-Go 项。
- 将 Run 数量从固定 6 个调整为“至少 1 个真实 Hero、目标 3–5 个、通过完整性门禁后可扩展”，避免用截断正文凑数量。

## V1.6 — Source-driven Run reset

- 恢复通用产品方向：不预设简历、职业或租房场景，程序形态由 Full Source 与 Grammar 决定。
- 统一冻结文件、门禁、PRD、SRS、约束与 Compiler/Programability Judge 提示词。
- Runtime 支持多种可执行组件与对应 Result 类型；保留 Started / Completed Usage。
- 合成 fixture 仅用于本地链路验证，不进入 Published 目录。

## V1.5 — Rule Execution Workbench

- Hero 交互收口为“本地输入 → 原文规则 → 确定性状态 → 结果 → 原文证据”。
- 新增 Executable Schema 1.3、Programability Judge Schema、确定性 Evaluator 与 Source Anchor offset 校验。
- 原始用户输入只留在浏览器；Progress API 增加字段白名单并拒绝正文数据。
- 新增 8 条规则的简历工作台合成 fixture；动画降级为通用执行反馈，不按文章关键词生成。

## V1.4 — Product Freeze Candidate

- 新增 `00-governance/PRODUCT-FREEZE.md` 与多角度裁决；该文件于 2026-09-10 经产品负责人批准。
- 第一用户收敛为求职或初入职场的学生与新人；Hero 锁定 Inspect，默认简历自检。
- P0 从 6–10 个 Run、三种 Grammar 收缩为 1 个 Hero + 2 个 Supporting、最多两种 Grammar。
- 删除排行、公共编译、完整 Admin UI、OAuth 和产品内 Baseline 的 P0 要求。
- 用阶段 Gate 替代 48 小时时间盒；部署调整为提交前门禁。
- Public OpenAPI 删除 rankings，增加 Session 历史。
- 修复 choice 组件缺少 options 机器定义和 Diagnose fixture 无选项的问题。
- 统一 README、PRD、SRS、UX、Demo、测试、风险、验收、部署与 Codex 指令。

## V1.3 — Multi-angle Review Consolidation

- 产品类别正式锁定为 `Executable Knowledge`。
- 核心叙事从“内容→行动”收紧为“Knowledge Object → Executable Version”。
- 新增 Action Agent / Interactive Content / App Builder 防撞边界。
- P0 禁止 Runtime LLM 和个性化“下一步”生成。
- P0 一份 Source 只维护一个 canonical Run，版本变化进入 `run_versions`。
- 新增 `AGENTS.md` 与 `spec/product-constraints.json` 约束 Codex。
- 新增多角度评审、竞品矩阵、定位护栏、评委 Q&A、官方评分映射。
- 新增 Hero Selection Rubric、Submission Checklist、Codex First Task。
- 文档按 Product / Engineering / Quality / Delivery / Reference 重构。
- 保留并验证 V1.2.1 的 Schema / Fixture / OpenAPI 合约。

## V1.2.1

- 修复 Fixture contentHash / Source Anchor 契约问题。
- Actionable Component 的机器 Schema 强制 source。
- 新增 local contract check 与 Knowledge Pool smoke test。
