# 26 — Source Anchor Spec

## 1. Source Block

入库后把 Full Source 切为稳定 block：

```text
block_id
source_id
block_index
start_offset
end_offset
text
block_hash
```

## 2. Anchor

```json
{
  "blockId": "...",
  "quote": "...",
  "startOffset": 10,
  "endOffset": 30,
  "blockHash": "..."
}
```

## 3. Validator

必须验证：

1. block 属于当前 source；
2. block hash 与当前版本一致；
3. offset 合法；
4. quote 与 block 中对应片段一致或只存在标点/空格归一化差异。

## 4. Source Change

若 `content_hash` 变化：

```text
run.needs_recompile = true
```

旧 Run 可继续保留历史版本，但 Admin 应看到警告。

## 5. 目的

- 防引用漂移
- 精确展示依据
- 支撑 Compiler 可审计
- 避免纯语义“模型说有出处”
