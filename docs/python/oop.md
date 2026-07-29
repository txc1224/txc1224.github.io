---
title: '面向对象 / 异常处理'
order: 4
---

# 面向对象 / 异常处理

> Python 的 OOP 灵活而强大，理解类机制、MRO、描述符和上下文管理器，才能写出优雅的面向对象代码。

---

## 类基础

```python
class Animal:
    kingdom = 'Animalia'                 # 类变量

    def __init__(self, name: str, age: int):
        self.name = name                 # 实例变量
        self.age = age

    def speak(self) -> str:
        raise NotImplementedError

    @classmethod
    def from_dict(cls, data: dict):
        return cls(data['name'], data['age'])

    @staticmethod
    def is_valid_age(age: int) -> bool:
        return 0 < age < 200
```

| 方法类型 | 装饰器          | 第一参数 | 访问范围  |
| -------- | --------------- | -------- | --------- |
| 实例方法 | 无              | `self`   | 实例 + 类 |
| 类方法   | `@classmethod`  | `cls`    | 仅类      |
| 静态方法 | `@staticmethod` | 无       | 都不能    |

---

## MRO 与 super()

```python
class A: pass
class B(A): pass
class C(A): pass
class D(B, C): pass
D.__mro__  # (D, B, C, A, object) —— C3 线性化

class B(A):
    def __init__(self):
        super().__init__()  # 沿 MRO 调用下一个类
```

---

## property 与描述符

```python
class Circle:
    def __init__(self, radius: float):
        self._radius = radius

    @property
    def radius(self) -> float:
        return self._radius

    @radius.setter
    def radius(self, value: float):
        if value < 0: raise ValueError('半径不能为负数')
        self._radius = value

    @property
    def area(self) -> float:
        return 3.14159 * self._radius ** 2

# 描述符 —— 可复用的属性验证逻辑
class Validated:
    def __init__(self, min_val=None):
        self.min_val = min_val
    def __set_name__(self, owner, name):
        self.name = name
    def __get__(self, obj, objtype=None):
        return None if obj is None else obj.__dict__.get(self.name)
    def __set__(self, obj, value):
        if self.min_val is not None and value < self.min_val:
            raise ValueError(f'{self.name} 不能小于 {self.min_val}')
        obj.__dict__[self.name] = value

class Product:
    price = Validated(min_val=0)
```

---

## 上下文管理器

```python
import time
from contextlib import contextmanager

class Timer:
    def __enter__(self):
        self.start = time.perf_counter()
        return self
    def __exit__(self, exc_type, exc_val, exc_tb):
        self.elapsed = time.perf_counter() - self.start
        return False

# contextmanager 装饰器更简洁
@contextmanager
def managed_db(url):
    conn = connect(url)
    try:
        yield conn       # yield 前 = __enter__，后 = __exit__
    finally:
        conn.close()
```

---

## dataclass

```python
from dataclasses import dataclass, field

@dataclass(order=True)
class Point:
    x: float
    y: float
    label: str = ''
    tags: list = field(default_factory=list)   # 可变默认值必须用 field

    def distance(self) -> float:
        return (self.x**2 + self.y**2) ** 0.5
```

| 参数     | 默认值 | 作用                    |
| -------- | ------ | ----------------------- |
| `init`   | True   | 自动生成 `__init__`     |
| `repr`   | True   | 自动生成 `__repr__`     |
| `eq`     | True   | 自动生成 `__eq__`       |
| `order`  | False  | 自动生成比较方法        |
| `frozen` | False  | True = 不可变           |
| `slots`  | False  | 使用 `__slots__`(3.10+) |

---

## 特殊方法速查表

| 方法                  | 触发时机    | 示例                 |
| --------------------- | ----------- | -------------------- |
| `__init__`            | 创建实例    | `obj = Cls()`        |
| `__repr__`            | 开发者表示  | `repr(obj)`          |
| `__str__`             | 用户可读    | `print(obj)`         |
| `__eq__` / `__hash__` | 比较 / 哈希 | `a == b` / `hash(a)` |
| `__len__`             | 长度        | `len(obj)`           |
| `__getitem__`         | 索引        | `obj[key]`           |
| `__iter__`            | 迭代        | `for x in obj`       |
| `__call__`            | 调用        | `obj()`              |
| `__enter__/__exit__`  | with        | `with obj as x`      |

---

## 异常处理

```python
import json

def read_json(path: str) -> dict:
    try:
        with open(path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        raise                                        # 重新抛出
    except json.JSONDecodeError as e:
        raise ValueError(f'无效 JSON: {path}') from e  # 异常链
    else:
        print('解析成功')
    finally:
        print('清理完成')

# 自定义异常
class AppError(Exception):
    def __init__(self, message: str, code: str = 'UNKNOWN'):
        super().__init__(message)
        self.code = code
```

---

## 常见陷阱

```python
# ❌ 可变类变量被所有实例共享
class Team:
    members = []
t1, t2 = Team(), Team()
t1.members.append('Alice')
t2.members  # ['Alice'] —— 被污染！

# ✅ 在 __init__ 中初始化
class Team:
    def __init__(self): self.members = []

# ❌ 硬编码父类名（菱形继承时重复调用）
class Child(Parent):
    def __init__(self): Parent.__init__(self)

# ✅ super() 沿 MRO 正确调用
class Child(Parent):
    def __init__(self): super().__init__()
```

<!-- KNOWLEDGE-IMPORT:START -->

## 上下文管理器与 contextlib

## TL;DR

> `with` 语句帮你「进入时做事、退出时收尾」,资源(文件/锁/连接)用它能保证必然释放。

## 背景与动机

打开文件要关、拿锁要放、连数据库要断开 —— 这些「成对的进入/退出」操作,一旦中途抛异常就容易漏掉收尾,造成资源泄漏或死锁。`try/finally` 能写但啰嗦易错。上下文管理器把「进入逻辑」和「退出逻辑」绑在协议里,`with` 一句就能**保证退出动作一定执行**,哪怕中途异常。

工程价值:文件、锁、数据库事务、临时改目录、计时、抑制异常,这些高频场景用 `with` 既安全又清爽,是 Python 资源管理的标准姿势。

## 核心机制

