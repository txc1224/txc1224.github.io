---
title: '日常操作速查'
order: 2
---

# 日常操作速查

> 涵盖 Git 最常用的日常命令，从仓库初始化到提交、暂存、标签和配置管理。

## 仓库初始化

```bash
# 在当前目录初始化新仓库
git init

# 克隆远程仓库（默认 main 分支）
git clone <url>

# 克隆指定分支，限制深度（加速大仓库克隆）
git clone -b develop --depth 1 <url>
```

---

## 文件状态周期

| 状态          | 说明               | 进入该状态的操作 |
| ------------- | ------------------ | ---------------- |
| **Untracked** | 新文件，Git 不追踪 | 新建文件         |
| **Modified**  | 已追踪文件被修改   | 编辑已提交的文件 |
| **Staged**    | 已添加到暂存区     | `git add`        |
| **Committed** | 已提交到本地仓库   | `git commit`     |

```
Untracked ──git add──▶ Staged ──git commit──▶ Committed
                         ▲                        │
                         │      git add            │
                      Modified ◀── 编辑文件 ───────┘
```

---

## 添加 & 提交

```bash
# 添加指定文件到暂存区
git add src/index.ts

# 添加所有修改（慎用，检查 .gitignore）
git add .

# 交互式选择要暂存的代码块
git add -p

# 提交（写清楚做了什么）
git commit -m "feat: add user login API"

# 添加并提交已追踪的文件（不含新文件）
git commit -am "fix: correct email validation"
```

---

## 状态 & 差异

```bash
# 查看工作区状态
git status

# 简洁模式
git status -s

# 查看未暂存的修改
git diff

# 查看已暂存的修改（即将提交的内容）
git diff --staged

# 对比两个分支
git diff main..feature/login
```

---

## .gitignore 规则速查

| 规则             | 含义         | 示例                              |
| ---------------- | ------------ | --------------------------------- |
| `file.txt`       | 忽略指定文件 | `secret.key`                      |
| `*.log`          | 通配符匹配   | 所有 `.log` 文件                  |
| `dir/`           | 忽略整个目录 | `node_modules/`                   |
| `!important.log` | 取反，不忽略 | 保留特定文件                      |
| `**/logs`        | 任意层级目录 | 所有 `logs` 目录                  |
| `doc/*.pdf`      | 仅一级子目录 | `doc/a.pdf`，不含 `doc/sub/b.pdf` |

```bash
# 已被追踪的文件加入 .gitignore 后需手动移除缓存
git rm --cached <file>
```

---

## git log 常用参数

| 参数        | 作用             | 示例                           |
| ----------- | ---------------- | ------------------------------ |
| `--oneline` | 单行显示         | `git log --oneline`            |
| `--graph`   | 分支图形         | `git log --graph --oneline`    |
| `--author`  | 按作者过滤       | `git log --author="Tom"`       |
| `--since`   | 起始时间         | `git log --since="2025-01-01"` |
| `--until`   | 截止时间         | `git log --until="2025-06-01"` |
| `-n`        | 限制条数         | `git log -5`                   |
| `--stat`    | 显示文件变更统计 | `git log --stat`               |
| `-p`        | 显示具体 diff    | `git log -p -2`                |
| `--grep`    | 搜索提交信息     | `git log --grep="fix"`         |

---

## git stash 暂存操作

```bash
git stash save "WIP: login page layout"  # 暂存当前修改（含描述）
git stash                    # 简写
git stash list               # 查看暂存列表
git stash pop                # 恢复最近暂存（并从列表移除）
git stash apply              # 恢复但保留在列表中
git stash apply stash@{2}    # 恢复指定暂存
git stash drop stash@{0}     # 删除指定暂存
git stash clear              # 清空所有暂存
git stash -u                 # 暂存时包含未追踪文件
```

---

## git tag 标签管理

```bash
# 创建轻量标签
git tag v1.0.0

# 创建附注标签（推荐）
git tag -a v1.0.0 -m "Release version 1.0.0"

# 给历史提交打标签
git tag -a v0.9.0 <commit-hash>

# 查看所有标签
git tag -l

# 推送标签到远程
git push origin v1.0.0
git push origin --tags

# 删除本地标签
git tag -d v1.0.0

# 删除远程标签
git push origin --delete v1.0.0
```

---

## 配置管理

```bash
# 设置用户信息
git config --global user.name "Your Name"
git config --global user.email "your@email.com"

# 查看当前配置
git config --list

# 设置默认分支名
git config --global init.defaultBranch main

# 设置默认编辑器
git config --global core.editor "code --wait"
```

**常用别名配置：**

```bash
git config --global alias.st status
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.ci commit
git config --global alias.lg "log --oneline --graph --all"
git config --global alias.last "log -1 HEAD"
```
