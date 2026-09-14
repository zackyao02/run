# Content Provider Spec V1.7

> 2026-09-13 live verification: the hackathon knowledge detail endpoint is
> `/knowledge/{work_id}`. The `/story/{work_id}` path returns 404 for these
> knowledge IDs and must not be used by the Provider.

## Interface

```ts
interface ContentProvider {
  listCandidates(): Promise<ContentCandidate[]>
  getSource(externalId: string): Promise<NormalizedSource | null>
}
```

## HackathonKnowledgeProvider

### listCandidates
调用 `/knowledge/list`

### getSource
调用 `/knowledge/{work_id}`

校验：
- ID 来自 List
- 非空
- 记录 `content.length`；当前线上接口对长内容会在 3000 字符处硬截断，长度达到 3000 时标记为 `bounded_excerpt`
- 禁止 `/ ? # CR LF`
- 固定 host

归一化：
- title = chapter_name
- author
- labels
- introduction
- body = content
- completeness = `full | bounded_excerpt`
- scope = hackathon_event
- coverage = `{ type, startOffset, endOffset, providerLimit?, disclosure? }`

### Source Scope eligibility gate

只有同时满足以下条件的详情才可进入 Source Scope Gate：

1. `work_id` 已出现在本次 `/knowledge/list` 返回的候选集合中。
2. `content` 是非空字符串；小于 3000 字符标记为 `full`，达到 3000 字符标记为 `bounded_excerpt`。
3. 至少生成一个非空 Source Block，并为每个 block 计算独立 hash。
4. 详情中的标题与作者字段可追溯；缺失字段只能进入待审队列，不能自动发布。

若长度达到 3000，Provider 不得标成 `full`，必须记录 `coverage=0..3000`、
`providerLimit=3000` 和公开披露文案。该片段可以进入 Judge/Compiler，但只能生成范围内
语义完整且可锚定的 Supporting Run；不得生成 Hero、补全后文或声称代表整篇文章。

## ZhihuSearchProvider

只用于：
- 搜索发现
- 元数据
- canonical source Url

其 `ContentText`：
`completeness=excerpt`

不得进入 Compiler。

## Direct Answer Boundary

`developer.zhihu.com/answer` 与 `/v1/chat/completions` 属于编译期模型能力，不属于 `ContentProvider`。它们不能填充 `body`、`sourceBlocks`、作者原文或 Full Source completeness；任何模型输出都必须回到已取得的官方 Source 上进行校验。

## Source Segmentation

Full body 入库后：
1. normalize newline
2. 保留原文顺序
3. 切 source blocks
4. 记录 offsets
5. 计算 block hash / content hash
