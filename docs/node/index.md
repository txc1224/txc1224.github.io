node简介
1、node是一款软件 他的功能是解析并运行js(ECMAScript + node相关的api)
2、node是一款命令行应用

打开命令行的方式
1 win + r 输入cmd  
 一定要注意我们的命令行的工作目录
切换命令窗口的工作目录的命令是 cd 目录地址

    2 按住shift 点击右键  松开shift出现powershell窗口
      打开 命令行窗口就定位到我们当前的目录

常用的cmd命令
1 查看当前目录下的所有内容 dir
2 cd (changeDir) 切换工作目录
跨盘切换的时候,输入: 盘符编号加冒号
在盘内进行切换的时候,采用的是相对路径, ./代表当前目录 ../上一级目录
如果要进入盘符的根目录 cd /

node环境搭建
node中js的运行
浏览器中的js如何运行？
依赖一份html文件运行

        在node中  js是可以独立 运行的
        技巧: 使用tab可以帮我们自动补全目录名称 (在node 或者是 cd 的时候都可以使用)
            如果多个文件包含了相同的名称字符  可以进行切换
            使用上下键 可以是查看历史命令

node中的模块
模块化编程
1 commonjs规范(nodejs)
2 AMD CMD规范(浏览器端的require.js)

    关于模块化的总结:
    1 能够使各个模块独立运行 且互不影响
    2 模块与模块之间应该有一种统一的合作方式

    node中的模块
    1 一份js文件就是一个模块
    2 node中规定使用require方法引入模块
    3 node中规定使用module.exports去导出模块

    node中的模块分类
        1 自定义模块(我们自己创建的模块)
        2 核心模块(包含在node内部,安装node环境,这些模块就可以直接使用了,比如  fs)
        3 第三方模块(需要安装,有个人创建并按照规范传到node包管理中心的模块)

    fs模块的简单用法
        fs是一个核心模块  主要功能是操作目录和文件
        引入fs模块
            const fs = require("fs");    //引入fs模块

        1 读取文件  (fs.readFileSync)

2 写入文件 （fs.readFileSync）

注意: 如果 没有要读取的文件路径 则新建一个文件

3 删除文件 (fs.unlinkSync)
4 判断资源是否存在 (fs.existsSync) 返回布尔值 删除文件先判断 有没有 在删除

5 判断该资源是文件还是目录 (fs.statSync)

6 创建目录 fs.mkdirSync()

7 读取目录 fs.readdirSync

拼接路径的技巧

node的一个常量 \_\_dirname 出现在模块中的 代表的是当前文件所在目录的 绝对路径

8 删除目录 (fs.rmdirSync)

导入导出的细节和原理
导入细节和原理
1 require是node环境中提供的一个方法, 作用是引入模块(在浏览器的环境下没有这个方法)
2 require函数接收参数的类型是字符串（路径形式的 和 模块名）

3路径分为绝对 和 相对
A 绝对路径一般都是从盘符开始 一般借助\_\_dirname 和 path.join()
B 相对路径参照的目录是 ？？？？？
Require 是当前模块所在的目录就是该相对路径所参照的目录
除了require之外 其他的相对路径的参照永远都是工作目录(命令行所定位的目录)

总结: 工作目录是可变的,所以尽量用绝对路径也就是借助\_\_dirname 和 path.join

4 如果接收的参数是一个模块名, 那么我们此时引入的就不是模块 而是 包(package) ,

导出细节和原理
1 module.exports是node环境中提供的一个对象, 作用是导出模块(在浏览器的环境下没有这个对象)

node中其实存在一个可以导出的对象 叫 exports

本质上存在 exports === module.exports => true
但是 在 真正在导出的时候 识别的是 module.exports 这个名字

node中的包
1 包就是把多个node模块集合在一起 但是要遵守相关的一些规则
一个集合了js文件的目录就是一个包 也叫package

2 包相关的规则:
在目录的根部创建package.json 该文件中有众多属性(字段) 这些属性赋予包额外的特性 一般使用npm init 创建 package.json（对包的描述）

3 如何引入包 也是 require
1 在require方法中只要写入包的路径 在包中会默认查找 index.js  
如果没有 就查找 包的package.json中的main这个字段

2 通过包的名字去引入包
1 包 必须 存入 node_modules下， 包名必须符合包的规范
2 通过包名查找包的规则
1 在当前目录下的node_modules下去查找包名目录
2 按照包的规则去加载包
如果在当前目录的node_modules没有找到对应的目录,继续向上一层按照该规则去查找,直到盘符的根目录

3 如果在根目录还没找到,那么就会找全局环境变量NODE_PATH所对应的目录
此电脑-》右键-》属性-》高级系统设置-》高级-》环境变量-》系统变量-》NODE_PATH

npm介绍
1 npm属于node的一个模块, 全写是 node package manger（node的包管理）
2 通过命令行使用

npm管理包的一些命令
1 创建包的描述文件package.json （npm init）
2 安装包的命令 （npm install 包名）
2.1 从npm的光放网站
2.2 安装到指定的位置
2.3 全局安装 （npm install packageName -g）
2.4 本地安装  
（生产环境） npm install packageName --save
npm install packageName -S
（开发环境） npm install packageName --save-dev
npm install packageName -D
【babel 作用是把es6的代码转成es5的】
2.4.1 本地安装的这个包 被安装在工作目录的node_modules下

2.5 快速安装 （npm install）
在有package.json的工作目录下执行
检测package.json中的 dependencies 和 devDependencies两个字段 并且全部安装他们所保存的包

3 卸载包 （npm uninstall packageName 环境）
4 设置和查看全局包的安装位置的命令
npm config get prefix 查看
npm config set prefix 设置 后面的跟的是新的目录地址

5 有些全局包是一些使用工具
npm install -g cnpm --registry=https://registry.npmmirror.com -g
yddict 字典功能包 使用yd 内容 实现英汉互译

anywhere 以工作目录为静态资源目录 创建服务器

6 设置和查看我们的下载源 npm config get registry
npm config set registry 下载地址

node中的工具模块  
url 地址

url模块和querystring模块
解析url路径

querystring 解析查询字符串 返回一个对象

// 在node环境下运行es6模块语法
// 使用babel转码成es5,但是它这针对js文件，其他类型无法迁移
// node环境几乎支持除了es5模块之外所有的语法，babel提供了一 个@babel/register的模块
// 该模块的作用是在运行时解决node不支持es6的问题

// @babel/register的用法:
// 在运行入口文件的时候，添加一个启动模块(entry.js),写入以下内容

require( '@babel/register')({
//在运行时，会去转码对应的es6语法
plugins: ['@babel/plugin-transform-modules-commonjs']
});

//加载目标文件
// require('./index' )
// 在node中执行entry.js即可
