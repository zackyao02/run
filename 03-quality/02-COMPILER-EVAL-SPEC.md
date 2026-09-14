# Compiler Evaluation Spec V1.4

本文件用于 P1 离线答辩证据，不阻塞 P0 Hero 交付。

## 1. 评测目标

证明 Run 不是普通“文章→清单”。

## 2. 三组 Baseline

### A — Original
用户直接阅读。

### B — Generic LLM
固定 Prompt：
> 请把以下内容整理成一份可执行清单，不要遗漏重要步骤。

### C — Zhihu Run
完整 Compiler Pipeline。

## 3. 指标

### Grounding
`grounded actionable components / all actionable components`

### Hallucination
原文没有依据的关键行动数量。

### Statefulness
是否记录执行状态。

### Branch Fidelity
需要分支时是否按来源支持的逻辑分支。

### Interaction Advantage
用户是否更愿意在现实任务中使用。

### Completion Support
是否能判断“执行流程完成”，而非只输出文字。

## 4. Release Gate

Hero：
- Grounding = 100%
- Critical Hallucination = 0

Supporting:
- Grounding ≥ 95%
- Critical Hallucination = 0

## 5. Knowledge Pool Metrics

- Total Sources
- Full Sources
- Executable Rate
- Capability Distribution
- Median Run Score
- Reject Reasons

这些数据用于决定 Hero，不作为“知识质量排行榜”。

## 新增：Repeatability

同一 Source、同一 Run Version 在多次 Session 中：
- Schema 必须一致；
- Source Anchor 必须一致；
- 只允许 Progress 不同。

这是 Run 与一次性 Action Agent 的核心技术差异之一。
