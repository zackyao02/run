# AI Coding Guide V1.4

## 优先级

1. `00-governance/PRODUCT-FREEZE.md`
2. `AGENTS.md`
3. `spec/product-constraints.json`
4. `spec/*.json`、`spec/openapi.yaml`
5. `db/migrations/*.sql`
6. `02-engineering/00-SRS.md`
7. `01-product/01-PRD.md`

冻结文件未批准时不得实现。发生冲突时先报告文件、条款、影响和最小变更，不自行选一个继续写。

## 开发纪律

- 每个阶段只完成实施计划中对应范围。
- 先完成 Hero 主链路，再做 Supporting。
- fixture 只用于本地验证，不能冒充官方数据。
- 非 P0 Schema 枚举或 fixture 不代表必须实现。
- 不加公开编译、排行、完整后台、第三 Grammar 或企业级基建；OAuth 只实现已批准的最小 P1 登录链路，不扩展用户数据产品。
- 不改变 Started、Completed、Source-bound 和 Runtime 无 LLM 的语义。

## 验证

每阶段提供可复现证据：命令、通过结果、实现位置和仍未解决的阻塞。视觉“看起来能跑”不能替代关键幂等、Anchor 与合约测试。
