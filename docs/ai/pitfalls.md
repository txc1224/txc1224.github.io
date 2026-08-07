---
title: '常见陷阱 ❌/✅ 汇总'
order: 18
---

# 常见陷阱 ❌/✅ 汇总

> 全板块踩坑点速查。按主题分组，每点 ❌ 错误做法 + ✅ 正确做法，链回对应页面深挖。

## 编排与流程

**1. 默认上 Agent**

- ❌ 凡事先想 Agent，把本可用三步 chain 干掉的任务交给自主 Agent，换来不可复现、难调试、token 成本翻倍。
- ✅ 默认最简确定性方案，Agent 只在确有价值处兜底。详见 [Orchestration](./orchestration)。

**2. 用 DAG 硬扛有环流程**

- ❌ 需要回退/重试/人工审批时，在无环框架里靠复制节点、堆条件边模拟循环，越补越乱。
- ✅ 有环就上状态机/图，原生支持循环与中断恢复。详见 [Workflow](./workflow)。

**3. 混淆 BPMN 与 LLM workflow**

- ❌ 用 BPMN 引擎编排纯 LLM 调用链（笨重无收益），或用 LLM chain 硬写需人工任务/补偿/审计的长业务流（缺可视化与确定性）。
- ✅ 两者解决的问题域不同：LLM 只是长业务流里一个任务时才用 BPMN。详见 [BPMN](./bpmn)。

**4. 以为混合编排"骨架确定就安全"**

- ❌ 自主节点内部的输出方差沿骨架向下游传播，主干再确定也救不了被污染的下游。
- ✅ 每个自主节点出口加结构化 schema 校验、置信度阈值与降级路径，把不确定性封死在节点内。详见 [Orchestration](./orchestration)。

---

## Workflow / BPMN

**5. workflow 函数体里直接调非确定性 API**

- ❌ 在 workflow 函数体里 `new Date()` / `Math.random()` / `fetch`，重放时结果与历史不一致，状态错乱或报 Determinism 错。
- ✅ 所有非确定性调用下沉到 Activity。详见 [Workflow](./workflow)。

**6. 假设 Activity 只执行一次**

- ❌ 下游直接 INSERT/扣款而不带 idempotency key，重试/重放时产生重复单或重复扣款。
- ✅ 副作用 Activity 必须用业务主键做幂等去重。详见 [Workflow](./workflow)。

**7. 补偿写成一次性尽力调用**

- ❌ 补偿失败被静默吞掉，留下半完成状态（钱扣了货没发）。
- ✅ 补偿也必须幂等 + 可重试 + 最终告警。详见 [Workflow](./workflow)。

**8. 把 BPMN 当画图工具**

- ❌ 只在建模器画得好看，元素没配 implementation（没绑 delegate/topic/decisionRef），部署到引擎跑不起来。
- ✅ 每个可执行节点都必须有执行语义。详见 [BPMN](./bpmn)。

**9. 并行网关误解为多线程**

- ❌ 以为 fork 后分支真并行，实际引擎默认单线程串行推进，长任务堵在同一线程，join 还等最慢分支。
- ✅ 真并行靠 External Task 或 async 续点。详见 [BPMN](./bpmn)。

---

## 工具与协议

**10. 模型 arguments 不校验直接执行**

- ❌ `JSON.parse` 后就执行，幻觉参数（错类型/编造枚举/漏必填）直达下游 API 造成脏数据。
- ✅ 执行前必须 zod/JSON Schema 校验，失败作为 tool_result 错误回灌让模型自纠。详见 [Function Calling](./function-calling)。

**11. 工具调用循环没设终止条件**

- ❌ 模型反复发起 tool_call（结果不满足就重查）导致死循环烧 token。
- ✅ 必须设 maxIterations 兜底，触顶返回降级结果。详见 [Function Calling](./function-calling)。

**12. 吞掉工具错误返回空**

- ❌ try/catch 吞掉错误返回空结果，模型拿不到失败信号会幻觉编造结果。
- ✅ 把错误信息作为 tool_result（is_error / content）回灌，让模型自我纠正或换工具。详见 [Function Calling](./function-calling)。

**13. 把 MCP/A2A/AG-UI 当竞品"选型"**

- ❌ 在三者里选一个淘汰另外两个——它们在不同层，真实系统是叠加。
- ✅ 接工具→MCP、接别的 Agent→A2A、接前端→AG-UI，各层划清边界。详见 [协议三件套](./protocols)。

**14. 只用 MCP 的 Tools**

- ❌ 忽略 Resources 和 Prompts，又手写一套喂上下文/复用 prompt 的逻辑，白引入协议。
- ✅ Tools/Resources/Prompts 三类原物按需使用。详见 [协议三件套](./protocols)。

