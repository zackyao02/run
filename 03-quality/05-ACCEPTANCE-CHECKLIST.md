# Acceptance Checklist V1.4

## Freeze

- [x] `PRODUCT-FREEZE.md` 为 APPROVED，批准人和时间已填写。
- [ ] 未实现任何明确不做项。

## Product

- [ ] 至少一个真实 Full Source Hero 达到演示品质；其题材与模型均由原文结构决定，不预设职业、简历或其他固定场景。
- [ ] 目标 3–5 个真实 Published Run；Supporting 只能使用通过 Source Scope 与人工 Preview 的官方 Bounded Source Excerpt。
- [ ] 最终 Published Run 至少呈现两种明显不同的 Grammar；真实内容不支持的模型保持未发布，禁止拿 fixture 凑数。
- [ ] 发现、详情、运行、Result、历史/恢复可用。
- [ ] 无登录可以完成 Hero。

## Source 与 AI

- [ ] 至少一条官方 Full Source 自动完成 Judge → Compile → Validate → Preview → Publish。
- [ ] 至少一条 Bounded Source Excerpt 显示覆盖范围，且 Compiler/Validator 拒绝跨范围行动与整篇结论。
- [ ] Search 摘要不能进入 Compiler。
- [ ] 每个关键 Action 的 blockId、quote、offset、blockHash 校验通过。
- [ ] 不适合执行与高风险内容被拒绝。
- [ ] Compiler 不生成或执行任意代码。

## Runtime

- [ ] 运行时 0 次 LLM 调用。
- [ ] 创建 Session 不计 Started。
- [ ] 首次有效交互只计一次 Started。
- [ ] Completion 后端验证且幂等。
- [ ] 刷新后进度可恢复。
- [ ] Result 与 Schema/Progress 一致，不生成现实结论。
- [ ] 已发布 Run 具备至少两种可锚定程序原语；每个 required Action 迁移声明状态，普通线性清单被拒绝。
- [ ] Programability Judge、Planner 与最终 Run 的 `program.model` 一致；模型由原文结构而非题材、标题或关键词选择。
- [ ] 微型实验室的 required timer 完成后触发声明的状态迁移；参数沙盘只使用 Schema 声明的有限参数值。

## Demo 与提交

- [ ] 前 20 秒出现用户价值与首次有效交互。
- [ ] 3 分钟内完成 Hero、查看来源并看到 Result。
- [ ] 连续彩排 3 次通过。
- [ ] 公网 H5 在提交前用异网手机验证。
- [ ] 产品说明与实现一致，无虚构数据。
- [ ] 开发日志与 AI 交互记录真实保留。
- [ ] 备用录屏与当前产品版本一致。