- **协议**:对象实现 `__enter__()`(进入时调用,返回值赋给 `as` 后的变量)和 `__exit__(exc_type, exc_val, exc_tb)`(退出时调用)。
- **`__exit__` 的返回值**:返回 `True` 表示「吞掉」块内抛出的异常;返回 `False`/`None` 则异常继续向上抛。
- **`@contextmanager`**(contextlib):用生成器函数快速写一个上下文管理器 —— `yield` 前是进入逻辑,`yield` 后是退出逻辑,异常会通过 `throw()` 送回到 `yield` 处。
- **常用工具**:`contextlib.closing`(给没有协议的closeable对象包装)、`suppress`(忽略指定异常)、`ExitStack`(动态管理多个上下文)。

## 代码示例

```python
from contextlib import contextmanager, suppress

@contextmanager
def timer(name):
    import time
    start = time.time()
    yield                          # with 块在这里执行
    print(f'{name} 耗时 {time.time()-start:.2f}s')

with timer('计算'):
    sum(range(10**6))

# __exit__ 返回 True 可吞异常
class Suppress:
    def __enter__(self): return self
    def __exit__(self, *exc): return True

with Suppress():
    raise ValueError('不会传出')

with suppress(FileNotFoundError):   # 内置工具,等效
    open('不存在的文件')
```

## 易错点 / 反例

- **手写 `try/finally` 漏收尾**:忘了在 finally 里 close,异常时资源泄漏 —— 这正是 `with` 要解决的。
- **`__exit__` 误吞异常**:返回 `True` 太随意会把真 bug 也吞掉,排查困难;要精确匹配异常类型再吞。
- **生成器式 `@contextmanager` 里 yield 多次**:只能 `yield` 一次,写两次会报 `RuntimeError`。
- **在 `__enter__` 里抛异常**:这样 `__exit__` 不会被调用,进入阶段要尽量少做事、早失败。

## 高频面试题(5 题)

- **Q1**: `with` 语句底层做了什么?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - 调用对象的 `__enter__()`,返回值绑定 `as` 变量
  - 执行 with 块
  - 无论正常结束还是异常,都调用 `__exit__(exc_type, exc_val, exc_tb)`
    &lt;details&gt;

- **Q2**: 如何让 with 块里的异常不向外抛?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - 让 `__exit__` 返回 `True`,表示异常已被处理
  - 或用 `contextlib.suppress(具体异常类型)`
  - 要谨慎,只吞预期内的异常
    &lt;details&gt;

- **Q3**: 用 `@contextmanager` 写一个上下文管理器,关键点?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - 生成器函数只 `yield` 一次,yield 值即 as 变量的值
  - yield 前是 **enter** 逻辑,yield 后是 **exit** 逻辑
  - 块内异常会通过 throw() 送回 yield 处,可用 try/except 捕获处理
    &lt;details&gt;

- **Q4**: 上下文管理器适合哪些场景?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - 成对的资源获取与释放:文件、锁、网络/数据库连接
  - 临时状态切换:改目录、改精度、临时配置
  - 计时、日志、事务提交/回滚
    &lt;details&gt;

- **Q5**: 手动 try/finally 和 with 哪个好?为什么?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - with 更简洁、更不易漏,语义清晰(资源即上下文)
  - try/finally 灵活但啰嗦,易在复杂分支漏掉 finally
  - 协议化后可复用(closing/ExitStack 组合多个资源)
    &lt;details&gt;

## 延伸资源

