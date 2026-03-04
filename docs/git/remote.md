---
title: '远程协作'
order: 4
---

# 远程协作

> 掌握远程仓库操作是团队协作的核心。理解 fetch / pull / push 的区别至关重要。

## git remote 管理

```bash
# 查看远程仓库
git remote -v

# 添加远程仓库
git remote add origin <url>

# 添加上游仓库（fork 场景）
git remote add upstream <url>

# 修改远程仓库 URL
git remote set-url origin <new-url>

# 重命名
git remote rename origin old-origin

# 删除
git remote remove upstream

# 查看远程仓库详情
git remote show origin
```

---

## fetch vs pull

| 操作              | 命令                            | 作用                         | 安全性             |
| ----------------- | ------------------------------- | ---------------------------- | ------------------ |
| **fetch**         | `git fetch origin`              | 仅下载远程更新到本地，不合并 | 安全，不改动工作区 |
| **pull**          | `git pull origin main`          | fetch + merge，自动合并      | 可能产生冲突       |
| **pull --rebase** | `git pull --rebase origin main` | fetch + rebase，线性历史     | 推荐日常使用       |

```bash
# 推荐流程：先 fetch 查看变化，再决定合并方式
git fetch origin
git log HEAD..origin/main --oneline  # 查看远程新增的提交
git merge origin/main                # 确认后合并
```

::: tip 建议
设置默认 pull 策略为 rebase，避免产生无意义的 merge commit：

```bash
git config --global pull.rebase true
```

:::

---

## git push 推送

```bash
# 推送当前分支并设置上游追踪
git push -u origin feature/login

# 后续推送（已设置上游）
git push

# 推送所有分支
git push --all origin

# 安全强推（推荐替代 --force）
git push --force-with-lease

# 删除远程分支
git push origin --delete feature/login
```

**--force vs --force-with-lease：**

| 方式                 | 行为                         | 风险             |
| -------------------- | ---------------------------- | ---------------- |
| `--force`            | 强制覆盖远程                 | 可能覆盖他人提交 |
| `--force-with-lease` | 仅当远程未被他人更新时才推送 | 安全，推荐使用   |

---

## Fork & Pull Request 工作流

```bash
# 1. Fork 仓库（在 GitHub 上操作）

# 2. 克隆自己的 fork
git clone <your-fork-url>

# 3. 添加上游仓库
git remote add upstream <original-repo-url>

# 4. 创建 feature 分支
git switch -c feature/awesome

# 5. 开发、提交
git commit -m "feat: add awesome feature"

# 6. 推送到自己的 fork
git push -u origin feature/awesome

# 7. 在 GitHub 上创建 Pull Request
```

---

## upstream 同步（保持 fork 最新）

```bash
# 获取上游更新
git fetch upstream

# 切到 main 分支
git switch main

# 合并上游 main
git merge upstream/main

# 推送到自己的 fork
git push origin main
```

::: warning 注意
在 feature 分支开发前，先同步 upstream，避免基于过时代码开发。
:::

---

## SSH vs HTTPS 认证

| 特性     | SSH                            | HTTPS                              |
| -------- | ------------------------------ | ---------------------------------- |
| 认证方式 | 密钥对                         | 用户名 + Token                     |
| 首次配置 | 需生成密钥并添加到 GitHub      | 直接使用                           |
| 后续操作 | 免密                           | 需配置凭据缓存或每次输入           |
| URL 格式 | `git@github.com:user/repo.git` | `https://github.com/user/repo.git` |
| 防火墙   | 可能被限制（端口 22）          | 通常无限制（端口 443）             |
| 推荐场景 | 个人开发机                     | CI/CD、临时使用                    |

**SSH 密钥配置：**

```bash
# 生成密钥
ssh-keygen -t ed25519 -C "your@email.com"

# 添加到 ssh-agent
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519

# 测试连接
ssh -T git@github.com

# 复制公钥，粘贴到 GitHub Settings → SSH Keys
cat ~/.ssh/id_ed25519.pub
```

---

## GitHub CLI（gh）常用命令

```bash
# 登录
gh auth login

# 创建仓库
gh repo create my-project --public

# 克隆
gh repo clone owner/repo

# Pull Request
gh pr create --title "feat: xxx" --body "description"
gh pr list
gh pr view 123
gh pr merge 123

# Issue
gh issue create --title "Bug: xxx"
gh issue list
gh issue close 123

# 查看 CI 状态
gh run list
gh run view <run-id>

# 查看仓库信息
gh repo view
```
