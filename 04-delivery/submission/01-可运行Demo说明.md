# 可运行 Demo 说明

## 提交链接

- 公网 Demo：`[提交前填入公网 HTTPS URL]`
- 本地预览：`http://localhost:304/`

本地地址只用于开发和录制前检查，不能作为最终提交链接。公网环境必须配置持久化数据库，不能使用内存回退。

## 评审者打开后怎么体验

1. 首页选择一篇“已发布”知识，点击 `RUN 一下`。
2. 运行页先看到文章已经被编译为程序，再按页面提示填写或选择自己的真实情况。
3. 每一步都可以点击“查看原文”，打开对应的原文片段和依据。
4. 完成后看到本次 Result，包含状态、路径和可回看的结果物。
5. 在 Result 页面可以主动请求“AI 辅助解读”。AI 只解释本次填写、确定性结果和相关原文，不改变运行路径或结果。

## 建议演示入口

- 首页：`/`
- 官方知识运行：`/runs/{已发布RunId}`
- 官方知识原文：`/knowledge/{已发布RunId}`
- 模拟知识运行：`/demo/{模拟文章Id}`
- 模拟知识原文：`/demo/{模拟文章Id}/source`
- 运行记录：`/me`

## 启动方式

```text
npm install
npm run dev
```

生产预览：

```text
npm run build
npm run start
```

## 体验保证

- 首次有效填写或选择后才计 Started。
- 满足程序完成条件后才计 Completed。
- 刷新页面可以恢复当前 Session 和已填写内容。
- 运行时不依赖大模型；模型不可用时，已发布 Run 仍可完整运行。
- 官方内容与模拟内容在页面上明确区分，模拟内容标注“赛事模拟知识”。

## 上线前必须替换

- 将顶部公网链接替换为实际 HTTPS 地址。
- 配置 `DATABASE_URL`、`LLM_API_KEY`、`LLM_MODEL`、`ZHIHU_API_BASE_URL`、`OPERATOR_SECRET`、`NEXT_PUBLIC_APP_URL`。
- 执行数据库迁移：`db/migrations/001_init.sql`、`db/migrations/002_runtime_documents.sql`。
- 用手机 4G/5G 打开首页、官方 Run、原文依据和 Result，确认公网访问无登录阻塞。
