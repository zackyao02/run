# Runtime Component Spec V1.4

## P0 Grammar

### Inspect

完整实现：对象或材料 → 逐项检查 → 正常/风险/未确认 → Result。

### Diagnose

仅用于一个 Supporting Run：显示当前问题、原文支持的 2–5 个选项，并沿预编译路径到达 Result。真实内容池不支持时不强行发布。

Mission、Practice、Configure、Compare 属于未来兼容能力，不构成 P0 实现范围。

## P0 Component

- IntroCard
- CheckItem
- TaskCard
- ChoiceCard
- ResultCard
- Progress
- SourceEvidenceSheet

`input`、`warning`、`timer` 可保留在 Schema 枚举中，但 P0 Compiler 必须拒绝发布使用未实现组件的 Run。

## Choice 结构

每个 choice 必须有 2–5 个 options：

```json
{
  "id": "choice_1",
  "type": "choice",
  "options": [
    {"id": "yes", "label": "是", "nextId": "result_a"},
    {"id": "no", "label": "否", "nextId": "result_b"}
  ]
}
```

`nextId` 必须指向同一 Schema 内存在的 component id。

## Runtime Rules

- 不访问 LLM 或知乎实时接口。
- 只渲染已发布 Version 中的组件。
- Source Evidence 由已验证 Anchor 生成。
- 本地先反馈，后台保存失败可重试。
- Completion 由后端验证。
- Result 由 Schema + Progress 计算。
- 用户自由文本不得改变行动集合。

## UX

关键点击区域 ≥44px；不依赖 hover；不只用颜色表达状态；刷新后恢复；Diagnose 一次只展示当前分支。
