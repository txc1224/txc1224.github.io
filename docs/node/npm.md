# npm / pnpm 常用命令

## npm

```bash
# 初始化
npm init -y

# 安装
npm install lodash           # 生产依赖
npm install -D typescript    # 开发依赖
npm install -g nodemon       # 全局安装
npm ci                       # CI 环境（按 lock 文件严格安装）

# 更新 / 卸载
npm update lodash
npm uninstall lodash
npm outdated                 # 查看过期包

# 运行脚本
npm run build
npm run test -- --watch      # 传递额外参数
npm start                    # 等价于 npm run start

# 查看
npm list                     # 查看已安装包
npm list --depth=0           # 只看直接依赖
npm info lodash version      # 查看包最新版本

# 镜像
npm config set registry https://registry.npmmirror.com
```

---

## pnpm

```bash
pnpm install           # 安装（使用硬链接，节省磁盘）
pnpm add lodash        # 生产依赖
pnpm add -D typescript
pnpm remove lodash
pnpm update --interactive
pnpm run build
pnpm dlx create-react-app  # 等价于 npx

# pnpm workspace（monorepo）
pnpm add lodash --filter my-app
pnpm -r run build      # 递归执行所有包的 build
```

---

## lock 文件区别

|      | `package-lock.json` | `yarn.lock` | `pnpm-lock.yaml`  |
| ---- | ------------------- | ----------- | ----------------- |
| 工具 | npm                 | yarn        | pnpm              |
| 格式 | JSON                | 自定义      | YAML              |
| 锁定 | 精确版本+完整依赖树 | 精确版本    | 精确版本+内容哈希 |

> **⚠️ lock 文件必须提交到 git**，确保团队环境一致。
