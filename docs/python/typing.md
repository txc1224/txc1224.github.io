---
title: '类型注解 / 包管理'
order: 6
---

# 类型注解 / 包管理

> 类型注解让 Python 代码更安全、更易读，配合 mypy/pyright 实现静态检查，提前发现 bug。

---

## 基础类型注解对比表

| 类型           | 写法（3.9+）      | 旧写法（需 import typing） | 说明               |
| -------------- | ----------------- | -------------------------- | ------------------ |
| 列表           | `list[int]`       | `List[int]`                | 整数列表           |
| 字典           | `dict[str, int]`  | `Dict[str, int]`           | 字符串到整数的映射 |
| 元组（固定）   | `tuple[int, str]` | `Tuple[int, str]`          | 固定长度和类型     |
| 元组（可变长） | `tuple[int, ...]` | `Tuple[int, ...]`          | 任意长度整数元组   |
| 集合           | `set[str]`        | `Set[str]`                 | 字符串集合         |
| 可选           | `int \| None`     | `Optional[int]`            | 可能为 None        |
| 联合           | `int \| str`      | `Union[int, str]`          | 多种类型           |

> 3.10+ 推荐用 `X | Y` 替代 `Union[X, Y]` 和 `Optional[X]`。

---

## 函数注解

```python
from collections.abc import Callable, Generator

# 基础注解
def add(a: int, b: int) -> int:
    return a + b

# 复杂参数
def process(
    items: list[str],
    callback: Callable[[str], bool],     # 接收 str 返回 bool
    config: dict[str, int] | None = None
) -> list[str]:
    return [x for x in items if callback(x)]

# 生成器注解：Generator[yield类型, send类型, return类型]
def counter(start: int = 0) -> Generator[int, None, None]:
    while True:
        yield start
        start += 1
```

---

## Generic 泛型

```python
from typing import TypeVar, Generic

T = TypeVar('T')

class Stack(Generic[T]):
    def __init__(self) -> None:
        self._items: list[T] = []
    def push(self, item: T) -> None:
        self._items.append(item)
    def pop(self) -> T:
        return self._items.pop()

stack: Stack[int] = Stack()
stack.push(1)        # 正确
stack.push('hello')  # mypy 报错

# 有约束的 TypeVar
Numeric = TypeVar('Numeric', int, float, complex)
def add(a: Numeric, b: Numeric) -> Numeric:
    return a + b
```

---

## Protocol 结构化子类型

```python
from typing import Protocol, runtime_checkable

@runtime_checkable
class Drawable(Protocol):
    def draw(self) -> None: ...

class Circle:
    def draw(self) -> None:
        print('画圆')

# 不需要显式继承，只要有 draw 方法就行（鸭子类型的静态版本）
def render(shape: Drawable) -> None:
    shape.draw()

render(Circle())                    # 正确
isinstance(Circle(), Drawable)      # True
```

---

## TypedDict 与 Literal

```python
from typing import TypedDict, NotRequired, Literal

class UserDict(TypedDict):
    name: str
    age: int
    email: NotRequired[str]      # 可选字段（3.11+）

# Literal —— 限定字面量值
def set_mode(mode: Literal['read', 'write', 'append']) -> None: ...
set_mode('read')    # 正确
set_mode('delete')  # mypy 报错

# TypeGuard —— 类型缩窄（3.10+）
from typing import TypeGuard
def is_str_list(val: list[object]) -> TypeGuard[list[str]]:
    return all(isinstance(x, str) for x in val)
```

---

## pyproject.toml 类型检查配置

```toml
# mypy 配置
[tool.mypy]
python_version = "3.12"
strict = true
disallow_untyped_defs = true

[[tool.mypy.overrides]]
module = "tests.*"
disallow_untyped_defs = false    # 测试文件可以宽松

# pyright 配置
[tool.pyright]
pythonVersion = "3.12"
typeCheckingMode = "strict"
```

---

## 包管理

```bash
# venv 虚拟环境
python -m venv .venv
source .venv/bin/activate         # Linux/Mac

# pip
pip install requests==2.31.0
pip install -r requirements.txt

# uv（推荐，极速包管理器）
uv sync && uv add requests && uv add --dev pytest ruff mypy
uv run python app.py
```

```toml
[project]
name = "my-project"
version = "1.0.0"
requires-python = ">=3.11"
dependencies = ["requests>=2.31", "pydantic>=2.0"]

[project.optional-dependencies]
dev = ["pytest", "ruff", "mypy"]
```

---

## 常见陷阱

```python
# ❌ 以为类型注解会阻止运行时错误
def add(a: int, b: int) -> int:
    return a + b
add('hello', 'world')  # 运行时不报错！返回 'helloworld'
# ✅ 必须配合 mypy / pyright 静态检查

# ❌ 混淆 Optional 和可选参数
def f(x: int | None):     # x 是必填参数，值可以是 None
    ...
f()      # TypeError: missing argument
f(None)  # 正确

# ✅ 可选参数需要默认值
def f(x: int | None = None):  # 这才是可选参数
    ...
f()      # 正确
```

<!-- KNOWLEDGE-IMPORT:START -->

## async / await 语法(PEP 492)

## TL;DR

> `async def` 定义协程,`await` 挂起当前协程让出事件循环,等待可等待对象完成。

## 背景与动机

Python 传统并发靠多线程,但 GIL 让 CPU 密集任务无法真正并行,而且线程切换、加锁的开销和复杂度高。现实中大量后端任务是 **IO 密集**(网络请求、读写数据库、读写文件):线程 99% 的时间在「等结果」,CPU 几乎空转。

`async/await` 的思路是:**单线程内用协作式多任务**,一个协程在等 IO 时主动「让出」执行权,事件循环(event loop)马上去跑另一个就绪的协程。这样一个线程就能轻松撑起上万并发连接,且没有锁竞争。PEP 492(Python 3.5)把协程从「靠生成器 `@asyncio.coroutine` + `yield from` 模拟」升级为一等语法,可读性和正确性都大幅提升。

## 核心机制

