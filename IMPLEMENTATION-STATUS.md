# Implementation Status V1.13

更新时间：2026-09-13

## Gate 0

- `PRODUCT-FREEZE.md`: `APPROVED`
- 产品范围保持冻结；程序形态由真实 Source 与 Grammar 决定，不预设固定场景；OAuth 仅作为不阻塞主流程的可选 P1，公开编译和企业级基础设施仍不做。

## Phase 1 — 合约与骨架

状态：已通过（基础浏览器/API 验收完成）

已完成：

- 运行 `tools/local_contract_check.py`，3 个 executable fixture 全部通过。
- 建立 Next.js + TypeScript 单体 Web App 骨架。
- 建立 ExecutableRun、Component、SourceAnchor、Session、Result 类型。
- 建立一个来源绑定的通用 Inspect fixture（仅工程测试，不代表最终 Hero）。
- 建立 Runtime API 骨架：Published Run、Session、Progress、Complete、Result。
- Runtime 不调用 LLM 或知乎实时接口。
- `npm install` 完成，`npm run build` 通过。
- Next.js 已锁定到官方安全修复版本 `15.5.9`。
- 已加入 `.gitignore` 与 `.env.example`，避免凭证进入仓库。
- Executable Schema 升级到 1.3，Check 必须携带声明式 evaluation。
- 新增 Programability Judge Schema、确定性 Evaluator 与本地输入工作台。
- 服务端进度接口采用字段白名单，不接收 rawInput、inputValue 或 excerpt。
- Source Evidence 按 startOffset/endOffset 精确切片，并在 quote 不一致时拒绝展示。

待验证：

- 数据库持久化替换当前内存 Session store。
- OpenAPI 响应 schema 与实际 route 响应逐项对齐。
- choice/task 等组件的运行时验证与多 Grammar 渲染。
- 需要继续补齐：首页、真实 Published Run、Progress、Complete、Result 的视觉验收与数据库持久化。
- 真实内容 Provider 与知乎线上接口的错误/截断处理。

## 本次 smoke test

- 首页 HTTP 200。
- Published Run 列表返回 0 个 Hero（真实 Full Source 尚未发布）。
- Session 创建、三项 Progress 写入、Complete 和 Result 读取成功。
- 通用 fixture 可返回 `normal / risk / unchecked` 与 `matched / not_matched / needs_review` 状态；合成数据不进入 Published 目录。

## 当前边界

当前页面使用明确标注的合成 fixture，仅用于工程开发和运行链路验证，不得作为最终参赛内容或线上真实使用数据。

## 2026-09-11/12 V1.6 实施

- 正式冻结文件已升格为 `00-governance/PRODUCT-FREEZE.md`；V1.4 内所有门禁统一引用该文件。
- 根目录 `CLAUDE.md` 已切换到 V1.4；V1.3 评审、草案和计划均已标记为历史材料。
- `publishedRuns` 不再包含租房 fixture；公开首页显示“正式 Hero 尚未发布”。
- 租房 fixture 仅在开发环境 `/dev/fixtures/inspect` 提供，并明确标注“工程测试样例 / 非 Hero”。
- Inspect Runtime 已改为单项分步交互，不引入 Diagnose 分支或运行时 AI。
- Result Artifact 新增逐项 `items`，可列出具体风险项并重新打开对应来源。
- fixture Source Anchor 已拆成三个独立 block；block hash 不再复用全文 content hash。
- Source Evidence Sheet 已验证可在完整段落中定位并高亮 quote。
- 开发态 Session store 使用进程级共享单例；生产与 Resume 仍必须由 PostgreSQL 替换。
- Hero 不再固定为简历或职业成长，具体题材由真实内容池决定；当前通用方法型 fixture 不是参赛内容。
- Runtime 接受 check/task/choice/input 的统一进度状态，Result 类型与 Run capability 对齐。
- Started / Completed usage 聚合按 canonical Run 统计，并在首页卡片与运行页展示。
- 当前 V1.6 演示地址为 `/dev/fixtures/inspect`，展示 Source → 编译结构 → 运行状态 → Result → 原文链路。

## 2026-09-13 Provider 接入

- 新增 `src/domain/content-provider.ts`：候选列表使用 `/knowledge/list`，详情使用已实测可用的 `/knowledge/{work_id}`。
- 新增开发路由 `/api/v1/dev/provider/knowledge`，用于查看候选池和单篇 Source Scope。
- Provider 将小于 3000 字符的内容标为 `full`；达到 3000 字符的赛事详情正文标为 `bounded_excerpt`，记录 `coverage=0..3000`、Provider 上限和强制披露文案。
- `bounded_excerpt` 可以进入 Judge/Compiler，但只能生成范围内语义完整、逐项可锚定的 Supporting Run；不得生成 Hero、补全后文或代表整篇文章。
- 目前实测：10 篇知识候选中 1 篇为 Full Source，9 篇为 Bounded Source Excerpt；全部保留为候选，最终是否发布由 Judge、Validator 与 Human Preview 决定。
- 当前仍未将任何真实内容直接发布到首页；发布前必须完成 Judge → Compiler → Validator → Human Preview。

