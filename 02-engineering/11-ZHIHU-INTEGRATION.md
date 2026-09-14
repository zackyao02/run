# Zhihu Integration V1.6

官方 Skill 锁定：`0.7.2-beta.20260911131715`

## 1. Hackathon Knowledge API

本次黑客松专用，不应描述为长期稳定开放平台 API。

### List
`GET https://api.zhihu.com/km-indep-home/hackathon/v2/knowledge/list`

### Detail
`GET https://api.zhihu.com/km-indep-home/hackathon/v2/knowledge/{work_id}`

详情通常提供：
- work_id
- chapter_name
- author_avatar
- author_name
- labels
- introduction
- content

当前文档说明该赛事内容接口不需要 Access Secret / OAuth Header。

### 安全
- work_id 必须来自列表；
- 拒绝 `/ ? # CR LF`；
- 固定 host `api.zhihu.com`；
- 不根据返回内容跳转 host；
- 接口失败不循环重试。

## 2. Zhihu Search

`GET https://developer.zhihu.com/api/v1/content/zhihu_search`

- Query 必填
- Count 默认 10，最大 10
- HasMore 当前固定 false
- `ContentText` = 摘要，不是完整正文
- Url 带溯源 UTM

用途：
- 候选发现
- 元数据
- 搜索链接
- 不作为正式全文 Compiler 输入

## 3. Quota

`GET https://developer.zhihu.com/api/v1/quota`

APIIDs：
- global_search
- zhihu_search
- hot_list
- user_data
- zhida_openai
- knowledge
- tools

实现不硬编码配额；需要时查询 quota，不高频轮询。

最新参赛者开发流程文档当前写明 Zhihu Search / Global Search 为 5000 次/天，但工程仍以 quota 接口实时返回为准。

## 4. Direct Answer

文档入口：`https://developer.zhihu.com/answer`

`POST https://developer.zhihu.com/v1/chat/completions`

模型：
- zhida-fast-1p5
- zhida-thinking-1p5
- zhida-agent

正式文档字段：
- model
- messages
- stream

边界：Direct Answer 不是知乎原文 Provider。它不能提供或替代 `knowledge/{work_id}` 的 Full Source，不能参与 Source Anchor 生成，也不能把模型输出当作作者原文。当前 P0 Compiler 采用独立配置的 `deepseek-v4-pro`；Direct Answer 仅保留为可选的赛事能力研究，不进入发布链路。

实测记录（2026-09-13）：知识列表返回的 work_id 使用 `/story/{work_id}` 全部返回 404；使用本节 `/knowledge/{work_id}` 返回 200 且含 `content`。接入代码必须保留该 Go/No-Go 检查，若官方后续修复路径，以最新实测为准。

## 5. OAuth

P0 可不接。若接：
- app_id / app_key 来自黑客松项目；
- App Key / OAuth Token / Access Secret 后端保存；
- OAuth 不阻塞 Hero Demo。

## 5.1 Current creator full text

For the account that owns the configured Access Secret only:

- List: `GET https://developer.zhihu.com/api/v1/user/contents`
- Full body: `GET https://developer.zhihu.com/api/v1/user/content_detail?ContentUrl=<owned-https-url>`

The detail endpoint is creator-analysis data, not general public article access. The server verifies ownership; the application does not accept another user's identity or scrape public pages. `Summary` from the list is discovery metadata only and must never enter the Compiler.

## 6. 内容边界

- 保留作者与归属；
- 不把原文改写成应用原创；
- 不生成虚假正文；
- 不批量爬取；
- 不假装写回知乎主站。
