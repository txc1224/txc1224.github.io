## fs 模块 file System 文件系统 核心/内置模块 不用下载 直接 require 引用

- 方法 同步和异步
- 文件
  - readFileSync/readFile 读取文件
    - fs.readFileSync('filePath', 'utf-8);
    - fs.readFile('filePath', 'utf-8', (err, data) => {});
  - writeFileSync/writeFile 覆盖式写入文件
    - fs.writeFileSync('filePath', '写入内容');
    - fs.writeFile('filePath', '写入内容', (err) => {});
  - appendFileSync/appendFile 追加式写文件
    - fs.appendFileSync('filePath', '写入内容');
    - fs.appendFile('filePath', '写入内容', (err) => {});
  - unlinkSync/unlink 删除文件
    - fs.unlinkSync('filePath');
    - fs.unlink('filePath', (err) =>{});
  - copyFileSync/copyFile 复制文件
    - fs.copyFileSync('源文件', '目标文件');
    - fs.copyFile('源文件', '目标文件', (err) => {});
  - renameSync/rename 重命名
    - fs.renameSync('源文件', '新文件');
    - fs.rename('源文件', '新文件', (err) => {});
- 文件夹
  - readdirSync/readdir 读取目录 只读一层
    - fs.readdirSync('filePath');
    - fs.readdir('filePath', (err, data) => {});
  - stat 检测文件
    - fs.statSync('filePath);
    - fs.stat('filePath', (err, stats) => {});
      - stats.isFile(); 判断是不是文件
      - stats.isDirectory(); 判断是不是目录
  - 判断文件/目录
    - existsSync 存在返回 true 不存在 false
    - accessSync 存在什么都不发生 不存在报错
  - mkdirSync/mkdir 创建目录
    - fs.mkdirSync('filePath');
    - fs.mkdir('filePath', (err) => {});
  - rmdirSync/rmdir 删除目录
    - fs.rmdirSync('filePath');
    - fs.rmdir('filePath', (err) => {});

## path

- Node.js path 模块提供了一些用于处理文件路径的小工具，我们可以通过以下方式引入该模块：

- 用法 let path = require("path")

- api

- path.join([path1][, path2][, ...]) 用于连接路径。该方法的主要用途在于，会正确使用当前系统的路径分隔符，Unix 系统是"/"，Windows 系统是"\"。
- path.resolve([from ...], to)将 to 参数解析为绝对路径，给定的路径的序列是从右往左被处理的，后面每个 path 被依次解析，直到构造完成一个绝对路径。 例如，给定的路径片段的序列为：/foo、/bar、baz，则调用 path.resolve('/foo', '/bar', 'baz') 会返回 /bar/baz。

  - 例如：
    path.resolve('/foo/bar', './baz');
    // 返回: '/foo/bar/baz'

    path.resolve('/foo/bar', '/tmp/file/');
    // 返回: '/tmp/file'

    path.resolve('wwwroot', 'static_files/png/', '../gif/image.gif');
    // 如果当前工作目录为 /home/myself/node，
    // 则返回 '/home/myself/node/wwwroot/static_files/gif/image.gif'

  -     path.extname(p)
    返回路径中文件的后缀名，即路径中最后一个'.'之后的部分。如果一个路径中并不包含'.'或该路径只包含一个'.' 且这个'.'为路径的第一个字符，则此命令返回空字符串
  - path.parse(pathString)
    返回路径字符串的对象。

### url 模块（解析地址/生成地址/拼接地址）

```javascript
1，url.parse(要解析的路径 ，解析出来的query查询字符串（false 默认）还是查询对象（true）)
    let str = 'https://baidu.com:8080/p/a/t/h?id=1&name=美女';
    let url = require('url');
    console.log(url.parse(str,true).query.id);
2，url.format(url) -- 将一个URL对象转换为URL字符串
    例如：
         let urlObj = {
            protocol: "http",
            host: "127.1.1.0",
            port: "8080",
            search: "?name=张三"
        }
        console.log(url.format(urlObj));
3，url.resolve() 可以用于拼接URL
    例如：
        let p = url.resolve('/one/two/three', '/four') // '/one/two/four'
        let p1 = url.resolve('http://example.com/two/', '/one') // 'http://example.com/one'
```

---

- 流式读写

  - 1、创建可读流 const rs = fs.createReadStream('filepath');
  - 2、创建可写流 const ws = fs.createWriteStream('filepath');
  - 3、管道输出 rs.pipe(ws);

  - 可读流 监听事件
    - rs.on('data', (chunk) => {});
    - rs.on('end', () => {});