- [contextlib 官方文档](https://docs.python.org/3/library/contextlib.html)
- [PEP 343(The 'with' Statement)](https://peps.python.org/pep-0343/)
- 书籍: 《Fluent Python》第 15 章

## (留白) 我的理解

> 这一段不强制填。学完后用自己的话复述、记下踩过的坑、和其他知识的连接。AI 写不出这段。

---

## dataclass 入门

## TL;DR

> `@dataclass` 一行注解,自动帮你生成 `__init__`/`__repr__`/`__eq__`,写「纯数据类」零样板。

## 背景与动机

写「只是装数据的类」(坐标、配置、DTO、值对象)时,要手写 `__init__`、`__repr__`、`__eq__`,一堆样板还容易写错。`@dataclass`(PEP 557,Python 3.7+)根据类注解的字段**自动生成这些方法**,让数据类的定义像声明结构体一样简洁。

工程价值:配置对象、API 出入参、领域值对象用 dataclass,既省代码又自带漂亮的 repr/eq,调试和测试都舒服;配合 `frozen=True` 还能当不可变值对象/字典键。

## 核心机制

- **类注解驱动**:类里写 `x: int`、`name: str`,dataclass 据此生成 `__init__(self, x, name)`、`__repr__`、`__eq__`。
- **默认值与 `field()`**:可变默认值(列表/字典)不能直接写,要用 `field(default_factory=list)`;`field(default=..., init=False, repr=False, compare=False)` 精细控制。
- **`__post_init__`**:生成的 `__init__` 末尾会调它,用于派生字段/校验。
- **常用参数**:`frozen=True`(不可变)、`order=True`(生成比较方法)、`eq=False`(只要 repr/init)。
- **dataclasses 工具**:`asdict()` / `astuple()` / `replace()`(拷贝并改字段)/ `fields()`。

## 代码示例

```python
from dataclasses import dataclass, field, replace

@dataclass(frozen=True)
class Point:
    x: float
    y: float
    tags: list[str] = field(default_factory=list, compare=False)

    def dist(self) -> float:
        return (self.x ** 2 + self.y ** 2) ** 0.5

p = Point(3, 4, tags=['a'])
print(p)              # Point(x=3, y=4, tags=['a'])
print(p.dist())       # 5.0
p2 = replace(p, x=0)  # 拷贝并改字段(frozen 也可)
# p.x = 1             # frozen 会报 FrozenInstanceError
```

## 易错点 / 反例

- **可变默认值直接写**:`tags: list = []` 会报 `ValueError`,必须 `field(default_factory=list)`(否则所有实例共享同一个列表)。
- **以为 dataclass 自带校验**:它不做类型/范围校验,校验要写 `__post_init__` 或上 pydantic。
- **`frozen=True` 还想改字段**:会抛 `FrozenInstanceError`,要用 `replace()` 生成新对象。
- **`__post_init__` 里给 frozen 类赋值**:`self.x = ...` 会失败,要 `object.__setattr__(self, 'x', ...)`。

## 高频面试题(5 题)

- **Q1**: `@dataclass` 自动生成了哪些方法?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - `__init__`(按字段顺序)、`__repr__`、`__eq__`
  - 可选:`__lt__`/`__le__`/`__gt__`/`__ge__`(order=True)、`__hash__`(frozen+eq)
  - 不生成 `__str__`(用 `__repr__`)、不做校验
    &lt;details&gt;

- **Q2**: 列表/字典这类可变默认值怎么写?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - 用 `field(default_factory=list)` / `field(default_factory=dict)`
  - 直接写 `= []` 会被 dataclass 拒绝(防止实例间共享)
  - default_factory 每次实例化都新建对象
    &lt;details&gt;

- **Q3**: `__post_init__` 是干什么的?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - 在生成的 `__init__` 末尾被调用
  - 用于派生字段、跨字段校验、依赖其他字段的初始化
  - frozen 类里要改值得用 `object.__setattr__`
    &lt;details&gt;

- **Q4**: dataclass 和 namedtuple / pydantic 怎么选?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - namedtuple:更轻、不可变、是 tuple,适合极简定值
  - dataclass:可变/不可变都行、方法全、3.7+ 标配,通用首选
  - pydantic:要运行时校验/序列化/JSON Schema 时用
    &lt;details&gt;

- **Q5**: 如何让 dataclass 实例可哈希(能当 dict 键)?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - 用 `frozen=True`(且 eq 默认开)生成 `__hash__`
  - 或手动 `unsafe_hash=True`(需确保不可变)
  - 可变 dataclass 默认不可哈希(**hash**=None)
    &lt;details&gt;

## 延伸资源

- [dataclasses 官方文档](https://docs.python.org/3/library/dataclasses.html)
- [PEP 557(Data Classes)](https://peps.python.org/pep-0557/)
- 书籍: 《Fluent Python》第 5 章

## (留白) 我的理解

> 这一段不强制填。学完后用自己的话复述、记下踩过的坑、和其他知识的连接。AI 写不出这段。

---

## 装饰器(函数/类/带参/functools.wraps)

## TL;DR

> 装饰器是「接收可调用对象、返回新可调用对象」的可调用对象,`@deco` 等价于 `func = deco(func)`,在定义时执行。

## 背景与动机

工程里大量「横切关注点」与业务正交:记录日志、计时、鉴权、缓存、重试、注册。若在每个函数体内手写,代码重复且污染核心逻辑。

装饰器让你**在不修改原函数源码的前提下,给它包裹一层额外行为**。这依赖 Python 的两个前提:函数是一等公民(可当参数传递、当返回值返回)、闭包(内层函数能记住外层变量)。框架靠它实现声明式 API——Flask 的 `@app.route`、测试的 `@pytest.fixture`、`functools.lru_cache`,本质都是「定义函数时顺手登记/增强一下」。没有装饰器,这些都会变成繁琐的样板代码。

## 核心机制

**1. 本质就是函数替换。** 下面两行完全等价(PEP 318 引入 `@` 语法糖):

```python
@deco
def f(): ...      # 等价于  def f(): ...; f = deco(f)
```

**关键:装饰器在「函数定义时」就执行,不是在调用时。** 模块导入即触发,这是「注册类装饰器」(如路由)能工作的根本原因。

**2. 三层结构对应三种形态:**

- **简单装饰器**(无参):`deco` 接收 `func`,返回 `wrapper`。一层嵌套。
- **带参装饰器**:`@deco(arg)` 先用 `arg` 调用 `deco`,拿到真正的装饰器,再用它装饰 `func`。所以是**两层**嵌套:`deco(arg) -> decorator -> wrapper`。最容易绕晕的地方——比简单装饰器多包一层。
- **类装饰器**:两种含义。(a) 用类当装饰器:`__init__` 收 `func`,`__call__` 当 `wrapper`,适合需要维护状态的装饰器;(b) 装饰类的装饰器:接收一个类、返回(修改后的)类。

**3. `functools.wraps` 修元数据。** `wrapper` 是另一个函数,默认会盖住原函数的 `__name__`、`__doc__`、`__module__`、`__wrapped__`。这会让日志、调试、自省、装饰器叠放全都错乱。`@wraps(func)` 把这些属性从原函数拷贝到 `wrapper`,是写装饰器的**标配**,漏写是最常见的低级错误。

**4. `\*args, **kwargs`透传。**`wrapper`要适配任意签名,统一写成`def wrapper(*args, \*\*kwargs): return func(*args, \*\*kwargs)`。

## 代码示例

```python
import functools, time

# 1) 简单装饰器:计时
def timer(func):
    @functools.wraps(func)          # 保留 __name__/__doc__,标配
    def wrapper(*args, **kwargs):
        start = time.perf_counter()
        result = func(*args, **kwargs)
        print(f"{func.__name__} 耗时 {time.perf_counter()-start:.4f}s")
        return result
    return wrapper

# 2) 带参装饰器:两层嵌套,外层收参数
def repeat(times):
    def decorator(func):            # 这层才是真正的装饰器
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            for _ in range(times):
                result = func(*args, **kwargs)
            return result
        return wrapper
    return decorator

# 3) 类作为装饰器:可维护状态(计数)
class CountCalls:
    def __init__(self, func):
        functools.update_wrapper(self, func)
        self.func = func
        self.count = 0
    def __call__(self, *args, **kwargs):
        self.count += 1
        return self.func(*args, **kwargs)

@repeat(3)
@timer
def greet(name):
    print(f"hi {name}")
```

## 易错点 / 反例

**1. 漏写 `@functools.wraps`,元数据被覆盖**

```python
def deco(func):
    def wrapper(*a, **k):
        return func(*a, **k)
    return wrapper

@deco
def add(a, b):
    """加法"""
    return a + b

print(add.__name__)   # 'wrapper',不是 'add'!文档、栈追踪、日志全乱
```

叠放多个装饰器、用 `inspect`、或框架按名字路由时,这个 bug 极难排查。永远加 `@wraps(func)`。

**2. 带参装饰器少包一层,把参数当 func**

```python
def repeat(times):                 # 错!少了一层
    def wrapper(*a, **k):
        for _ in range(times):     # times 此时其实是被装饰的函数
            func(*a, **k)          # NameError: func 未定义
    return wrapper
```

带参装饰器必须是「参数 → 装饰器 → wrapper」三层。判断口诀:`@deco` 不带括号是一层嵌套,`@deco(...)` 带括号是两层。

**3. wrapper 忘了 `return`,吞掉返回值**

```python
def deco(func):
    @functools.wraps(func)
    def wrapper(*a, **k):
        func(*a, **k)              # 错!没 return,被装饰函数返回值变 None
    return wrapper
```

纯日志装饰器很容易漏 `return`,导致原函数的返回值丢失。

**4. 误以为装饰器在调用时才执行**

```python
@register    # 定义这一行就执行了 register(func),不是等 foo() 被调
def foo(): ...
```

导入模块即触发装饰。把有副作用(连库、起线程)的逻辑写进装饰器顶层,会导致 import 变慢甚至失败。

**5. 装饰器叠放顺序搞反**

```python
@A
@B
def f(): ...   # 等价 f = A(B(f)):B 先包(离函数近),A 后包
```

执行顺序是「装饰自下而上,调用自上而下」。对顺序敏感的叠放(如先鉴权再计时)必须想清楚谁在内层。

## 高频面试题(5 题)

- **Q1**: 装饰器的本质是什么?`@deco` 语法糖等价于什么?何时执行?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - 本质:接收可调用对象并返回新可调用对象的可调用对象(通常是高阶函数)。
  - 等价:`@deco` + `def f()` 等价于 `def f()` 后接 `f = deco(f)`,名字 `f` 被重新绑定。
  - 执行时机:在**函数定义时**(模块导入时)执行一次,不是每次调用时。
  - 依赖前提:函数是一等公民 + 闭包。

  &lt;details&gt;

- **Q2**: 为什么要用 `functools.wraps`?不写会有什么问题?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - 作用:把被装饰函数的 `__name__`、`__doc__`、`__module__`、`__wrapped__` 等元数据拷贝到 wrapper。
  - 不写的后果:wrapper 盖住原函数元数据,`__name__` 变成 `'wrapper'`。
  - 影响:帮助文档、栈追踪、日志、自省(`inspect`)、按名字路由的框架、装饰器叠放全部出错。
  - 结论:写装饰器的标配,几乎必须加。

  &lt;details&gt;

- **Q3**: 带参装饰器和无参装饰器结构上有何区别?为什么带参的要多一层?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - 无参:`deco(func) -> wrapper`,一层嵌套。
  - 带参:`deco(arg) -> decorator -> wrapper`,两层嵌套。
  - 原因:`@deco(arg)` 是先用 `arg` 调用 `deco`,其**返回值**才是真正的装饰器,再拿它装饰函数。多的一次调用就是多出来的一层。
  - 口诀:带括号两层,不带括号一层。

  &lt;details&gt;

- **Q4**: 如何用类实现装饰器?相比函数实现有什么优势?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - 实现:类定义 `__init__(self, func)` 接收被装饰对象,`__call__(self, *args, **kwargs)` 作为 wrapper;实例即装饰后的可调用对象。
  - 记得用 `functools.update_wrapper(self, func)` 拷贝元数据(实例上不能用 `@wraps`)。
  - 优势:类有实例属性,天然适合维护状态(如调用计数、缓存);逻辑复杂时比多层闭包更可读、可拆方法。
  - 注意:被类装饰器包装的对象是实例而非函数,某些依赖 `inspect.isfunction` 的代码需注意。

  &lt;details&gt;

- **Q5**: 多个装饰器叠放时,执行顺序是怎样的?举例说明。
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - `@A @B def f` 等价于 `f = A(B(f))`。
  - 装饰(包裹)顺序:自下而上——`B` 先包 `f`,`A` 再包 `B(f)`,离函数越近越先执行装饰。
  - 调用(运行时)顺序:自上而下——调 `f()` 实际先进入 `A` 的 wrapper,再进 `B`,最后到原函数。
  - 应用:顺序敏感场景(先鉴权再计时、先缓存再校验)要据此安排叠放次序。

  &lt;details&gt;

## 延伸资源

- [functools.wraps 官方文档](https://docs.python.org/3/library/functools.html#functools.wraps)
- [PEP 318 — Decorators for Functions and Methods](https://peps.python.org/pep-0318/)
- [Glossary — decorator](https://docs.python.org/3/glossary.html#term-decorator)
- 书籍:《Fluent Python》第 9 章(装饰器与闭包,讲透变量作用域与 `nonlocal`)

## (留白) 我的理解

> 这一段不强制填。学完后用自己的话复述、记下踩过的坑、和其他知识的连接。AI 写不出这段。

---

## 迭代器与生成器 yield / yield from

## TL;DR

> 生成器是「写成像函数的迭代器」,`yield` 让它边算边给、惰性产出不占内存。

## 背景与动机

处理大文件、无限序列、流式数据时,「一次性算出整个列表」会爆内存。生成器把「计算」和「遍历」解耦:**只在被问到时才算下一个值**,内存占用是 O(1) 而不是 O(n)。这是 Python 处理大数据的基石,`for` 循环、`map`、管道式数据处理都建立其上。

工程价值:日志逐行读、分页拉取 API、无限数据流(实时事件、传感器)都靠生成器,一行 `for x in gen` 就能流式跑完而不撑爆内存。

## 核心机制

- **迭代器协议**:对象实现 `__iter__()`(返回自身)和 `__next__()`(给下一个,抛 `StopIteration` 结束)。`for` 循环本质是反复调 `next()`。
- **生成器函数**:函数体里出现 `yield` 就变生成器。调用它**不会立刻执行**,而是返回一个生成器对象;每次 `next()` 跑到下一个 `yield` 吐出值并挂起,记住现场。
- **`yield from`**(PEP 380):把产出委托给子生成器,等价于 `for x in subgen: yield x`,但能双向传递值和异常,写协程/管道时必备。
- **惰性求值**:值是「算出来」不是「存起来」,所以可以表示无限序列。

## 代码示例

```python
def read_lines(path):
    with open(path) as f:
        for line in f:      # 逐行惰性产出,不读整个文件
            yield line.rstrip()

def chain(*iters):           # yield from 委托子迭代器
    for it in iters:
        yield from it

for line in chain(read_lines('a.log'), read_lines('b.log')):
    print(line)

# 生成器表达式(更简洁)
squares = (x * x for x in range(10**9))  # 不占内存
print(next(squares))  # 0
```

## 易错点 / 反例

- **生成器只能消费一次**:`g = (x for x in range(3))`,遍历完再 `list(g)` 得 `[]` —— 它已被耗尽。
- **`return` 提前终止**:生成器里 `return` 会抛 `StopIteration`,后续 `yield` 不再执行。
- **在生成器外套 list 失去惰性**:`list(read_lines(...))` 又把整个文件读进内存,白搭。
- **`yield from` 不是语法糖**那么简单:它还处理了 `send()` / `throw()` / `close()` 的转发,手写 `for x in sub: yield x` 不等价(协程场景会出错)。

## 高频面试题(5 题)

- **Q1**: 生成器函数和普通函数有什么区别?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - 调用生成器函数返回生成器对象,不立刻执行函数体
  - 每次 `next()` 执行到下一个 `yield` 吐出值并挂起,保留局部状态
  - 惰性求值,内存 O(1),可表示无限序列
    &lt;details&gt;

- **Q2**: 迭代器和可迭代对象是一回事吗?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - 可迭代对象只需 `__iter__()` 返回迭代器(如 list)
  - 迭代器还要 `__next__()`,且有状态(记住遍历位置)
  - list 可迭代但不是迭代器;生成器既是可迭代对象也是迭代器
    &lt;details&gt;

- **Q3**: 为什么生成器遍历一次就空了?怎么复用?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - 生成器有状态,耗尽后 `next()` 抛 `StopIteration`
  - 复用需重新调用生成器函数创建新对象
  - 或一开始就 `list()` 物化(但失去惰性)
    &lt;details&gt;

- **Q4**: `yield from` 解决了什么问题?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - 简化「把子生成器的值原样转发」的样板
  - 正确处理 `send()`、`throw()`、`close()` 的传递
  - 是协程/多层管道组合的关键语法
    &lt;details&gt;

- **Q5**: 用生成器实现斐波那契无限序列,怎么写?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - `a, b = 0, 1` 循环 `yield a; a, b = b, a+b`
  - 无限 `while True`,调用方用 `next()` / `islice` 取前 N 个
  - 体现惰性:可以无限,不用先算好存着
    &lt;details&gt;

## 延伸资源

- [Python 官方教程:Generators](https://docs.python.org/3/tutorial/classes.html#generators)
- [PEP 255(Simple Generators)](https://peps.python.org/pep-0255/) / [PEP 380(yield from)](https://peps.python.org/pep-0380/)
- 书籍: 《Fluent Python》第 14、16 章

## (留白) 我的理解

> 这一段不强制填。学完后用自己的话复述、记下踩过的坑、和其他知识的连接。AI 写不出这段。

---

## 常用魔术方法(**str**/**eq**/**iter**/**getitem** 等)

## TL;DR

> 魔术方法是 Python 数据模型的钩子,让自定义对象获得内置语法行为。

## 背景与动机

内置类型(`list`、`str`、`dict`)能用 `len()`、`for`、`[]`、`==`、`+` 这些统一语法,靠的不是语法特权,而是它们实现了一组**双下划线方法(dunder / magic method)**。Python 把"对象如何响应内置操作"这件事协议化:只要你实现对应的魔术方法,自定义类就能像内置类型一样被 `len()`、被迭代、被下标访问、被打印、被比较。

这把"语言的语法"和"对象的语义"解耦了——框架作者可以让 `Vector + Vector`、`len(collection)`、`for row in table:` 都有自然含义,极大提升 API 的表达力与一致性。这也是《Fluent Python》开篇就讲"数据模型"的原因。

## 核心机制

解释器遇到内置语法时,会在**类**上查找对应的魔术方法并调用(对隐式调用,通常绕过实例字典直接查类,见数据模型文档)。常用分组:

- **字符串表示**:`__repr__`(给开发者,尽量 `eval` 可行)、`__str__`(给用户,缺省回退到 `__repr__`)。
- **比较与哈希**:`__eq__`、`__lt__` 等;定义 `__eq__` 后默认 `__hash__` 会被置为 `None`(对象变为不可哈希),需显式保留。
- **容器协议**:`__len__`、`__getitem__`、`__setitem__`、`__contains__`。
- **迭代协议**:`__iter__`(返回迭代器)、`__next__`(推进并抛 `StopIteration` 结束);只实现 `__getitem__` 的旧式序列也能被 `for` 按下标迭代。
- **可调用与上下文**:`__call__`(对象当函数用)、`__enter__`/`__exit__`(with 协议)。
- **数值运算**:`__add__`、`__mul__` 等运算符重载,反向版本 `__radd__`、原地版本 `__iadd__`。

要点:**魔术方法应交给解释器隐式触发**(`len(x)` 而非 `x.__len__()`),代码可读且享受实现层面的优化。

## 代码示例

```python
class Deck:
    def __init__(self, cards):
        self._cards = list(cards)

    def __len__(self):                # 支持 len(deck)
        return len(self._cards)

    def __getitem__(self, i):         # 支持 deck[0]、切片、for 迭代
        return self._cards[i]

    def __repr__(self):               # 给开发者的无歧义表示
        return f"Deck({self._cards!r})"

    def __eq__(self, other):          # 支持 == 比较
        return isinstance(other, Deck) and self._cards == other._cards

d = Deck(["A", "K", "Q"])
print(len(d), d[1], list(d))          # 3 K ['A', 'K', 'Q']
```

## 易错点 / 反例

**坑 1:定义了 `__eq__` 却忘了 `__hash__`,对象变得不能放进 set/dict。**

```python
class P:
    def __eq__(self, o):
        return True
# P() in {}  # TypeError: unhashable type
# 修复:显式保留哈希
class P2:
    def __eq__(self, o):
        return True
    __hash__ = object.__hash__
```

**坑 2:直接调用魔术方法而不是用内置语法。**

```python
d.__len__()   # 不推荐,绕过了协议
len(d)        # 推荐:语义清晰,且 CPython 对内置类型有优化
```

**坑 3:`__str__` / `__repr__` 职责颠倒。**
`__repr__` 应该精确、面向调试(理想是 `eval(repr(x)) == x`);`__str__` 面向最终用户可读。只实现一个时优先 `__repr__`,因为它是回退项。

**坑 4:`__eq__` 不做类型检查,与无关对象比较时抛错或误判**(应 `isinstance` 判断或返回 `NotImplemented` 让 Python 尝试反向比较)。

**坑 5:`__iter__` 返回 `self` 却又实现 `__next__`,导致同一个迭代器被多处 for 共享、状态错乱**——容器应每次返回新迭代器。

## 高频面试题(5 题)

- **Q1**: `__str__` 和 `__repr__` 有什么区别?只实现一个该选谁?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - `__repr__` 面向开发者,要求无歧义、理想可被 `eval` 还原;交互式环境和 `repr()` 用它。
  - `__str__` 面向用户,强调可读性;`print()`、`str()` 用它。
  - `__str__` 缺省时回退到 `__repr__`,所以只实现一个优先 `__repr__`。

  &lt;details&gt;

- **Q2**: 为什么自定义类定义了 `__eq__` 后,放进 `set` 会报 `unhashable type`?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - Python 数据模型规定:类一旦定义 `__eq__` 而没定义 `__hash__`,`__hash__` 会被自动置为 `None`。
  - 目的是避免"相等但哈希不同"破坏 set/dict 的不变量(可变对象不应有默认哈希)。
  - 需要哈希时显式写 `__hash__ = object.__hash__` 或自定义。

  &lt;details&gt;

- **Q3**: 实现 `for x in obj:` 有哪两种方式?区别是什么?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - 新式:实现 `__iter__` 返回一个迭代器(迭代器自身实现 `__next__`,结束抛 `StopIteration`)。
  - 旧式序列协议:只实现 `__getitem__`,解释器从 0 开始递增下标直到 `IndexError`。
  - 优先 `__iter__`,更通用且能支持无限/惰性序列。

  &lt;details&gt;

- **Q4**: `__getitem__` 一个方法为什么能同时支持下标、切片和迭代?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - `d[0]` 传入整数下标,`d[1:3]` 传入 `slice` 对象,`__getitem__` 都能接收。
  - 只实现 `__getitem__` 时,`for` 会退化为旧式序列协议,从 0 递增取到 `IndexError`。
  - 内部直接转发给 `self._cards[i]` 即可,委托给底层列表。

  &lt;details&gt;

- **Q5**: 解释器对魔术方法的调用和普通方法调用有何不同?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - 对隐式触发的魔术方法,解释器在**类**上查找而非实例字典(对新式类绕过 `__getattribute__` 的常规路径)。
  - 因此把 `__len__` 赋值给实例属性通常不会被 `len()` 识别,要定义在类上。
  - 应该用内置语法 `len(x)` 触发,而不是手动 `x.__len__()`。

  &lt;details&gt;

## 延伸资源

- [Python 数据模型(官方文档)](https://docs.python.org/3/reference/datamodel.html)
- 《Fluent Python》第 1 章:Python 数据模型

## (留白) 我的理解

> 这一段不强制填。学完后用自己的话复述、记下踩过的坑、和其他知识的连接。AI 写不出这段。

---

## 方法解析顺序 MRO 与 super

## TL;DR

> MRO 用 C3 线性化确定方法查找顺序;super() 沿该顺序把调用委托给"下一个"。

## 背景与动机

单继承里方法查找很直观:从子类一路向上找到第一个定义该方法的类。但 Python 支持**多重继承**,一旦出现"菱形继承"(两个父类又共同继承自同一祖先),"下一个类是谁"就不再显然。

如果没有一套确定、可预测的查找规则,同名方法到底执行哪一份、初始化到底走哪条链就会变成玄学,大型框架(如 Django 的 Mixin、抽象基类)将无法可靠协作。MRO 解决的就是:**在多重继承下给出一个单调、一致的线性顺序**;super() 则提供一种**不写死父类名、顺着这个顺序"把接力棒传给下一家"**的调用方式,让多个协作的父类都能被正确初始化。

## 核心机制

Python 自 2.3 起使用 **C3 线性化(C3 Linearization)** 算法计算 MRO(见官方 MRO 文档)。它满足三条性质:

1. **本地优先**:子类一定排在父类前面。
2. **单调性**:保持每个类自身声明的继承顺序(`class C(B, A)` 中 B 在 A 前)。
3. **一致性**:父类之间原有的相对顺序在子类 MRO 中不被打破。

查看顺序用 `类名.__mro__` 或 `类名.mro()`。

关键认知:**`super()` 不是"调用父类",而是"调用 MRO 中当前类的下一个类"**。在多重继承里,这个"下一个"可能并不是声明中的直接父类。`super()` 的常见形式:

- `super().method(...)`:零参形式,编译器自动填充当前类与 `self`(依赖 `__class__` 闭包单元)。
- `super(CurrentClass, self)`:Python 2 风格,显式给出"从谁的 MRO 的哪一位之后开始找"。

正因为 super 沿 MRO 链推进,协作式多重继承要求**链上每个类的 `__init__` 都用 `super().__init__(...)` 继续往下传,并接受透传参数**(通常用 `**kwargs`),否则链条会在某个"不调 super"的类处断掉。

## 代码示例

```python
class A:
    def who(self):
        print("A")

class B(A):
    def who(self):
        print("B", end=" -> ")
        super().who()        # 沿 MRO 把调用传给下一个

class C(A):
    def who(self):
        print("C", end=" -> ")
        super().who()

class D(B, C):               # 菱形:B、C 都继承 A
    def who(self):
        print("D", end=" -> ")
        super().who()

print(D.__mro__)             # D, B, C, A, object
D().who()                    # D -> B -> C -> A(注意 C 先于 A)
```

## 易错点 / 反例

**坑 1:把 super 当成"直接父类",在多重继承下用错顺序。**
`class D(B, C)` 时,`B` 里的 `super()` 的下一个其实是 `C` 而不是 `A`。如果脑子里只有"super=父类",就会困惑为什么 `C` 的方法被执行了。

**坑 2:协作链中有一个类不调 super,导致链条断裂。**

```python
class Base:
    def __init__(self, **kw):
        super().__init__(**kw)

class Mixin:
    def __init__(self, **kw):
        # 错误:忘记调用 super().__init__(**kw)
        self.extra = 1

class Child(Base, Mixin):
    pass

# Child() 时 Base 调 super 会走到 Mixin,
# 但 Mixin 不再往下传,object 之前的链路就此中断。
```

**坑 3:硬编码父类名而不是用 super。**

```python
class Sub(Base):
    def __init__(self):
        Base.__init__(self)   # 脆弱:改父类名、加 Mixin 时全要改
```

一旦改成多重继承或调整继承结构,硬编码调用就会重复初始化或漏初始化。

**坑 4:`super().**init**(**kwargs)` 时参数不透传\*\*,链上后面的类拿不到它需要的参数。

## 高频面试题(5 题)

- **Q1**: 什么是 MRO?Python 用什么算法计算它?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - MRO(Method Resolution Order)是多重继承下解释器查找属性/方法的线性顺序。
  - Python 2.3 起用 **C3 线性化**算法,保证本地优先、单调性、继承顺序一致。
  - 用 `类名.__mro__` 或 `类名.mro()` 查看。

  &lt;details&gt;

- **Q2**: `super()` 和"直接调用父类方法"有什么本质区别?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - `super()` 调的是 **MRO 中当前类的"下一个"**,不一定是声明的直接父类(多重继承下尤其明显)。
  - 硬编码 `Parent.method(self)` 写死了目标类,改继承结构时易重复/漏调用。
  - super 支持协作式多重继承,让链上每个类的方法各执行一次。

  &lt;details&gt;

- **Q3**: 菱形继承 `class D(B, C)`,且 `B`、`C` 都继承 `A`,`D().method()` 的查找顺序是什么?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - MRO 为 `D -> B -> C -> A -> object`。
  - 先在 D 找,再 B,再 C,最后 A,object 兜底。
  - 因此 B 中 `super()` 的"下一个"是 C 而非 A。

  &lt;details&gt;

- **Q4**: 为什么在协作式多重继承中,每个 `__init__` 都要调 `super().__init__()` 并透传参数?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - super 沿 MRO 链推进,任何一环不调 super,链条就在该处断掉,后续类的初始化被跳过。
  - 各父类 `__init__` 签名不同,需用 `**kwargs` 透传并各自取出所需参数。
  - 最末端会到达 `object.__init__`,它不接受多余参数,所以链上类要"消费"掉自己的参数。

  &lt;details&gt;

- **Q5**: 零参 `super()` 在 Python 3 里是如何知道当前类和实例的?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - 编译器为方法自动创建 `__class__` 闭包单元引用当前类。
  - 零参 `super()` 等价于 `super(__class__, <首参 self>)`。
  - 因此它依赖方法定义在类体内;把函数摘出来单独调用会失去 `__class__` 而报错。

  &lt;details&gt;

## 延伸资源

- [super() 官方文档](https://docs.python.org/3/library/functions.html#super)
- [Python 术语表:method resolution order](https://docs.python.org/3/glossary.html#term-method-resolution-order)
- [Python 2.3 MRO(C3)官方说明](https://www.python.org/download/releases/2.3/mro/)
- 《Fluent Python》第 14 章:继承与 Mixin 实践

## (留白) 我的理解

> 这一段不强制填。学完后用自己的话复述、记下踩过的坑、和其他知识的连接。AI 写不出这段。

---

## property 与描述符

## TL;DR

> 描述符是实现了 `__get__/__set__/__delete__` 的对象;property 是它最常用的现成实现,用于把方法伪装成属性。

## 背景与动机

Python 鼓励直接读写属性(`obj.x = 1`),简单直白。但工程里常需要在「读/写属性」这个动作上附加逻辑:

- **校验**:`age` 不能为负数、`price` 必须大于 0。
- **惰性计算**:`area` 由 `width * height` 现算,不该存成冗余字段。
- **兼容重构**:以前公开属性,后来要加逻辑,又不想改成 `get_age()/set_age()` 破坏调用方。

直接暴露属性无法插入校验;写一对 `get/set` 方法又破坏了 Python 简洁的访问习惯。描述符协议正是语言层给出的答案:**拦截「属性存取」这个语法动作,转而执行你定义的方法**。`property` 就是内置的描述符类,让你用最小的成本把方法伪装成属性,既不破坏调用方习惯,又能插入任意逻辑。

## 核心机制

**描述符协议**:任何一个类,只要定义了 `__get__`、`__set__`、`__delete__` 三者之一,它的实例就是描述符。当这个实例作为**类的属性**出现时,对它的访问会被协议接管:

- `obj.attr` → 若 `attr` 是描述符,调用 `type(obj).attr.__get__(obj, type)`
- `obj.attr = v` → 若 `attr` 定义了 `__set__`,调用 `__set__(obj, v)`,**而不是**塞进 `obj.__dict__`

关键区分(理解属性查找顺序的前提):

- **数据描述符**:同时定义了 `__get__` 和 `__set__`(或 `__delete__`)。优先级**最高**,会覆盖实例字典 `obj.__dict__` 里的同名键。`property` 默认有 `setter` 时报错,本质是数据描述符。
- **非数据描述符**:只有 `__get__`。实例字典里的同名属性**优先**于它。普通函数(方法)就是非数据描述符——这正是「实例能遮蔽方法」「`obj.method` 每次新建 bound method」的原因。

属性查找的完整顺序(简化):类型(及 MRO)里的**数据描述符** → 实例 `__dict__` → 类型(及 MRO)里的**非数据描述符 / 普通类属性** → `__getattr__` 兜底。

`property` 的本质:`property(fget, fset, fdel, doc)` 是一个数据描述符类,`@property` 是语法糖;`@x.setter`、`@x.deleter` 返回一个**新的** property 对象替换原属性。存储上,真正的值要另起名字(如 `self._age`)放进实例字典,否则 `__set__` 里写 `self.age = v` 会无限递归。

## 代码示例

```python
class Temperature:
    def __init__(self, celsius: float):
        self.celsius = celsius  # 走 setter,集中校验

    @property
    def celsius(self) -> float:
        return self._celsius  # 真实值存在 _celsius,避免递归

    @celsius.setter
    def celsius(self, value: float) -> None:
        if value < -273.15:
            raise ValueError("低于绝对零度")
        self._celsius = value

    @property
    def fahrenheit(self) -> float:  # 惰性计算,无冗余字段
        return self._celsius * 9 / 5 + 32

# 手写一个数据描述符,做通用类型校验
class Positive:
    def __set_name__(self, owner, name):  # 3.6+,自动拿到属性名
        self.name = name
    def __get__(self, obj, objtype=None):
        if obj is None:      # 通过类访问时返回描述符自身
            return self
        return obj.__dict__[self.name]
    def __set__(self, obj, value):
        if value <= 0:
            raise ValueError(f"{self.name} 必须为正数")
        obj.__dict__[self.name] = value

class LineItem:
    price = Positive()   # 描述符实例是「类属性」
    def __init__(self, price):
        self.price = price
```

## 易错点 / 反例

**1. setter 里写同名属性 → 无限递归**

```python
class A:
    @property
    def x(self):
        return self._x
    @x.setter
    def x(self, v):
        self.x = v          # 错!又触发了 setter,RecursionError
```

应写 `self._x = v`,把真实值存到另一个名字。

**2. 只写 `@property` 不写 setter,却以为能赋值**

```python
t = Temperature(25)
t.fahrenheit = 100          # AttributeError: can't set attribute
```

只读 property 是数据描述符但没有 `__set__`,赋值会被拒绝。要么加 setter,要么明确这就是只读。

**3. 用可变对象做描述符/类属性,被所有实例共享**

描述符实例是**类属性**,所有实例共享同一个描述符对象。若把数据存到描述符自身(`self.value = ...`)而非 `obj.__dict__[name]`,多个实例会互相覆盖——这正是上面用 `obj.__dict__` 存值的原因。

**4. 实例字典遮蔽不了数据描述符**

```python
li = LineItem(10)
li.__dict__['price'] = -999   # 试图绕过校验
print(li.price)               # 仍走描述符 __get__,得不到 -999
```

数据描述符优先级高于实例字典,想绕过校验这条路走不通(这是特性,但若不理解会困惑「赋值没生效」)。

**5. 通过类访问描述符拿到的是 `None` 版本的 `__get__`**

`LineItem.price` 触发 `__get__(None, LineItem)`,若不处理 `obj is None` 直接 `obj.__dict__` 会 `AttributeError`。所以 `__get__` 里要判断:通过类访问时通常 `return self`。

## 高频面试题(5 题)

- **Q1**: 什么是描述符协议?数据描述符和非数据描述符的区别是什么?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - 描述符:实现了 `__get__` / `__set__` / `__delete__` 之一的对象,作为类属性时拦截属性存取。
  - 数据描述符:同时有 `__get__` 和 `__set__`(或 `__delete__`),优先级高于实例 `__dict__`,如 `property`。
  - 非数据描述符:只有 `__get__`,实例字典同名属性优先,如普通函数(方法)、`staticmethod`、`classmethod`。
  - 区别决定了属性查找顺序,是「实例能否遮蔽类属性」的关键。

  &lt;details&gt;

- **Q2**: Python 的属性查找顺序(以 `obj.attr` 为例)是怎样的?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - 在类型及其 MRO 中查找:若是**数据描述符**,调用其 `__get__`,结束。
  - 否则查实例 `__dict__`,命中则返回。
  - 否则回到类型/MRO:若是**非数据描述符**调用 `__get__`,若是普通类属性直接返回。
  - 都没找到则调用 `__getattr__` 兜底;再没有则抛 `AttributeError`。
  - 核心口诀:数据描述符 > 实例字典 > 非数据描述符 > `__getattr__`。

  &lt;details&gt;

- **Q3**: 为什么 property 的 setter 里不能再写 `self.属性名`?正确的存储方式是什么?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - `self.属性名 = v` 会再次触发该数据描述符的 `__set__`,造成无限递归 → `RecursionError`。
  - 正确做法:把真实值存到另一个名字,约定用 `self._属性名`(单下划线表示内部实现)。
  - getter 里读 `self._属性名`,setter 里写 `self._属性名`,property 只做拦截与校验。
  - 真实数据落在实例 `__dict__` 的 `_属性名` 键上,描述符本身不存数据。

  &lt;details&gt;

- **Q4**: `__set_name__` 是干什么的?解决了描述符的什么痛点?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - `__set_name__(self, owner, name)` 在描述符被赋为类属性、类创建完成时由解释器自动调用(Python 3.6+,PEP 487)。
  - 痛点:以前描述符不知道自己在类里叫啥名字,只能让调用方重复写 `price = Positive('price')`,冗余且易写错。
  - 有了它,描述符能自动拿到属性名,用于报错提示和作为 `obj.__dict__` 的键。
  - 是 ORM(如 Django/SQLAlchemy 字段)实现声明式模型的基础。

  &lt;details&gt;

- **Q5**: 描述符有哪些实际应用场景?举两三个工程例子。
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - 属性校验/类型检查:字段赋值时统一校验(如 `Positive`、`Typed` 描述符)。
  - ORM 字段映射:`Model.field` 读写时转成对底层行/查询的操作。
  - 惰性求值与缓存:首次访问才计算并缓存(如 `functools.cached_property`,注意它是非数据描述符,可被实例字典遮蔽以实现缓存)。
  - 实现 `property`、`staticmethod`、`classmethod`、方法绑定本身——这些语言特性全建立在描述符之上。

  &lt;details&gt;

## 延伸资源

- [Descriptor HowTo Guide(官方,必读)](https://docs.python.org/3/howto/descriptor.html)
- [property 内置函数文档](https://docs.python.org/3/library/functions.html#property)
- [Data Model — Descriptors](https://docs.python.org/3/reference/datamodel.html#descriptors)
- [PEP 487 — `__set_name__`](https://peps.python.org/pep-0487/)
- 书籍:《Fluent Python》第 20 章(描述符讲得最透的章节之一)

## (留白) 我的理解

> 这一段不强制填。学完后用自己的话复述、记下踩过的坑、和其他知识的连接。AI 写不出这段。

<!-- KNOWLEDGE-IMPORT:END -->
