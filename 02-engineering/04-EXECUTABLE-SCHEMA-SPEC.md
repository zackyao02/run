# Executable Schema Spec V1.4

机器定义：`spec/executable-run.schema.json`

## Root

必须包含：

- schemaVersion
- title
- description
- capability
- estimatedMinutes
- sourceRef
- program（新编译 Run 必填）
- components
- completion
- resultArtifact

## Source Anchor

行动组件引用：

```json
{
  "source": {
    "blockId": "block_uuid",
    "quote": "原文片段",
    "startOffset": 12,
    "endOffset": 36,
    "blockHash": "sha256..."
  }
}
```

## Schema Component Superset

- intro / check / task / choice / input / warning / timer / result

P0 Runtime 只实现 intro、check、task、choice、result。其余枚举用于未来兼容，不构成实现授权。包含未实现组件的候选必须在发布前拒绝。

`sourceEvidence` 由 Runtime 根据 source anchor 自动渲染，不要求模型重复生成 UI 节点。

## Hard Limits

- components：2–20
- choice options：2–5
- diagnose depth：≤8
- source quote：建议 ≤200 字
- schema 总大小：≤100KB
- 禁止 HTML/JS/SQL/eval/expression

## Completion

P0：
- all_required_completed
- result_reached
- stage_completed

不允许模型定义可执行 custom code。

choice 必须显式包含 `options`；每项包含稳定 `id`、用户可读 `label` 与指向同一 Schema component 的 `nextId`。

## Program State Machine

`program` 将 Run 声明为一个小程序，而不是任务列表：

- `model`：verification / gated_path / diagnosis / practice_cycle；
- `primitives`：至少两个可原文锚定的程序原语；
- `states`：2–8 个用户可见的执行状态；
- `transitions`：由某个 component 的 `completed` 或 `choice:<optionId>` 触发的状态迁移。

每一个 required check、task、choice 或 input 都必须至少出现在一条 transition 中。Runtime 只回放这个声明，不推测新的状态或路径。

## Result Artifact

Schema 只声明 Artifact 类型与允许聚合字段，例如：

```json
{
  "resultArtifact": {
    "type": "inspect_summary",
    "fields": ["normalCount", "riskCount", "uncheckedCount"]
  }
}
```

## Stable Runtime Rule

同一 `run_version_id` 的所有 Session 必须消费相同 Schema。

用户 Progress 可以改变：
- 当前节点
- component value
- completion

不能改变：
- Schema 行动集合
- Source Anchor
- Compiler 结果