- **协程函数 / 协程对象**:`async def foo()` 定义的是协程函数;调用 `foo()` **不会执行函数体**,而是返回一个协程对象(coroutine object)。它必须被事件循环驱动才会真正运行。
- **await 的本质**:`await x` 要求 `x` 是「可等待对象」(awaitable:协程、Task、Future)。语义是:挂起当前协程,把控制权交回事件循环;当 `x` 完成时,事件循环恢复当前协程,`await` 表达式的值就是 `x` 的返回值。
- **await 只能在 async 函数内用**:这是语法约束。在普通函数里写 `await` 会直接 `SyntaxError`。
- **谁启动事件循环**:入口通常用 `asyncio.run(main())`(3.7+),它创建事件循环、跑完 `main`、再清理关闭。在已有循环内则用 `await` 或 `asyncio.create_task()`。
- **并发 vs 串行**:连续 `await a(); await b()` 是**串行**(b 等 a 完成才开始)。要并发需用 `asyncio.gather()` 或 `asyncio.create_task()` 把协程包装成任务同时调度。
- **关键心法**:`await` 只是「挂起点标记」,真正让它异步的是底层 IO 用了非阻塞 + 事件循环回调。在 `await` 一个**纯 CPU 计算**时并不会让出,照样阻塞整个循环。

## 代码示例

```python
import asyncio
import time

async def fetch(name: str, delay: float) -> str:
    # await 让出执行权;asyncio.sleep 不阻塞线程
    await asyncio.sleep(delay)
    return f"{name} done"

async def main() -> None:
    start = time.perf_counter()
    # gather 并发调度两个协程,总耗时约 max(1,2) 而非 1+2
    results = await asyncio.gather(fetch("A", 1), fetch("B", 2))
    print(results, round(time.perf_counter() - start, 2))

if __name__ == "__main__":
    asyncio.run(main())  # ['A done', 'B done'] 约 2.0 秒
```

## 易错点 / 反例

- **调用协程却不 await,函数体根本没跑**:

  ```python
  async def work():
      print("running")

  work()  # 只创建协程对象,什么都不打印,还可能有 RuntimeWarning
  # 正确:asyncio.run(work()) 或在 async 函数里 await work()
  ```

- **用 `time.sleep` 阻塞整个事件循环**:它是同步阻塞调用,会把单线程里所有协程都卡住。
  ```python
  async def bad():
      time.sleep(2)        # 整个事件循环冻结 2 秒
  async def good():
      await asyncio.sleep(2)  # 只挂起当前协程
  ```
- **在普通(非 async)函数里写 await** → `SyntaxError: 'await' outside async function`。这是新手最常踩的语法坑,根因是没理解「await 必须由 async 上下文承载」。
- **误以为 await 自动并发**:`await a(); await b()` 是顺序执行,想要并发必须显式 `gather`/`create_task`,否则耗时是各任务之和。
- **在 async 里跑 CPU 密集计算**:不会让出,GIL 下也无法并行,应丢给 `asyncio.to_thread()` 或进程池。

## 高频面试题(5 题)

- **Q1**: `async def` 定义的函数被直接调用时会发生什么?为什么不会执行函数体?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - 调用 `async def` 函数返回的是一个**协程对象**,不是执行结果,函数体一行都没跑。
  - 协程是「惰性」的:必须由事件循环驱动(如 `asyncio.run`、`await`、`create_task`)才会执行。
  - 这是与生成器一致的设计:定义与执行分离,便于调度器介入。
  - 忘记驱动会产生 `RuntimeWarning: coroutine was never awaited`。

  &lt;details&gt;

- **Q2**: `await` 关键字底层做了什么?它能作用于哪些对象?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - `await x` 挂起当前协程,把控制权交还事件循环,等 `x` 完成后恢复并取其返回值。
  - `x` 必须是 awaitable:协程、`asyncio.Task`、`asyncio.Future`(或实现 `__await__` 的对象)。
  - 底层等价于 `yield from` 的语法升级,通过 `__await__` 协议驱动。
  - `await` 只能在 `async def` 内使用,否则 `SyntaxError`。

  &lt;details&gt;

- **Q3**: `asyncio.gather()` 和连续写多个 `await` 有什么区别?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - 连续 `await a(); await b()` 是**串行**:b 必须等 a 完成,总耗时为两者之和。
  - `gather(a(), b())` 把多个协程**并发**调度,总耗时约等于最慢的那个。
  - `gather` 按传入顺序返回结果列表,`return_exceptions=True` 可收集异常而非中断。
  - 需要逐个拿到任务句柄/取消时用 `create_task`;只要结果聚合用 `gather`。

  &lt;details&gt;

- **Q4**: 为什么在协程里不能用 `time.sleep`,要用 `asyncio.sleep`?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - asyncio 是**单线程协作式**调度,`time.sleep` 是同步阻塞,会冻结整个事件循环,所有协程都被卡。
  - `asyncio.sleep` 是协程,`await` 它只挂起当前协程并让出循环,其他协程照常运行。
  - 同理,所有同步阻塞 IO(requests、普通文件读)都会阻塞循环,需换成异步库或 `to_thread`。
  - 核心原则:协程里只允许「非阻塞 + 可 await」的操作。

  &lt;details&gt;

- **Q5**: 异步编程相比多线程适合什么场景?有什么局限?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - 适合 **IO 密集**:高并发网络请求、连接、文件读写,单线程即可撑上万连接,无锁开销。
  - 不适合 **CPU 密集**:受 GIL 限制无法利用多核,且纯计算不会让出事件循环。
  - 局限:依赖异步生态库;一处同步阻塞拖累全局;调试与栈追踪更复杂。
  - CPU 密集应配合进程池 / `asyncio.to_thread`,异步与多进程常搭配使用。

  &lt;details&gt;

## 延伸资源

