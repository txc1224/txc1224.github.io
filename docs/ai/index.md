---
title: 'AI 知识'
description: 'AI 编排与 Agent 工程备忘:Workflow/BPMN、Function Calling/Skill、MCP/A2A、LangChain/LangGraph、RAG、评估与安全'
order: 1
---

# AI 知识

> LLM 应用的编排与 Agent 工程速查——不讲模型训练，聚焦"怎么把大模型落地成可靠系统"。

## 学习路径

按下面顺序读，从底层输入到编排、工具、框架、工程化逐层递进：

### 一、基础

所有编排与框架的底层输入都是 prompt 与上下文，先把它写对。

- [Prompt 与上下文工程](./prompt-engineering) — System 分层 / Few-shot / 窗口预算 / 结构化输出契约

### 二、编排与流程

控制流由谁决定：代码、流程引擎，还是模型。

- [Orchestration 编排全景与边界](./orchestration) — Workflow / BPMN / Agent 的本质区别与范式光谱
- [Workflow 持久化执行与状态机](./workflow) — Durable Execution / Saga / HITL / Temporal
- [BPMN 业务流程建模与执行](./bpmn) — BPMN 2.0 元素 / DMN / Camunda / LLM 作为流程节点

### 三、工具与协议

给模型接能力的机制与标准。

- [Function Calling 工具调用机制与实战](./function-calling) — schema → 结构化输出 → 执行 → 回灌
- [Agent 协议三件套 MCP / A2A / AG-UI](./protocols) — 接工具 / 接别的 Agent / 接前端
- [Skill Agent 技能](./skill) — SKILL.md / 渐进式披露 / 与 MCP 的分工

### 四、框架实战

两大主流框架的分工与落地。

- [LangChain 组件与 LCEL](./langchain) — Runnable / 链 / 记忆 / 流式 / LangSmith
- [LangGraph 状态图 Agent 实战](./langgraph) — State/Node/Edge / Checkpointer / HITL / 多 Agent

### 五、工程深化

把 demo 拉进可迭代、可观测、可上线的工程。

- [Agent 设计模式](./agent-patterns) — ReAct / Plan-Execute / Reflection / 多 Agent / 护栏
- [Agent 记忆与状态管理](./agent-memory) — 短期/长期记忆 / 压缩摘要 / 与 RAG 的边界
- [RAG 检索增强生成](./rag) — 分块 / 混合检索 / Rerank / 引用与兜底 / 评估
- [安全与注入防护](./llm-security) — Prompt Injection / 权限收敛 / 不可信输入隔离
- [评估与可观测](./evaluation) — 离线 Eval / LLM-as-Judge / Trace / 成本与延迟

### 六、收口

- [编排方案选型 决策表与决策树](./comparison) — 六种方案多维度对比，可直接照抄的选型结论
- [常见陷阱 ❌/✅ 汇总](./pitfalls) — 全板块踩坑点速查
