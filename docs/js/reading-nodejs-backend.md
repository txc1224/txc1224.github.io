---
title: '学习书单 · 二、Node.js 后端'
order: 92
---

# 学习书单 · 二、Node.js 后端

<!-- KNOWLEDGE-IMPORT:START -->

## 二、Node.js 后端入门

## TL;DR

> 从前端跨到后端:用 Node.js + NestJS 搭出能跑的生产级 CRUD 服务。

## 阶段目标

本阶段学完应该能:

- 独立搭一个能跑的 NestJS CRUD(含参数校验、错误处理、认证)
- 手写中间件链,讲清请求生命周期
- 解释 libuv 事件循环 6 阶段,讲清与浏览器事件循环的差异
- 讲清 Buffer / Stream / 模块机制在真实场景的应用

## 推荐书单

### 📖 1. 《深入浅出 Node.js》

- **作者**: 朴灵
- **链接**: https://book.douban.com/subject/25768396/
- **覆盖主题**: 事件循环、模块机制、异步 I/O、Buffer、Stream、网络编程
- **难度**: ⭐⭐⭐
- **预计投入**: 3 周 / 每天 1.5h
- **状态**: unread
- **为什么读**: 中文世界讲 Node 底层最经典的一本,把 V8 / libuv / 事件循环讲透了。虽老但**底层原理不过时**,是理解 Node 运行时的必读书。
- **阅读重点**: 精读第 1-5 章(模块机制、异步 I/O、事件循环、Buffer);第 6 章 Stream 精读;后面的网络/进程章节按需泛读。
- **配套笔记**: [js-event-loop-basics, js-browser-vs-node-loop, node-fs, node-process, node-events-stream]
- **避坑**: 2014 年出版,Node 版本早就过时,**具体 API 不要照抄**。但事件循环 / 模块 / 流这三章永不过时,值得反复读。版本相关的细节去查官方文档。
- **我的收获**(留白): <读完后写,AI 写不出这段>

### 📖 2. 《Node.js 实战》

- **作者**: Alex Young
- **链接**: https://book.douban.com/subject/25870716/
- **覆盖主题**: Express/Koa、中间件、RESTful API、认证、错误处理
- **难度**: ⭐⭐⭐
- **预计投入**: 2 周 / 每天 1.5h
- **状态**: unread
- **为什么读**: 偏工程实战,把"写一个能跑的 Web 服务"的完整链路串起来,适合作为朴灵那本的落地补充。
- **阅读重点**: 中间件机制、路由、错误处理、认证章节精读;部署运维章节泛读。
- **配套笔记**: [node-http, node-express-middleware, node-restful-api]
- **避坑**: 不要照抄 Express 4 的老教程写法,直接上 Express 5 或干脆跳过 Express 上 NestJS。这本书的价值在"思路"不在"代码"。
- **我的收获**(留白): <读完后写,AI 写不出这段>

### 📖 3. 《NestJS 实战》

- **作者**: 刘大卫 等
- **链接**: https://book.douban.com/subject/35342034/
- **覆盖主题**: TS 后端架构、依赖注入、分层架构、微服务
- **难度**: ⭐⭐⭐
- **预计投入**: 3 周 / 每天 1.5h
- **状态**: unread
- **为什么读**: NestJS 是当前 Node 后端架构的事实标准,把 Spring 那套 DI / 分层思想搬到了 TS 世界。前端转后端靠它能最快建立"后端架构思维"。
- **阅读重点**: 精读 DI / 模块 / 控制器 / 提供者 / 中间件 / 异常过滤器;微服务章节泛读,用到再深入。
- **配套笔记**: [nestjs-di, nestjs-module, nestjs-middleware, node-http]
- **避坑**: NestJS 概念多(装饰器满天飞),别陷入"背注解"。先理解 DI 和分层的目的,再回头看装饰器只是语法糖。务必动手敲一个完整 CRUD,只看不动手等于白读。
- **我的收获**(留白): <读完后写,AI 写不出这段>

## 阶段自测清单

- [ ] 能脱稿讲清本阶段核心概念
- [ ] 能把本阶段知识跟现有知识库条目对上链接
- [ ] 能在自己的项目里用到至少 1 个本阶段学到的模式

## 跟知识库的对应关系

> 把书单里的概念反向链接到 01-04 模块已有知识点,边读边补。

- 《深入浅出 Node.js》事件循环章节 → [[../../01-js-core/js-event-loop-basics]]、[[../../01-js-core/js-browser-vs-node-loop]]
- 《深入浅出 Node.js》Buffer/Stream 章节 → [[../../04-node/node-events-stream]]
- 《Node.js 实战》中间件章节 → [[../../04-node/node-express-middleware]]
- 《NestJS 实战》DI 与分层章节 → [[../../04-node/nestjs-di]]
<!-- KNOWLEDGE-IMPORT:END -->
