# 20 — Source Facts & Version Lock

## 锁定资料

### 官方 Skill
`zhihu-cli-skill-0.7.2-beta.20260911131715`

Skill 中 `hackathon-content-api.md` 资料核对时间：2026-09-03。

### 赛事文档
- 开发者手册
- 参赛者开发流程文档

若规则冲突，以活动页面 / 最新 Skill / 官方群最新通知为准。

## 已确认

### Hackathon Knowledge
- List：`https://api.zhihu.com/km-indep-home/hackathon/v2/knowledge/list`
- Detail：`https://api.zhihu.com/km-indep-home/hackathon/v2/knowledge/{work_id}`（2026-09-13 实测知识列表 work_id 返回 200；`story/{work_id}` 对这些 ID 返回 404）
- 详情通常包含 `content`
- 当前赛事文档说明此专用内容接口无需 Access Secret / OAuth

### Zhihu Search
- `https://developer.zhihu.com/api/v1/content/zhihu_search`
- Count 最大 10
- HasMore 当前固定 false
- ContentText 是摘要
- 返回 Url / VoteUpCount / AuthorName 等

### Direct Answer
- `https://developer.zhihu.com/v1/chat/completions`
- 模型：zhida-fast-1p5 / zhida-thinking-1p5 / zhida-agent
- 文档正式字段：model / messages / stream
- `https://developer.zhihu.com/answer` 是直答能力的文档入口，不是某一篇知乎回答的正文详情接口。
- 直答输出属于模型结果，只能作为编译期 AI Provider；不得作为 Source、作者原文或 Source Anchor 的依据。
- 直答是否进入 P0 取决于实测响应、配额和鉴权；未实测前不得把它写成硬依赖。

### Quota
- `https://developer.zhihu.com/api/v1/quota`
- 可查询 RemainingQuota
- 工程不硬编码配额

### 最新参赛者开发流程文档
当前写明 Zhihu Search / Global Search 单用户总调用量上限为 5000 次/天；旧手册存在更低旧值，因此实现不依赖固定数字，以 quota API 与最新官方通知为准。

## 不得推断

- Hackathon Knowledge API 是长期稳定通用 API
- 普通 Search 可以取得任意完整正文
- 可以写回知乎主站 Run Count
- 可以给知乎 App 注入原生按钮

## V1.4 官方评审与交付事实

开发者手册明确：
- 初审 AI 场景价值 40%、创新 25%、完成度 25%、产品体验 10%；
- 决赛 AI 场景价值 35%、创新 25%、完成度 25%、产品体验 8%、计划书与演示 7%；
- 决赛 3 分钟 Demo + 2 分钟 Q&A；
- 网页项目需要公网可运行 Demo；
- 产品说明计划书必交；
- 代码仓库、演示视频为选交加分材料。

最新参赛者开发流程文档写明知乎 Search / Global Search 当前单用户总调用量上限 5000 次/天；工程仍以 quota API 与最新官方通知为最终运行依据。
