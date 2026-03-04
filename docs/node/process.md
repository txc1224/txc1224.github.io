# process 与环境变量

```js
// 环境变量
process.env.NODE_ENV; // 'production' | 'development'
process.env.PORT ?? 3000; // 端口

// 命令行参数
// node app.js --port=3000 --debug
process.argv; // ['node', 'app.js', '--port=3000', '--debug']

// 进程信息
process.pid; // 进程 ID
process.cwd(); // 当前工作目录
process.uptime(); // 运行时长（秒）
process.memoryUsage(); // 内存使用情况

// 标准流
process.stdout.write('Hello\n');
process.stderr.write('Error\n');

// 退出
process.exit(0); // 正常退出
process.exit(1); // 异常退出

// 信号处理（优雅关闭）
process.on('SIGTERM', () => {
  server.close(() => {
    db.disconnect();
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\nCtrl+C received, shutting down...');
  process.exit(0);
});
```
