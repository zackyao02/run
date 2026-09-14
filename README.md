# 知乎 Run｜用一下 — Engineering Package V1.9

> 把知乎方法型知识，变成有原文依据、能逐步执行、能留下结果的 Run。

项目类型：移动端 H5 / Web App  
赛道：知识炼金场  
产品类别：Executable Knowledge  
官方 Skill：`zhihu-cli-skill 0.7.2-beta.20260911131715`

## 1. V1.6 的唯一产品结论

第一用户是已经读过一篇方法型知乎内容、准备真正照着做的人。具体用户与题材由真实内容池决定。

知乎 Run 使用 AI 在发布前把完整知乎内容编译成受限交互 Schema；用户运行时不调用模型，只执行由该文章生成的稳定程序。每个关键行为都能回到原文证据，完成后得到由运行状态计算出的结果。

```text
Official Verifiable Source Scope
→ AI Judge / Compiler
→ Schema + Source Anchor Validation
→ Human Preview / Publish
→ Deterministic Runtime
→ Session / Result Artifact
```

## 2. 冻结状态

`00-governance/PRODUCT-FREEZE.md` 是唯一正式产品冻结文件，当前状态为 `APPROVED / 1.8`。Coding Agent 可以按冻结范围实现，但不得自行扩展产品边界。

## 3. P0 范围

- 最少 1 个 Full Source Hero，目标 3–5 个 Published Run；Supporting 可使用范围明确的赛事官方详情片段；至少两种明显不同的 Grammar。
- Hero 不预设题材，由真实内容池中最适合演示的 Source 决定。
- 发现、排行、我的、详情、运行、Result、历史/恢复页面。
- Source Scope、Judge、Planner、Compiler、Schema Validator、Source Anchor Validator、人工 Preview/Publish。
- Started / Completed Usage 聚合归属于 canonical Run，并在卡片与 Result 中展示。
- Session、首次有效交互 Started、后端验证 Completed、Result Artifact。
- 提交前完成公网部署与产品说明。

P0 不包含公开编译页、完整 Admin UI、社交、推荐、游戏化或产品内 Baseline。OAuth 是可选 P1，不阻塞 Run。

## 可选 OAuth P1

项目提供 `/api/auth/zhihu/start`、`/auth/callback`、`/api/auth/status` 和 `/api/auth/logout`。配置 `ZHIHU_OAUTH_APP_ID`、服务端 `ZHIHU_OAUTH_APP_KEY` 与公网 HTTPS `ZHIHU_OAUTH_REDIRECT_URI` 后，可进行知乎账号授权和基础资料读取。App Key 与 OAuth Token 不进入浏览器或仓库；本地地址只能预览，不能完成真实授权。

## 4. 开发顺序

1. `00-governance/PRODUCT-FREEZE.md`
2. `AGENTS.md`
3. `spec/product-constraints.json`
4. `01-product/01-PRD.md`
5. `02-engineering/00-SRS.md`
6. `spec/executable-run.schema.json`
7. `spec/openapi.yaml`
8. `04-delivery/00-IMPLEMENTATION-PLAN.md`

## 5. Definition of Done

- 一条真实知乎 Full Source 能完成 Compile → Validate → Preview → Publish。
- Hero 从发现页进入、运行、查看来源、完成、查看结果、刷新恢复，全链路可用。
- Runtime 在断开 LLM 后仍可运行。
- 每个关键 Action 的 quote、offset、block hash 校验通过。
- 同一 Session 的 Started 最多计一次；Completed 只表示流程完成。
- 至少 1 个 Full Source Hero 达到演示品质；目标 3–5 个真实 Published Run，Supporting 允许使用已披露范围的官方详情片段。
- 公网链接在提交前通过手机网络实测。
- Demo、产品说明和实际产品行为一致。

## 6. 核心防撞表达

> 普通 AI 再回答一次；知乎 Run 把原知识编译成一个可重复运行、每一步能回到出处的版本。

## 7. 当前 Provider 验证入口（开发环境）

启动 `npm run dev` 后可访问：

- `GET /api/v1/dev/provider/knowledge`：读取本次黑客松知识候选池。
- `GET /api/v1/dev/provider/knowledge?work_id=<id>`：读取单篇详情并识别 Full Source 或 Bounded Source Excerpt。

两类来源均返回 `200`：小于 3000 字符标记为 `full`；达到 3000 字符标记为
`bounded_excerpt`，并携带覆盖范围与强制披露文案。后者只能生成 Supporting Run，不得冒充整篇文章或 Hero。该路由仅在开发环境开放，生产环境固定返回 404。
## 真实内容编译（受保护的内部流程）

真实正文只会经由官方知识 Provider 进入编译器。服务端使用 `COMPILER_MODEL=deepseek-v4-pro` 与 OpenAI 兼容的 `COMPILER_API_BASE_URL` 完成可执行性判断、交互规划、Schema / Source Anchor / 语义校验后生成草稿；知乎 Access Secret 不参与这条模型调用。草稿不会自动上线；操作员预览确认后，才可调用 Publish。

部署到公网时，内部端点要求请求头 `x-operator-secret` 与服务器 `OPERATOR_SECRET` 一致；本地非生产环境只允许 `localhost` 回环请求免口令使用 `/dev/ops`：

- `POST /api/v1/ops/compile`，正文 `{ "workId": "..." }`
- `GET /api/v1/ops/drafts` 与 `GET /api/v1/ops/drafts/:draftId`
- `POST /api/v1/ops/drafts/:draftId/publish`，正文 `{ "approved": true, "role": "hero" | "supporting" }`；Hero 只能来自 Full Source。Hero 尚未发布时，Supporting 会保存为“已批准，等待 Hero”，不会伪装公开。

编译端点每小时最多 6 次，且不会把任何凭证、上游错误正文或模型原文回传给浏览器。配置 `DATABASE_URL` 后，草稿、Published Run、Session、Progress、Result、Usage 与额度限流都会持久化到 PostgreSQL；执行 `db/migrations/001_init.sql` 和 `db/migrations/002_runtime_documents.sql`。未配置数据库时，仅 localhost 使用易失内存回退，禁止用于公网 Demo。

本地开发时可打开 `/dev/ops`：从官方候选列表选择文章、完整运行草稿 Preview、核对每个 Action 的引文，再人工批准或发布。该页面在生产构建环境直接返回 404，不构成公开编译入口。
