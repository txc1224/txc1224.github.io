---
title: '常见陷阱'
order: 7
---

# 常见陷阱

> 这些是开发者最容易踩的 Git 坑。了解它们，可以避免大量不必要的麻烦。

## 1. git push --force 覆盖他人代码

```bash
# ❌ 强制推送，可能覆盖他人已推送的提交
git push --force

# ✅ 安全推送，仅当远程分支未被他人更新时才强推
git push --force-with-lease
```

`--force-with-lease` 会检查远程分支的引用是否与你本地缓存一致，如果他人已推送新提交，命令会拒绝执行。

---

## 2. 在 main 分支直接开发

```bash
# ❌ 直接在 main 上修改提交
git commit -m "add feature"
git push origin main

# ✅ 创建 feature 分支
git switch -c feature/user-auth
# 开发完成后通过 PR 合并
```

| 问题             | 后果               |
| ---------------- | ------------------ |
| 代码未经 review  | 质量无法保证       |
| 无法回退单个功能 | main 历史混乱      |
| CI/CD 频繁触发   | 未完成的代码被部署 |

---

## 3. Commit message 随便写

```bash
# ❌ 无意义的提交信息
git commit -m "fix"
git commit -m "update"
git commit -m "asdf"

# ✅ 遵循 Conventional Commits 规范
git commit -m "feat(auth): add JWT token refresh"
git commit -m "fix(cart): correct price calculation for discounts"
git commit -m "docs: update API endpoint examples"
```

**Conventional Commits 格式：**

| 类型       | 用途                   |
| ---------- | ---------------------- |
| `feat`     | 新功能                 |
| `fix`      | Bug 修复               |
| `docs`     | 文档更新               |
| `style`    | 格式调整（不影响逻辑） |
| `refactor` | 重构                   |
| `test`     | 测试                   |
| `chore`    | 构建 / 工具 / 依赖     |
| `perf`     | 性能优化               |

---

## 4. 提交敏感信息

```bash
# ❌ 把密码、密钥提交到仓库
git add .env
git commit -m "add config"

# ✅ 在 .gitignore 中排除敏感文件
echo ".env" >> .gitignore
echo "*.key" >> .gitignore
echo "credentials.json" >> .gitignore
```

**已提交的敏感信息清理：**

```bash
# 使用 git-filter-repo（推荐）
pip install git-filter-repo
git filter-repo --path .env --invert-paths

# 清理后必须 force push
git push --force-with-lease --all
```

::: danger 重要
一旦敏感信息被推送到远程，即使清理了 Git 历史，也应当立即轮换密钥/密码。因为他人可能已经拉取。
:::

---

## 5. merge 和 rebase 混用

```bash
# ❌ 同一分支反复 merge 又 rebase，历史变得混乱
git merge main
git rebase main   # 危险！已 merge 的提交被重写

# ✅ 团队统一策略：始终 merge 或始终 rebase，不要混用
```

| 策略                     | 适用场景     | 团队约定   |
| ------------------------ | ------------ | ---------- |
| 只用 merge               | 保留完整历史 | 适合大团队 |
| 只用 rebase              | 线性历史     | 适合小团队 |
| merge 公共 + rebase 个人 | 折中方案     | 最常见     |

---

## 6. 大文件直接提交

```bash
# ❌ 提交大文件到仓库（即使后来删除，历史中依然存在）
git add design-assets.zip   # 50MB

# ✅ 使用 .gitignore 排除或 Git LFS 管理
echo "*.zip" >> .gitignore
git lfs track "*.zip"
```

---

## 7. detached HEAD 状态下提交丢失

```bash
# ❌ 在 detached HEAD 状态下提交，切换分支后提交会丢失
git checkout <commit-hash>
git commit -m "some work"
git switch main   # 刚才的提交变成孤立提交

# ✅ 先创建分支再提交
git switch -c temp-branch
git commit -m "some work"

# 如果已经切走了，用 reflog 找回
git reflog
git branch recovery <lost-hash>
```

---

## 8. git stash 忘记 pop

```bash
# ❌ 暂存了修改然后忘了恢复

# ✅ 养成好习惯
git stash save "WIP: 具体描述"   # 加上描述方便识别
git stash list                   # 定期检查
git stash pop                    # 用 pop 而非 apply，自动移除条目
```

::: tip 建议
暂存时一定写描述。`git stash list` 列表不应该超过 3 个。能用分支暂存的场景，优先用分支。
:::

---

## 9. CRLF vs LF 换行符问题

不同操作系统使用不同的换行符：

| 系统          | 换行符 | 表示   |
| ------------- | ------ | ------ |
| Linux / macOS | LF     | `\n`   |
| Windows       | CRLF   | `\r\n` |

```bash
# ❌ 团队成员系统不同，导致 diff 里全是换行符变更

# ✅ 统一配置
# macOS / Linux
git config --global core.autocrlf input

# Windows
git config --global core.autocrlf true
```

**推荐使用 .gitattributes 统一管理：**

```txt
* text=auto
*.js text eol=lf
*.ts text eol=lf
*.sh text eol=lf
*.bat text eol=crlf
*.png binary
```

::: tip 终极方案
在项目根目录添加 `.gitattributes` 和 `.editorconfig`，从源头统一换行符。
:::