---

## Skill

**15. description 写成"介绍"而非"触发器"**

- ❌ 只写"这是一个部署技能"，不写 when-to-use，模型在几十上百个 skill 里检索不到、永不命中。
- ✅ 穷尽触发场景、关键词、错误码（"当用户要求 X / 出现 Y 报错 / 处理 Z 类文件时使用"）。详见 [Skill](./skill)。

**16. SKILL.md 写成大杂烩**

- ❌ 正文塞几千行参考，命中后一次性灌进上下文，既贵又稀释核心指令。
- ✅ 正文只留操作主流程，大块材料拆 references/\*.md 按需加载。详见 [Skill](./skill)。

**17. 让模型现写确定性操作**

- ❌ 把本可一个脚本搞定的格式化/校验，写成让模型逐步生成的指令，结果不稳定还慢。
- ✅ 抽成 scripts/\*.py，指令只写"运行 scripts/xxx.py"。详见 [Skill](./skill)。

---

## 框架实战

**18. LangChain 链默认无记忆**

- ❌ 多次 invoke 同一 chain，模型每次"失忆"；历史不裁剪还会撑爆 context 与成本。
- ✅ 套 RunnableWithMessageHistory + session_id，并裁剪历史。详见 [LangChain](./langchain)。

**19. 用 stream() 却想拿中间进度**

- ❌ stream 只吐最终 token，看不到工具调用/检索进度。
- ✅ 中间步骤事件用 astream_events(v2)。详见 [LangChain](./langchain)。

**20. LangGraph 状态被覆盖丢失**

- ❌ messages 字段忘写 Annotated[list, add_messages]，节点返回后历史全没了。
- ✅ 需累积的字段必须显式声明 reducer。详见 [LangGraph](./langgraph)。

**21. interrupt 恢复后副作用重复执行**

- ❌ resume 时整个节点从头重跑，interrupt 之前写库/发请求会执行两遍。
- ✅ interrupt 前只做无副作用计算，副作用放 interrupt 之后或拆独立节点。详见 [LangGraph](./langgraph)。

**22. 无 checkpointer 却想用 HITL/time travel**

- ❌ 不编译 checkpointer，interrupt 报错、get_state_history 为空。
- ✅ 生产必须挂 SqliteSaver/PostgresSaver，并始终把 thread_id 放进 config。详见 [LangGraph](./langgraph)。

---

## Agent / RAG / 评估

**23. ReAct 不设 max_iterations**

- ❌ 模型在工具返回不符预期时无限重试同一调用，token 与费用瞬间打满。
- ✅ 硬编码步数上限，触顶走降级路径。详见 [Agent 模式](./agent-patterns)。

**24. 把 Reflection 当万能质量提升器**

- ❌ 在没有客观验证信号的纯文本任务上，批评家越改越"看起来对"反而引幻觉，每轮反思成本翻倍。
- ✅ Reflection 只在有可机器验证标准（测试/执行/schema）的场景才划算。详见 [Agent 模式](./agent-patterns)。

**25. 只做稠密向量检索就上线**

- ❌ 遇到型号/错误码/专有名词/缩写这类精确匹配查询大量召回失败。
- ✅ 混合检索：稠密(语义) + BM25(词面)，RRF 融合。详见 [RAG](./rag)。

**26. 换了 embedding 模型没重建索引**

- ❌ 索引与查询用了不同模型/版本/维度，检索结果静默变差且无报错。
- ✅ 改了 embedding 必须全量重建向量索引。详见 [RAG](./rag)。

**27. RAG 没有拒答/兜底分支**

- ❌ 检索相关性低仍强行生成，模型只能编造。
- ✅ 设相似度阈值，低于阈值走"我不知道/转人工"。详见 [RAG](./rag)。

**28. 用 LLM judge 评一切**

- ❌ 包括能用代码断言的格式/字段检查——又贵有方差还不可复现。
- ✅ 确定性判断写代码，LLM 只判开放质量。详见 [评估](./evaluation)。

**29. 把月度总账单当成本监控**

- ❌ 无法归因到具体功能/用户，发现时某个 agent 循环已烧掉大半预算。
- ✅ 按 trace 维度记录 token 并做归因。详见 [评估](./evaluation)。

---

## 安全

**30. 把检索/工具返回内容当可信指令源**

- ❌ 间接注入主渠道——模型把网页/文档/邮件里的恶意指令当成用户意图执行。
- ✅ 不可信内容隔离标记，与 system/用户指令分信任级。详见 [安全](./llm-security)。

**31. 给 Agent 全套读写凭证**

- ❌ 一个注入就能改库/发邮件。
- ✅ 最小授权 + 危险操作二次确认。详见 [安全](./llm-security)。
