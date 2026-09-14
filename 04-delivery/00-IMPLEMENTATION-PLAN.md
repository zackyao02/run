# Implementation Plan V1.4

本计划按可验证阶段推进，不按 48 小时时间盒分配。每阶段未通过验收前，不进入下一阶段。

## Gate 0 产品批准

- 产品负责人已把 `00-governance/PRODUCT-FREEZE.md` 批准为 `APPROVED`。
- 仅剩的 Hero Source 选择属于内容运营，不得触发产品重设计。

## Phase 1 合约与骨架

- 运行 `tools/local_contract_check.py`。
- 对齐 migration、JSON Schema、OpenAPI 与 TypeScript 类型。
- 修复 choice.options 合约并验证 fixtures。

验收：所有机器文件可解析，fixture 通过 Schema。

## Phase 2 Runtime 与 Session

- 实现 P0 Component Registry。
- 实现 Session、Progress、Started、Completion、Result 与 Resume。
- 使用合成 fixture 验证，不对外冒充真实数据。

验收：Inspect fixture 完整跑通；Runtime 断开 LLM；Started 与 Complete 幂等。

## Phase 3 用户主链路

- 发现、详情、运行、Result、历史/恢复。
- Source Evidence Sheet 与移动端交互。

验收：从发现进入 fixture Hero，查看来源、完成、刷新恢复全链路通过。

## Phase 4 Provider 与 Compiler

- 实测官方 List/Search/Detail/Quota 的实际响应。
- Source Scope Gate、block/hash、Judge、Compiler、Validator。
- 受保护的 Preview/Publish 最小流程。

验收：一条真实 Source 自动编译、Anchor 校验、人工 Preview 后发布；不适合内容被拒绝。

## Phase 5 内容与 Hero

- 从真实内容池选择默认简历自检 Source；不满足条件时按冻结文件规则替换。
- 制作 1 个真实来源 Proof Run + 4 个完整赛事模拟知识 Run。
- 精修“目标修复、加薪谈话、专注实验、职业积累地图”的状态、Result 与模拟原文展示。

验收：真实来源 Proof Run 可验证；四个模拟 Run 的不同输入会触发不同状态、不同结果和可回看的模拟原文依据，单次体验 3 分钟内稳定完成。

## Phase 6 部署与提交

- 在提交前部署公网 HTTPS 版本并异网验证。
- 准备产品说明、演示视频或备用录屏、开发日志与 AI 交互记录。
- 完成浏览器与故障演练。

验收：公网链接可直接操作；产品说明、Demo 与实现一致。

## 砍功能顺序

1. Diagnose Supporting 改为第二个 Inspect。
2. 本地搜索缩为发现页静态分类。
3. 现场编译证明改为编译记录展示。
4. Supporting Run 从 2 个降到 1 个，仅在 Hero 已完整时允许。

永不砍：Full Source Hero、Source Scope Gate、Source Anchor、片段覆盖范围披露、Runtime 无 LLM、Session/Result、人工 Preview、提交前公网 Demo。
