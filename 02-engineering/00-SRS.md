# SRS V1.6

## 1. 系统主链路

```text
Official Verifiable Source Scope
→ Judge
→ Compiler
→ Schema / Anchor / Safety Validation
→ Protected Preview / Publish
→ Runtime Session
→ Progress / Completion
→ Result Artifact
```

## 2. 角色

- Visitor：发现、查看、运行、看来源、完成、看结果。
- Local User：Visitor + 当前设备历史与恢复；P0 不要求 OAuth。
- Operator：通过受保护的内部流程编译、预览、发布或拒绝内容；P0 不要求完整 Admin UI。

## 3. 功能要求

### Source

- FR-SOURCE-001：赛事官方知识详情返回、知乎创作分析接口为当前 Access Secret 所属账号返回的本人完整正文、或受控预置的完整赛事模拟知识，可进入 Compiler。`bounded_excerpt` 仅可生成带覆盖范围披露的 Supporting Run；创作列表摘要不得进入 Compiler。模拟知识必须带 `hackathon_demo` 来源标签。
- FR-SOURCE-002：Search 结果只用于候选发现，摘要永不进入 Compiler。
- FR-SOURCE-003：入库后生成 `content_hash`、稳定 source block、全文 offset 与 block hash。
- FR-SOURCE-004：一份 Source 只对应一个 canonical Run；更新产生新 Version。
- FR-SOURCE-005：正文只能由服务端已配置的知乎 Provider 获取。赛事知识池或当前 Access Secret 所属账号的创作分析全文可自动进入候选列表；不得提供正文粘贴、文件上传、任意 URL 或第三方网页抓取入口。

### Judge 与 Compiler

- FR-JUDGE-001：Judge 返回符合 `judge-result.schema.json` 的 JSON。
- FR-JUDGE-002：必须独立判断 task intent、action knowledge、interaction advantage、completion state、groundability 与 risk。
- FR-COMP-001：Compiler 只能输出 `executable-run.schema.json` 允许的数据结构，不生成代码。
- FR-COMP-002：P0 至少发布两种 Grammar；具体 Grammar 由真实内容池与 Planner 结果决定，不得强行把所有 Source 编译为同一种表单。
- FR-COMP-003：所有关键 Action 必须包含 Source Anchor。
- FR-COMP-004：Schema、Anchor 或 Safety 失败不得发布；结构解析失败最多修复两次。
- FR-COMP-005：Programability Gate 必须拒绝普通线性待办。批准的 Source 至少具备两种可锚定的程序原语：observable_state、source_backed_branch、deterministic_evaluation、feedback_loop、repeatable_experiment、material_artifact。
- FR-COMP-006：新编译 Run 必须含 program（状态、转移、原语）；每个 required Action 必须触发声明的状态转移。
- FR-COMP-007：Engine 支持七种 program model。Planner 只能在 Source 具备相应锚定结构时选择；模型不匹配或未声明所需字段时必须拒绝编译。

### Runtime 与 Result

- FR-RUN-001：创建 Session 不计 Started。
- FR-RUN-002：第一次有效组件交互计 Started，事务内幂等。
- FR-RUN-003：进度按 Session 与 Component 幂等写入。
- FR-RUN-004：后端验证 Completion Rule；重复 Complete 返回同一结果。
- FR-RUN-005：Runtime 状态机不调用 LLM，也不生成未声明的个性化下一步；对模拟知识，下一步只可由预置规则与结构化用户输入决定。
- FR-RUN-006：刷新或离开后能恢复进度。
- FR-RUN-007：Runtime 只回放 Compiler 声明的状态转移；不得在运行时推测、生成或个性化下一状态。
- FR-RUN-008：情境/对话、实验计时、规则测试、行动编排和参数沙盘均是有限声明式 Runtime；不传输未受控原始输入到 Progress API，不执行表达式或代码。
- FR-RESULT-001：Result 只由 Schema 与 Progress 计算。
- FR-RESULT-002：Completed 只表示流程完成，不代表现实结果达成。
- FR-RESULT-003：用户完成确定性 Result 后可主动请求 AI 辅助解读。请求只发送有限的本次输入、确定性 Result 与必要原文片段；AI 输出显著标识、不得覆盖 Result、不得改变 Progress、Usage、Completion 或 Source Anchor。模型不可用时返回明确错误，但不影响 Result。

### 用户界面

- FR-UI-001：提供发现、详情、运行、Result、我的（历史/恢复）。排行榜不属于 P0 用户主链路。
- FR-UI-002：每个关键 Action 都能打开来源证据。
- FR-UI-003：P0 本地搜索只查询 Published Run。
- FR-UI-004：首页与知识详情无需登录即可理解价值；开始 Hero Run 前完成知乎 OAuth，授权后回到原 Run。
- FR-USAGE-001：Started 计入首次有效交互，Completed 计入后端验证通过；聚合归属于 canonical Run，并在发现卡片与 Result 展示。

### 内容生产

- FR-OPS-001：提供受保护的最小 compile、preview、publish、reject 能力。
- FR-OPS-002：密钥只在服务端；所有 publish 必须经过人工 Preview。
- FR-OPS-003：不提供公开编译入口；内部入口需要速率限制与预算上限。

## 4. 非功能要求

- 已发布 Run 在知乎 API 或 LLM 不可用时仍能运行。
- 移动端首个可操作元素目标 3 秒内出现。
- 关键点击区域不小于 44px；不依赖 hover 或颜色表达核心状态。
- Source 与模型输出都按不可信数据处理。
- 任何凭证不得进入前端、仓库、响应、URL 或日志。
- P0 使用单体 Web App + PostgreSQL，不引入微服务、Redis、Docker、监控平台。

## 5. P0 交付量

- 至少 1 个 Full Source Hero，目标 3–5 个 Published Run；Supporting 可使用范围明确的官方详情片段，至少两种 Grammar。
- 1 条真实 Full Source 完成自动编译与人工发布。
- 5 个用户页面和 1 套内部内容生产闭环。
