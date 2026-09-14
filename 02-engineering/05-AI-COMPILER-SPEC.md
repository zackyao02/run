# AI Compiler Spec V1.7

## Pipeline

```text
Official Verifiable Source Scope
→ Judge
→ Planner
→ Compiler
→ Parser
→ Source Anchor Validator
→ Semantic Validator
→ Safety Validator
→ Preview
```

## Source Scope Gate

```text
completeness not in [full, bounded_excerpt]
→ SOURCE_SCOPE_NOT_ELIGIBLE
```

普通 Zhihu Search `ContentText`、列表 `description`、详情 `introduction` 和模型补写都是摘要或派生文本，不能绕过此门禁。

`bounded_excerpt` 仅限赛事官方详情接口的 `content`。Compiler 必须接收并保留
`coverage.startOffset/endOffset/providerLimit/disclosure`，只编译范围内语义完整、可锚定的动作；不得补全截断句、推断后文或生成整篇结论。

## Judge

机器 Schema：`spec/judge-result.schema.json`

必须判断：

- taskIntent
- actionKnowledge
- interactionAdvantage
- completionState
- groundability
- riskLevel
- recommendedCapability
- runScore
- confidence
- reason

## Run Score

只用于内部排序，不是“知识质量分”。

建议维度：

- Task Intent 20
- Action Knowledge 20
- Interaction Advantage 25
- Completion State 15
- Groundability 20

阈值配置化。

## Planner

输出：
- interaction objective
- capability
- section / stage / branch strategy
- component palette
- expected completion
- result artifact type

P0 可规划 Inspect、Mission、Diagnose、Practice；具体 Grammar 必须由真实来源结构决定。Diagnose 仅当真实内容天然包含清晰、可锚定的条件分支时允许。不得为了凑类型强行套用 Grammar。

## Programability Gate

“能抽出步骤”不是通过条件。Source 必须支持至少两个不同、可逐项锚定的程序原语：

- 可观察状态（observable_state）
- 原文条件分支（source_backed_branch）
- 确定性评估（deterministic_evaluation）
- 反馈回路（feedback_loop）
- 可重复实验（repeatable_experiment）
- 可保留结果物（material_artifact）

Inspect 必须有状态和确定性评估；Diagnose 必须有原文分支；Mission 必须有状态及分支或结果物；Practice 必须有反馈/实验及状态或结果物。纯线性待办直接 `NOT_EXECUTABLE`。

## Compiler

禁止：
- 发明作者没说过的行动
- 把建议变必须
- 生成任意前端代码
- 用摘要补正文
- 把 Bounded Source Excerpt 描述成整篇文章
- 跨越 Source Coverage 生成行动或结论
- 强行为所有文章生成 Run
- 用只改文案的 step list 冒充状态机

## Source Anchor

先进行 block segmentation，再让 Compiler 选择 block 并引用 quote。Validator 必须确认：

- block 存在
- hash 匹配
- offset 合法
- quote 与 block 对应

## 编译期模型策略

P0 编译器使用 `deepseek-v4-pro`，经 Credits 的 OpenAI 兼容接口调用。模型只在受保护的 `POST /api/v1/ops/compile` 中运行；知乎官方详情接口仍是唯一 Source Provider。

- 请求使用 JSON Output（`response_format: { type: "json_object" }`）并在 Prompt 中显式要求 JSON；
- 关闭 thinking，避免把预算消耗在不可发布的推理文本；
- 仅“返回空内容”时允许重试一次；
- 无论模型声称结构正确与否，仍必须通过 Parser、Schema、Source Anchor、Semantic Validator 和人工 Preview；
- 已发布 Run 的 Runtime 永不调用该模型。

知乎直答可作为赛事接口能力留作独立研究，但不作为 P0 Compiler；它不能提供或替代官方原文。

## Repair

最多 2 次，只修结构，不修“知识事实”。

## Prompt

机器使用 Prompt 见 `prompts/`。

## V1.4 防 Action-Agent 规则

Compiler 可以把 Source 中已有的条件逻辑编译成分支。

Compiler 不得生成：
- “结合用户情况，我建议你现在……”
- Source 中不存在的个性化行动
- Runtime 需要再次问 LLM 才能知道下一步的节点

判定标准：

> 删除 LLM 网络连接后，这个 Run Version 是否仍然完整可运行？

若否，则不符合 V1.4 Runtime。
