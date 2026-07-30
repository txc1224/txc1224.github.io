---
title: '学习书单 · 一、JS/TS 根基'
order: 91
---

# 学习书单 · 一、JS/TS 根基

<!-- KNOWLEDGE-IMPORT:START -->

## 一、夯实 JS/TS 根基(前端升级)

## TL;DR

> 三个月全栈第一关:把 JS/TS 底层打透,前端升级为主力技能。

## 阶段目标

本阶段学完应该能:

- 脱稿手写 Promise(含 then 链、all/race)
- 手写深拷贝(处理循环引用、特殊类型)
- 手写事件循环 demo,讲清 task vs microtask 的执行顺序
- 讲清原型链 / class / 闭包在真实业务里的应用
- 用 TS 写出有类型约束的业务代码,不再 `any` 满天飞

## 推荐书单

### 📖 1. 《你不知道的 JavaScript(上中下)》

- **作者**: Kyle Simpson
- **链接**: https://book.douban.com/subject/26351021/
- **覆盖主题**: 作用域、闭包、this、原型、异步、事件循环
- **难度**: ⭐⭐⭐
- **预计投入**: 4 周 / 每天 1.5h
- **状态**: unread
- **为什么读**: 市面上讲 JS 底层最透的一套,不是 API 罗列,而是从编译器视角解释"为什么"。读完再写代码会有"看见字节"的感觉。
- **阅读重点**: 上卷精读(作用域/闭包/this);中卷精读异步部分(事件循环、Promise);下卷泛读(ES6+ 语法),按需查。
- **配套笔记**: [js-types-primitives, js-scope-chain, js-closure, js-promise, js-async-await, js-event-loop-basics, js-prototype-chain, js-class-and-inheritance]
- **避坑**: 别从头死磕逐字读,这套书细节极多,容易陷进去。带着"我要能给别人讲清"的目标读,读完一章立刻写 demo 验证。
- **我的收获**(留白): <读完后写,AI 写不出这段>

### 📖 2. 《TypeScript 编程》

- **作者**: Boris Cherny
- **链接**: https://book.douban.com/subject/35760210/
- **覆盖主题**: 类型系统、接口、泛型、类型体操、TS 与 JS 互操作
- **难度**: ⭐⭐⭐
- **预计投入**: 3 周 / 每天 1.5h
- **状态**: unread
- **为什么读**: TS 进阶最系统的一本,讲透了类型系统的设计哲学,不是只教语法。O'Reilly 出品,作者来自 Facebook 工程团队。
- **阅读重点**: 前 6 章精读(类型基础/泛型/函数重载);类型体操章节挑着读,工作里用到再回来查。
- **配套笔记**: [ts-type-basics, ts-generics, ts-utility-types]
- **避坑**: 别一上来就追求"类型体操大神",先把日常业务类型写扎实。泛型 T 满天飞的项目反而难维护。
- **我的收获**(留白): <读完后写,AI 写不出这段>

### 📖 3. 《深入 React 技术栈》/ 《Vue.js 设计与实现》

- **作者**: 陈屹 / 霍春阳
- **链接**: https://book.douban.com/subject/27130672/ / https://book.douban.com/subject/35768338/
- **覆盖主题**: 框架原理、虚拟 DOM、状态管理、SSR
- **难度**: ⭐⭐⭐
- **预计投入**: 3 周 / 每天 1.5h
- **状态**: unread
- **为什么读**: 框架原理二选一(看主栈),理解"框架为什么这样设计",而不是只会用 API。霍春阳是 Vue 官方团队成员,讲的是 Vue3 设计思路。
- **阅读重点**: React 那本精读组件化与状态管理;Vue 那本精读响应式原理与渲染器。SSR 章节泛读。
- **配套笔记**: [react-hooks-principle, vue-reactivity, virtual-dom]
- **避坑**: 两本都买但只精读一本,另一本当对照参考。不要同时啃,会串味。
- **我的收获**(留白): <读完后写,AI 写不出这段>

## 阶段自测清单

- [ ] 能脱稿讲清本阶段核心概念
- [ ] 能把本阶段知识跟现有知识库条目对上链接
- [ ] 能在自己的项目里用到至少 1 个本阶段学到的模式

## 跟知识库的对应关系

> 把书单里的概念反向链接到 01-04 模块已有知识点,边读边补。

- 《你不知道的 JavaScript》上卷第 1-2 章 → [[../../01-js-core/js-scope-chain]]
- 《你不知道的 JavaScript》上卷第 3-5 章 → [[../../01-js-core/js-closure]]
- 《你不知道的 JavaScript》中卷异步部分 → [[../../01-js-core/js-event-loop-basics]]、[[../../01-js-core/js-promise]]
- 《TypeScript 编程》泛型章节 → [[../../02-ts/ts-generics]]
- 《Vue.js 设计与实现》响应式章节 → [[../../03-framework/vue-reactivity]]
<!-- KNOWLEDGE-IMPORT:END -->
