---
title: '常用标准库'
order: 5
---

# 常用标准库

> Python 标准库是"自带电池"哲学的体现，掌握核心模块能大幅减少第三方依赖。

---

## 常用模块速查表

| 模块          | 用途             | 核心 API                                   |
| ------------- | ---------------- | ------------------------------------------ |
| `collections` | 高性能数据结构   | Counter / defaultdict / deque / namedtuple |
| `itertools`   | 迭代器工具       | chain / product / combinations / groupby   |
| `functools`   | 函数工具         | lru_cache / partial / reduce / wraps       |
| `pathlib`     | 路径操作（推荐） | Path / glob / read_text / write_text       |
| `json`        | JSON 序列化      | dumps / loads / dump / load                |
| `datetime`    | 日期时间         | datetime / timedelta / timezone            |
| `re`          | 正则表达式       | search / match / findall / sub / compile   |

---

## collections 模块详解

```python
from collections import Counter, defaultdict, deque, namedtuple

# Counter —— 计数器
words = ['apple', 'banana', 'apple', 'cherry', 'banana', 'apple']
count = Counter(words)
count.most_common(2)           # [('apple', 3), ('banana', 2)]
count['apple']                 # 3
count.update(['apple'])        # apple 变为 4

# defaultdict —— 自动初始化的字典
groups = defaultdict(list)
for name, dept in [('Alice', 'dev'), ('Bob', 'dev'), ('Eve', 'ops')]:
    groups[dept].append(name)  # 无需判断 key 是否存在
# {'dev': ['Alice', 'Bob'], 'ops': ['Eve']}

# deque —— 双端队列（两端操作 O(1)）
dq = deque(maxlen=5)           # 有界队列，满了自动丢弃旧元素
dq.appendleft('first')         # 左端追加
dq.rotate(2)                   # 旋转：右移 2 位

# namedtuple —— 具名元组
Point = namedtuple('Point', ['x', 'y'])
p = Point(3, 4)
p.x, p.y                      # 属性访问，比索引更清晰
p._asdict()                    # {'x': 3, 'y': 4}
```

---

## itertools 常用函数

```python
from itertools import chain, product, combinations, groupby, islice

# chain —— 连接多个可迭代对象
list(chain([1, 2], [3, 4], [5]))      # [1, 2, 3, 4, 5]

# product —— 笛卡尔积（替代多层 for 循环）
list(product('AB', [1, 2]))           # [('A',1),('A',2),('B',1),('B',2)]

# combinations —— 组合（不重复）
list(combinations([1, 2, 3], 2))      # [(1,2), (1,3), (2,3)]

# groupby —— 分组（数据必须先排序）
data = sorted(users, key=lambda u: u['dept'])
for dept, group in groupby(data, key=lambda u: u['dept']):
    print(dept, list(group))

# islice —— 切片迭代器（不创建中间列表）
list(islice(range(10**8), 5))         # [0, 1, 2, 3, 4]，内存友好
```

---

## pathlib vs os.path 对比

| 操作     | `os.path`（旧）          | `pathlib`（推荐）   |
| -------- | ------------------------ | ------------------- |
| 路径拼接 | `os.path.join(a, b)`     | `Path(a) / b`       |
| 文件名   | `os.path.basename(p)`    | `p.name`            |
| 扩展名   | `os.path.splitext(p)[1]` | `p.suffix`          |
| 父目录   | `os.path.dirname(p)`     | `p.parent`          |
| 是否存在 | `os.path.exists(p)`      | `p.exists()`        |
| 读取文件 | `open(p).read()`         | `p.read_text()`     |
| 递归查找 | `glob.glob('**/*.py')`   | `p.glob('**/*.py')` |

```python
from pathlib import Path

# 常用操作
p = Path('/tmp/project')
p.mkdir(parents=True, exist_ok=True)   # 递归创建目录
(p / 'config.json').write_text('{}')   # 写文件
files = list(p.glob('**/*.py'))        # 递归查找所有 .py 文件
p.resolve()                            # 绝对路径
```

---

## json 序列化 / 反序列化

```python
import json
from datetime import datetime

# 基本用法
data = {'name': '橙子', 'scores': [95, 88, 92]}
text = json.dumps(data, ensure_ascii=False, indent=2)  # 中文不转义
obj = json.loads(text)

# 文件读写
with open('data.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False)
with open('data.json', 'r', encoding='utf-8') as f:
    obj = json.load(f)
```

---

## functools 常用函数

```python
from functools import lru_cache, partial, reduce

# lru_cache —— 自动缓存函数结果
@lru_cache(maxsize=128)
def fib(n):
    if n < 2: return n
    return fib(n - 1) + fib(n - 2)

# partial —— 固定部分参数
int_from_hex = partial(int, base=16)
int_from_hex('ff')                    # 255

# reduce —— 累积计算
reduce(lambda a, b: a * b, [1, 2, 3, 4])  # 24
```

---

## 常见陷阱

### datetime 时区问题

```python
from datetime import datetime, timezone

# ❌ naive datetime，不带时区信息，跨时区比较会出错
now = datetime.now()

# ✅ aware datetime，始终带时区
now = datetime.now(timezone.utc)
```

### json 序列化自定义对象

```python
# ❌ 直接序列化自定义对象会报 TypeError
json.dumps(datetime.now())  # TypeError: Object of type datetime is not JSON serializable

# ✅ 自定义序列化器
class DateEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, datetime):
            return obj.isoformat()
        return super().default(obj)

json.dumps({'time': datetime.now()}, cls=DateEncoder)
```

### defaultdict 陷阱

```python
# ❌ 访问不存在的 key 会自动创建条目（副作用）
d = defaultdict(int)
if d['missing']:  # 这会创建 d['missing'] = 0
    pass

# ✅ 先检查是否存在
if 'missing' in d:
    process(d['missing'])
```

<!-- KNOWLEDGE-IMPORT:START -->

## argparse 命令行参数解析

## TL;DR

> 声明式定义 CLI 参数，自动生成解析、类型转换、帮助与报错。

## 背景与动机

手写 `sys.argv` 解析很快失控：要处理 `-h`、可选/必填、值类型、未知参数报错、生成 usage 帮助。argparse（由 PEP 389 引入，取代 `optparse`）把这些**从命令式解析变成声明式规格**——你描述「有哪些参数、什么类型、是否必填、默认值、帮助文案」，它负责解析、校验、报错并自动生成 `-h/--help`。这让 CLI 行为与文档天然一致，也让使用者不看源码就能自助上手。

## 核心机制

三步模型：**建 parser → 声明参数 → 解析**。

- `ArgumentParser(description=...)`：解析器，自动生成 `-h`。
- `add_argument` 两类：
  - **位置参数**（positional）：无 `-` 前缀，按顺序必填，如 `add_argument("input")`。
  - **可选参数**（optional / flag）：`-f` / `--foo` 形式，可用 `default`、`required=True`。
- 关键参数：
  - `type=`：解析后转换（`type=int`），转换失败自动报错退出。
  - `choices=`：限定取值集合。
  - `nargs=`：参数个数（`"?"` 0或1、`"*"` 0或多、`"+"` 1或多、`N` 恰好 N 个）。
  - `action=`：特殊行为，`"store_true"/"store_false"`（开关）、`"append"`（多次出现累加成列表）、`"count"`（如 `-vvv` 计次数）。
  - `default=`：未提供时的值。
- `parse_args()`：返回 `Namespace`，用属性访问；解析失败打印 usage 并以退出码 2 退出。
- **子命令**：`add_subparsers()` 实现 `git commit` / `git push` 式多级命令。

## 代码示例

```python
import argparse

parser = argparse.ArgumentParser(description="文件处理工具")
parser.add_argument("input", help="输入文件路径")          # 位置参数
parser.add_argument("-o", "--output", default="out.txt")   # 可选,带默认值
parser.add_argument("-n", "--lines", type=int, default=10, help="行数")
parser.add_argument("--mode", choices=["fast", "safe"], default="safe")
parser.add_argument("-v", "--verbose", action="store_true") # 开关
parser.add_argument("--tag", action="append", default=[])  # 可多次,聚成列表

args = parser.parse_args()   # 出错自动打印 usage 并退出(exit 2)

print(args.input, args.output, args.lines, args.mode)
print("verbose=", args.verbose, "tags=", args.tag)
# 运行: python tool.py data.csv -n 5 --mode fast -v --tag a --tag b
```

## 易错点 / 反例

**1. 布尔开关误用 `type=bool`**

```python
parser.add_argument("--debug", type=bool)
# --debug False 时 args.debug == True!因为 bool("False") 是 True
```

任何非空字符串 `bool()` 都为 `True`。开关一律用 `action="store_true"`（或 Python 3.9+ 的 `argparse.BooleanOptionalAction`，自动提供 `--debug/--no-debug`）。

**2. `default=[]` 配 `action="append"` 的残留坑**

```python
parser.add_argument("--tag", action="append", default=[])
# 每次 append 是往这同一个默认列表里塞;虽然每次 parse_args 新建 Namespace,
# 但 default 列表对象会被原地 append,跨多次解析可能脏数据
```

更安全：`default=None`，解析后用 `args.tag or []`。

**3. 位置参数与 `nargs="*"`/`"?"` 混用导致解析歧义**——可选参数若 `nargs="*"` 且后面紧跟位置参数，argparse 可能把值「吃错」。复杂参数结构优先用子命令或明确分隔，必要时用 `parse_known_args` 兜底。

**4. 在库里 `parse_args()` 直接退进程**——`parse_args` 失败会 `sys.exit(2)`，让被 import 的代码意外终止。库应封装成函数返回 Namespace，把退出交给 `if __name__ == "__main__"` 入口。

## 高频面试题（5 题）

- **Q1**: 位置参数和可选参数的区别？`add_argument` 如何区分？
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - 看名字是否带 `-` 前缀：带（如 `-o/--output`）为可选参数，不带为位置参数
  - 位置参数按出现顺序匹配、默认必填
  - 可选参数顺序无关、可设 default 或 required=True
  - 可选参数可长短名并存（`-o` 与 `--output`）

  &lt;details&gt;

- **Q2**: `type=int` 和 `choices=` 各起什么作用？转换失败会怎样？
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - `type=`：对解析到的字符串做转换/校验，收到的是转换后的值
  - `choices=`：限定取值必须落在集合内
  - 任一校验失败：打印 usage + 错误信息到 stderr，以退出码 2 退出
  - type 也可传自定义函数实现复杂校验

  &lt;details&gt;

- **Q3**: `nargs` 有哪些取值？`action="append"` 和 `"store_true"` 区别？
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - nargs：`"?"` 0或1、`"*"` 0或多、`"+"` 1或多、整数 N 恰好 N 个，结果常为列表
  - store_true：开关，出现即 True、缺省 False，不接受值
  - append：每次出现把值追加进列表，适合 `--tag a --tag b`
  - count：累计出现次数，如 `-vvv` 得 3

  &lt;details&gt;

