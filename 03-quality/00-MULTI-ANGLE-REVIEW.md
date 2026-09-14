# Multi Angle Review V1.10

完整裁决见 `00-governance/MULTI-ANGLE-DECISION.md`。

## 2026-09-14 复审结论

**CONDITIONAL GO。** 产品机制与 Runtime 已达到可演示完整度；唯一不能由工程替代的主风险仍是：是否能从官方内容池获得足以发布的真实 Source。当前 Published Run 仍为 0，这一事实必须如实保留。

### 五个视角的裁决

| 视角 | 结论 | 已落实的优化 | 仍需人工验证 |
|---|---|---|---|
| 评委 / 创新 | 有竞争力 | Run 必须由原文选择程序模型、状态机与结果物，线性清单会拒绝 | 至少两种真实 Grammar 能否稳定发布 |
| 用户体验 | 主链路清楚 | 情境、诊断、实验、规则、编排、对话、沙盘各有不同运行界面；Result 可展开原文上下文 | 手机上完成真实 Hero 的摩擦 |
| 内容可信 | 机制合格 | Source Scope、Anchor、模型一致性、人工 Preview 均为硬门禁 | Full Source 与 3000 字符 Bounded Excerpt 的真实候选质量 |
| 工程可靠 | 可交付 | Runtime 0 次 LLM；所有 required Action 迁移状态；断网保存失败不会再在 UI 假装成功 | 配置 Postgres 后的跨设备恢复与公网环境回归 |
| 合规 / 安全 | 已收紧 | fixture 仅能通过 `/dev` 以私有 session snapshot 运行，已从公开 Runtime 查询中移除 | 提交前保持仓库、部署与开发日志的真实状态 |

### 本轮发现与修复

1. **fixture 隔离**：公开 Runtime 不再查询任何 fixture；开发 fixture 只能以 session snapshot 进入 `/dev` 路由。
2. **状态一致性**：Generic / Inspect Runner 只在服务端 Progress 写入成功后更新 UI，网络失败不会显示虚假的“已完成”。
3. **证据可见性**：ProgramRunner 已加入与其他 Runner 一致的“展开原文上下文 / 定位原文”交互，quote 会在完整 block 中高亮。
4. **模型选择一致性**：Programability Judge、Planner 与 Compiler 必须选中同一个、由原文结构证明的模型；`approved` 与 `none` 的矛盾输出直接拒绝。

### 当前发布门禁

- 不得用任何 fixture、搜索摘要、description 或模型补写发布。
- Full Source 才可能成为 Hero；Bounded Source Excerpt 只能是持续披露范围的 Supporting。
- 每次真实候选必须经过：Source Scope → Candidate Screen → Judge / Planner / Compiler → Anchor + Semantic 校验 → 完整 Preview → 人工 Publish。
- 如模型接口或知乎接口失效，只允许运行已发布 Schema，不能现场临时生成替代内容。

## 历史结论（V1.7）

CONDITIONAL GO。机制有竞争力，但只有在“真实 Full Source Hero + 至少两个诚实披露范围的 Supporting + Source Anchor 可见 + 运行闭环稳定”同时成立时才值得提交。

## 评分预判

| 维度 | 当前判断 | 主要证据 | 最大风险 |
|---|---|---|---|
| 用户痛点 | 成立 | 读完方法后仍需执行和记状态 | 用户范围再次泛化 |
| AI 场景价值 | 较强 | 可执行性判断、结构编译、来源对齐与拒绝 | 被看成 JSON 抽取 |
| 知乎契合 | 较强 | 官方 Source Scope、作者与原文证据进入产品体验 | 换成任意网页也成立 |
| 创新防撞 | 中高 | Source-bound + Stable Runtime + Result 的组合 | 外观像 Checklist |
| 产品完整性 | 可达 | 五页主链路 + Session/Result | 被 Supporting 分散 |
| 工程可行性 | 可达 | 单体应用、3 个 Run、内部生产流程 | 真实接口响应未实测 |
| Demo | 可达 | 风险状态、原文高亮、Result 三个可见变化 | 现场编译超时 |
| 合规 | 需持续核对 | 日志与真实数据要求已纳入 | 提前公开或伪造时间线 |

## 进入实现前必须满足

1. 产品负责人批准冻结候选。
2. 真实接口实测区分 Full Source 与 Bounded Source Excerpt；不要依靠文档字段猜测。
3. Hero 默认 Source 至少达到选择 Rubric 的通过线。

## 一票否决

- Hero 使用片段、摘要、fixture 或模型补写冒充 Full Source。
- Supporting 使用片段却不披露覆盖范围或声称代表整篇文章。
- 关键 Action 无法回到原文。
- Runtime 运行时仍依赖 LLM。
- Demo 先讲架构，20 秒内看不到用户价值。
- 为证明泛化新增多个 Grammar，导致 Hero 不完整。
