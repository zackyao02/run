# Data Model V1.4

机器 Migration：`db/migrations/001_init.sql`

## 核心关系

```text
sources
  1 ── N source_blocks
  1 ── 1 candidates
  1 ── 1 run_apps      # P0 canonical
run_apps
  1 ── N run_versions
  1 ── N run_sessions
run_sessions
  1 ── N run_progress
  1 ── 1 run_result_artifacts
```

## 为什么 Source → Run 是 1:1

P0 要证明“知识对象获得可执行版本”，不是同一文章不断随机生成小工具。

因此：
- 同一 Source 只维护一个 canonical Run；
- 模型/Prompt/Schema 更新进入 `run_versions`；
- Usage 聚合不会被重复 Run 稀释。

## 状态

Candidate：
`discovered → judging → accepted/rejected → compiling → converted/failed`

Run：
`draft → validating → ready → published ↔ unpublished`

Session：
`created → engaged → completed/abandoned`

## Completed 语义

数据库不存：
- solved
- success
- effective

P0 只存：
- started
- completed

现实 Outcome 是未来独立对象，不能偷换。