## 2026-09-13 V1.7 Source Scope 决策

- 人类产品负责人批准：Hero 继续要求 Full Source；Supporting 允许使用赛事官方详情接口提供的 Bounded Source Excerpt。
- Search `ContentText`、列表 `description`、详情 `introduction` 和模型补写继续禁止进入 Compiler。
- 该调整将真实候选从 1 篇扩展为 10 篇，但不等于 10 篇都会发布；目标仍是 1 个 Hero + 2 个 Supporting。

## 2026-09-13 V1.8 OAuth P1

- 已按产品负责人确认增加可选 OAuth 登录能力：授权起始、回调、`state` 校验、服务端内存会话、基础用户信息和退出登录。
- OAuth 不参与知识 Provider、Compiler 或 Runtime；未配置 App Key/公网回调时仅显示待部署状态。
- App ID 通过环境变量提供；App Key 不写入代码、日志、前端响应或文档。
- `npx tsc --noEmit`、`npm run contract-check` 与 `npm run build` 已通过；未配置密钥/回调时 `/api/auth/status` 返回未登录，授权起始路由安全返回 503。

验收证据：公开 Run 数量为 0；旧 `/runs/fixture_inspect` 返回 404；开发 fixture 可完成 3 项交互并返回 3 条结构化 Result item，其中风险项 1 条。

## 2026-09-13 V1.9 Runtime / Preview / Persistence

- Choice Progress 现在保存为 `choice:<optionId>`，Runtime 会校验选项存在并依据 `nextId` 计算实际路径；不再把所有选择写成同一个 `matched`。
- Practice、Mission、Diagnose 的运行页按 Grammar 展示不同的阶段语义与确定性 Result 标题；Runtime 仍然零 LLM 调用。
- 内部草稿新增“完整运行预览”，使用真实 Runtime 但不计入公开 Usage；人工不再只看卡片文字就发布。
- Bounded Supporting 在没有 Full Source Hero 时可以保存为 `ready`（已批准、等待 Hero），不会伪装发布，也不会再出现可点但必然失败的按钮。
- 新增 PostgreSQL 持久化文档迁移 `002_runtime_documents.sql` 与 `pg` 驱动。配置 `DATABASE_URL` 后，Published Run、Draft、Session、Result、Usage 均进入数据库；本地未配库时保留明确标记的内存回退。
- 已实测 Mission fixture：创建 Session → task → `choice:steady` → 分支目标 task → Complete，Result 返回三项真实路径记录与 Mission Snapshot。
- 新增 `/ranking`（仅 Published Usage）与 `/me`（当前浏览器 Local History）；刷新运行页会恢复未完成 Session，不重新计 Started。
- `npx tsc --noEmit` 与 `npm run contract-check` 通过。

## 2026-09-13 V1.9 Program State Machine

- 产品负责人批准“Run 不能是换皮清单”：Programability Gate 现在要求至少两个、均由原文支持的程序原语。
- 新编译 Run 必须包含 `program`（model、primitives、states、transitions）；每个 required Action 必须改变声明的状态。
- Compiler / Candidate Screener 会拒绝普通线性待办，而不是为了提高通过率强行生成 Run。
- Runtime 与 Generic Runner 回放声明状态机，运行页显示当前状态而非整篇步骤；Result 显示最终状态和实际迁移记录。
- 发布端再次校验 program，避免旧草稿或绕过 Compiler 的内容被发布。
- 本地 Mission fixture 已实测：目标已框定 → 路径已选择 → 变化已记录，Result 返回 terminal state；未调用模型。

## 2026-09-13 V1.10 Seven Program Models

- 产品负责人批准 Runtime 完整支持七种模型：情境模拟器、诊断路径图、微型实验室、规则压力测试器、行动编排器、对话排练器与参数沙盘。
- 新增 `program.model`、有限 state variables、transition effects、timer、有限参数 option value 与对话展示字段；全部为 Schema 数据，Runtime 不执行代码、不调用 LLM。
- 新增 `ProgramRunner`：按模型展示情境状态变量、诊断路径、实验计时、对话气泡、行动状态和参数控制；新旧 Session/Anchor/Usage/Result 仍共用同一后端。
- 新增 7 组明确标为“工程测试 / 非 Hero”的 fixture；任一真实文章必须先通过与自身模型相匹配的 Programability Gate。
- 实测情境 fixture：选择“确认标准后继续举证”后，证据充分度 `1 → 2`、谈判风险 `2 → 1`，Result 到达“下一步已确定”；状态改变完全由已声明 transition effect 计算。
- `npx tsc --noEmit`、`npm run contract-check`、`npm run build` 已通过；七个开发页均 HTTP 200。

## 2026-09-14 V1.10 Model-selection Hardening

