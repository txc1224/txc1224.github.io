interface ISidebarItem {
  text: string;
  link?: string;
  items?: ISidebarItem[];
}

interface ISidebarConf {
  [path: string]: ISidebarItem[];
}

export const sidebar: ISidebarConf = {
  '/js/': [
    { text: '概览', link: '/js/' },
    { text: '变量 / 闭包 / 原型链', link: '/js/core' },
    { text: '异步编程', link: '/js/async' },
    { text: 'ES6+ / 函数技巧', link: '/js/es6' },
    { text: '类型判断 / 深拷贝', link: '/js/types' },
    { text: 'Map & Set / Generator / Proxy / Symbol', link: '/js/advanced' },
    { text: '正则表达式', link: '/js/regex' },
    { text: '设计模式 / 错误处理', link: '/js/patterns' },
  ],
  '/node/': [
    { text: '概览 & Event Loop', link: '/node/' },
    { text: '模块系统', link: '/node/modules' },
    { text: '内置模块速查', link: '/node/builtin' },
    { text: 'HTTP 模块', link: '/node/http' },
    { text: 'EventEmitter / Buffer & Stream', link: '/node/events-stream' },
    { text: 'process 与环境变量', link: '/node/process' },
    { text: 'npm / pnpm', link: '/node/npm' },
    { text: '调试技巧', link: '/node/debug' },
    { text: 'fs 文件系统', link: '/node/fs' },
  ],
  '/python/': [
    { text: '概览', link: '/python/' },
    { text: '基础数据类型', link: '/python/types' },
    { text: '函数 / 推导式', link: '/python/functions' },
    { text: '面向对象 / 异常处理', link: '/python/oop' },
    { text: '常用标准库', link: '/python/stdlib' },
    { text: '类型注解 / 包管理', link: '/python/typing' },
    { text: '常见陷阱', link: '/python/pitfalls' },
  ],
  '/java/': [
    { text: '概览', link: '/java/' },
    { text: '基本类型 / String', link: '/java/types' },
    { text: '面向对象 / 泛型', link: '/java/oop' },
    { text: '集合框架 / Java 8+', link: '/java/collections' },
    { text: '异常体系', link: '/java/exceptions' },
    { text: '多线程 / JVM', link: '/java/threading' },
    { text: 'Maven', link: '/java/maven' },
  ],
  '/c/': [
    { text: '概览', link: '/c/' },
    { text: '数据类型与运算符', link: '/c/types' },
    { text: '指针', link: '/c/pointers' },
    { text: '内存管理', link: '/c/memory' },
    { text: '结构体 / 字符串', link: '/c/structs' },
    { text: '文件IO / 预处理器', link: '/c/fileio' },
    { text: '编译链接 / 常见陷阱', link: '/c/compilation' },
  ],
  '/cpp/': [
    { text: '概览 & C++ vs C', link: '/cpp/' },
    { text: '面向对象', link: '/cpp/oop' },
    { text: 'RAII / 智能指针', link: '/cpp/raii' },
    { text: '模板 / STL 容器', link: '/cpp/templates' },
    { text: 'STL 算法 / 移动语义', link: '/cpp/stl' },
    { text: 'Lambda / 现代 C++ 特性', link: '/cpp/modern' },
    { text: '编译工具链', link: '/cpp/toolchain' },
  ],
  '/daily-tech/': [{ text: '每日科技资讯', link: '/daily-tech/' }],
};
