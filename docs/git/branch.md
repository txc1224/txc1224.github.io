---
title: '分支管理'
order: 3
---

# 分支管理

> 分支是 Git 最强大的特性。掌握分支策略是团队协作的基础。

## 分支基本操作

```bash
# 查看本地分支
git branch

# 查看所有分支（含远程）
git branch -a

# 创建新分支
git branch feature/login

# 创建并切换（传统方式）
git checkout -b feature/login

# 创建并切换（推荐新语法）
git switch -c feature/login

# 切换分支
git switch main

# 删除已合并的分支
git branch -d feature/login

# 强制删除未合并分支
git branch -D feature/login

# 重命名分支
git branch -m old-name new-name

# 删除远程分支
git push origin --delete feature/login
```

---

## 合并策略对比

| 策略             | 命令                         | 历史记录                        | 适用场景               |
| ---------------- | ---------------------------- | ------------------------------- | ---------------------- |
| **Merge**        | `git merge feature`          | 保留分支历史，产生 merge commit | 团队协作，需要完整历史 |
| **Rebase**       | `git rebase main`            | 线性历史，无 merge commit       | 个人分支整理，保持整洁 |
| **Squash Merge** | `git merge --squash feature` | 多次提交压缩为一次              | feature 分支合入主干   |

---

## Fast-forward vs No-fast-forward

```bash
# Fast-forward：主干无新提交，直接移动指针（不产生 merge commit）
git merge feature/login
# main: A─B─C─D─E（线性）

# No-fast-forward：强制产生 merge commit（推荐，保留分支信息）
git merge --no-ff feature/login
# main: A─B─────F（merge commit）
#         └─C─D─E┘
```

::: tip 建议
团队项目中建议使用 `--no-ff`，合并后能清晰看到 feature 分支的起止点。
:::

---

## git merge 冲突解决

```bash
# 合并分支
git merge feature/login

# 出现冲突时，文件中会标记冲突区域：
# &lt;<<<<<< HEAD
# 当前分支的代码
# =======
# 合入分支的代码
# &gt;>>>>>> feature/login

# 手动解决后：
git add <resolved-file>
git commit

# 放弃合并
git merge --abort
```

---

## git rebase 变基

```bash
# 将当前分支变基到 main（在 feature 分支执行）
git rebase main

# 交互式 rebase：整理最近 3 次提交
git rebase -i HEAD~3
```

**交互式 rebase 操作关键字：**

| 关键字   | 作用                         |
| -------- | ---------------------------- |
| `pick`   | 保留提交                     |
| `reword` | 修改提交信息                 |
| `edit`   | 修改提交内容                 |
| `squash` | 合并到上一个提交（保留信息） |
| `fixup`  | 合并到上一个提交（丢弃信息） |
| `drop`   | 删除提交                     |

::: danger 黄金法则
不要对已推送到远程的公共分支执行 rebase。Rebase 会改写历史，影响其他协作者。
:::

---

## cherry-pick 挑选提交

```bash
# 将指定提交应用到当前分支
git cherry-pick <commit-hash>

# 挑选多个提交
git cherry-pick <hash1> <hash2>

# 挑选但不自动提交（可修改后再提交）
git cherry-pick <hash> --no-commit

# 出现冲突时
git cherry-pick --continue   # 解决后继续
git cherry-pick --abort      # 放弃
```

---

## Git Flow 工作流

```
main ────────●───────────────●──────────── 生产环境
              \             /
release ───────●───●───●───● ──────────── 预发布
                \       /
develop ──●──●───●──●──●──●──●──●──────── 开发主线
           \  /       \  /
feature ───���●──────────●─────────────────── 功能开发
                                   \
hotfix ─────────────────────────────●───── 紧急修复
```

| 分支        | 来源    | 合入           | 说明                 |
| ----------- | ------- | -------------- | -------------------- |
| `main`      | —       | —              | 生产代码，始终可部署 |
| `develop`   | main    | main           | 开发集成分支         |
| `feature/*` | develop | develop        | 新功能开发           |
| `release/*` | develop | main + develop | 预发布，仅修 bug     |
| `hotfix/*`  | main    | main + develop | 生产紧急修复         |

---

## GitHub Flow 简化工作流

```
main ──●──●──●──●──●──●──●──●── 始终可部署
        \     /  \        /
         ●───●    ●──●──●────── feature 分支 + PR
```

核心流程：

1. 从 `main` 创建 feature 分支
2. 开发并提交
3. 发起 Pull Request
4. Code Review + CI 通过
5. 合并到 `main` 并部署

::: tip 适用场景
GitHub Flow 适合持续部署的项目。Git Flow 适合有明确版本发布周期的项目。
:::

---

## 分支命名规范

| 前缀        | 用途         | 示例                    |
| ----------- | ------------ | ----------------------- |
| `feature/`  | 新功能       | `feature/user-auth`     |
| `fix/`      | Bug 修复     | `fix/login-redirect`    |
| `hotfix/`   | 生产紧急修复 | `hotfix/payment-crash`  |
| `release/`  | 版本发布     | `release/v2.1.0`        |
| `chore/`    | 构建 / 工具  | `chore/upgrade-deps`    |
| `docs/`     | 文档更新     | `docs/api-reference`    |
| `refactor/` | 重构         | `refactor/user-service` |

**命名建议：**

- 全部小写，单词用 `-` 连接
- 包含 issue 编号：`feature/123-user-login`
- 简短明确，不超过 5 个单词
