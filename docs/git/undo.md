---
title: '撤销 & 回退'
order: 5
---

# 撤销 & 回退

> 这是 Git 最关键的章节。撤销操作选错命令可能导致代码丢失，务必理解每个命令的作用范围。

## 撤销操作决策表

| 场景                         | 推荐命令                            | 影响范围          |
| ---------------------------- | ----------------------------------- | ----------------- |
| 丢弃工作区某文件的修改       | `git restore &lt;file&gt;`          | 仅工作区          |
| 从暂存区撤回文件             | `git restore --staged &lt;file&gt;` | 仅暂存区          |
| 修改最近一次提交信息         | `git commit --amend`                | 最近一次提交      |
| 撤销最近一次提交（保留修改） | `git reset --soft HEAD~1`           | 提交历史          |
| 撤销最近一次提交（完全丢弃） | `git reset --hard HEAD~1`           | 提交历史 + 工作区 |
| 撤销已推送的提交（安全）     | `git revert &lt;hash&gt;`           | 新增反向提交      |
| 恢复已删除的分支             | `git reflog` + `git branch`         | 恢复引用          |
| 丢弃所有未提交的修改         | `git checkout -- .`                 | 工作区            |

---

## 丢弃工作区修改

```bash
# ❌ 旧语法（容易和分支切换混淆）
git checkout -- src/index.ts

# ✅ 新语法（推荐，语义清晰）
git restore src/index.ts

# 丢弃所有工作区修改
git restore .
```

::: danger 警告
`git restore` 会永久丢弃未暂存的修改，且无法恢复。操作前确认不需要这些改动。
:::

---

## 从暂存区撤回

```bash
# ❌ 旧语法
git reset HEAD src/index.ts

# ✅ 新语法（推荐）
git restore --staged src/index.ts

# 撤回所有暂存文件
git restore --staged .
```

文件会回到 Modified 状态，修改内容不会丢失。

---

## git reset 三种模式

```bash
git reset --soft HEAD~1    # 回退提交，修改保留在暂存区
git reset --mixed HEAD~1   # 回退提交，修改保留在工作区（默认）
git reset --hard HEAD~1    # 回退提交，修改全部丢弃
```

| 模式      | 提交历史 | 暂存区 | 工作区 | 使用场景                 |
| --------- | -------- | ------ | ------ | ------------------------ |
| `--soft`  | 回退     | 保留   | 保留   | 重新组织提交             |
| `--mixed` | 回退     | 清除   | 保留   | 重新选择暂存文件（默认） |
| `--hard`  | 回退     | 清除   | 清除   | 彻底丢弃，回到指定提交   |

```
HEAD~1：上一次提交
HEAD~3：往前第 3 次提交
<commit-hash>：指定提交
```

::: danger 注意
`--hard` 会永久丢弃工作区修改。如果误操作，可尝试 `git reflog` 恢复。
:::

---

## git revert 安全撤销

```bash
# 创建一个新提交，内容是指定提交的反向操作
git revert <commit-hash>

# 撤销多个连续提交
git revert <oldest-hash>..<newest-hash>

# 撤销但不自动提交（可批量处理后统一提交）
git revert --no-commit <hash1>
git revert --no-commit <hash2>
git commit -m "revert: rollback feature X"
```

---

## reset vs revert 对比

| 特性         | `git reset`          | `git revert`         |
| ------------ | -------------------- | -------------------- |
| 原理         | 移动 HEAD 指针       | 创建反向提交         |
| 历史记录     | 改写历史（提交消失） | 保留历史（新增提交） |
| 已推送的提交 | 需要 force push      | 直接 push            |
| 团队协作     | 可能影响他人         | 安全，不影响他人     |
| 适用场景     | 本地未推送的提交     | 已推送或公共分支     |

::: tip 黄金法则

- 未推送到远程 --> 用 `reset`
- 已推送到远程 --> 用 `revert`
  :::

---

## 修改最近一次提交

```bash
# 修改提交信息
git commit --amend -m "fix: correct typo in login"

# 追加文件到上次提交（不改消息）
git add forgotten-file.ts
git commit --amend --no-edit
```

::: warning
`--amend` 会改写提交历史。如果已推送，需要 `--force-with-lease` 强推。
:::

---

## 恢复已删除的分支

```bash
# 查看操作日志（包含所有 HEAD 移动记录）
git reflog

# 输出示例：
# a1b2c3d HEAD@{0}: checkout: moving to main
# e4f5g6h HEAD@{1}: commit: feat: add payment
# i7j8k9l HEAD@{2}: checkout: moving to feature/payment

# 找到分支最后一次提交的 hash，重建分支
git branch feature/payment e4f5g6h
```

---

## 恢复误删的提交

```bash
# 用 reflog 找到被 reset 掉的提交
git reflog

git reset --hard <lost-commit-hash>   # 方法1：reset 回去
git cherry-pick <lost-commit-hash>    # 方法2：找回特定提交
git branch recovery <lost-commit-hash> # 方法3：新分支指向丢失提交
```

---

## 紧急回退线上代码

**标准操作流程：**

```bash
# 1. 确认当前生产版本对应的提交
git log --oneline -10

# 2. 方案 A：revert 指定提交（推荐，保留历史）
git switch main
git revert <bad-commit-hash>
git push origin main

# 3. 方案 B：回退到上一个稳定版本（紧急情况）
git switch main
git reset --hard <stable-commit-hash>
git push --force-with-lease origin main

# 4. 通知团队
# 5. 修复问题后，重新提交修复代码
```

| 步骤 | 操作         | 注意事项                              |
| ---- | ------------ | ------------------------------------- |
| 1    | 确认问题提交 | `git log` / `git bisect`              |
| 2    | 选择回退方案 | 优先 revert，紧急时 reset             |
| 3    | 推送到远程   | revert 直接 push，reset 需 force push |
| 4    | 通知团队成员 | 避免他人基于错误版本开发              |
| 5    | 补充修复提交 | 修复根因，不要只是回退                |

::: danger 生产回退注意

- 操作前备份当前状态：`git tag backup-before-rollback`
- 使用 `--force-with-lease` 而非 `--force`
- 回退后立即验证线上功能
  :::
