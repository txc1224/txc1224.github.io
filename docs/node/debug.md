# 调试技巧

```bash
# 启动调试模式（配合 Chrome DevTools 或 VS Code）
node --inspect app.js
node --inspect-brk app.js  # 在第一行暂停，等待调试器连接

# 打开 chrome://inspect 连接
```

```js
// 内置 inspector（程序内启动调试）
import inspector from 'node:inspector'
inspector.open(9229, '127.0.0.1', true) // port, host, breakOnStart

// 性能分析
const { performance } = require('perf_hooks')
const start = performance.now()
doWork()
console.log(`耗时: ${performance.now() - start}ms`)

// 内存泄漏排查
node --expose-gc app.js  // 允许手动调用 gc()
// 然后使用 heapdump 或 Chrome DevTools Memory 面板分析堆快照

// 常见内存泄漏原因
// 1. 全局变量意外积累
// 2. 闭包持有大对象引用
// 3. EventEmitter 忘记 removeListener
// 4. 定时器 setInterval 没有 clearInterval
// 5. 缓存无限增长（用 WeakMap 或设置上限）
```

```bash
# 查看 Node.js 版本信息
node -e "console.log(process.versions)"

# 性能分析火焰图
node --prof app.js
node --prof-process isolate-*.log > flamegraph.txt
```
