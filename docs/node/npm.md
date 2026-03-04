---
title: 'npm / pnpm'
order: 7
---

# npm 与包管理

> npm 是 Node.js 默认的包管理器，理解语义版本、依赖管理和 workspace 是大型项目的基础技能。

---

## npm vs pnpm vs yarn 对比

| 特性              | npm                        | pnpm                             | yarn (v4)                  |
| ----------------- | -------------------------- | -------------------------------- | -------------------------- |
| 安装速度          | 慢                         | 最快（硬链接）                   | 快                         |
| 磁盘占用          | 大（每项目独立副本）       | 最小（全局 store + 硬链接）      | 中等                       |
| 幽灵依赖          | 存在                       | 严格隔离，不存在                 | 存在                       |
| lock 文件         | `package-lock.json` (JSON) | `pnpm-lock.yaml` (YAML)          | `yarn.lock` (YAML)         |
| monorepo          | `workspaces`               | `workspaces`（最佳支持）         | `workspaces`               |
| `npx` 等价        | `npx`                      | `pnpm dlx`                       | `yarn dlx`                 |
| CI 安装           | `npm ci`                   | `pnpm install --frozen-lockfile` | `yarn install --immutable` |
| node_modules 结构 | 扁平化                     | 内容寻址（非扁平）               | PnP 或 node_modules        |

> lock 文件必须提交到 git，确保团队和 CI 环境一致。

---

## package.json 核心字段

```jsonc
{
  "name": "my-app", // 包名（npm 上唯一）
  "version": "1.2.3", // 语义版本
  "type": "module", // ESM 模式（默认 commonjs）
  "main": "./dist/index.cjs", // CJS 入口
  "module": "./dist/index.mjs", // ESM 入口（打包工具用）
  "types": "./dist/index.d.ts", // TypeScript 类型
  "exports": {
    // 条件导出（优先于 main）
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.cjs",
    },
  },
  "files": ["dist"], // 发布时包含的文件
  "scripts": {}, // 自定义脚本
  "dependencies": {}, // 生产依赖
  "devDependencies": {}, // 开发依赖
  "peerDependencies": {}, // 对等依赖（插件声明宿主版本）
  "engines": {
    // 运行环境要求
    "node": ">=18",
  },
}
```

---

## 语义版本（SemVer）

| 格式      | 含义             | 安装范围          |
| --------- | ---------------- | ----------------- |
| `1.2.3`   | 精确版本         | 仅 1.2.3          |
| `^1.2.3`  | 兼容补丁和次版本 | >=1.2.3 且 <2.0.0 |
| `~1.2.3`  | 仅兼容补丁版本   | >=1.2.3 且 <1.3.0 |
| `>=1.0.0` | 大于等于         | >=1.0.0           |
| `1.x`     | 主版本锁定       | >=1.0.0 且 <2.0.0 |
| `*`       | 任意版本         | 最新版（危险）    |

```
版本号：MAJOR.MINOR.PATCH
  MAJOR — 不兼容的 API 变更
  MINOR — 向后兼容的新功能
  PATCH — 向后兼容的 bug 修复
```

---

## scripts 常用模式

```jsonc
{
  "scripts": {
    "dev": "node --watch src/app.js", // 开发模式（Node 18+）
    "build": "tsc && node build.js", // 构建
    "start": "node dist/app.js", // 生产启动
    "test": "vitest", // 测试
    "test:watch": "vitest --watch", // 测试监听
    "lint": "eslint src/", // 代码检查
    "lint:fix": "eslint src/ --fix", // 自动修复
    "preinstall": "npx only-allow pnpm", // 强制使用 pnpm
    "prepare": "husky", // Git hooks
  },
}
```

```bash
# 运行脚本
npm run dev
npm test                    # test/start/stop 可省略 run
npm run build -- --watch    # -- 传递额外参数
```

---

## workspace（Monorepo）

```yaml
# pnpm-workspace.yaml
packages:
  - 'packages/*'
  - 'apps/*'
```

```bash
# pnpm workspace 常用命令
pnpm add lodash --filter my-app          # 给指定包安装依赖
pnpm add @my-org/utils --filter my-app --workspace  # 安装 workspace 内部包
pnpm -r run build                        # 递归执行所有包的 build
pnpm -r run test --parallel              # 并行执行所有包的 test
```

```jsonc
// packages/my-app/package.json
{
  "dependencies": {
    "@my-org/utils": "workspace:*", // 引用本地 workspace 包
  },
}
```

---

## .npmrc 配置

```ini
# .npmrc — 放在项目根目录
registry=https://registry.npmmirror.com   # 国内镜像
auto-install-peers=true                    # 自动安装 peerDependencies
strict-peer-dependencies=false             # 不严格检查 peer 版本
shamefully-hoist=true                      # pnpm: 提升依赖（兼容性）
node-linker=hoisted                        # pnpm: 使用扁平 node_modules
engine-strict=true                         # 严格检查 engines 字段
save-exact=true                            # 安装时锁定精确版本
```

---

## 常见陷阱

```bash
# ❌ 幽灵依赖（Phantom Dependencies）
# 项目没有声明 lodash，但因为其他包安装了 lodash，代码意外能用
import _ from 'lodash'  # npm 扁平化 node_modules 导致

# ✅ 使用 pnpm 严格隔离 — 只能访问显式声明的依赖
# 或使用 eslint-plugin-import 检查未声明依赖
```

```bash
# ❌ npm install 和 npm ci 混淆
npm install   # 可能更新 lock 文件（开发环境用）
npm ci        # 严格按 lock 文件安装（CI 环境用）

# ✅ CI/CD 中始终使用
npm ci                               # npm
pnpm install --frozen-lockfile       # pnpm
```

```jsonc
// ❌ 依赖地狱 — 不锁版本，每次安装可能不同
{
  "dependencies": {
    "foo": "*",        // 任意版本，极度危险
    "bar": ">=1.0.0"   // 范围过大
  }
}

// ✅ 使用 ^ 或精确版本 + lock 文件
{
  "dependencies": {
    "foo": "^2.1.0",   // 允许补丁和次版本更新
    "bar": "1.5.3"     // 精确版本
  }
}
```

```bash
# ❌ 全局安装项目工具 — 团队版本不一致
npm install -g typescript

# ✅ 作为 devDependencies 安装 + npx 执行
npm install -D typescript
npx tsc --version
```