- **Q4**: 为什么不能对布尔开关用 `type=bool`？正确写法是什么？
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - bool("False")、bool("0") 都为 True，因为只判字符串非空
  - 用户传 `--flag False` 会得到 True，完全违背直觉
  - 正确：`action="store_true"` / `"store_false"`
  - 或 3.9+ 用 `argparse.BooleanOptionalAction` 自动生成 --x/--no-x

  &lt;details&gt;

- **Q5**: 如何实现 `git commit` / `git push` 这种子命令？
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - 用 `parser.add_subparsers(dest="cmd")` 拿到子解析器容器
  - 每个子命令 `sub = subparsers.add_parser("commit")` 再各自 add_argument
  - parse_args 后根据 `args.cmd` 分发到不同处理函数
  - 常用 `sub.set_defaults(func=handler)` 把函数绑到子命令上统一调用

  &lt;details&gt;

## 延伸资源

- [argparse 官方文档](https://docs.python.org/3/library/argparse.html)
- [argparse 官方教程（HOWTO）](https://docs.python.org/3/howto/argparse.html)
- [PEP 389 -- argparse 新命令行解析模块](https://peps.python.org/pep-0389/)
- 进阶替代：Click / Typer（第三方，装饰器风格，功能更强）

## （留白） 我的理解

> 这一段不强制填。学完后用自己的话复述、记下踩过的坑、和其他知识的连接。AI 写不出这段。

---

## collections(Counter/defaultdict/deque/namedtuple)

## TL;DR

> 一组针对特定场景优化过的容器,替代手写 dict/list 的轮子。

## 背景与动机

内置的 `dict`、`list`、`tuple` 是通用容器,但很多高频场景用它们写起来啰嗦又低效:

- 统计词频要手写 `d[k] = d.get(k, 0) + 1`;
- 分组聚合要先 `if k not in d: d[k] = []` 再 append;
- 用 `list.pop(0)` 做队列是 O(n),因为所有元素要前移;
- 用裸元组 `("张三", 18, "北京")` 存记录,取值靠 `[0]/[1]/[2]` 魔法下标,可读性差。

`collections` 把这四类"重新发明轮子"的场景做成了开箱即用、且经过 C 级优化的容器。工程价值在于:代码更短、意图更清晰、关键路径(如队列两端操作)从 O(n) 降到 O(1)。

## 核心机制

四个容器各自针对一类问题,底层实现决定了它们的适用边界:

- **Counter**:dict 的子类,键是元素、值是计数。缺失键访问返回 `0` 而不是抛 `KeyError`(这正是它能直接 `+= 1` 的原因)。`most_common(n)` 用堆排序(`heapq.nlargest`)取前 n 个,常用于 Top-K 统计。
- **defaultdict**:dict 子类,构造时传入一个"默认值工厂"(`list`/`int`/`set` 等)。访问缺失键时**自动调用工厂生成默认值并插入**,省去显式判空。注意:这个"自动插入"是写操作,遍历时误用会污染字典(见易错点)。
- **deque**:双端队列,底层是**双向链表 + 固定长度块**(不是动态数组)。两端 `append`/`pop` 都是 O(1);但按下标随机访问 `dq[i]` 是 O(n),这点和 list 相反。可选 `maxlen` 实现"满时自动丢弃另一端"的滑动窗口。
- **namedtuple**:元组的子类工厂,生成带字段名的轻量不可变记录类。实例同时拥有元组的不可变性/可解包和属性的可读性(`p.x` 而非 `p[0]`),内存比普通 class 实例省(无 `__dict__`)。

## 代码示例

```python
from collections import Counter, defaultdict, deque, namedtuple

# Counter:一行完成词频统计
words = "a b a c b a".split()
print(Counter(words).most_common(2))   # [('a', 3), ('b', 2)]

# defaultdict:按首字母分组,无需判空
groups = defaultdict(list)
for w in words:
    groups[w[0]].append(w)             # 缺失键自动建成 []

# deque:O(1) 两端操作 + maxlen 滑动窗口
dq = deque(maxlen=3)
for i in range(5):
    dq.append(i)
print(list(dq))                        # [2, 3, 4] 旧的被挤出

# namedtuple:可读且不可变的记录
Point = namedtuple("Point", ["x", "y"])
p = Point(1, 2)
print(p.x, p[0], p._asdict())          # 1 1 {'x': 1, 'y': 2}
```

## 易错点 / 反例

- **把 `list.pop(0)` 当队列用,数据量大时卡死**:`pop(0)` 要移动全部后续元素,是 O(n)。

  ```python
  # 反例:O(n) 出队,10 万级数据明显变慢
  q = [1, 2, 3]
  q.pop(0)              # 每次都要把后面元素前移一格

  # 正确:deque.popleft() 是 O(1)
  from collections import deque
  dq = deque([1, 2, 3])
  dq.popleft()
  ```

- **遍历 defaultdict 时顺手取值,导致键被悄悄写入**:访问缺失键会插入默认值。
  ```python
  from collections import defaultdict
  d = defaultdict(int)
  for k in ["a", "b"]:
      if d[k] == 0:      # 读取动作就触发了插入,d 多了 'a','b'
          pass
  print(dict(d))         # {'a': 0, 'b': 0}  ← 并非预期
  ```
  只想安全查询应改用 `d.get(k)`(不触发工厂),或干脆用普通 dict。
- **对 deque 做 `dq[len(dq)//2]` 这类随机下标访问**:链表结构下是 O(n),热点路径换成 list。
- **把 namedtuple 当可变对象改字段**:`p.x = 9` 会抛 `AttributeError`,它是不可变的;要改值用 `p._replace(x=9)` 返回新实例。
- **Counter 做减法期望得到"负计数"用于交集**:`c1 - c2` 只保留正计数;要全量差集用 `subtract()`(允许零和负值)。

## 高频面试题(5 题)

- **Q1**: defaultdict 和普通 dict 处理缺失键的区别是什么?原理是什么?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - 普通 dict 访问缺失键抛 `KeyError`;defaultdict 访问缺失键时调用构造时传入的工厂函数生成默认值,并把该键值对写回字典。
  - 原理是 defaultdict 重写了 `__missing__` 钩子:当 `__getitem__` 找不到键时,`dict` 会回落调用 `__missing__(key)`,defaultdict 在其中执行 `default_factory()` 并 `self[key] = value`。
  - 关键副作用:这是一次"写"操作,会让字典多出一个键;用 `in` 判断或 `get()` 则不会触发。

  &lt;details&gt;

- **Q2**: 为什么 deque 两端操作是 O(1) 而 list 的头部插入/删除是 O(n)?它们底层结构有何不同?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - deque 底层是双向链表组织的固定大小块(block),两端各有指针,append/pop 只动端点,与元素总数无关,故 O(1)。
  - list 是连续内存的动态数组,头部 insert/pop 要让所有后续元素整体平移一格,代价随长度线性增长,故 O(n)(尾部 append 摊销 O(1))。
  - 取舍:list 随机下标访问 O(1)、deque O(n);所以"两端进出用 deque、按下标随机访问用 list"。

  &lt;details&gt;

- **Q3**: Counter 是如何实现 `most_common(n)` 的?统计负数计数时 `-` 和 `subtract()` 有何差异?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - `most_common(n)` 内部调用 `heapq.nlargest(n, items, key=计数)`,基于堆取 Top-N;不传 n 时退化为按值排序 `sorted`。
  - 算术运算 `c1 - c2` 只保留结果中计数 **> 0** 的项(集合语义);`c1.subtract(c2)` 是逐键相减,允许结果为 0 或负数并保留在 Counter 中。
  - 缺失键在 Counter 中读取为 0,这是它能直接累加的原因。

  &lt;details&gt;

- **Q4**: namedtuple 相比普通 class 实例、相比字典,各有什么优劣?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - 相比普通 class:无需写 `__init__` 等样板;实例无 `__dict__`,占用内存更小;自带可读的 `__repr__` 和比较;但不可变,改字段要 `_replace` 生成新对象。
  - 相比字典:用属性访问 `p.x` 有 IDE 补全和拼写检查,字段固定不可拼错;但不如字典灵活(不能任意增删键)。
  - 适用:字段固定、只读的轻量记录/返回值;需要可变或大量字段时改用 `@dataclass` 或普通 class。

  &lt;details&gt;

- **Q5**: 如何在遍历/滑动窗口场景下用 deque 的 `maxlen`?它满时行为是什么?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - 构造 `deque(maxlen=n)` 后,当长度已达上限时,从一端 `append`/`appendleft` 会自动从**另一端**挤出一个元素,始终保持长度 ≤ n。
  - 典型用途:固定大小的滑动窗口、最近 N 条日志/记录缓存、流式数据的移动平均。
  - 注意 `maxlen` 一旦设定不可改;读取端常用 `list(dq)` 或下标切片需先转 list(deque 不支持切片)。

  &lt;details&gt;

## 延伸资源

- [collections — Container datatypes(官方文档)](https://docs.python.org/3/library/collections.html)
- [typing.NamedTuple(带类型注解的命名元组)](https://docs.python.org/3/library/typing.html#typing.NamedTuple)
- 《Fluent Python(第 2 版)》第 3 章:字典与集合
- 《Python Cookbook(第 3 版)》第 1 章:数据结构与算法

## (留白) 我的理解

> 这一段不强制填。学完后用自己的话复述、记下踩过的坑、和其他知识的连接。AI 写不出这段。

---

## datetime / time / zoneinfo 时区处理

## TL;DR

> 用带时区的 aware 对象存算时间,统一以 UTC 存储、按地区展示。

## 背景与动机

时间是后端最容易出错又最难排查的领域,根因只有一个:**同一时刻在不同时区写法不同**。一个"2026-07-29 12:00"如果不带时区,既可能是北京时间也可能是纽约时间,差 12 小时。

- 早期 Python 只有 `datetime`,且 `datetime.utcnow()` 返回的是**不带时区信息的"naive"对象**,容易和本地时间混用,算出错乱结果。
- 时区数据(各国偏移、夏令时规则)由 IANA 维护、每年更新。PEP 615 引入 `zoneinfo`,让标准库直接读 IANA 数据库,取代了过去要装第三方 `pytz` 的方案,且修正了 pytz 的若干使用陷阱。

工程共识(也是本文主线):**存储与计算一律用 UTC 的 aware 对象,只有在给人展示时才 `astimezone` 转成当地时区**。这样跨时区、跨夏令时的比较和排序才不会出错。

## 核心机制

- **naive vs aware**:`datetime` 对象若 `tzinfo` 为 `None` 就是 naive(只有年月日时分秒,不知属于哪个时区);设置了 `tzinfo` 就是 aware。两者**不能直接比较或相减**,会抛 `TypeError`——这是 Python 在帮你挡错。
- **`zoneinfo.ZoneInfo(key)`:IANA 时区对象**。key 是 `"Asia/Shanghai"`、`"America/New_York"` 这类名称。它会按名称从系统(或 `tzdata` 包)加载规则,正确处理夏令时。`ZoneInfo("UTC")` 即 `datetime.timezone.utc` 的等价物。
- **三个核心操作**:
  - `now(tz)` / `datetime.now(ZoneInfo(...))`:取**当前时刻**并带上时区(aware)。
  - `astimezone(tz)`:把一个 aware 时间**转换到另一个时区**,时刻不变、显示变。
  - `replace(tzinfo=tz)`:只**替换**时区标签、不换算时刻——极易误用(见易错点)。
- **时间戳互转**:`dt.timestamp()` 把 aware 时间转成 Unix 秒;`datetime.fromtimestamp(ts, tz)` 反向还原并指定时区。时间戳与时区无关,天然适合做跨系统传输的"中间格式"。

## 代码示例

```python
from datetime import datetime, timezone, timedelta
from zoneinfo import ZoneInfo

# 取当前 UTC 时刻(aware),不要再用 utcnow()
utc_now = datetime.now(timezone.utc)

# 同一时刻转换到上海与纽约,时刻不变、显示不同
sh = utc_now.astimezone(ZoneInfo("Asia/Shanghai"))
ny = utc_now.astimezone(ZoneInfo("America/New_York"))
print(sh.isoformat())   # 2026-07-29T...+08:00
print(ny.isoformat())   # 同一瞬间 ...-04:00

# 字符串 <-> 对象(ISO 格式推荐 fromisoformat / isoformat)
dt = datetime.fromisoformat("2026-07-29 12:00:00+08:00")

# 时间戳:跨系统传输的中间格式,与时区无关
ts = utc_now.timestamp()
back = datetime.fromtimestamp(ts, ZoneInfo("Asia/Shanghai"))

# 时间加减用 timedelta
tomorrow = utc_now + timedelta(days=1)
```

## 易错点 / 反例

- **混用 naive 与 aware 直接比较/相减**:
  ```python
  from datetime import datetime, timezone
  a = datetime.now()                  # naive
  b = datetime.now(timezone.utc)      # aware
  a < b                               # TypeError: can't compare offset-naive and offset-aware
  ```
  解决:全程只用 aware,取当前时间用 `datetime.now(timezone.utc)`。
- **用 `replace(tzinfo=...)` 去"转换时区",结果时刻错乱**:`replace` 只改标签不换算。
  ```python
  from datetime import datetime, timezone
  from zoneinfo import ZoneInfo
  dt = datetime(2026, 7, 29, 12, 0, tzinfo=timezone.utc)
  dt.replace(tzinfo=ZoneInfo("Asia/Shanghai"))  # 仍显示 12:00,但其实是错的!
  dt.astimezone(ZoneInfo("Asia/Shanghai"))      # 正确:显示 20:00(+08:00)
  ```
  只有"这个 naive 时间本来就是这个时区的"时才用 `replace` 打标签;真正的时区换算永远用 `astimezone`。
- **还在用 `datetime.utcnow()`**:它返回 naive,Python 3.12+ 已标记弃用。改用 `datetime.now(timezone.utc)`。
- **用固定 `timedelta(hours=8)` 代表"北京时间"**:没有夏令时的地区或许侥幸正确,但一有夏令时(如美国)偏移就随季节变化,硬编码偏移必然出错。务必用 `ZoneInfo` 名称让它按日期取正确偏移。
- **本地"不存在/歧义"的时刻(夏令时切换)**:比如拨快时钟那一小时不存在、拨回那一小时出现两次。`zoneinfo` 用 `fold` 属性区分歧义时刻,构造时间时要意识到这种边界,不能假设"本地时间一定合法且唯一"。

## 高频面试题(5 题)

- **Q1**: naive 和 aware datetime 有什么区别?为什么不能混用?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - naive:`tzinfo` 为 `None`,只有日历/时钟字段,不代表任何确定的物理时刻;aware:带了 `tzinfo`,对应时间轴上唯一确定的瞬间。
  - 混用时(naive 与 aware 比较或相减)Python 抛 `TypeError`,因为两者语义不在同一坐标系,无法定义先后。
  - 工程实践:内部统一用 aware(通常 UTC),naive 只出现在"尚未标注时区的原始输入"边界处,进入系统后立即补时区。

  &lt;details&gt;

- **Q2**: `astimezone()` 和 `replace(tzinfo=...)` 的本质区别是什么?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - `astimezone(tz)` 是**换算**:保持同一物理时刻,把它在目标时区的本地表示算出来(时和偏移一起变),要求原对象是 aware。
  - `replace(tzinfo=tz)` 是**改标签**:不动年月日时分秒,只换时区标记,物理时刻随之改变;用于"给一个本就属于某时区的 naive 时间补上时区"。
  - 误用 replace 做换算是经典 bug:显示时间不变,但对应的 UTC 瞬间错了。

  &lt;details&gt;

- **Q3**: 为什么推荐用 `zoneinfo.ZoneInfo("Asia/Shanghai")` 而不是 `timedelta(hours=8)` 或固定 offset?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - `ZoneInfo` 加载 IANA 时区库,**按具体日期**返回正确偏移,自动处理夏令时与历史偏移变更;固定 `timedelta(hours=8)` 永远 +8,遇到有夏令时的地区就会错。
  - 偏移不是常量而是"随时间变化的规则":美国夏季 EDT(-4)、冬季 EST(-5),只有名称能表达这套规则。
  - `zoneinfo` 自 3.9 起进标准库(PEP 615),取代第三方 pytz;系统无时区库时用 `tzdata` 包兜底。

  &lt;details&gt;

- **Q4**: 正确的"跨时区时间"存储与展示流程应该是怎样的?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - 存储/计算:统一用 UTC 的 aware 对象(或与之等价的时间戳),保证比较、排序、加减不受时区干扰。
  - 展示:临到输出才 `astimezone(用户所在时区)` 转成本地时间,再用 `isoformat`/`strftime` 格式化。
  - 传输:用 Unix 时间戳或带偏移的 ISO 8601 字符串(如 `...+08:00`),接收方能无损还原;避免传"无时区的本地时间字符串"。

  &lt;details&gt;

- **Q5**: `datetime.utcnow()` 为什么不推荐了?夏令时切换时会遇到什么坑?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - `utcnow()` 返回 **naive** 对象,名义是 UTC 却不带 `tzinfo`,极易与本地 naive 时间混算出错;Python 3.12+ 已弃用,应改用 `datetime.now(timezone.utc)` 得到 aware。
  - 夏令时坑:春季拨快时某个本地小时"不存在"(构造它会得到非法/被归一化的结果);秋季拨回时某个本地小时"出现两次",存在歧义。
  - `zoneinfo` 用 `fold=0/1` 区分歧义的那一次;做调度、计费类系统时必须考虑这两类边界,不能假设本地时间与物理时刻一一对应。

  &lt;details&gt;

## 延伸资源

- [datetime — 基本日期和时间类型(官方文档)](https://docs.python.org/3/library/datetime.html)
- [zoneinfo — IANA 时区支持(官方文档)](https://docs.python.org/3/library/zoneinfo.html)
- [PEP 615 — Support for the IANA Time Zone Database in the Standard Library](https://peps.python.org/pep-0615/)
- 《Python Cookbook(第 3 版)》第 3 章:数字、日期与时间

## (留白) 我的理解

> 这一段不强制填。学完后用自己的话复述、记下踩过的坑、和其他知识的连接。AI 写不出这段。

---

## itertools 与 functools(lru_cache/partial/reduce)

## TL;DR

> 高效惰性迭代工具集 + 函数变换工具集,让代码更省内存、更声明式。

## 背景与动机

两个问题驱动了这两个模块的存在:

- **内存与惰性**:`[f(x) for x in range(10**9)]` 会一次性把 10 亿个结果装进内存。`itertools` 提供一组"惰性迭代器"——按需产出、用多少算多少,常数级内存处理任意大的数据流。
- **函数即对象**:Python 函数是一等公民,`functools` 提供对函数的"再加工"——缓存结果(`lru_cache`)、预填参数(`partial`)、折叠归约(`reduce`)、保留元信息(`wraps`)。它们让递归、回调、高阶组合的写法更简洁且不重复造轮子。

工程价值:用声明式的组合替代手写循环,代码更短;`lru_cache` 一行就能给昂贵计算/递归加记忆化,常常是数量级的提速。

## 核心机制

- **itertools 是迭代器工厂**:所有函数返回的都是**迭代器**(一次性、惰性、不可重置)。`islice` 支持对无限迭代器切片,`chain` 串接多个可迭代对象,`groupby` 按"连续相同键"分组(注意是连续,见易错点),`combinations/permutations` 做组合排列。底层是 C 实现,比等价的 Python 生成器更快。
- **lru_cache = 记忆化装饰器**:把"参数 → 返回值"存进一个带 LRU 淘汰策略的哈希表。相同参数再次调用直接命中缓存,跳过函数体。`maxsize` 控制容量(满时淘汰最久未用项),`typed=True` 区分 `1` 与 `1.0` 这类等值不同类型。
- **partial = 参数预设**:`partial(func, a, b)` 返回一个新可调用对象,调用它时自动把 `a, b` 填在最前面。常用于给回调/键函数固定某些参数,避免再写一层 `lambda`。
- **reduce = 折叠**:`reduce(f, [a,b,c], init)` 等价于 `f(f(f(init,a),b),c)`,把序列折叠成单值。Python 3 把它移出内建,正是为了抑制"什么都用 reduce"的晦涩写法——能读懂的循环/专用函数(sum/max/join)优先。

## 代码示例

```python
from itertools import islice, count, chain, groupby
from functools import lru_cache, partial, reduce

# 惰性:对无限序列只取前 5 个,内存恒定
first5 = list(islice(count(0), 5))           # [0,1,2,3,4]

# chain 打平多个可迭代对象
flat = list(chain([1, 2], (3, 4)))           # [1,2,3,4]

# lru_cache:给指数级递归斐波那契加记忆化
@lru_cache(maxsize=None)
def fib(n):
    return n if n < 2 else fib(n-1) + fib(n-2)
print(fib(50))                                # 12586269025 秒出

# partial:预填底数,得到"平方/立方"函数
power = partial(pow)                          # 先包一层
square = partial(pow, exp=2)                  # 固定 exp=2
print(square(9))                              # 81

# reduce:折叠求乘积
prod = reduce(lambda a, b: a * b, [1, 2, 3, 4], 1)  # 24
```

## 易错点 / 反例

- **迭代器被"消费一次就空了"**:itertools 返回的是一次性迭代器,转 list 后再用就是空。
  ```python
  from itertools import islice, count
  it = islice(count(0), 3)
  list(it)          # [0,1,2]
  list(it)          # []  ← 已被耗尽,不是 [0,1,2]
  ```
  需要重复使用就尽早 `list()` 落地,或用 `itertools.tee` 复制(代价是内部缓存)。
- **`groupby` 不排序就直接分组,得到重复键的多个组**:它只合并**连续**相同键。
  ```python
  from itertools import groupby
  data = "aabbca"
  [ (k, list(g)) for k, g in groupby(data) ]
  # [('a',['a','a']), ('b',['b','b']), ('c',['c']), ('a',['a'])]  ← 'a' 出现两次!
  ```
  想按键全局分组,先 `sorted(data, key=...)` 再 groupby,且排序键与分组键要一致。
- **给参数不可哈希的函数加 `lru_cache`,直接报 TypeError**:缓存以参数做字典键。
  ```python
  from functools import lru_cache
  @lru_cache
  def f(items):       # list 不可哈希
      return sum(items)
  f([1, 2])           # TypeError: unhashable type: 'list'
  ```
  解法:参数改成可哈希类型(如 `tuple`),或换成可哈希的键再入函数。
- **给实例方法加 `@lru_cache(maxsize=None)` 导致内存泄漏**:缓存键会持有 `self`,实例永远无法被 GC。对方法缓存应设有限 `maxsize`,或在类外缓存纯数据。
- **滥用 `reduce` 写一行天书**:`reduce(lambda a,b: a+[b] if b%2 else a, xs, [])` 远不如列表推导可读。能用 `sum`/`max`/`join`/推导式时不要用 reduce。

## 高频面试题(5 题)

- **Q1**: `@lru_cache` 的原理是什么?`maxsize` 和 `typed` 参数各起什么作用?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - 原理是记忆化:用一个字典把"(位置参数+关键字参数) → 返回值"缓存起来,命中就直接返回,未命中才执行函数体并存入。
  - `maxsize` 是缓存容量上限,达到上限后按 LRU(最近最少使用)淘汰旧项;`maxsize=None` 表示无限增长(可能内存膨胀);`maxsize=0` 等价于不缓存。
  - `typed=False`(默认)把 `1` 与 `1.0`、`True` 视为同一缓存项;`typed=True` 则按类型分开缓存。
  - 要求:所有参数必须可哈希;常见于递归加速(斐波那契、动态规划)。

  &lt;details&gt;

- **Q2**: itertools 为什么说"省内存"?它和列表推导的本质区别是什么?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - itertools 返回的是**惰性迭代器**,逐个产出元素,任一时刻只占常数内存;列表推导会一次性把所有元素构建进内存。
  - 因此处理大数据流、无限序列(如 `count()`/`cycle()`)只能用惰性迭代器,配 `islice` 截取有限片段。
  - 代价:迭代器是一次性的、不可随机下标访问、耗尽即空;需要复用要 `list()` 落地,牺牲惰性。

  &lt;details&gt;

- **Q3**: `functools.partial` 有什么用?它和 `lambda` 有什么异同?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - 用途:预填函数的部分位置/关键字参数,生成一个参数更少的新可调用对象;常用于给回调、键函数(如 `sorted(key=...)`)、`map` 固定某些参数。
  - 与 lambda 相同:都能造出"已绑定部分参数"的可调用。
  - 与 lambda 不同:partial 保留了被包装函数的对象(`.func/.args/.keywords` 可自省),语义更明确、可被 `functools.update_wrapper`/类型检查更好处理;lambda 是匿名函数体,更通用但也更易写出晦涩表达式。
  - partial 预填的位置参数是从**最左**开始绑定的,关键字参数可覆盖。

  &lt;details&gt;

- **Q4**: `itertools.groupby` 的"陷阱"是什么?正确使用姿势是什么?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - 陷阱:groupby 只把**连续相邻**的相同键合成一组,不会去重或全局聚合;未排序时同一键可能分散成多个组。
  - 正确姿势:先用与分组键相同的 key 对数据 `sorted(...)`,再 `groupby`,才能得到"每个键一组"的直觉结果。
  - 注意 `groupby` 返回的每组迭代器 `g` 与外层共享游标,必须在内层立即消费(如 `list(g)`),否则随外层前进而失效。

  &lt;details&gt;

- **Q5**: 为什么 Python 3 把 `reduce` 从内建移到 `functools`?什么场景该用、什么场景不该用?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - 设计意图:`reduce` 写出来的代码常晦涩难懂,而绝大多数归约都有更清晰的专用工具(`sum`/`max`/`min`/`any`/`all`/`str.join`)或显式循环,故 Guido 将其降级以抑制滥用。
  - 该用:确实需要把二元运算逐级折叠、且没有现成专用函数时(如 `operator.mul` 求乘积、嵌套字典按路径取值)。
  - 不该用:求和、拼接、过滤收集等——分别用 `sum`、`join`、列表推导,可读性远胜 reduce。
  - 建议始终提供 `initializer`(初始值),避免空序列时 `reduce` 抛 `TypeError`。

  &lt;details&gt;

## 延伸资源

- [itertools — 高效迭代器工具(官方文档)](https://docs.python.org/3/library/itertools.html)
- [functools — 高阶函数与可调用对象操作(官方文档)](https://docs.python.org/3/library/functools.html)
- 《Fluent Python(第 2 版)》第 7 章(函数装饰器与闭包)、第 17 章(迭代器与生成器)
- 《Python Cookbook(第 3 版)》第 4 章(迭代器与生成器)

## (留白) 我的理解

> 这一段不强制填。学完后用自己的话复述、记下踩过的坑、和其他知识的连接。AI 写不出这段。

---

## json / csv / sqlite3 数据序列化与存储

## TL;DR

> json 存结构化文本、csv 存表格、sqlite3 提供零配置嵌入式 SQL 数据库。

## 背景与动机

程序跑在内存里的数据结构（dict、list）无法直接跨进程/跨网络传递或持久化，必须先「序列化」成字节流。Python 标准库针对不同场景提供了三件工具：`json` 处理层级结构、跨语言通用的文本格式；`csv` 处理二维表格数据（Excel、日志导出最常见）；`sqlite3` 则是一个无需单独部署、单文件、支持完整 SQL 的嵌入式数据库，非常适合本地缓存、小型应用、测试环境。三者都不依赖第三方库，是数据持久化的「零成本起步」方案。

## 核心机制

- `json`：`json.dumps(obj)` 把 Python 对象编码为 JSON 字符串，`json.loads(s)` 解码回来；带 `dump`/`load` 的文件版本直接读写文件对象。类型映射：dict→object、list→array、str→string、int/float→number、True/False→true/false、None→null。**不支持** set、tuple（会被转成 list）、datetime、自定义对象，需要传 `default=` 钩子或先转换。
- `csv`：`csv.reader` / `csv.writer` 按行读写列表；`csv.DictReader` / `csv.DictWriter` 把每行映射成字典，更适合带表头的表格。读文件时一定要用 `open(..., newline="")`，否则 Windows 下会出现空行。
- `sqlite3`：实现 DB-API 2.0（PEP 249）。流程：`connect` → `cursor` → `execute` → `commit`/`fetch`。参数占位符用 `?`，**不要**用 f-string 拼接 SQL，否则有注入风险。`with conn:` 自动提交/回滚；`conn.row_factory = sqlite3.Row` 让结果可按列名访问。

## 代码示例

```python
import json, csv, sqlite3

# 1) json:对象 <-> 字符串
data = {"name": "橙子", "scores": [90, 85], "active": True}
s = json.dumps(data, ensure_ascii=False, indent=2)  # ensure_ascii=False 保留中文
print(json.loads(s)["scores"])  # [90, 85]

# 2) csv:带表头写读
with open("user.csv", "w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=["name", "age"])
    w.writeheader(); w.writerow({"name": "橙子", "age": 18})

# 3) sqlite3:建表、参数化插入、查询
conn = sqlite3.connect(":memory:")     # 内存库,文件库传文件路径
conn.execute("CREATE TABLE user (name TEXT, age INTEGER)")
conn.execute("INSERT INTO user VALUES (?, ?)", ("橙子", 18))  # 参数化防注入
for row in conn.execute("SELECT name, age FROM user WHERE age > ?", (10,)):
    print(row)  # ('橙子', 18)
conn.commit(); conn.close()
```

## 易错点 / 反例

1. **json 不支持中文转义**：`json.dumps({"k": "橙子"})` 默认输出 `橙子`；要显示中文加 `ensure_ascii=False`。
2. **json 无法序列化 set/datetime**：`json.dumps({1, 2})` 抛 `TypeError: Object of type set is not JSON serializable`；自定义类型传 `default=lambda o: list(o) if isinstance(o, set) else str(o)`。
3. **csv 读写忘记 `newline=""`**：在 Windows 上会得到每行后面多一个空行，读出来行数翻倍。
4. **sqlite3 用 f-string 拼 SQL**：`f"SELECT * FROM user WHERE name = '{name}'"` 有 SQL 注入风险；永远用 `?` 占位符 + 参数元组。
5. **sqlite3 忘记 commit**：默认不是 autocommit，执行 INSERT/UPDATE 后不 `conn.commit()`，事务在连接关闭时回滚，数据丢失。
6. **datetime 存 sqlite3 类型不对应**：sqlite3 原生只认 TEXT/INTEGER/REAL/BLOB/NULL，datetime 要先转成 ISO 字符串或时间戳，或注册适配器。

## 高频面试题(5 题)

- **Q1**: `json.dumps` 和 `json.dump` 有什么区别？ loads / load 呢？
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - `dumps(obj)` 返回 JSON 字符串；`dump(obj, fp)` 把 JSON 写入文件对象
  - `loads(s)` 从字符串解析；`load(fp)` 从文件对象读取并解析
  - 记忆法：带 s 的是 string，不带 s 的是 file-like

  &lt;details&gt;

- **Q2**: json 默认支持哪些 Python 类型？遇到 set / datetime / 自定义对象怎么办？
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - 默认支持 dict、list、str、int、float、bool、None
  - tuple 会被静默转成 list（解码后变成 list），set/datetime 直接抛 TypeError
  - 方案 1：dumps 传 `default=` 钩子函数，把不支持的类型转成支持的
  - 方案 2：自定义 `json.JSONEncoder` 子类，重写 default 方法

  &lt;details&gt;

- **Q3**: 为什么 sqlite3 插入数据要用 `?` 占位符而不是字符串拼接？
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - 防止 SQL 注入：拼接会把用户输入直接嵌入 SQL，恶意输入可改变语句语义
  - 参数化查询由驱动负责转义，安全可靠
  - sqlite3 还会对参数化语句做缓存复用，批量执行更快
  - 注意 sqlite3 用 `?`（qmark 风格），MySQL 驱动用 `%s`，不能混用

  &lt;details&gt;

- **Q4**: csv 文件读写为什么要 `open(..., newline="")`？
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - csv 模块需要自己控制换行符（`\r\n` / `\n`），依赖文件对象原样透传
  - 若文本模式默认做换行转换，Windows 上会把 `\r\n` 变成 `\r\r\n`，导致行间出现空行
  - 官方文档明确要求：打开 csv 文件时传 `newline=""`

  &lt;details&gt;

- **Q5**: sqlite3 里执行了 INSERT 但查询不到数据，可能是什么原因？
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - 最常见：忘记 `conn.commit()`，事务未提交，连接关闭后回滚
  - 用了 `with conn:` 会在块结束时自动 commit，但异常会回滚
  - 连接的可能是不同数据库文件/不同连接（`:memory:` 每个连接都是独立库）
  - 也可能是 autocommit 被关闭（Python 3.12 后 `autocommit` 参数控制）

  &lt;details&gt;

## 延伸资源

- [json — JSON encoder and decoder](https://docs.python.org/3/library/json.html)
- [csv — CSV File Reading and Writing](https://docs.python.org/3/library/csv.html)
- [sqlite3 — DB-API 2.0 interface for SQLite databases](https://docs.python.org/3/library/sqlite3.html)
- [PEP 249 — Python Database API Specification v2.0](https://peps.python.org/pep-0249/)

## (留白) 我的理解

> 这一段不强制填。学完后用自己的话复述、记下踩过的坑、和其他知识的连接。AI 写不出这段。

---

## logging 日志体系

## TL;DR

> 分级、可路由、可配置的日志框架，用 Logger-Handler-Formatter 三层解耦替代 print。

## 背景与动机

`print` 只适合一次性脚本：无法区分「调试信息」和「线上事故」、无法静默、无法同时写文件和终端、无法附加时间戳/模块名/请求 ID。`logging` 解决的是**日志的生产与消费分离**——业务代码只负责「在正确级别记录一条消息」，至于这条消息写到哪、用什么格式、要不要上报，全部交给配置决定。这样同一份代码在开发时打满 DEBUG、在线上只留 WARNING，而不用改任何业务逻辑。

## 核心机制

logging 是**发布-订阅 + 责任链**结构，四个核心对象：

- **Logger**：日志入口，按名字组织成树（`a.b` 是 `a` 的子 logger），用 `logging.getLogger(__name__)` 获取。每个 logger 有级别，低于级别的消息直接丢弃。
- **Handler**：决定日志去向（`StreamHandler`→stderr、`FileHandler`→文件、`RotatingFileHandler`→滚动切割、`SMTPHandler`→邮件）。一个 logger 可挂多个 handler。
- **Formatter**：决定输出格式，`%(asctime)s %(levelname)s %(name)s %(message)s`。
- **Filter**：在 logger 和 handler 两层做精细过滤。

关键且最易被误解的两点：

1. **级别数值**：`DEBUG=10 < INFO=20 < WARNING=30 < ERROR=40 < CRITICAL=50`。消息级别 ≥ logger 有效级别才会被处理。
2. **propagate（冒泡）**：子 logger 处理完一条记录后，默认会**继续传给父 logger 的所有 handler** 再处理一遍。root logger 一旦被 `basicConfig` 配了 handler，你的模块日志就会被**重复打印**。这也是「log 打两遍」的经典根因。

`basicConfig` 本质是「给 root logger 配一个默认 handler」，且**只在 root 没有任何 handler 时生效一次**。

## 代码示例

```python
import logging

# 推荐:模块化 logger,库代码不要 basicConfig
logger = logging.getLogger(__name__)

def setup():
    logger.setLevel(logging.DEBUG)               # logger 层放行 DEBUG
    fmt = logging.Formatter(
        "%(asctime)s [%(levelname)s] %(name)s: %(message)s")
    ch = logging.StreamHandler()                  # 终端
    ch.setLevel(logging.INFO)                     # handler 层再过滤
    fh = logging.FileHandler("app.log")           # 文件
    fh.setLevel(logging.DEBUG)
    for h in (ch, fh):
        h.setFormatter(fmt)
        logger.addHandler(h)
    logger.propagate = False                      # 关键:不冒泡给 root

setup()
logger.debug("细节,只进文件")
logger.info("终端可见")
logger.warning("警告:磁盘将满")
```

## 易错点 / 反例

**1. 日志重复打印（propagate 未关 + 配了 root）**

```python
logging.basicConfig(level=logging.INFO)   # 给 root 配了 handler
logger = logging.getLogger("app")
logger.addHandler(logging.StreamHandler()) # 自己又加一个
logger.info("x")  # 打两遍:自己 handler 一遍,冒泡到 root 又一遍
```

修复：`logger.propagate = False`，或只在一处配 handler。

**2. 用 f-string / 提前拼接，破坏惰性求值**

```python
logger.debug("结果: %s" % expensive())     # 级别不够也会调用 expensive()
logger.debug(f"结果: {expensive()}")        # 同上,f-string 立即求值
logger.debug("结果: %s", expensive())      # 错误:函数已先执行
```

正确：传参数让 logging 惰性格式化 `logger.debug("结果: %s", value)`——只有级别达标时才做 `%` 插值，且求值仍发生在调用处，故省的是格式化而非函数调用；真正昂贵的计算应配 `logger.isEnabledFor(logging.DEBUG)` 守卫。

**3. 在库代码里 `basicConfig` 或加 handler**——库应只 `getLogger(__name__)` 并加 `NullHandler`，把配置权交给应用入口，否则污染使用方的日志。

## 高频面试题（5 题）

- **Q1**: logging 的四大组件及各自职责？
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - Logger：日志入口/分级，按名字树形组织，决定哪些消息被放行
  - Handler：决定输出去向（控制台/文件/网络），可挂多个，各自有级别
  - Formatter：控制输出格式字符串
  - Filter：在 logger、handler 两层做精细化过滤
  - 设计思想：生产与消费解耦，业务只发消息，配置决定行为

  &lt;details&gt;

- **Q2**: 为什么日志会重复打印？如何避免？
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - 根因：记录处理后默认沿 logger 树向上 propagate，父 logger（尤其被 basicConfig 配过的 root）的 handler 会再输出一遍
  - 典型场景：自己加了 handler，又冒泡给 root 的 handler
  - 解决：`logger.propagate = False`，或只在一处挂 handler
  - 库代码只挂 NullHandler，不碰 root 配置

  &lt;details&gt;

- **Q3**: 日志级别有哪些？`logger.setLevel` 和 handler 的级别如何协同？
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - DEBUG/INFO/WARNING/ERROR/CRITICAL，数值 10~50
  - 记录先过 logger 的有效级别（未设则沿树继承），达标后分发给各 handler
  - 每个 handler 再按自己的级别二次过滤
  - 利用双层过滤可实现「终端 INFO、文件 DEBUG」

  &lt;details&gt;

- **Q4**: 为什么推荐 `logger.info("%s", x)` 而不是 f-string？
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - logging 惰性格式化：只有级别达标才执行 % 插值，省格式化开销
  - 便于日志聚合系统按模板分组（如 Sentry），f-string 已展开无法归并
  - 注意：参数表达式本身在调用处仍会求值，昂贵计算需 isEnabledFor 守卫

  &lt;details&gt;

- **Q5**: 多线程/多进程下 logging 怎么用才安全？
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - logging 的 handler 内部有加锁，多线程写同一 handler 是线程安全的
  - 多进程不安全：多进程写同一文件会交错/丢失
  - 多进程方案：`QueueHandler` + `QueueListener` 集中到单独进程写，或各进程写各自文件，或用 `SocketHandler`/日志服务

  &lt;details&gt;

## 延伸资源

- [logging 官方文档](https://docs.python.org/3/library/logging.html)
- [Logging HOWTO（官方教程）](https://docs.python.org/3/howto/logging.html)
- [Logging Cookbook（实战配方）](https://docs.python.org/3/howto/logging-cookbook.html)
- 书籍：《Python Cookbook》第 13 章「脚本与系统管理」日志相关条目

## （留白） 我的理解

> 这一段不强制填。学完后用自己的话复述、记下踩过的坑、和其他知识的连接。AI 写不出这段。

---

## pathlib 与 os / shutil / glob 文件操作

## TL;DR

> pathlib 用面向对象统一路径操作，os/shutil/glob 负责系统级与批量文件处理。

## 背景与动机

在 PEP 428（Python 3.4）引入 `pathlib` 之前，Python 的路径操作依赖 `os.path` 的一系列字符串函数（`os.path.join`、`os.path.splitext`……），代码冗长且容易写错分隔符。`pathlib` 把路径抽象为 `Path` 对象，用 `/` 运算符拼接、用方法查询属性，可读性大幅提升。但实际工程里仍需要 `os`（环境变量、进程级操作）、`shutil`（复制、移动、删除目录树）、`glob`（通配符匹配），这四者分工明确，常常混合使用。

## 核心机制

- `pathlib.Path`：不可变路径对象，自动按当前操作系统选择 `PosixPath` / `WindowsPath`。核心运算：`p / "sub"` 拼接、`p.name` / `p.stem` / `p.suffix` 取部件、`p.exists()` / `p.is_file()` / `p.is_dir()` 判断、`p.read_text()` / `p.write_text()` 一步读写、`p.glob("**/*.py")` 递归匹配、`p.resolve()` 转绝对路径。
- `os` 模块：贴近系统调用，`os.listdir`、`os.makedirs`、`os.walk`（自顶向下遍历目录树，返回三元组 `dirpath, dirnames, filenames`）、`os.environ`、`os.remove`。`os.path` 子模块在旧代码里仍大量存在。
- `shutil`：高层文件操作，`shutil.copy` / `copy2`（保留元数据）/ `copytree`（递归复制目录）/ `move` / `rmtree`（递归删除，危险）。
- `glob`：返回匹配通配符的路径列表，`glob.glob("*.txt")`；`pathlib` 的 `Path.glob` 功能等价且返回 `Path` 对象，更常用。

## 代码示例

```python
from pathlib import Path

# 拼接、查询、读写一步到位
base = Path("data") / "2026" / "report"
base.mkdir(parents=True, exist_ok=True)          # 递归创建目录
file = base / "summary.txt"
file.write_text("hello pathlib", encoding="utf-8")
print(file.read_text(encoding="utf-8"))
print(file.stem, file.suffix)                    # summary .txt

# 递归找所有 .py 文件
for py in Path(".").rglob("*.py"):
    print(py)

# shutil 复制整个目录；os.walk 手动遍历
import shutil, os
shutil.copytree("data", "data_backup", dirs_exist_ok=True)
for dirpath, dirnames, filenames in os.walk("data"):
    for name in filenames:
        print(Path(dirpath) / name)
```

## 易错点 / 反例

1. **手动拼分隔符**：`path = dir + "/" + name` 在 Windows 上会失效；正确做法：`Path(dir) / name` 或 `os.path.join(dir, name)`。
2. **`Path.suffix` 只取最后一段**：`Path("a.tar.gz").suffix` 是 `.gz`，想取完整压缩后缀用 `p.suffixes`（返回 `['.tar', '.gz']`）。
3. **`os.remove` / `Path.unlink` 不能删目录**：对目录调用会抛 `IsADirectoryError`；删空目录用 `Path.rmdir()`，删非空目录树用 `shutil.rmtree()`——但 `rmtree` 不可恢复，务必确认路径。
4. **`glob.glob` 不递归子目录**除非加 `**` 且传 `recursive=True`：`glob.glob("**/*.py", recursive=True)`；`Path.rglob("*.py")` 天然递归。
5. **相对路径陷阱**：`Path("data").exists()` 依赖当前工作目录，脚本被不同目录调用时结果会变；用 `Path(__file__).resolve().parent` 定位脚本所在目录更稳。

## 高频面试题(5 题)

- **Q1**: `pathlib.Path` 相比 `os.path` 有什么优势？
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - 面向对象：路径是对象，`/` 运算符拼接，链式调用，可读性高
  - 跨平台：自动选择 PosixPath / WindowsPath，无需关心分隔符
  - 功能聚合：读写文件（read_text/write_text）、遍历（glob/rglob）、路径判断都收在一个 API 下
  - `os.path` 是纯函数 + 字符串，容易拼错且无法链式表达

  &lt;details&gt;

- **Q2**: 如何递归遍历目录？`os.walk` 和 `Path.rglob` 有什么区别？
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - `os.walk` 生成器，每层返回 `(dirpath, dirnames, filenames)`，可就地修改 dirnames 控制遍历，功能强但返回字符串
  - `Path.rglob("*.py")` 返回 `Path` 对象生成器，语法简洁，但无法用通配符以外的复杂条件
  - 需要按条件过滤、改目录树时用 `os.walk`；简单匹配用 `rglob`

  &lt;details&gt;

- **Q3**: `shutil.copy`、`copy2`、`copytree` 的区别？
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - `copy(src, dst)`：复制文件内容和权限位，不复制元数据（如修改时间）
  - `copy2(src, dst)`：在 copy 基础上尽量保留元数据（atime/mtime）
  - `copytree(src, dst)`：递归复制整个目录树，Python 3.8+ 支持 `dirs_exist_ok=True` 允许目标已存在

  &lt;details&gt;

- **Q4**: `Path("a.tar.gz").suffix` 和 `.stem` 的结果是什么？怎么拿到完整后缀？
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - `.suffix` → `.gz`（只取最后一个 `.` 之后的部分）
  - `.stem` → `a.tar`（去掉最后一段后缀）
  - 完整多段后缀用 `.suffixes` → `['.tar', '.gz']`
  - 想拿 `a` 可用 `p.name.removesuffix("".join(p.suffixes))`

  &lt;details&gt;

- **Q5**: 删除一个非空目录应该用什么？有什么注意事项？
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - 用 `shutil.rmtree(path)` 递归删除整个目录树
  - `os.rmdir` / `Path.rmdir()` 只能删空目录；`os.remove` / `Path.unlink()` 只能删文件
  - `rmtree` 删除不可恢复，务必先校验路径、防止误删（可用 `Path.resolve()` 打印确认）
  - 传符号链接给 `rmtree` 会报错，不会跟随链接删除目标

  &lt;details&gt;

## 延伸资源

- [pathlib — Object-oriented filesystem paths](https://docs.python.org/3/library/pathlib.html)
- [os — Miscellaneous operating system interfaces](https://docs.python.org/3/library/os.html)
- [shutil — High-level file operations](https://docs.python.org/3/library/shutil.html)
- [PEP 428 — The pathlib module](https://peps.python.org/pep-0428/)

## (留白) 我的理解

> 这一段不强制填。学完后用自己的话复述、记下踩过的坑、和其他知识的连接。AI 写不出这段。

---

## re 正则表达式

## TL;DR

> re 用「模式」描述字符串规则，实现查找、提取、替换、切分。

## 背景与动机

字符串的 `find`/`split`/`replace` 只能做字面匹配，遇到「所有以数字开头、后跟 @ 的邮箱」「把连续多个空格压成一个」这类**带规则**的需求就力不从心。正则表达式用一套紧凑的语法描述字符模式，`re` 模块把它编译成自动机来做匹配，是日志清洗、数据校验、爬虫提取的核心工具。难点不在 API，而在正确写出既不过度匹配又不漏匹配的模式。

## 核心机制

- **元字符**：`.` 任意字符、`\d` 数字、`\w` 单词字符、`\s` 空白、`[]` 字符集、`^`/`---
  title: '常用标准库'
  order: 5

---

# 常用标准库

> Python 标准库是"自带电池"哲学的体现，掌握核心模块能大幅减少第三方依赖。

---

## 常用模块速查表

| 模块          | 用途             | 核心 API                                   |
| ------------- | ---------------- | ------------------------------------------ |
| `collections` | 高性能数据结构   | Counter / defaultdict / deque / namedtuple |
| `itertools`   | 迭代器工具       | chain / product / combinations / groupby   |
| `functools`   | 函数工具         | lru_cache / partial / reduce / wraps       |
| `pathlib`     | 路径操作（推荐） | Path / glob / read_text / write_text       |
| `json`        | JSON 序列化      | dumps / loads / dump / load                |
| `datetime`    | 日期时间         | datetime / timedelta / timezone            |
| `re`          | 正则表达式       | search / match / findall / sub / compile   |

---

## collections 模块详解

```python
from collections import Counter, defaultdict, deque, namedtuple

# Counter —— 计数器
words = ['apple', 'banana', 'apple', 'cherry', 'banana', 'apple']
count = Counter(words)
count.most_common(2)           # [('apple', 3), ('banana', 2)]
count['apple']                 # 3
count.update(['apple'])        # apple 变为 4

# defaultdict —— 自动初始化的字典
groups = defaultdict(list)
for name, dept in [('Alice', 'dev'), ('Bob', 'dev'), ('Eve', 'ops')]:
    groups[dept].append(name)  # 无需判断 key 是否存在
# {'dev': ['Alice', 'Bob'], 'ops': ['Eve']}

# deque —— 双端队列（两端操作 O(1)）
dq = deque(maxlen=5)           # 有界队列，满了自动丢弃旧元素
dq.appendleft('first')         # 左端追加
dq.rotate(2)                   # 旋转：右移 2 位

# namedtuple —— 具名元组
Point = namedtuple('Point', ['x', 'y'])
p = Point(3, 4)
p.x, p.y                      # 属性访问，比索引更清晰
p._asdict()                    # {'x': 3, 'y': 4}
```

---

## itertools 常用函数

```python
from itertools import chain, product, combinations, groupby, islice

# chain —— 连接多个可迭代对象
list(chain([1, 2], [3, 4], [5]))      # [1, 2, 3, 4, 5]

# product —— 笛卡尔积（替代多层 for 循环）
list(product('AB', [1, 2]))           # [('A',1),('A',2),('B',1),('B',2)]

# combinations —— 组合（不重复）
list(combinations([1, 2, 3], 2))      # [(1,2), (1,3), (2,3)]

# groupby —— 分组（数据必须先排序）
data = sorted(users, key=lambda u: u['dept'])
for dept, group in groupby(data, key=lambda u: u['dept']):
    print(dept, list(group))

# islice —— 切片迭代器（不创建中间列表）
list(islice(range(10**8), 5))         # [0, 1, 2, 3, 4]，内存友好
```

---

## pathlib vs os.path 对比

| 操作     | `os.path`（旧）          | `pathlib`（推荐）   |
| -------- | ------------------------ | ------------------- |
| 路径拼接 | `os.path.join(a, b)`     | `Path(a) / b`       |
| 文件名   | `os.path.basename(p)`    | `p.name`            |
| 扩展名   | `os.path.splitext(p)[1]` | `p.suffix`          |
| 父目录   | `os.path.dirname(p)`     | `p.parent`          |
| 是否存在 | `os.path.exists(p)`      | `p.exists()`        |
| 读取文件 | `open(p).read()`         | `p.read_text()`     |
| 递归查找 | `glob.glob('**/*.py')`   | `p.glob('**/*.py')` |

```python
from pathlib import Path

# 常用操作
p = Path('/tmp/project')
p.mkdir(parents=True, exist_ok=True)   # 递归创建目录
(p / 'config.json').write_text('{}')   # 写文件
files = list(p.glob('**/*.py'))        # 递归查找所有 .py 文件
p.resolve()                            # 绝对路径
```

---

## json 序列化 / 反序列化

```python
import json
from datetime import datetime

# 基本用法
data = {'name': '橙子', 'scores': [95, 88, 92]}
text = json.dumps(data, ensure_ascii=False, indent=2)  # 中文不转义
obj = json.loads(text)

# 文件读写
with open('data.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False)
with open('data.json', 'r', encoding='utf-8') as f:
    obj = json.load(f)
```

---

## functools 常用函数

```python
from functools import lru_cache, partial, reduce

# lru_cache —— 自动缓存函数结果
@lru_cache(maxsize=128)
def fib(n):
    if n < 2: return n
    return fib(n - 1) + fib(n - 2)

# partial —— 固定部分参数
int_from_hex = partial(int, base=16)
int_from_hex('ff')                    # 255

# reduce —— 累积计算
reduce(lambda a, b: a * b, [1, 2, 3, 4])  # 24
```

---

## 常见陷阱

### datetime 时区问题

```python
from datetime import datetime, timezone

# ❌ naive datetime，不带时区信息，跨时区比较会出错
now = datetime.now()

# ✅ aware datetime，始终带时区
now = datetime.now(timezone.utc)
```

### json 序列化自定义对象

```python
# ❌ 直接序列化自定义对象会报 TypeError
json.dumps(datetime.now())  # TypeError: Object of type datetime is not JSON serializable

# ✅ 自定义序列化器
class DateEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, datetime):
            return obj.isoformat()
        return super().default(obj)

json.dumps({'time': datetime.now()}, cls=DateEncoder)
```

### defaultdict 陷阱

```python
# ❌ 访问不存在的 key 会自动创建条目（副作用）
d = defaultdict(int)
if d['missing']:  # 这会创建 d['missing'] = 0
    pass

# ✅ 先检查是否存在
if 'missing' in d:
    process(d['missing'])
```

锚点、`*`/`+`/`?`/`{m,n}` 量词、`|` 或、`()` 分组。

- **贪婪与非贪婪**：`*`、`+`、`{m,n}` 默认贪婪（尽可能多匹配）；加 `?` 变非贪婪（尽可能少），如 `<.*?>` 匹配最短标签。
- **核心函数**：
  - `re.match(pattern, s)` 只从**字符串开头**匹配
  - `re.search(pattern, s)` 扫描整个字符串找**第一个**匹配
  - `re.findall(pattern, s)` 返回所有匹配的列表（有分组时返回分组）
  - `re.finditer` 返回迭代器，元素是 `Match` 对象，可拿位置
  - `re.sub(pattern, repl, s)` 替换；`re.split(pattern, s)` 按模式切分
- **编译复用**：`re.compile(pattern)` 预编译，循环里反复用同一模式时提速，还能用 `p.search(s)` 直接调用。
- **分组与引用**：`(\d{4})-(\d{2})` 捕获年/月，`m.group(1)` 取第 1 组，`(?P&lt;year&gt;\d{4})` 命名分组；`re.sub` 里用 `\1` 或 `\g&lt;year&gt;` 反向引用。
- **原始字符串**：模式一律用 `r"..."`，避免 `\b`（退格）被 Python 字符串先转义成退格符而不是正则的「单词边界」。

## 代码示例

```python
import re

text = "联系方式:alice@example.com 或 bob_2026@test.org,电话 138-0000-1234"

# 1) search 找第一个,group() 取结果
m = re.search(r"[\w.]+@[\w.]+\.\w+", text)
print(m.group())          # alice@example.com

# 2) findall 抓所有邮箱
print(re.findall(r"[\w.]+@[\w.]+\.\w+", text))
# ['alice@example.com', 'bob_2026@test.org']

# 3) 命名分组 + 反向引用替换:隐藏手机号中间 4 位
pat = re.compile(r"(?P&lt;loc&gt;\d{3})-(?P&lt;mid&gt;\d{4})-(?P&lt;last&gt;\d{4})")
print(pat.sub(r"\g&lt;loc&gt;-****-\g&lt;last&gt;", text))
# 联系方式:alice@example.com 或 bob_2026@test.org,电话 138-****-1234

# 4) 贪婪 vs 非贪婪
html = "&lt;b&gt;粗&lt;b&gt;&lt;i&gt;斜&lt;i&gt;"
print(re.findall(r"<.*>", html))    # ['&lt;b&gt;粗&lt;b&gt;&lt;i&gt;斜&lt;i&gt;']  贪婪全吞
print(re.findall(r"<.*?>", html))   # ['&lt;b&gt;', '&lt;b&gt;', '&lt;i&gt;', '&lt;i&gt;']
```

## 易错点 / 反例

1. **match 不等于「包含」**：`re.match(r"\d+", "abc123")` 返回 None，因为 match 只从开头比；要全文找用 `search`。
2. **忘记加 r 前缀**：`"\bword\b"` 里 `\b` 被 Python 解释成退格符，匹配失败；必须写 `r"\bword\b"`。
3. **贪婪匹配吞掉多余内容**：`re.search(r"<(.+)>", "&lt;a&gt;&lt;b&gt;").group(1)` 得到 `a><b`，而不是想要的 `a`；标签/引号内容提取通常要非贪婪 `(.+?)` 或排除字符 `([^>]+)`。
4. **findall 与分组交互**：`re.findall(r"(\d+)-(\d+)", "1-2 3-4")` 返回 `[('1','2'), ('3','4')]` 元组列表，不是整个匹配；想拿整段要去掉括号或用 `finditer`。
5. **特殊字符未转义**：匹配字面 `a.b` 用 `r"a\.b"`，否则 `.` 会匹配任意字符；同理 `(`、`)`、`[`、`+` 都要 `\` 转义。
6. **在循环里重复编译**：循环体内 `re.search(r"\d+", line)` 每次都编译（虽有缓存），性能敏感场景应在循环外 `pat = re.compile(...)`。

## 高频面试题(5 题)

- **Q1**: `re.match` 和 `re.search` 的区别？
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - `match` 只从字符串起始位置尝试匹配，开头不匹配就失败
  - `search` 扫描整个字符串，返回第一个能匹配的位置
  - `re.fullmatch` 要求整个字符串完全匹配模式
  - 想模拟 search 可用 match 加 `.*` 前缀，但直接 search 更清晰

  &lt;details&gt;

- **Q2**: 什么是贪婪匹配和非贪婪匹配？举例说明。
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - 量词 `*`、`+`、`{m,n}` 默认贪婪：在满足整体匹配前提下尽可能多吞字符
  - 量词后加 `?` 变非贪婪：尽可能少吞
  - 例：`<.*>` 对 `&lt;a&gt;&lt;b&gt;` 匹配整串；`<.*?>` 只匹配 `&lt;a&gt;`
  - 提取成对标签/引号内容时通常要非贪婪

  &lt;details&gt;

- **Q3**: 为什么写正则模式推荐用原始字符串 `r"..."`？
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - Python 字符串和正则引擎都会处理反斜杠转义，存在两层转义
  - 不写 r 时 `"\b"` 先被 Python 转成退格符，正则收到的就不是「单词边界」
  - 用 `r"..."` 让反斜杠原样传给正则引擎，语义清晰、不会踩坑
  - 匹配字面反斜杠时，原始字符串写 `r"\\"`，普通字符串得写 `"\\\\"`

  &lt;details&gt;

- **Q4**: `re.findall` 在模式含分组时返回什么？如何拿到带位置信息的匹配？
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - 无分组：返回所有匹配子串的列表
  - 有一个分组：返回该分组内容的列表
  - 有多个分组：返回元组列表，每个元组是各分组内容
  - 需要 `Match` 对象（含 span、group）时用 `re.finditer` 遍历

  &lt;details&gt;

- **Q5**: 如何用正则把字符串中连续多个空白压缩成一个空格？
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - 用 `re.sub(r"\s+", " ", s)`
  - `\s+` 匹配一个或多个连续空白字符（空格、制表、换行）
  - 替换为单个空格即可
  - 若还要去掉首尾空白，先 `s.strip()` 再 sub

  &lt;details&gt;

## 延伸资源

- [re — Regular expression operations](https://docs.python.org/3/library/re.html)
- [Regular Expression HOWTO(官方教程)](https://docs.python.org/3/howto/regex.html)
- 书籍:《Python Cookbook》第 2 章字符串与文本

## (留白) 我的理解

> 这一段不强制填。学完后用自己的话复述、记下踩过的坑、和其他知识的连接。AI 写不出这段。

---

## NumPy(ndarray / 广播 / 向量化 / 切片)

## TL;DR

> 连续内存 + C 实现的同构数组,用向量化替代 Python 循环换来数量级提速。

## 背景与动机

Python 原生 `list` 是指向 PyObject 的指针数组:每个元素都是完整的对象,带类型头、引用计数,内存分散,遍历和运算都要逐元素走解释器动态分派,做数值计算极慢。科学计算场景(矩阵运算、信号处理、图像/机器学习)动辄上亿次浮点运算,纯 Python 循环完全无法接受。

NumPy 的解法是把数据放进一块**连续的、类型同构的内存缓冲区**,运算整体下推到 C/Fortran 层一次完成(而非逐元素解释),这就是「向量化」。它解决的问题本质上是:**把解释器的 per-element 开销,摊薄成一次底层批量调用**。理解这一点,就理解了为什么「能用 NumPy 向量化就不要写 for 循环」。

## 核心机制

- **ndarray**:N 维同构数组。元数据(shape / dtype / strides)+ 指向连续数据的指针。`strides`(步幅)记录沿每个轴移动一个元素需要跳过多少字节——这是切片能产生「视图」而非「拷贝」的关键。
- **dtype 同构**:所有元素同一类型(int64 / float64 ...),因此可以按固定字节偏移随机访问,无需像 list 那样逐个解引用对象。
- **向量化 / ufunc**:`a + b`、`np.sin(a)` 等通用函数(ufunc)在 C 层对整个缓冲区做 SIMD 友好的循环,避开 Python 字节码逐元素分派。
- **广播(Broadcasting)**:形状不同的数组做运算时,NumPy 在不复制数据的前提下「虚拟扩展」较小数组。规则:从尾部对齐维度,某轴相等或其中一方为 1 即可广播;都不满足则报 `ValueError`。
- **切片是视图(view)**:基本切片(`a[1:3]`、`a[:, ::2]`)只新建 strides/offset 元数据,与原数组**共享内存**,改视图会改原数组。这是性能来源,也是最大陷阱。

## 代码示例

```python
import numpy as np

a = np.arange(6).reshape(2, 3)      # 2x3 数组,连续内存
# [[0 1 2]
#  [3 4 5]]
print(a.dtype, a.strides)           # int64 (24, 8):行步幅24字节,列步幅8字节

b = a[:, 1]                          # 基本切片 -> 视图,共享内存
b[:] = 99                            # 改视图,原数组也变了
print(a[0, 1])                       # 99

# 广播:标量 + 一维向量 同时作用于二维数组
col = np.array([10, 20, 30])         # shape (3,)
print(a + col)                       # col 沿行方向广播,逐列相加

# 向量化替代 for 循环(数量级提速)
x = np.random.rand(1_000_000)
y = x * 2 + 1                        # 一次底层调用,而非百万次 Python 循环
```

## 易错点 / 反例

1. **误以为切片是拷贝**,改了视图污染原数据:

```python
a = np.arange(5)
sub = a[1:3]        # 视图!
sub[:] = -1
print(a)            # [ 0 -1 -1  3  4] 原数组被悄悄改了
# 需要独立副本时用显式拷贝:sub = a[1:3].copy()
```

2. **混淆视图与拷贝的边界**:布尔索引 / 花式索引(整数数组)返回的是**拷贝**,不是视图,行为与基本切片相反:

```python
a = np.arange(4)
mask = a[a > 1]     # 花式索引 -> 拷贝
mask[:] = 0
print(a)            # [0 1 2 3] 不受影响
```

3. **广播维度对不上悄悄报错或得到意外形状**:`(3,) + (2,)` 无法广播;`(2,1) + (1,3)` 会变成 `(2,3)`——有时是想要的外积,有时是隐藏 bug,务必打印 shape 确认。
4. **整数数组做 in-place 浮点运算被静默截断**:`np.arange(3) / 2` 得到 float 没问题,但 `a = np.arange(3); a /= 2`(即 `a //= ...` 类型语义)会因 dtype 是 int 而报 `Cannot cast` 或截断,in-place 运算受原 dtype 约束。
5. **`np.array` vs `np.asarray`**:前者总是拷贝,后者在输入已是同 dtype 的 ndarray 时不拷贝(共享内存),混用会导致意外的内存共享。

## 高频面试题(5 题)

- **Q1**: NumPy 为什么比 Python 原生 list 做数值运算快这么多?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - 内存布局:ndarray 是连续、同构的数据缓冲区,list 是 PyObject 指针数组、内存分散。
  - 免去逐元素类型检查与引用计数开销,固定字节偏移即可随机访问。
  - 向量化 / ufunc 把运算下推到 C/Fortran 层,一次批量循环代替解释器逐元素分派,且可利用 SIMD。
  - 缓存友好:连续内存命中 CPU cache,list 的指针跳转造成大量 cache miss。

  &lt;details&gt;

- **Q2**: 广播(Broadcasting)的规则是什么?什么时候会报错?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - 从尾部(最后一个轴)向前对齐两个数组的维度。
  - 每个轴上:两维度相等,或其中一方为 1,即可广播(为 1 的一方被虚拟扩展)。
  - 任一轴两维度既不相等也都不为 1,则报 `ValueError: operands could not be broadcast`。
  - 维度数不同的一方在前面补 1 再对齐;广播是「虚拟扩展」,不真正复制数据。

  &lt;details&gt;

- **Q3**: 视图(view)和拷贝(copy)的区别?哪些操作返回视图、哪些返回拷贝?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - 视图与原数组共享底层内存,改一个影响另一个;拷贝拥有独立内存。
  - 基本切片(整数/slice 索引,如 `a[1:3]`、`a[:, ::2]`)返回视图。
  - 花式索引(整数数组)与布尔索引返回拷贝。
  - 用 `arr.base`(视图指向原数组)、`np.shares_memory(a, b)` 判断;需要独立副本用 `.copy()`。

  &lt;details&gt;

- **Q4**: `strides`(步幅)是什么?它和切片视图、性能有什么关系?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - strides 记录沿每个轴移动一个元素需跳过的字节数,如 C 连续的 2x3 int64 数组为 `(24, 8)`。
  - 切片只需改 strides/offset 元数据而不动数据,所以视图是 O(1)、零拷贝。
  - `reshape`、`transpose`、`ravel` 等很多时候也只改 strides 返回视图。
  - 非连续(转置/大步幅)数组运算可能 cache 不友好,必要时 `np.ascontiguousarray` 改善。

  &lt;details&gt;

- **Q5**: 如何把一段 Python for 循环的数值计算改写成向量化?思路是什么?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - 核心思路:把「逐元素循环 + 标量运算」改为「整个数组上的一次 ufunc 调用」。
  - 例:`[x*2+1 for x in data]` → `np.asarray(data) * 2 + 1`。
  - 用广播处理两两组合(如距离矩阵),用 `np.where` / 布尔掩码替代条件分支,用 `np.cumsum`/`np.diff` 等替代累积/差分循环。
  - 实在难以向量化的逐元素逻辑,可考虑 `np.vectorize`(仅语法糖,不提速)、numba/Cython 真加速。

  &lt;details&gt;

## 延伸资源

- [NumPy 官方:Broadcasting](https://numpy.org/doc/stable/user/basics.broadcasting.html)
- [NumPy 官方:Copies and Views](https://numpy.org/doc/stable/user/basics.copies.html)
- [NumPy 官方:Absolute Beginners](https://numpy.org/doc/stable/user/absolute_beginners.html)
- 书籍:《Python for Data Analysis》(Wes McKinney)NumPy 章节;《Fluent Python》第 2 章数组相关

## (留白) 我的理解

> 这一段不强制填。学完后用自己的话复述、记下踩过的坑、和其他知识的连接。AI 写不出这段。

---

## Pandas(DataFrame / groupby / merge / 性能)

## TL;DR

> 基于 NumPy 的带标签二维表,用向量化与分组-连接语义做高效数据分析。

## 背景与动机

NumPy 解决的是「同构数值数组」的高速运算,但真实业务数据是**异构的表**:一行里有字符串(姓名)、数值(金额)、时间(下单时间)、枚举(状态),而且列有名字、行有索引,还要处理缺失值、按某列分组统计、像 SQL 一样做多表连接。用裸 NumPy 处理这些,代码会很快变得晦涩易错。

Pandas 在 NumPy 之上提供 `DataFrame`:每列是有名字的 `Series`(底层仍是 NumPy 数组,享受向量化提速),配上行列标签、缺失值语义和一套声明式的分组(`groupby`)、连接(`merge`)、透视 API。它把「数据分析里反复出现的表操作」固化成高层原语,让分析师用接近 SQL/思维直觉的方式写代码,同时保住 NumPy 级的性能。理解 Pandas 的关键是:**它的高层 API 几乎都建立在「列是 NumPy 数组、操作尽量向量化」之上,一旦退回 Python 级逐行循环,性能就崩了**。

## 核心机制

- **DataFrame / Series**:DataFrame 是按列组织的字典式结构,每列一个 `Series`(一个带 index 的一维 NumPy 数组 + dtype)。同列同 dtype,不同列可不同 dtype。`index` 提供对齐(alignment)能力——运算按标签而非位置对齐。
- **groupby(split-apply-combine)**:按某列把数据**拆分**成组,对每组**应用**聚合/变换(如 `sum`/`mean`/自定义函数),再**合并**结果。聚合走 C 层,`agg` 内置函数远快于 `apply` 传 Python 函数。
- **merge / join**:类似 SQL 的 `inner/left/right/outer` 连接,按一个或多个键列对齐两张表;`how` 决定保留哪些键,`on`/`left_on`/`right_on` 指定键,`validate` 可校验一对一/多对一关系。
- **视图 vs 拷贝与链式赋值**:Pandas 的索引返回视图还是拷贝**取决于 dtype、布局、是否单一 block**,不保证。`df[df.a > 0]['b'] = 1` 这种链式赋值会触发 `SettingWithCopyWarning`,因为第二步可能作用在临时拷贝上而写不回去。
- **性能本质**:快的是「列级向量化操作」(`df.a * 2`、`df.groupby('k').v.sum()`);慢的是「行级 Python 循环」(`iterrows`、`apply` 传慢速 Python 函数、循环里 `append` 拼 DataFrame)。

## 代码示例

```python
import pandas as pd

df = pd.DataFrame({
    "team": ["A", "A", "B", "B"],
    "name": ["x", "y", "z", "w"],
    "score": [80, 90, 70, 60],
})

# 向量化列运算 + 布尔筛选
df["passed"] = df["score"] >= 75
print(df.loc[df["passed"], ["name", "score"]])

# groupby:split-apply-combine,聚合走 C 层,快
print(df.groupby("team")["score"].mean())     # 每组平均分

# merge:类 SQL 连接
info = pd.DataFrame({"team": ["A", "B"], "city": ["SH", "BJ"]})
print(df.merge(info, on="team", how="left"))  # 左连接补上城市列
```

## 易错点 / 反例

1. **链式赋值写不回去(`SettingWithCopyWarning`)**:

```python
df = pd.DataFrame({"a": [1, 2, 3], "b": [0, 0, 0]})
df[df.a > 1]["b"] = 99      # 警告!可能改了临时拷贝,df.b 不变
# 正确:用 .loc 一次性定位行列
df.loc[df.a > 1, "b"] = 99
```

2. **用 `iterrows` / `apply` 做本可向量化的逐行计算**,慢几个数量级:

```python
# 反例:逐行循环
total = [r["a"] * r["b"] for _, r in df.iterrows()]
# 正例:列向量化
total = df["a"] * df["b"]
```

3. **循环里 `df.append`/反复 concat 拼 DataFrame**,每次全量拷贝,复杂度 O(n²)。应先收集 list 最后一次 `pd.concat`。
4. **merge 键对不上导致行数爆炸或丢行**:多对多键会产生笛卡尔积;键有重复/NaN(NaN 不等于自身)会静默错配。用 `validate="one_to_one"/"many_to_one"` 校验,先 `df.key.isna().sum()` 检查。
5. **内存爆炸**:CSV 读进来数值默认 `int64/float64`、字符串全是 `object`。大表应 `pd.read_csv(..., dtype=...)` 指定小 dtype,低基数字符串列转 `category`,可省大半内存。

## 高频面试题(5 题)

- **Q1**: `.loc` 和 `.iloc` 有什么区别?为什么推荐用 `.loc` 赋值?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - `.loc` 按**标签**(index/column 名)选取,切片含右端点;`.iloc` 按**整数位置**选取,行为类似 Python 切片不含右端点。
  - `df.loc[row_mask, "col"] = v` 一次定位行与列,作用在原对象上,不产生中间拷贝。
  - 链式赋值 `df[mask]["col"] = v` 第一步可能返回拷贝,第二步写不回去,触发 `SettingWithCopyWarning`。
  - 因此赋值/筛选统一用 `.loc`,避免视图/拷贝歧义。

  &lt;details&gt;

- **Q2**: groupby 的 split-apply-combine 是什么?`agg`/`transform`/`apply` 有何区别?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - split:按键把数据分组;apply:对每组应用函数;combine:把结果拼回。
  - `agg`(聚合):每组返回**一个**标量(如 sum/mean),结果行数等于组数。
  - `transform`(变换):每组返回**与原组等长**的结果(如组内减均值),结果行数与原表一致。
  - `apply`:最灵活、可返回任意形状,但走 Python 回调,最慢;能用内置 agg/transform 就不要用 apply。

  &lt;details&gt;

- **Q3**: merge 的几种连接方式(inner/left/right/outer)区别?有哪些常见坑?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - inner:只保留两表键都匹配的行;left:保留左表全部行,右表无匹配补 NaN;right 反之;outer:取两表键的并集。
  - 坑 1:键有重复时多对多连接产生笛卡尔积,行数暴涨。
  - 坑 2:键含 NaN 无法匹配(NaN != NaN),静默丢行。
  - 坑 3:两表同名非键列自动加后缀 `_x/_y`,易混淆。
  - 用 `validate` 参数强制校验基数关系(如 `many_to_one`)提前暴露问题。

  &lt;details&gt;

- **Q4**: Pandas 性能优化的主要手段有哪些?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - 向量化优先:用列运算、内置 agg,替代 `iterrows`/逐行 `apply`。
  - 降内存:`read_csv` 指定 dtype、数值降精度(int64→int32)、低基数字符串转 `category`、只读需要的列 `usecols`。
  - 避免 O(n²):不要循环 append,先收 list 再一次 `pd.concat`。
  - 大文件分块 `chunksize` 读取;超内存时换 `eval`/`query` 减少中间对象,或用 polars/Dask/Modin 等替代引擎。

  &lt;details&gt;

- **Q5**: 为什么 `SettingWithCopyWarning` 会出现?底层根源是什么?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - 根源:Pandas 索引返回视图还是拷贝**不确定**(取决于 dtype 是否单一、底层 block 布局等)。
  - `df[mask]["col"] = v` 分两步:第一步 `df[mask]` 可能返回临时拷贝,第二步赋值作用在拷贝上,原表不变。
  - Pandas 检测到「你似乎在改一个可能是拷贝的对象」,于是发出警告提醒结果可能不符合预期。
  - 解法:用 `.loc[mask, "col"] = v` 单次完成行+列定位,明确作用在原对象;必要时显式 `.copy()` 表达意图。

  &lt;details&gt;

## 延伸资源

- [Pandas 官方:Group by](https://pandas.pydata.org/docs/user_guide/groupby.html)
- [Pandas 官方:Merge, join, concatenate](https://pandas.pydata.org/docs/user_guide/merging.html)
- [Pandas 官方:Returning a view versus a copy](https://pandas.pydata.org/docs/user_guide/indexing.html#returning-a-view-versus-a-copy)
- [Pandas 官方:Scaling to large datasets](https://pandas.pydata.org/docs/user_guide/scale.html)
- 书籍:《Python for Data Analysis》(Wes McKinney,Pandas 作者所著)

## (留白) 我的理解

> 这一段不强制填。学完后用自己的话复述、记下踩过的坑、和其他知识的连接。AI 写不出这段。

<!-- KNOWLEDGE-IMPORT:END -->
