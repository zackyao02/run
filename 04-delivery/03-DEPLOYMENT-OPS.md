# Deployment and Ops V1.4

## 原则

公网 Demo 是提交必交项，但部署与公开动作在提交前、确认符合赛事规则后执行。文档不把提前公开视为规避原创要求的方式。

## 最小部署

- 单个 Next.js Web App。
- 单个 PostgreSQL 数据库。
- 公网 HTTPS URL。
- 服务端环境变量。

推荐 Vercel + Supabase，也允许等价方案。P0 不需要 staging、Docker、Nginx、Redis、APM 或告警平台。

## 环境变量

- `DATABASE_URL`
- `LLM_API_KEY`
- `LLM_MODEL`
- `ZHIHU_API_BASE_URL`
- `OPERATOR_SECRET`
- `NEXT_PUBLIC_APP_URL`

数据库按顺序执行 `db/migrations/001_init.sql` 与 `db/migrations/002_runtime_documents.sql`。后者持久化人工草稿决定、Published Run、Session、Progress、Result 与 Usage；未配置 `DATABASE_URL` 时仅允许 localhost 使用易失内存回退，禁止作为公网 Demo 部署。

实际接口若不需要 Access Secret，不创建虚假的必填变量。所有 Secret 只在服务端配置，不进前端、仓库、URL、截图或日志。

## Demo 安全模式

Hero 始终读取已发布 Run Version。关闭 LLM 与知乎 Provider 后，Runtime、Session、Completion 和 Result 继续工作。安全模式不得切换到 fixture 或伪造线上数据。

## 提交前检查

- 数据库迁移成功。
- 3 个真实 Published Run 可读取。
- 手机异网打开首页、运行 Hero、查看来源和 Result。
- 刷新后 Session 可恢复。
- Operator 路由不可被公开访问。
- 导出 Hero Version、Source Blocks、Prompt Version、Migration 与 Demo 脚本作为恢复材料。
