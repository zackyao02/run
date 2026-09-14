# 25 — Result Artifact Spec

## 目标

让用户在完成 Run 后获得直接价值，而不是只给平台贡献一次 Count。

## Inspect

```json
{
  "type": "inspect_summary",
  "normalCount": 7,
  "riskCount": 2,
  "uncheckedCount": 1,
  "items": [
    {
      "componentId": "component_id",
      "title": "检查项标题",
      "status": "risk",
      "source": {
        "blockId": "source_block_id",
        "quote": "原文引用",
        "startOffset": 0,
        "endOffset": 4,
        "blockHash": "sha256"
      }
    }
  ]
}
```

## Mission（未来兼容，非 P0）

```json
{
  "type": "mission_snapshot",
  "completedTasks": 6,
  "totalTasks": 9,
  "currentStage": "demo",
  "remainingTaskIds": []
}
```

## Diagnose（仅 Supporting）

```json
{
  "type": "diagnose_trace",
  "reachedResultId": "result_x",
  "visitedNodeIds": [],
  "eliminatedBranches": []
}
```

## 规则

- 只根据 Schema + Progress 计算；
- 必须保留逐项状态；Result 不能只返回三个计数；
- 风险项与未确认项应能从 Result 重新打开对应 Source Anchor；
- 不调用 LLM；
- 不把“到达 Result”表述为现实问题一定解决；
- 若展示下一建议，必须由原 Schema/source 支持；
- Artifact 可在“我的”回看。

## V1.4 额外限制

Result Artifact 是“本次执行记录”，不是 Agent 的新一轮回答。

禁止：
- 推断现实结果成功
- 生成个人化后续行动
- 加入 Source 未覆盖的建议
