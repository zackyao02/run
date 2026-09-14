# Codex First Task V1.4

只有 `00-governance/PRODUCT-FREEZE.md` 状态为 `APPROVED` 后，才可执行下面任务：

> 读取冻结文件、根目录 `AGENTS.md`、`spec/product-constraints.json` 和 `04-delivery/00-IMPLEMENTATION-PLAN.md`。先运行 `tools/local_contract_check.py`。第一阶段只对齐数据库 migration、TypeScript 类型、Executable Schema、OpenAPI 和 fixture，修复或验证 choice.options 合约。不要接 LLM、不要接知乎实时接口、不要部署、不要做 Admin UI 或 P1/P2 功能。完成后运行合约检查并在 `IMPLEMENTATION-STATUS.md` 汇报通过证据、改动位置和阻塞。

如果冻结仍为 DRAFT，只允许运行只读检查并报告，不得创建应用骨架。
