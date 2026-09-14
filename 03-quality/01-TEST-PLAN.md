# Test Plan V1.4

## 自动化最低集

1. JSON / YAML 机器合约可解析。
2. Inspect 与 Diagnose fixture 通过 Executable Schema。
3. Choice 缺少 options、nextId 无效或客户端提交不存在的 `choice:<optionId>` 时拒绝；有效选择只完成其声明路径。
4. Search excerpt 不能进入 Compiler。
5. 错误 quote、offset、blockHash 分别导致 Anchor Validation 失败。
6. 第一次有效 Progress 只计一次 Started；Preview Session 不计入公开 Usage。
7. Complete 未满足规则返回冲突；重复成功请求返回同一 Result。
8. Runtime 测试环境没有 LLM 调用；Practice、Mission、Diagnose 的 Result 只由 Progress 与 Schema 确定性生成。
9. Programability Gate 拒绝只含线性 task 的来源；新编译 Run 缺少两种 primitives、缺少状态或 required Action 未触发状态迁移时拒绝。
10. Mission fixture 的 `目标已框定 → 路径已选择 → 变化已记录` 状态机在 task、choice、task 后进入 terminal state；Result 返回该状态。
11. 七种模型 fixture 均能创建 Session、进行声明动作并完成：情境模拟、诊断、微型实验、规则测试、行动编排、对话排练、参数沙盘。
12. 情境变量只由 Schema transition effect 更新；诊断只可抵达原文声明的落点；实验 timer 未结束时不可提交；参数滑块只映射到声明的 finite choice value。

## 手工主链路

- 发现 → 详情 → 开始 → 首次交互 → 查看来源 → 刷新恢复 → 完成 → Result。
- 手机竖屏、微信内置浏览器、iOS Safari 与 Android Chromium 至少各检查一次可用路径。
- LLM 与知乎 Provider 关闭后，已发布 Hero 仍能运行。
- 空列表、保存失败、来源不可用、Session 不存在有清楚提示。
- 草稿先完整运行 Preview；Bounded Supporting 在 Hero 未发布时只显示“已批准，等待 Hero”，不可出现在公开目录。

## 真实数据验收

- 至少一条官方 Full Source 经 Judge、Compiler、Validators、Preview、Publish 全链路。
- 至少一条 Bounded Source Excerpt 证明覆盖范围披露、范围内 Anchor 校验与跨范围内容拒绝均有效。
- Hero 与两个 Supporting 都有作者、原文链接与可点击 Anchor。
- 不适合执行、高风险、摘要来源至少各有一个 Reject 样例。

## Demo 回归

- 连续完整彩排 3 次。
- 每次 3 分钟以内，前 20 秒完成首次有效操作。
- 刷新恢复和来源高亮不依赖现场 LLM。
- 备用录屏与当前版本一致。

P1 才做大规模 Baseline、覆盖率指标、性能压测或完整 E2E 套件。
