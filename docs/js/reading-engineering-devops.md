---
title: '学习书单 · 六、工程化与 DevOps'
order: 99
---

# 学习书单 · 六、工程化与 DevOps

<!-- KNOWLEDGE-IMPORT:START -->

## 六、工程化与 DevOps(部署上线)

## TL;DR

> 把代码从"我本地能跑"推进到"全自动稳定上线"的最后一公里。

## 阶段目标

学完本阶段,你应该能:

- 把自己的全栈项目完整 dockerize:写出多阶段构建的 Dockerfile(区分 build 层和 runtime 层),并用 docker-compose 编排前端、后端、数据库一键拉起
- 为项目配置 GitHub Actions(或 GitLab CI)流水线:push 触发 lint + 单测,合并主干自动构建镜像并部署到服务器
- 熟练处理 Git 协作高频场景:rebase vs merge 的取舍、解决冲突、用 `git rebase -i` 整理提交历史、写出符合团队规范的 PR
- 解释容器与虚拟机的本质区别,说清镜像分层、缓存、volume、网络的工作原理,并能用 `docker exec` / `logs` / `inspect` 排查容器内问题

## 推荐书单

### 📖 1. 《Docker 实战》

- **作者**: Ian Miell
- **链接**: https://book.douban.com/subject/26702804/
- **覆盖主题**: 容器、镜像、Docker Compose、环境一致性
- **难度**: ⭐⭐⭐
- **预计投入**: 3 周 / 每天 1.5h
- **状态**: unread
- **为什么读**: 以"问题驱动"组织,每一节解决一个真实场景(怎么调试容器、怎么瘦身镜像、怎么管数据卷),比官方文档更接地气。读它不是为了背命令,而是建立"一切皆容器"的思维。
- **阅读重点**: 第 1-3 章(容器/镜像基础、分层文件系统)精读,这是根基;第 5 章(Dockerfile 技巧、多阶段构建)精读,直接决定你镜像的体积和安全;第 8 章(Docker Compose)精读,全栈项目编排全靠它;网络和数据卷相关章节按需精读;编排/集群(K8s)章节泛读或跳过。
- **配套笔记**: [[../../02-engineering/docker-basics]], [[../../02-engineering/dockerfile-best-practice]], [[../../02-engineering/docker-compose-fullstack]]
- **避坑**: 不要一上来就啃 K8s——先把单体 docker-compose 跑通、把自己项目跑起来,再谈编排。也不要只看不敲,每一节都拿自己的项目镜像做实验,否则命令永远记不住。
- **我的收获**(留白): <读完后写,AI 写不出这段>

### 📖 2. 《Git 权威指南》

- **作者**: Scott Chacon
- **链接**: https://book.douban.com/subject/6526452/
- **覆盖主题**: 分支、合并、变基、PR、协作规范
- **难度**: ⭐⭐⭐
- **预计投入**: 2 周 / 每天 1h
- **状态**: unread
- **为什么读**: Git 用了很多年,但多数人只会 `add/commit/push`。这本书从底层对象模型(blob/tree/commit)讲起,懂了模型之后 rebase、reflog、cherry-pick 这些"黑魔法"全变透明。
- **阅读重点**: 第 1-3 章(基础、分支)精读,重点是分支即指针这个心智模型;第 3 章 rebase 一节精读,彻底搞懂它和 merge 的差异与适用场景;第 7 章(Git 工具:交互式 rebase、stash、bisect、reflog)精读,效率翻倍的来源;分布式协作与 PR 工作流章节精读;底层原理(plumbing)章节泛读建立直觉。
- **配套笔记**: [[../../02-engineering/git-branch-strategy]], [[../../02-engineering/git-rebase-vs-merge]], [[../../02-engineering/git-pr-workflow]]
- **避坑**: rebase 很爽但别对公共分支乱用——记住黄金法则"绝不 rebase 已经 push 出去的提交"。也别为了炫技把历史改得面目全非,提交历史是写给队友看的。
- **我的收获**(留白): <读完后写,AI 写不出这段>

### 📖 3. 《CI/CD 实战》(GitHub Actions / GitLab CI 实战)

- **作者**: 多人合著(GitHub Actions / GitLab CI 实战)
- **链接**: https://book.douban.com/subject/35281257/
- **覆盖主题**: 自动化测试、自动化部署、流水线设计
- **难度**: ⭐⭐⭐⭐
- **预计投入**: 3 周 / 每天 1.5h
- **状态**: unread
- **为什么读**: CI/CD 是把前两本书(Docker + Git)串成自动化流水线的胶水。它教你的不只是 yaml 语法,而是"如何设计一条从提交到上线的可靠流水线"这套工程思维。
- **阅读重点**: 流水线核心概念(触发器、阶段、job、缓存、制品)精读;GitHub Actions 实战章节精读,重点是 workflow 编写、secrets 管理、矩阵构建、缓存依赖;自动构建镜像并推送 registry 的章节精读;部署策略(滚动/蓝绿/金丝雀)章节精读;GitLab CI 部分如果团队用不到可泛读。
- **配套笔记**: [[../../02-engineering/github-actions-ci]], [[../../02-engineering/ci-cd-pipeline-design]], [[../../02-engineering/deploy-strategy]]
- **避坑**: 不要在 CI 里跑全量 e2e——CI 要快(分钟级),把耗时的 e2e 留给 CD 或夜间任务,否则流水线慢到没人愿意等。也别为了"上了 CI/CD"而硬塞一堆华而不实的步骤,先从 lint + 单测 + 构建这条最小流水线跑通。
- **我的收获**(留白): <读完后写,AI 写不出这段>

## 阶段自测清单

- [ ] 能写出多阶段构建的 Dockerfile,并用 docker-compose 编排全栈项目一键拉起
- [ ] 能用 GitHub Actions 配出 push → lint + 单测 → 构建镜像 → 部署的流水线
- [ ] 能脱稿讲清 rebase vs merge 的差异、取舍和 rebase 黄金法则
- [ ] 能用 `git rebase -i` 整理提交历史,写出规范的 PR
- [ ] 能解释容器 vs 虚拟机、镜像分层与缓存、volume 与网络原理
- [ ] 能把本阶段知识跟现有知识库条目对上链接
- [ ] 能在自己的项目里用到至少 1 个本阶段学到的模式

## 跟知识库的对应关系

> 把书单里的概念反向链接到 01-04 模块已有知识点,边读边补。

- 《Docker 实战》第 1-3 章(容器/镜像/分层)→ [[../../02-engineering/docker-basics]]
- 《Docker 实战》第 5 章(Dockerfile / 多阶段构建)→ [[../../02-engineering/dockerfile-best-practice]]
- 《Docker 实战》第 8 章(Compose)→ [[../../02-engineering/docker-compose-fullstack]]
- 《Git 权威指南》第 3 章(分支 / rebase)→ [[../../02-engineering/git-rebase-vs-merge]], [[../../02-engineering/git-branch-strategy]]
- 《Git 权威指南》第 7 章(工具 / PR)→ [[../../02-engineering/git-pr-workflow]]
- 《CI/CD 实战》GitHub Actions 章节 → [[../../02-engineering/github-actions-ci]]
- 《CI/CD 实战》流水线设计章节 → [[../../02-engineering/ci-cd-pipeline-design]]
- 《CI/CD 实战》部署策略章节 → [[../../02-engineering/deploy-strategy]]
<!-- KNOWLEDGE-IMPORT:END -->