- Programability Judge 的输出契约现在必须包含唯一 `model`；`approved: true` 不允许搭配 `none`，拒绝则必须同时返回 `capability: none` 与 `model: none`。
- Candidate Screener、Programability Judge、Planner 与 Compiler 必须就同一个 Source-selected model 一致；任何阶段模型不一致都会拒绝草稿，而不是悄悄回退成任务清单。
- 模型选择只取决于可逐项锚定的文章结构（如显式条件、有限回应、时段反馈、确定性规则、依赖/补救、有限数值阈值），不取决于文章标题、领域或关键词。
- 已把 timer 纳入 required Action 状态迁移校验，微型实验室不能只显示计时器而不改变程序状态。
- 本次只完成本地静态校验与构建；未触发知乎 Provider、候选筛选或 DeepSeek 编译，未消耗模型额度。真实 Published Run 仍为 0，等待真实 Source 的人工 Preview / Publish。

## 2026-09-14 Real Source Go / No-Go

- 已用官方 `/knowledge/list` 与 `/knowledge/{work_id}` 实测 10 条赛事知识；仅 `1251918148732559360`《打造职业发展的金字塔》（杨萃先）返回 2,834 字符的 Full Source，其余为 3,000 字符 Bounded Source Excerpt。
- 切换至 `deepseek-v4-flash` 后，官方候选批量筛选返回 0 条合格候选；随后对唯一 Full Source 进行了独立 Judge → Programability 编译尝试。
- Programability Judge 拒绝该 Full Source：其为职业案例 / 建议叙事，未提供足以逐项锚定的状态迁移、条件分支、确定性评估、反馈回路、重复实验或结果物。因此未创建草稿、未进入 Preview、未发布 Hero。
- 这是正确的 Go / No-Go 结果：不能为满足数量而把该文章降级成任务清单，或把 Bounded Source Excerpt 冒充 Full Source Hero。Published Run 仍为 0。
- 修复编译端点限流顺序：先校验 `workId`，再预留模型槽；无效请求不再占用本地模型限流。

## 2026-09-14 Official Source Expansion Check

- 实测赛事 `knowledge/list` 的 `page`、`offset`、`cursor`、`limit`、`page_size` 与 `pageSize` 变体均返回同一组 10 条，当前接口未暴露分页或更多知识内容。
- 官方 `zhihu_search` 鉴权与调用成功，但官方 Skill 的 HTTP 文档明确定义 `ContentText` 为“内容摘要”；即使返回较长文本，也不得作为 Full Source、不得进入 Compiler。
- 官方赛事的第二个内容池 `story/list` 共 20 条。仅 2 条小于 3,000 字符上限（2,630 / 2,999），其余均为 Bounded Source Excerpt；所有候选均为小说叙事或含悬疑、暴力、求生等不适合作为低风险方法型知识 Hero 的题材。
- 因此没有接入故事池或搜索摘要作为正式 Provider。这样保持了“方法型知乎知识 → Source-bound Run”的冻结定位，也避免把赛事故事或片段伪装成可执行学习内容。
- 需要新的真实 Hero，必须等待赛事知识接口新增/补全 Full Source，或由产品负责人明确批准把产品范围改为另一类官方来源；在此之前 Published Hero 保持为 0。

## 2026-09-14 V1.13 产品收敛

- 产品冻结、PRD、SRS、UX 与机器约束统一为“自动知乎来源”边界：正文只可由赛事知识池或当前 Access Secret 所属账号的创作分析全文接口读取。
- 明确不提供粘贴正文、文件上传、任意文章链接、第三方网页抓取或其他内容导入入口。Run 内的少量状态/选择/参数属于运行交互，不是内容导入。
- 公开用户主链路收敛为发现、详情、运行、Result 与历史/恢复；首页已移除排行榜和 OAuth 卡片入口，旧 `/ranking` 路径会回到首页。
- 内部操作台改为“自动知乎来源流程”：自动同步官方知识或本人已发布创作 → 选择 → 编译 → 人工预览 → 发布；不再使用“导入文章”的产品表述。
- `npm run contract-check`、`npx tsc --noEmit` 与 `npm run build` 均已通过；本地首页和内部操作台均返回 HTTP 200。

## 2026-09-14 自然文章结构识别修正

- Programability Judge 仍拒绝纯观点、纯叙事和线性待办，但不再要求正常知乎文章使用流程图、产品术语或伪代码。
- 明确写在原文中的“若/否则”判断、有限情境回应、定时观察实验、有限检查标准、前置条件与暂停/补救信号，现分别作为诊断、对话/情境、实验室、规则测试与行动编排的有效证据。
- 不从常识补写任何条件、回应、评价标准或补救路径；这次调整只修正自然语言结构的识别，不放宽 Source-bound 和反清单门禁。
- 针对低成本模型的误拒，增加狭窄的确定性结构兜底：仅当原文同时包含可直接检测的有限标准/判断、定时观察、具体回应或补救信号时才可放行；Planner、Compiler、Semantic Validator 与 Anchor Validator 仍会完整复核，普通文章不能借此绕过门禁。
- 本地开发编译不再受旧的内存限流记录阻塞；生产环境仍保留每小时 6 次的受保护编译上限。
