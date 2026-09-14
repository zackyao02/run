# API Spec V1.4

机器合约：`spec/openapi.yaml`。

## Public

- `GET /api/v1/runs`：列出或本地搜索 Published Run。
- `GET /api/v1/runs/{runId}`：读取 Published Run 与 active Version。
- `POST /api/v1/runs/{runId}/sessions`：创建 Session，不计 Started。
- `PATCH /api/v1/sessions/{sessionId}/progress`：写进度；首次有效交互计 Started。
- `POST /api/v1/sessions/{sessionId}/complete`：验证完成并幂等生成 Result。
- `GET /api/v1/sessions/{sessionId}/result`：读取 Result。
- `GET /api/v1/sessions`：按匿名设备身份读取历史与恢复入口。

## Internal Operator

P0 只要求最小内容生产闭环，具体可通过 CLI 或受保护 route 实现：

- fetch Full Source
- judge / compile / validate
- preview
- publish / reject

这些接口不在 Public OpenAPI 中，不得暴露给普通用户。服务端必须校验 Operator Secret、限制并发与预算，并避免输出任何密钥。

## 不提供

- `/rankings`
- 公共 `/compile`
- `/chat`
- `/next-action`
- `/personalize`
- `/regenerate-runtime`

Runtime API 只保存和计算已发布 Schema 的状态，不调用模型。
