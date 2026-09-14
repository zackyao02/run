# System Architecture V1.4

## 1. 形态

采用一个 Next.js + TypeScript Web App、一个 PostgreSQL 数据库和两个外部 Provider：知乎内容接口与编译期 LLM。前端、用户 API 与受保护的 Operator API 同仓实现，不拆微服务。

```text
Mobile Web
  ├─ Discover / Detail / Runtime / Result / History
  └─ Public API
          │
     Next.js Server
      ├─ Session / Completion / Result
      ├─ Published Run Reader
      ├─ Protected Compile Workflow
      ├─ Source / Schema / Anchor Validators
      └─ Provider Adapters
          ├─ Zhihu Full Source
          └─ Compile-time LLM
          │
      PostgreSQL
```

## 2. 运行边界

- Runtime 路径只读取已发布 Run Version 与 Session，不访问 LLM。
- Source 与 Compiler 只在内部工作流使用。
- Preview/Publish 可以是受保护的极简页面、CLI 或内部 route；不要求完整后台。
- P0 不依赖公共编译、排行或 OAuth；OAuth 作为独立可选 P1，不进入 Source/Run 主链路。

## 3. 数据边界

- Search 只发现候选；Detail Full Source 才能进入 Compiler。
- Published Run 固定引用一个 Run Version。
- 进行中的 Session 始终消费创建时绑定的 Version，避免发布更新改变用户流程。
- Result Artifact 由服务端按 Version + Progress 生成。

## 4. 部署建议

默认可采用 Vercel + Supabase PostgreSQL，也允许任何能满足公网 HTTPS、服务端密钥和持久化数据库的等价组合。部署是提交前门禁，不在文档中预设赛前公开发布。

## 5. 明确不引入

微服务、消息队列、Redis、容器编排、独立搜索服务、APM、复杂缓存层。内部 Compiler 并发保持 1 即可。