- [PEP 492 — Coroutines with async and await syntax](https://peps.python.org/pep-0492/)
- [Python 官方文档 — asyncio Coroutines and Tasks](https://docs.python.org/3/library/asyncio-task.html)
- 书籍:《Fluent Python》第 21 章(异步编程)、《Python Cookbook》并发章节

## (留白) 我的理解

> 这一段不强制填。学完后用自己的话复述、记下踩过的坑、和其他知识的连接。AI 写不出这段。

---

## 异步 IO 实战(httpx / aiohttp / aiofiles)

## TL;DR

> 用异步客户端复用连接 + `gather` 并发,把串行 IO 等待变成并发,单机吞吐提升一个量级。

## 背景与动机

写爬虫、聚合多个下游接口、批量调 LLM API 时,瓶颈几乎全在「等网络响应」。同步写法一个请求没回来,下一个就不能发,N 个请求耗时是 N 倍单次延迟。工程上常见的痛点:接口聚合页要调 5 个微服务、爬虫要抓几千个 URL、批量处理要写几千个文件——同步串行根本不可接受。

异步 IO 的价值在于:**一个请求发出后在等响应的空档,事件循环立刻去发下一个**,理论上 N 个请求耗时约等于最慢那个 + 少量调度开销。`httpx` 和 `aiohttp` 提供异步 HTTP 客户端,`aiofiles` 把阻塞的文件读写包成可 await,三者是 Python 异步 IO 实战的主力组合。

## 核心机制

- **连接复用(关键)**:`httpx.AsyncClient` / `aiohttp.ClientSession` 是「会话」对象,内部维护连接池。复用同一个 client 发多个请求能省掉重复 TCP 握手和 TLS 协商,性能差距巨大。**绝不要每个请求新建一个 client**。
- **必须用异步上下文管理器**:`async with AsyncClient() as client:` 确保连接池被正确关闭,否则资源泄漏。
- **并发调度**:把多个协程丢给 `asyncio.gather()` 并发执行;任务很多时用 `asyncio.Semaphore` 限制并发数,避免把对端打挂或触发限流。
- **异步文件 IO**:`aiofiles` 用线程池把 `open/read/write` 包成 awaitable,`async with aiofiles.open(...) as f:` + `await f.read()`,避免文件操作阻塞事件循环。
- **httpx vs aiohttp**:`httpx` 同时支持同步/异步、HTTP/2,API 与 `requests` 几乎一致,新手更友好;`aiohttp` 更老牌、生态广、还能写异步 Web 服务端。二者选其一即可,思想相通。
- **超时与异常**:异步请求必须显式设超时,否则一个慢请求拖住 gather;批量任务常用 `gather(..., return_exceptions=True)` 让个别失败不拖垮整体。

## 代码示例

```python
import asyncio
import httpx

URLS = ["https://api.github.com"] * 5

async def fetch_one(client: httpx.AsyncClient, url: str, sem: asyncio.Semaphore) -> int:
    async with sem:  # 信号量限流,最多同时 N 个在飞
        resp = await client.get(url, timeout=10)
        return resp.status_code

async def main() -> None:
    sem = asyncio.Semaphore(3)  # 并发上限 3
    # 复用同一个 AsyncClient,连接池生效
    async with httpx.AsyncClient() as client:
        codes = await asyncio.gather(*(fetch_one(client, u, sem) for u in URLS))
    print(codes)

if __name__ == "__main__":
    asyncio.run(main())  # [200, 200, 200, 200, 200]
```

## 易错点 / 反例

- **每个请求都新建 client,丢掉连接池**,性能反而比同步还差:
  ```python
  async def bad(url):
      async with httpx.AsyncClient() as c:   # 每请求重建连接池 + TLS
          return await c.get(url)
  # 正确:全任务共享一个 client(见上方示例)
  ```
- **在协程里用同步的 `requests`**,直接阻塞整个事件循环:
  ```python
  import requests
  async def bad(url):
      return requests.get(url).status_code   # 同步阻塞,卡住所有协程
  # 正确:换 httpx/aiohttp;非要用同步库则 await asyncio.to_thread(requests.get, url)
  ```
- **用普通 `open()` 读写大文件**阻塞循环;应 `async with aiofiles.open(path) as f: await f.write(...)`。
- **不设超时**:慢请求/对端无响应会一直挂住,`gather` 整体被拖死。务必 `client.get(url, timeout=...)` 或在 client 上设默认超时。
- **无界并发**:一次性 `gather` 上万个协程,瞬间打满连接、触发对端限流或本机句柄耗尽。用 `Semaphore` 控并发上限。
- **忘了 await**:`resp = client.get(url)` 拿到的是协程不是响应,`resp.status_code` 直接 `AttributeError`。

## 高频面试题(5 题)

- **Q1**: 为什么强调要复用 `AsyncClient` / `ClientSession`,而不是每个请求新建一个?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - client/session 内部维护**连接池**,复用可省去重复的 TCP 三次握手与 TLS 协商。
  - 每请求新建会让异步化失去意义,高并发下性能可能还不如同步。
  - 正确模式:`async with AsyncClient()` 建一次,所有任务共享,gather 并发。
  - 同时它也统一承载超时、header、cookie、代理等配置。

  &lt;details&gt;

- **Q2**: 批量发起大量异步请求时,如何控制并发量?为什么需要控制?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - 用 `asyncio.Semaphore(N)`,在 `async with sem:` 内发请求,限制最多 N 个在飞。
  - 不限并发会瞬间打满连接/文件句柄,触发对端限流、被封 IP,甚至本机 OOM。
  - 也可用 `asyncio.Queue` + 固定数量 worker 做生产者-消费者限流。
  - 核心权衡:并发越高吞吐越大,但受对端容量与本地资源约束。

  &lt;details&gt;

- **Q3**: 协程里调了同步阻塞库(如 `requests`、普通 `open`)会怎样?怎么补救?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - 同步阻塞会**冻结整个事件循环**,所有协程一起卡住,异步形同虚设。
  - 首选:换成原生异步库(httpx / aiohttp / aiofiles / asyncpg)。
  - 没有异步替代时:`await asyncio.to_thread(func, *args)` 丢到线程池执行。
  - 判断标准:协程内只允许「非阻塞且可 await」的调用。

  &lt;details&gt;

- **Q4**: `httpx` 和 `aiohttp` 有什么区别?怎么选?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - `httpx` 同步/异步双支持、支持 HTTP/2,API 与 `requests` 高度一致,上手快。
  - `aiohttp` 纯异步、历史久、生态广,还能同时写异步 Web 服务端。
  - 选型:客户端抓取/聚合优先 `httpx`;已有 aiohttp 生态或要写异步服务端选 `aiohttp`。
  - 二者思想一致:会话复用 + gather 并发 + 信号量限流。

  &lt;details&gt;

- **Q5**: 如何让批量异步任务中个别失败不影响整体?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - `asyncio.gather(*tasks, return_exceptions=True)`:异常作为结果返回而不中断其他任务。
  - 之后在结果列表里逐个判断 `isinstance(r, Exception)` 做重试或记录。
  - 更精细:用 `asyncio.wait` + `FIRST_COMPLETED` 流式处理,或给单任务 `try/except`。
  - 配合超时与限流,避免个别慢/失败任务拖垮整批。

  &lt;details&gt;

## 延伸资源

- [httpx 官方文档 — Async Support](https://www.python-httpx.org/async/)
- [aiohttp 官方文档](https://docs.aiohttp.org/en/stable/)
- [aiofiles — 异步文件操作](https://github.com/Tinche/aiofiles)
- [Python 官方文档 — asyncio Tasks 与 Semaphore](https://docs.python.org/3/library/asyncio-task.html)

## (留白) 我的理解

> 这一段不强制填。学完后用自己的话复述、记下踩过的坑、和其他知识的连接。AI 写不出这段。

---

## asyncio(事件循环 / coroutine / Task / gather)

## TL;DR

> asyncio 用单线程事件循环调度协程,IO 等待时让出执行权,单线程也能高并发。

## 背景与动机

IO 密集服务(爬虫、网关、聊天、海量连接)的瓶颈是「等」,不是「算」。多线程方案每连接一个线程,内存和切换开销随连接数暴涨,还受 GIL 约束。asyncio 用**一个线程**跑一个事件循环,让成千上万个协程在 IO 等待点主动 `await` 让出执行权、切换去跑别人——开销极小、无锁竞争、C10k/C10M 不再是问题。这是 FastAPI、aiohttp、异步 ORM 的底座。

工程价值:同样的并发量,asyncio 的内存占用和上下文切换成本远低于线程池;且协程切换是「协作式」的(只在 `await` 处让出),避免了线程抢占式调度的大量锁。

## 核心机制

- **协程(coroutine)**:`async def` 定义的函数,调用它只返回协程对象、**不立刻执行**;`await` 才是真正的驱动点。`await` 挂起当前协程,把控制权交还事件循环,等结果就绪再恢复。
- **事件循环(event loop)**:核心调度器。维护一个「就绪任务」队列,反复取出可运行的协程执行;遇到 IO 就把协程挂起、注册到 IO 多路复用(epoll/kqueue),IO 就绪再唤醒。单线程内实现并发。
- **Task**:把协程包装成「由事件循环并发调度」的单位。`asyncio.create_task(coro)` 立即注册、开始调度(不等 `await` 就并发跑)。`await task` 取结果。
- **`asyncio.gather(*aws)`**:并发跑多个协程/Task,按入参顺序收集结果成列表;任一抛异常默认整体抛出(可 `return_exceptions=True` 改为收集异常)。
- **语法来源**:`async def` / `await` 由 PEP 492 引入(3.5+),底层建立在生成器与 `yield from`(PEP 380)之上;事件循环框架由 PEP 3156 定义。`asyncio.run(main())` 是官方入口,负责建/关循环。

## 代码示例

```python
import asyncio, time

async def fetch(name, delay):        # 协程:IO 等待时让出
    await asyncio.sleep(delay)       # 模拟异步 IO(非 time.sleep)
    return f"{name} 完成"

async def main():
    t0 = time.perf_counter()
    # 方式一:gather 并发,结果按入参顺序返回
    res = await asyncio.gather(fetch("A", 2), fetch("B", 1))
    # 方式二:create_task 显式并发
    t1 = asyncio.create_task(fetch("C", 1))
    t2 = asyncio.create_task(fetch("D", 2))
    res += await asyncio.gather(t1, t2)
    print(res, "耗时", round(time.perf_counter() - t0, 2))  # ≈2s 而非 6s

asyncio.run(main())                  # 建事件循环并跑入口
```

## 易错点 / 反例

- **在协程里用 `time.sleep` 阻塞整个循环**:
  ```python
  async def bad():
      time.sleep(1)   # 反例:阻塞唯一线程,所有协程都被卡住
  # 正解:await asyncio.sleep(1),让出执行权
  ```
- **`async def` 调用后不 `await`**:`coro()` 只创建协程对象不执行,拿到 `RuntimeWarning: coroutine was never awaited`。要么 `await coro()`,要么 `create_task(coro())`。
- **`create_task` 不保存引用**:任务可能被垃圾回收导致「任务消失」;应持有引用(`tasks.append(task)`)或用 `gather` 管理。
- **混用阻塞库**:在协程里直接调 `requests`、`open`、普通 DB 驱动会卡住事件循环;须用 `aiohttp`、`aiofiles`、异步驱动,或 `asyncio.to_thread(阻塞函数)` 丢到线程池。
- **在已有运行中的事件循环里再调 `asyncio.run`**(如 Jupyter):会报 `RuntimeError: asyncio.run() cannot be called from a running event loop`;Jupyter 里直接 `await main()`。
- **`gather` 一处异常全部取消**:默认任一协程抛错即传播;要各任务独立成败,加 `return_exceptions=True`。

## 高频面试题(5 题)

- **Q1**: 协程和线程有什么区别?为什么协程更轻量?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - 协程在用户态由事件循环协作式调度,线程由 OS 抢占式调度
  - 协程切换只保存少量栈状态,无需内核介入,开销远小于线程
  - 单线程可跑数万协程,内存低;但协程无法利用多核,且一处阻塞拖垮全部
    &lt;details&gt;

- **Q2**: `await` 到底做了什么?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - 挂起当前协程,把控制权交还事件循环
  - 等待被 await 的对象(协程/Task/Future)就绪
  - 就绪后从挂起点恢复执行并拿到返回值
  - 只有在 `await` 处协程才让出,其余代码独占运行(协作式)
    &lt;details&gt;

- **Q3**: `create_task` 和直接 `await 协程` 有何不同?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - `await coro()` 是顺序执行:等它跑完才往下走
  - `create_task(coro())` 把协程注册给事件循环,立即开始并发调度
  - 多个任务要真并发需 create_task 或 gather;单纯串行 await 不并发
    &lt;details&gt;

- **Q4**: 为什么协程里不能调 `time.sleep` / `requests`?怎么办?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - 这些是阻塞调用,会卡住唯一的事件循环线程,所有协程停滞
  - asyncio 的并发建立在「IO 时主动让出」,阻塞调用不让出
  - 改用异步库(aiohttp/asyncio.sleep),或 `asyncio.to_thread()` 移到线程
    &lt;details&gt;

- **Q5**: `gather` 和 `wait` 的区别?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - `gather` 返回按入参顺序的结果列表;`return_exceptions=True` 可收集异常
  - `wait` 返回 (done, pending) 两个集合,可按完成条件(FIRST_COMPLETED 等)控制
  - `gather` 更高层用于「等全部并收结果」,`wait` 更底层用于细粒度调度
    &lt;details&gt;

## 延伸资源

- [Python 官方文档:asyncio](https://docs.python.org/3/library/asyncio.html)
- [Python 官方文档:Coroutines and Tasks](https://docs.python.org/3/library/asyncio-task.html)
- [PEP 492(async/await 语法)](https://peps.python.org/pep-0492/) / [PEP 3156(事件循环)](https://peps.python.org/pep-3156/)
- 书籍: 《Fluent Python》第 21 章(异步编程)

## (留白) 我的理解

> 这一段不强制填。学完后用自己的话复述、记下踩过的坑、和其他知识的连接。AI 写不出这段。

---

## GIL 与多线程 vs 多进程

## TL;DR

> GIL 让同一时刻只有一个线程执行 Python 字节码,CPU 密集靠多进程,IO 密集靠多线程。

## 背景与动机

想利用多核 CPU 加速计算,直觉是开多个线程。但在 CPython 里,多线程跑 CPU 密集任务**不但不快反而更慢**。根因是 GIL(全局解释器锁):它保护解释器内部的引用计数不被并发破坏,代价是任意时刻只有一个线程持有锁、执行字节码。这决定了 Python 并发编程的核心选型逻辑——**任务类型决定用线程还是进程**。

工程价值:Web 服务抓 100 个 URL(IO 密集)用线程/asyncio 几乎线性提速;而图像处理、数值计算(CPU 密集)必须用多进程才能吃到多核。选错模型,代码又复杂又慢。

## 核心机制

- **GIL 的本质**:CPython 用引用计数做内存管理。若没有 GIL,两个线程同时增减同一对象引用计数会内存错乱。GIL 是「解释器级互斥锁」,简化内存管理、让 C 扩展好写,但牺牲了多核并行。
- **IO 时释放 GIL**:线程执行阻塞 IO(网络、文件、sleep)时会**主动释放 GIL**,让其它线程跑。所以 IO 密集场景多线程有效——瓶颈在「等」,不在「算」。
- **CPU 密集不放 GIL**:纯计算不碰 IO,线程只能争抢同一把锁、轮流执行,加上切换开销,多核白搭甚至变慢。
- **多进程绕过 GIL**:每个进程有独立解释器和独立 GIL、独立内存,真正多核并行。代价是进程创建/通信(IPC)开销大、不能共享内存(需 `Queue`/`Pipe`/共享内存)。
- **`concurrent.futures`** 统一入口:`ThreadPoolExecutor`(IO)与 `ProcessPoolExecutor`(CPU)同一套 API,便于切换。Python 3.13 起 PEP 703 在试验「free-threading」无 GIL 构建,但尚未成为默认。

## 代码示例

```python
import time
from concurrent.futures import ThreadPoolExecutor, ProcessPoolExecutor

def cpu_task(n):                 # CPU 密集:纯计算
    return sum(i * i for i in range(n))

def bench(Executor, workers=4):
    t0 = time.perf_counter()
    with Executor(max_workers=workers) as ex:
        list(ex.map(cpu_task, [10**6] * workers))
    return time.perf_counter() - t0

if __name__ == "__main__":
    print("线程池:", bench(ThreadPoolExecutor))    # 慢,GIL 串行
    print("进程池:", bench(ProcessPoolExecutor))   # 快,真正多核并行
```

## 易错点 / 反例

- **误以为多线程能加速 CPU 密集**:
  ```python
  # 反例:对纯计算开 4 个线程,反而比单线程慢(GIL 争抢+切换)
  ThreadPoolExecutor(4).map(cpu_task, data)  # 应改用 ProcessPoolExecutor
  ```
- **`ProcessPoolExecutor` 的任务不可序列化**:子进程靠 pickle 传参,传入 lambda、闭包、未在模块顶层定义的函数会 `PicklingError`。任务函数要放模块顶层。
- **漏掉 `if __name__ == "__main__":`**:多进程(尤其 spawn 启动,macOS/Windows 默认)会重新导入主模块,缺这行会递归创建子进程死循环。
- **以为加锁就能绕开 GIL**:GIL 是解释器内部的,你在 Python 层加的 `Lock` 保护的是你自己的共享数据,与 GIL 无关;加再多锁也不会让 CPU 密集并行。
- **混淆并发(concurrency)与并行(parallelism)**:多线程/asyncio 是并发(交替推进),多进程才是真并行(同一时刻多个核在跑)。

## 高频面试题(5 题)

- **Q1**: 什么是 GIL?为什么 CPython 需要它?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - 全局解释器锁,同一时刻只允许一个线程执行 Python 字节码
  - CPython 用引用计数管理内存,GIL 防止多线程并发改计数导致内存错乱
  - 简化了解释器实现和 C 扩展编写,代价是无法用多线程吃满多核
    &lt;details&gt;

- **Q2**: 为什么 IO 密集任务用多线程仍然有效?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - 线程发起阻塞 IO(网络/文件/sleep)时会主动释放 GIL
  - 等待期间其它线程可拿到锁继续执行
  - 瓶颈在「等待」而非「计算」,故多线程能显著提速
    &lt;details&gt;

- **Q3**: CPU 密集任务该怎么并行?为什么不能用多线程?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - 用 multiprocessing / ProcessPoolExecutor,每进程独立解释器和 GIL
  - 真正在多核上并行执行字节码
  - 多线程因 GIL 只能串行执行字节码,加切换开销反而更慢
    &lt;details&gt;

- **Q4**: 多进程相比多线程有哪些代价/坑?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - 进程创建与上下文切换开销远大于线程
  - 内存不共享,跨进程通信需 Queue/Pipe/共享内存,靠 pickle 序列化
  - 需 `if __name__ == "__main__":` 防止 spawn 递归;任务函数须可序列化
    &lt;details&gt;

- **Q5**: Python 有没有去掉 GIL 的方案或进展?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - PEP 703 提出 free-threading(无 GIL)构建,Python 3.13 起作为实验选项
  - 通过偏向引用计数、更细粒度锁替代 GIL,使多线程能真正并行
  - 目前非默认、生态兼容性仍在推进;其他实现 Jython/IronPython 本就无 GIL
    &lt;details&gt;

## 延伸资源

- [Python 官方文档:threading](https://docs.python.org/3/library/threading.html)
- [Python 官方文档:multiprocessing](https://docs.python.org/3/library/multiprocessing.html)
- [Python 官方文档:concurrent.futures](https://docs.python.org/3/library/concurrent.futures.html)
- [PEP 703(Making the GIL Optional)](https://peps.python.org/pep-0703/)
- 书籍: 《Fluent Python》第 19 章(Python 并发模型)

## (留白) 我的理解

> 这一段不强制填。学完后用自己的话复述、记下踩过的坑、和其他知识的连接。AI 写不出这段。

---

## mypy / pyright 静态类型检查

## TL;DR

> 在运行前扫描代码,依据注解推断并报出类型不一致的错误。

## 背景与动机

type hints 只是「写下来的约定」,它本身不做任何检查——运行时依旧动态。那谁来兑现注解的价值?答案是**静态类型检查器(static type checker)**。它在不执行代码的前提下,模拟类型在程序中的流动,提前发现「传错类型」「可能是 None 却直接调用方法」「返回值类型不匹配」等问题,把一类运行时 `TypeError`/`AttributeError` 消灭在编码阶段。

工程价值:

- 让 CI 在合并前拦住类型回归,降低线上事故。
- 配合 IDE,让补全、跳转、重构有类型依据。
- 作为「活文档」强制接口契约一致,多人协作时尤其重要。

主流工具:**mypy**(PEP 484 的参考实现,Python 写的,历史最久)和 **pyright**(微软出品,TypeScript 写的,速度快,是 VS Code Pylance 的内核)。两者检查规则大体一致但细节与报错风格有差异。

## 核心机制

1. **类型推断 + 注解校验**:检查器为每个表达式推断类型,再与显式注解比对;不一致即报错。它不运行代码,纯静态分析。
2. **类型收窄(narrowing)**:`if x is not None`、`isinstance(x, int)` 之后,检查器在该分支内把 `x` 收窄为更精确的类型——这是写出「既安全又不啰嗦」代码的关键。
3. **严格度可调**:mypy 有 `--strict` 及一堆细粒度开关(如 `disallow_untyped_defs`);pyright 有 `basic`/`standard`/`strict` 模式。可渐进地从宽松到严格。
4. **报错抑制与逃逸口**:`# type: ignore` 单行忽略;`Any` 放弃检查;`cast()` 强制断言类型;`reveal_type(x)` 让检查器打印它推断出的类型(调试利器)。
5. **配置文件**:mypy 用 `mypy.ini` / `setup.cfg` / `pyproject.toml`;pyright 用 `pyrightconfig.json` 或 `pyproject.toml` 的 `[tool.pyright]`。

## 代码示例

```python
# demo.py —— 跑 `mypy demo.py` 或 `pyright demo.py`
def parse_count(s: str | None) -> int:
    if s is None:
        return 0                    # 收窄后此处安全
    return int(s)                   # s 在此分支已是 str

def bad_add(a: int, b: int) -> int:
    return a + "x"                  # 检查器报错:int + str 不支持

x: list[int] = [1, 2, "3"]          # 报错:str 不能放进 list[int]

reveal_type(parse_count("5"))       # 检查器输出推断类型,辅助调试
# 单行抑制:mypy 用 type: ignore,pyright 用 type: ignore 或 pyright: ignore
value = "text"  # type: ignore[assignment]
```

## 易错点 / 反例

**坑 1:把 `# type: ignore` 当万能膏药。** 不带错误码的裸 ignore 会掩盖该行的所有问题,代码改坏后也不再报警。应写具体错误码 `# type: ignore[assignment]`,并优先修根因。

**坑 2:过度依赖 `Any`,检查形同虚设。** 函数签名全用 `Any`,检查器无法推断任何关系:

```python
def process(data: Any) -> Any: ...   # 等于没检查,应改为具体类型或 TypeVar
```

**坑 3:以为检查通过 = 程序正确。** 检查器只保证「类型一致」,不保证逻辑正确;且遇到运行时拼装的类型(`getattr`、动态导入、`eval`)它看不见。类型检查是补充,不替代测试。

**坑 4:mypy 与 pyright 结论不一致就困惑。** 两者实现对某些边界(如装饰器推断、`functools` 高阶用法)规则不同,可能一个报一个不报。团队应统一选其一并在 CI 锁定版本与配置。

**坑 5:`cast()` 滥用。** `cast(int, x)` 是「我比检查器更懂」的强行断言,运行时不做任何转换;若 `x` 实际不是 int,错被推迟到运行时。能用收窄就别用 cast。

## 高频面试题(5 题)

- **Q1**: mypy 和 pyright 有什么区别?如何选型?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - mypy:PEP 484 参考实现,Python 编写,生态成熟,是社区事实标准。
  - pyright:微软出品,TypeScript 编写,速度快、内存友好,是 VS Code Pylance 的内核。
  - 两者规则大体一致但细节和报错风格有差异;团队应统一其一,锁定版本与配置进 CI。

  &lt;details&gt;

- **Q2**: 什么是类型收窄(type narrowing)?举例说明。
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - 指检查器根据条件判断,把变量在某分支内推断为更精确的类型。
  - 例:`if x is not None:` 后,`x` 从 `int | None` 收窄为 `int`。
  - 例:`isinstance(x, str)` 后,`x` 在该分支收窄为 `str`,可安全调用 str 方法。

  &lt;details&gt;

- **Q3**: `# type: ignore`、`Any`、`cast()` 这三者的区别与各自的风险?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - `# type: ignore`:抑制该行报错,裸写会掩盖所有问题,应带错误码。
  - `Any`:让检查器放弃对该值的检查,类型关联全部丢失。
  - `cast(T, x)`:强行断言类型,运行时不转换,错了会推迟到运行期。
  - 三者都是逃逸口,应尽量少用,优先用收窄或正确注解修根因。

  &lt;details&gt;

- **Q4**: 静态类型检查通过后,还需要写测试吗?为什么?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - 需要。类型检查只保证「类型一致」,不保证业务逻辑正确。
  - 对运行时动态行为(`getattr`、动态导入、`eval`、反射)检查器无法覆盖。
  - 类型检查与测试是互补关系:前者抓类型类错误,后者验证行为正确性。

  &lt;details&gt;

- **Q5**: 如何在老项目中渐进地引入静态类型检查?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - 先用宽松配置跑通,只对新代码/核心模块强制注解,逐步扩大范围。
  - 逐步提高严格度(如开启 `disallow_untyped_defs`、`--strict`)。
  - 把检查接入 CI 防止回归;用 `# type: ignore` 标记存量债务并跟踪清理。

  &lt;details&gt;

## 延伸资源

- [mypy 官方文档](https://mypy.readthedocs.io/en/stable/)
- [pyright 官方文档](https://microsoft.github.io/pyright/)
- [typing 模块官方文档](https://docs.python.org/3/library/typing.html)
- [PEP 484 – Type Hints](https://peps.python.org/pep-0484/)
- 书籍:《Robust Python》(类型驱动的健壮 Python 工程实践)

## (留白) 我的理解

> 这一段不强制填。学完后用自己的话复述、记下踩过的坑、和其他知识的连接。AI 写不出这段。

---

## Type hints 类型注解(PEP 484/526/604)

## TL;DR

> 给变量/函数标注「期望类型」,仅供静态检查,运行时不强制。

## 背景与动机

Python 是动态类型语言,变量类型在运行时才确定。这把灵活性带来了,但也带来三类工程痛点:

- 函数参数到底传 `str` 还是 `bytes`?只能翻文档或读源码,协作成本高。
- IDE 无法可靠地自动补全和跳转,重构(重命名、改签名)风险大。
- 很多类型错误(把 `None` 传给期望 `str` 的地方)要等到运行到那一行才爆炸,线上才暴露。

Type hints 由 PEP 484(Python 3.5,2015)引入,目标就是「**在不改变 Python 动态本质的前提下,提供一套可选的、渐进的静态类型标注体系**」。它是渐进式(gradual typing)的:标多少算多少,没标注的部分照旧工作,这让老代码可以逐步接入。

## 核心机制

理解 type hints 的关键是建立三个认知:

1. **注解只是元数据,运行时几乎不生效。** 注解被存进 `__annotations__`,解释器不会因为它报错。`def f(x: int) -> str` 传字符串照样能跑——「检查」交给 mypy/pyright 这类外部工具在运行前完成。
2. **演进脉络(记住 PEP 编号就记住了一半):**
   - PEP 484(3.5):奠定整套体系,引入 `typing` 模块的 `List`/`Dict`/`Optional`/`Union` 等泛型写法。
   - PEP 526(3.6):变量注解语法 `x: int = 0`,不再只能靠注释。
   - PEP 563(3.7):`from __future__ import annotations` 让注解延迟求值(存成字符串),解决前向引用和循环导入。
   - PEP 585(3.9):内置类型直接当泛型用,`list[int]` 取代 `List[int]`。
   - PEP 604(3.10):联合类型用 `|` 表达,`int | None` 取代 `Optional[int]`,可读性大幅提升。
3. **类型是「结构 + 名义」的组合,但默认走名义匹配。** 标注 `-> str` 就返回 `str` 子类也行;是否多态由检查器判定,不靠运行时 `isinstance`。

`None` 相关的注解最容易写错:`Optional[int]` 等价于 `int | None`,表示「可以是 int 也可以是 None」,**不是**「可选参数」。

## 代码示例

```python
# 变量注解(PEP 526)+ 函数签名注解(PEP 484)
def greet(name: str, times: int = 1) -> str:
    return " ".join([f"hello {name}"] * times)

age: int = 18                       # 变量注解
scores: list[int] = [90, 85]        # PEP 585,3.9+ 直接 list[int]
config: dict[str, int] = {"a": 1}

# PEP 604,3.10+ 用 | 表达联合,比 Optional 更直观
def find_user(uid: int) -> str | None:
    return "alice" if uid == 1 else None

result = find_user(1)
if result is not None:              # 判空后,检查器自动收窄类型
    print(result.upper())
```

## 易错点 / 反例

**坑 1:以为注解会在运行时校验。** 不会。下面代码运行完全不报错,注解只是「提示」:

```python
def add(a: int, b: int) -> int:
    return a + b
add("1", "2")   # 运行 OK 返回 "12",类型错要 mypy 才抓得到
```

**坑 2:`Optional[int]` 误解为「可选参数」。** 它表示「可为 None」,参数依然必填:

```python
def f(x: int | None) -> None: ...  # x 必须传,只是能传 None
f()          # 报错:缺参数
f(None)      # 正确
```

**坑 3:可变默认参数 + 注解的叠加坑。** 注解救不了可变默认参数这个经典 bug:

```python
def append(item: int, box: list[int] = []) -> list[int]:  # 错误!默认列表被共享
    box.append(item)
    return box
# 正确写法:box: list[int] | None = None,函数体内 None 则新建 []
```

**坑 4:前向引用未延迟。** 类在自身方法里引用自身类型时,低版本需字符串写法 `"Node"` 或 `from __future__ import annotations`,否则 `NameError`。

## 高频面试题(5 题)

- **Q1**: Python 的 type hints 会在运行时做类型检查吗?为什么?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - 不会。注解只作为元数据存入 `__annotations__`,解释器执行时不校验。
  - 设计初衷是「渐进式类型」,不改变 Python 的动态本质,标注完全可选。
  - 类型检查由外部静态工具(mypy / pyright)在运行前完成,实现「开发期抓错、运行期零开销」。

  &lt;details&gt;

- **Q2**: `Optional[int]`、`int | None`、`Union[int, None]` 三者是什么关系?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - 三者语义完全等价,都表示「int 或 None」。
  - `Union[int, None]` 是 PEP 484 的原始写法;`Optional[int]` 是它的语法糖。
  - `int | None` 是 PEP 604(3.10+)的新写法,更简洁,推荐新代码使用。

  &lt;details&gt;

- **Q3**: PEP 484 / 526 / 585 / 604 各自引入了什么?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - PEP 484(3.5):类型注解体系与 `typing` 模块,如 `List[int]`、`Optional`。
  - PEP 526(3.6):变量注解语法 `x: int = 0`。
  - PEP 585(3.9):内置集合直接泛型化,`list[int]`、`dict[str, int]`。
  - PEP 604(3.10):联合类型运算符 `X | Y`。

  &lt;details&gt;

- **Q4**: 什么是前向引用(forward reference)?如何解决?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - 指注解引用了尚未定义的名字(如类内部引用自身),直接写会 `NameError`。
  - 方案一:把注解写成字符串形式 `"Node"`,延迟求值。
  - 方案二:`from __future__ import annotations`(PEP 563),让所有注解默认存为字符串。

  &lt;details&gt;

- **Q5**: 函数参数 `def f(x: list[int] = [])` 有什么问题?正确写法是什么?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - 问题:可变对象作为默认参数只在函数定义时创建一次,多次调用共享同一列表,造成状态串扰。
  - 这与类型注解无关,注解无法修复该 bug。
  - 正确写法:`def f(x: list[int] | None = None)`,函数体内 `if x is None: x = []`。

  &lt;details&gt;

## 延伸资源

- [typing 模块官方文档](https://docs.python.org/3/library/typing.html)
- [PEP 484 – Type Hints](https://peps.python.org/pep-0484/)
- [PEP 526 – Variable Annotations](https://peps.python.org/pep-0526/)
- [PEP 604 – Union Types with `|`](https://peps.python.org/pep-0604/)
- [PEP 563 – Postponed Evaluation of Annotations](https://peps.python.org/pep-0563/)
- 书籍:《Fluent Python》第 2 版类型相关章节

## (留白) 我的理解

> 这一段不强制填。学完后用自己的话复述、记下踩过的坑、和其他知识的连接。AI 写不出这段。

---

## typing 进阶(Generic / Protocol / TypedDict)

## TL;DR

> 泛型抽象容器类型,Protocol 做鸭子类型检查,TypedDict 给字典定结构。

## 背景与动机

基础 type hints 只能描述「这是 int、这是 str」,但真实代码里有三类更复杂的需求:

- **泛型(Generic)**:写一个函数/类,既能装 int 又能装 str,且要保证「放进去什么类型、取出来还是什么类型」。不抽象就只能为每种类型抄一份,或退化成 `Any` 丢失全部检查。
- **Protocol(结构化子类型)**:Python 崇尚鸭子类型——「不在乎你是谁,在乎你能做什么」。传统继承要求显式声明父类,但很多库对象(文件、迭代器)只是恰好有 `read()`/`__iter__()`。Protocol 让「有没有这组方法」成为可静态检查的类型契约,无需继承。
- **TypedDict**:大量数据以 `dict` 流转(JSON、配置、API 返回),普通注解只能写 `dict[str, object]`,丢了每个 key 的具体类型。TypedDict 能声明「这个字典必须有 name 是 str、age 是 int」。

这三者把 Python 的类型表达力从「标量」推进到「结构化、可复用」的层级。

## 核心机制

1. **Generic + TypeVar**:`TypeVar("T")` 定义一个类型变量占位符,`Generic[T]` 让类/函数支持参数化类型。检查时 T 会被绑定到具体类型并全程追踪,保证进出一致。可加 `bound=` 约束上界。
2. **Protocol(PEP 544)**:定义一组方法/属性签名作为「接口」。任何类只要**结构上**实现了这些成员,就被视为该 Protocol 的子类型——这就是结构化子类型(structural subtyping),对应「名义子类型(nominal,靠继承)」。`@runtime_checkable` 后还能配合 `isinstance()` 运行期判断。
3. **TypedDict(PEP 589)**:声明字典的固定 key 及各自类型。它**只在静态检查期存在**,运行时就是个普通 dict。默认所有 key 必填,可用 `total=False` 或 `NotRequired[...]` 标记可选键。

核心心法:Generic 解决「类型参数化复用」,Protocol 解决「鸭子类型可检查」,TypedDict 解决「字典结构化」。

## 代码示例

```python
from typing import TypeVar, Generic, Protocol, TypedDict

T = TypeVar("T")                      # 类型变量:泛型占位符

class Box(Generic[T]):                # 泛型容器
    def __init__(self, item: T):
        self.item = item
    def get(self) -> T:
        return self.item

b = Box(42)                           # 检查器推断 Box[int],b.get() 是 int

class Drawable(Protocol):             # 鸭子类型契约:有 draw 即可
    def draw(self) -> str: ...

def render(shape: Drawable) -> str:   # 不要求继承 Drawable
    return shape.draw()

class User(TypedDict):                # 字典结构:固定 key 及类型
    name: str
    age: int

u: User = {"name": "alice", "age": 18}  # 缺 key 或类型错会被检查器抓出
```

## 易错点 / 反例

**坑 1:以为 TypedDict 运行时会校验。** 不会,它只是普通 dict,运行期塞错 key 不报错:

```python
u: User = {"name": 123, "age": "x"}   # 运行 OK!只有 mypy 会报错
```

**坑 2:Protocol 漏了 `@runtime_checkable` 就做 `isinstance`。** 默认 Protocol 不能用于 `isinstance`,运行会抛 `TypeError`;需显式装饰,且运行期只检查方法是否存在、不检查签名。

**坑 3:TypeVar 不加约束导致调用不存在的方法。** `T` 是任意类型,`x.upper()` 会因「T 没有 upper」被检查器拒绝;要么 `TypeVar("T", bound=str)`,要么改用 Protocol 描述能力。

**坑 4:把 Generic 当协变乱套。** 默认 `Box[int]` 不是 `Box[object]` 的子类型(不变,invariant)。以为 `list[int]` 能传给 `list[object]` 参数是错的——这会让容器能塞进任意类型,破坏一致性;需用 `Sequence`/`covariant` 等只读抽象。

## 高频面试题(5 题)

- **Q1**: `TypeVar` 的作用是什么?为什么需要它而不直接用 `Any`?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - `TypeVar` 是类型变量,表示「某个待绑定的具体类型」,在函数/类内全程追踪同一类型。
  - 它能表达「入参类型 == 返回类型」这类关联,如 `def f(x: T) -> T`。
  - 用 `Any` 则完全放弃检查,进出的类型关联丢失,IDE 补全和静态检查都失效。

  &lt;details&gt;

- **Q2**: Protocol 和抽象基类(ABC)有什么区别?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - ABC 是名义子类型:子类必须显式继承,靠继承关系判定。
  - Protocol 是结构化子类型:只要结构上实现了要求的方法即匹配,无需继承。
  - Protocol 更契合鸭子类型,能为「恰好有某些方法」的既有类(如文件对象)定义契约而不改动它们。

  &lt;details&gt;

- **Q3**: 什么是结构化子类型(structural subtyping)?与名义子类型区别?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - 结构化:以「对象拥有哪些成员」判断子类型,即鸭子类型的静态化,对应 Protocol。
  - 名义:以「声明的类名/继承链」判断,对应普通 class 继承。
  - Python 两者都支持:继承走名义,Protocol 走结构化。

  &lt;details&gt;

- **Q4**: TypedDict 与普通 `dict[str, X]` 注解有何不同?如何标记可选键?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - `dict[str, X]` 只规定所有 value 同类型,不约束 key;TypedDict 规定每个固定 key 及各自类型。
  - TypedDict 仅在静态检查期生效,运行时是普通 dict。
  - 可选键:整类 `total=False`,或单键用 `NotRequired[...]`(3.11+ / typing_extensions)。

  &lt;details&gt;

- **Q5**: 为什么 `list[int]` 不能传给参数 `list[object]`?怎样才能传?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - 因为泛型容器默认是「不变(invariant)」的,`list[int]` 与 `list[object]` 无子类型关系。
  - 若允许,函数内可往 `list[object]` 塞入 str,调用方的 `list[int]` 就被污染,类型不安全。
  - 解决:参数声明为协变的只读抽象如 `Sequence[object]` 或 `Iterable[object]`,它们支持协变。

  &lt;details&gt;

## 延伸资源

- [typing 模块官方文档](https://docs.python.org/3/library/typing.html)
- [PEP 544 – Protocols: Structural subtyping](https://peps.python.org/pep-0544/)
- [PEP 589 – TypedDict](https://peps.python.org/pep-0589/)
- [PEP 484 – Type Hints(含 Generics)](https://peps.python.org/pep-0484/)
- 书籍:《Fluent Python》第 2 版(泛型与 Protocol 章节)、《Robust Python》

## (留白) 我的理解

> 这一段不强制填。学完后用自己的话复述、记下踩过的坑、和其他知识的连接。AI 写不出这段。

<!-- KNOWLEDGE-IMPORT:END -->
