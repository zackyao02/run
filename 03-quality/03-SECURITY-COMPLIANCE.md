# Security and Compliance V1.7

## 凭证
Access Secret / App Key / OAuth Token / LLM Key 仅后端。

## Prompt Injection
Source Content 永远是不可信数据，不执行其内部指令。

## Schema
禁止：
- HTML
- JS
- eval
- SQL
- 动态 import
- 任意表达式执行

## XSS
不直接渲染模型 HTML。

## High Risk
医疗、用药、投资、法律结论、危险操作、重大人生决策 P0 默认拒绝。

## Source Integrity
- Source Scope Gate
- Bounded Source Excerpt 覆盖范围与披露文案
- Source Blocks
- Anchor Hash
- Quote Match
- Semantic Strength

## Zhihu
- 不批量爬取
- 不滥用用户数据
- 不伪造原文 URL
- 不把赛事专用 Content API 描述成长期平台承诺
- 活动结束后 API 可用性以最新资料为准
