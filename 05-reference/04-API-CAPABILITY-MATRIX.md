# Zhihu API Capability Matrix V1.4

本矩阵按官方开放平台页面与本次赛事资料区分“可以直接支撑产品”的能力和“容易把范围做大”的能力。申请时可以一次性询问可开通的接口集合，但实现仍按 P0/P1/P2 分层。

## 建议申请与优先级

| 能力 | 典型接口/入口 | 优先级 | 在项目中的正确用途 | 不得做什么 |
|---|---|---:|---|---|
| 黑客松 Knowledge | `/km-indep-home/hackathon/v2/knowledge/list`、`/{work_id}` | P0 | 获取候选与 Full Source，建立 Source Blocks、作者和原文链接 | 不把摘要、模型输出或普通搜索结果当 Full Source |
| 知乎站内搜索 | `/api/v1/content/zhihu_search` | P1 | 发现候选、补充站内入口和元数据 | 不把 `ContentText` 直接送进 Compiler |
| 直答/模型 | `/v1/chat/completions`，文档入口 `/answer` | P0 可选 | Judge、Planner、Compiler 的编译期模型 | 不作为原文来源，不在 Runtime 调用 |
| Quota | `/api/v1/quota` | P0 | 读取剩余额度、在内部流程做预算保护 | 不硬编码额度，不高频轮询 |
| 全网搜索 | `/api/v1/content/global_search` | P2 | 研究或答辩对照材料 | 不把外部网页混入知乎 Source-bound 主链路 |
| 热榜 | `/api/v1/content/hot_list` | P2 | 可选的发现页背景或演示素材 | 不做推荐系统，不抢 Hero |
| OAuth / 用户数据 | 官方 OAuth 与用户能力 | P1 | 登录、跨设备历史、人气奖相关体验 | 不让登录阻塞 Hero，不把用户隐私写入日志 |
| 内容发布 | 需以官方当前文档确认 | 暂不申请 | 当前产品没有写回知乎的必要 | 不因为“可能有接口”就设计自动发帖或刷屏 |

## 最小申请组合

优先询问平台能否开通以下能力及其配额：

1. Knowledge 赛事内容接口的访问方式。
2. `zhihu_search` 与 `quota`。
3. Direct Answer / Zhida 模型调用。
4. OAuth 作为可选能力，而不是 P0 前置条件。

如果平台按一个 Access Secret 管理多个开放接口，仍要逐项确认开通范围、日限额、时间戳要求、错误码和是否允许黑客松项目使用。官方开放平台当前说明数据接口使用 Bearer 鉴权并校验 `X-Request-Timestamp`；密钥只能放服务端。[知乎数据开放平台](https://developer.zhihu.com/)

## 实测记录要求

每个申请到的能力都要记录：请求 URL、请求头类型、响应字段、配额、限流、失败响应、是否允许缓存、是否允许在提交 Demo 中展示。未实测前只能标为“待验证”，不能写进产品硬依赖。

## 对 v1.4 的影响

- Knowledge + Direct Answer + Quota 足以支撑 P0。
- `zhihu_search` 用于候选发现，可延后接入。
- Global Search、Hot List、OAuth 都是加分或研究能力，不改变 Hero。
- 任何新增 API 都不能改变“Full Source → 编译 → 稳定 Runtime”的主链路。
