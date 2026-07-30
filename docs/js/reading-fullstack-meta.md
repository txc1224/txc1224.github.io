---
title: '学习书单 · 四、全栈元框架 Next/Nuxt'
order: 94
---

# 学习书单 · 四、全栈元框架 Next/Nuxt

<!-- KNOWLEDGE-IMPORT:START -->

## 四、全栈元框架 Next/Nuxt

## TL;DR

> 用 Next.js 打通前后端，吃透渲染策略与部署。

## 阶段目标

- 能独立完成一个 Next.js + Prisma + PostgreSQL 的完整项目（含登录鉴权、CRUD、部署上线），端到端不依赖纯后端。
- 能写出 SSG + ISR 混合渲染策略（如列表页 ISR 定时重验证 + 详情页 SSG 按需回源），并讲清每页为什么选这个策略。
- 能脱稿解释 hydration 的过程与代价，以及"双份渲染"带来的常见 bug（如文本不匹配、window 未定义）。

## 推荐书单

### 📖 1. 《全栈开发一本通：TypeScript+React+Next.js》

- **作者**: 刘一奇
- **链接**: https://book.douban.com/subject/35889395/
- **覆盖主题**: SSR/SSG、API 路由、Auth、数据库接入、部署上线
- **难度**: ⭐⭐⭐
- **预计投入**: 4 周 / 每天 1.5h
- **状态**: unread
- **为什么读**: 少有的"以一个完整项目贯穿"的中文全栈书，把 TS、React、Next.js、鉴权、部署串成一条线——正好把前面三个阶段的散点知识缝合成成品。
- **阅读重点**: SSR/SSG 数据获取（getServerSideProps/getStaticProps）、API 路由、Auth（Session/JWT）、数据库与部署章节精读并跟着做；已熟练的 TS/React 基础章节可快速跳过。
- **配套笔记**: React SSR、Node 端 JWT 鉴权
- **避坑**: 跟着书做项目时不要复制粘贴跑通就翻页——每章做完合上书自己重默一遍数据流（请求 → 渲染 → hydration），否则学完还是"看得懂写不出"。
- **我的收获**(留白): <读完后写，AI 写不出这段>

### 📖 2. 《Next.js 设计与实现》（深入浅出 Next.js）

- **作者**: 深入浅出 Next.js 编写组
- **链接**: https://book.douban.com/subject/35760666/
- **覆盖主题**: 路由体系、数据获取、中间件、缓存、性能优化、App Router 原理
- **难度**: ⭐⭐⭐⭐
- **预计投入**: 5 周 / 每天 1.5h
- **状态**: unread
- **为什么读**: 第一本偏"用"，这本偏"懂"——讲清 Next.js 的渲染流水线、缓存分层（Request Memoization / Data Cache / Full Route Cache）和 RSC 的设计动机，是应对版本快速迭代、不被 API 变化甩下的关键。
- **阅读重点**: 路由与数据获取、渲染策略对比、缓存机制、中间件、性能优化精读；部署平台特定（Vercel 商业功能）章节泛读。
- **配套笔记**: Next.js 渲染策略、Next.js 缓存机制、Hydration(注水)
- **避坑**: 别混淆 SSR / SSG / ISR / CSR 的渲染边界——每学一种策略，强制自己回答三个问题：HTML 在哪生成？数据何时拉取？缓存怎么失效？答不上就回去重读。
- **我的收获**(留白): <读完后写，AI 写不出这段>

## 阶段自测清单

- [ ] 能脱稿讲清本阶段核心概念（SSR/SSG/ISR/CSR 边界、hydration、RSC、缓存分层）
- [ ] 能把本阶段知识跟现有知识库条目对上链接
- [ ] 能在自己的项目里用到至少 1 个本阶段学到的模式（如 ISR 增量重验证、中间件做鉴权重定向）

## 跟知识库的对应关系

> 把书单里的概念反向链接到 01-04 模块已有知识点，边读边补。

- 《全栈开发一本通》数据获取章节 → React SSR
- 《全栈开发一本通》Auth 章节 → Node 端 JWT 鉴权
- 《Next.js 设计与实现》渲染策略章节 → Next.js 渲染策略
- 《Next.js 设计与实现》缓存章节 → Next.js 缓存机制
- hydration 相关章节 → Hydration(注水)

> 通用避坑：不要一上来就用 App Router 所有新特性（Server Actions、RSC、Streaming）——先用 Pages Router 跑通完整数据流，理解经典 SSR/SSG 后再迁移到 App Router，才知道新特性到底解决了什么问题。

<!-- KNOWLEDGE-IMPORT:END -->
