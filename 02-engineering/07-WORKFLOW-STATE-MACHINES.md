# Workflow and State Machines V1.4

## Candidate

```text
discovered
↓
judging
├→ rejected
↓
accepted
↓
compiling
├→ failed
↓
converted
```

`converted` 表示已形成 Run Draft，Candidate 生命周期结束。

## Run

```text
draft
↓
validating
├→ draft (修复/重编译)
↓
ready
↓
published
↔ unpublished
```

## Source Change

```text
source.content_hash changed
→ run_apps.needs_recompile = true
```

不改变 Candidate 状态。

## Session

```text
created
↓ first valid interaction
engaged
├→ abandoned
↓ completion verified
completed
↓
result artifact created
```

## Counts

- created：0 Started
- created→engaged：Started +1（一次）
- engaged→completed：Completed +1（一次）
