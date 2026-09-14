# Go No Go Gate V1.4

## Gate A 产品

- 冻结候选已由产品负责人批准。
- Hero 用户、主流程和不做项不再变动；Grammar 由已验证的真实 Source 在 Inspect、Mission、Diagnose、Practice 中选择，且至少形成两种不同运行体验。

未通过：不得实现。

## Gate B 真实内容

实测官方接口并记录：

- Detail 是否返回完整正文。
- `work_id`、正文、作者、原文链接与配额字段的真实形态。
- 至少 5 个官方候选的行动点、风险和可锚定性；不预设职业或其他固定题材。

通过线：

- 至少 1 个 Hero 候选达到 Rubric 通过线。
- 至少 2 个 Supporting 候选可安全发布。
- 至少 1 个候选能自动编译并通过 Anchor Validation。

未通过：只允许在冻结版允许的 Source Scope 与 Grammar 范围内换题材；不得用 fixture 冒充，不得新增产品能力掩盖数据问题。

## Gate C Hero

- 完整主链路连续通过 3 次。
- Runtime 断开 LLM 后仍可运行。
- Source 高亮与 Result 人工复核。

未通过：停止 Supporting 与视觉加分，先修 Hero。

## Gate D 提交

- 公网链接异网可操作。
- 产品说明、录屏和当前实现一致。
- 无凭证、fixture、虚构使用数据或错误时间线进入提交物。
