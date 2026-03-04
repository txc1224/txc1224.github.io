---
title: '高级技巧'
order: 6
---

# 高级技巧

> 进阶 Git 技能：reflog、bisect、submodule、hooks 等，提升版本控制效率。

## git reflog 操作日志

```bash
# 查看所有 HEAD 移动记录（包括 reset、rebase 等）
git reflog

# 查看指定分支的 reflog
git reflog show feature/login

# reflog 条目默认保留 90 天
# 可用于恢复误删的提交、分支、被 reset 掉的代码
```

reflog 是本地操作日志，不会推送到远程，是误操作的最后救命稻草。

---

## git bisect 二分查找 Bug

```bash
# 开始二分查找
git bisect start

# 标记当前版本有 bug
git bisect bad

# 标记已知正常的版本
git bisect good v1.0.0

# Git 自动 checkout 中间版本，测试后标记
git bisect good  # 该版本正常
git bisect bad   # 该版本有 bug

# 找到引入 bug 的提交后，结束
git bisect reset
```

**自动化 bisect（提供测试脚本）：**

```bash
# 脚本返回 0 表示 good，非 0 表示 bad
git bisect start HEAD v1.0.0
git bisect run npm test
```

---

## git blame 追溯修改

```bash
# 查看文件每一行的最后修改者
git blame src/utils.ts

# 指定行范围
git blame -L 10,20 src/utils.ts

# 忽略空白符变更
git blame -w src/utils.ts

# 跨文件追踪（检测代码移动/复制）
git blame -C src/utils.ts
```

::: tip
配合 IDE 的 Git Blame 插件使用更高效（如 VS Code 的 GitLens）。
:::

---

## git submodule 子模块

```bash
# 添加子模块
git submodule add <repo-url> libs/shared

# 克隆含子模块的仓库
git clone --recurse-submodules <url>

# 已克隆后初始化子模块
git submodule init
git submodule update

# 更新所有子模块到最新
git submodule update --remote

# 删除子模块（需手动清理）
git submodule deinit libs/shared
git rm libs/shared
rm -rf .git/modules/libs/shared
```

::: warning
子模块维护成本较高。如果只是共享代码，考虑使用包管理器（npm、Maven）替代。
:::

---

## git worktree 多工作树

```bash
# 在另一个目录同时处理不同分支
git worktree add ../hotfix-branch hotfix/urgent
git worktree list           # 查看所有工作树
git worktree remove ../hotfix-branch  # 删除
```

适用场景：正在 feature 分支开发，需要紧急修 bug，但不想 stash 当前工作。

---

## git hooks 钩子

钩子脚本位于 `.git/hooks/` 目录下：

| 钩子         | 触发时机       | 常见用途                 |
| ------------ | -------------- | ------------------------ |
| `pre-commit` | commit 之前    | 代码格式检查、lint       |
| `commit-msg` | 编辑提交信息后 | 校验 commit message 格式 |
| `pre-push`   | push 之前      | 运行测试                 |
| `post-merge` | merge 之后     | 自动安装依赖             |
| `pre-rebase` | rebase 之前    | 阻止对公共分支 rebase    |

**commit-msg 钩子示例（校验 Conventional Commits）：**

```bash
#!/bin/sh
# .git/hooks/commit-msg
commit_msg=$(cat "$1")
pattern="^(feat|fix|docs|style|refactor|test|chore)(\(.+\))?: .{1,50}"

if ! echo "$commit_msg" | grep -qE "$pattern"; then
  echo "ERROR: Commit message 不符合规范"
  echo "格式: type(scope): description"
  exit 1
fi
```

::: tip 团队共享 hooks
使用 [husky](https://github.com/typicode/husky) 或 [lefthook](https://github.com/evilmartians/lefthook) 管理 hooks，确保团队统一。
:::

---

## .gitattributes 配置

```txt
# 统一换行符
* text=auto
*.sh text eol=lf
*.bat text eol=crlf

# 标记二进制文件（不做 diff）
*.png binary
*.jpg binary
*.woff2 binary

# 自定义 diff 驱动
*.lock linguist-generated
*.min.js linguist-generated
```

---

## Git LFS 大文件处理

```bash
git lfs install                # 安装 LFS
git lfs track "*.psd"          # 追踪大文件类型
git lfs track                  # 查看追踪规则
git lfs ls-files               # 查看 LFS 管理的文件
# .gitattributes 会自动更新：*.psd filter=lfs diff=lfs merge=lfs -text
```

::: warning
LFS 需要服务端支持。GitHub 免费账户有 1GB 存储和带宽限制。
:::

---

## Monorepo 策略简述

| 方案          | 工具           | 特点                     |
| ------------- | -------------- | ------------------------ |
| **Submodule** | Git 内置       | 独立仓库引用，维护成本高 |
| **Monorepo**  | Turborepo / Nx | 单仓库多项目，统一管理   |
| **Subtree**   | Git 内置       | 将子仓库合入主仓库       |

```bash
git subtree add --prefix=libs/shared <repo-url> main --squash
git subtree pull --prefix=libs/shared <repo-url> main --squash
```
