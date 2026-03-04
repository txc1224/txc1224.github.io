---
title: '函数 / 推导式'
order: 3
---

# 函数 / 推导式

> 函数是 Python 的一等公民，掌握参数机制、装饰器、生成器和推导式是写出 Pythonic 代码的基础。

---

## 参数类型对比表

| 参数类型   | 语法              | 说明                       | 示例          |
| ---------- | ----------------- | -------------------------- | ------------- |
| 位置参数   | `def f(a, b)`     | 按位置传入                 | `f(1, 2)`     |
| 默认参数   | `def f(a, b=10)`  | 有默认值，可省略           | `f(1)`        |
| 关键字参数 | `def f(*, key)`   | `*` 之后强制关键字传入     | `f(key=1)`    |
| 仅位置参数 | `def f(a, /)`     | `/` 之前强制位置传入(3.8+) | `f(1)`        |
| 可变位置   | `def f(*args)`    | 收集为 tuple               | `f(1, 2, 3)`  |
| 可变关键字 | `def f(**kwargs)` | 收集为 dict                | `f(a=1, b=2)` |

```python
# 完整参数顺序：位置 → 默认 → *args → 关键字 → **kwargs
def example(a, b=10, *args, key='default', **kwargs):
    pass

# 仅位置 + 仅关键字
def strict(pos_only, /, normal, *, kw_only):
    pass

strict(1, 2, kw_only=3)       # 正确
strict(pos_only=1, ...)       # TypeError
```

---

## 装饰器

```python
import functools, time

# 基本装饰器
def timer(func):
    @functools.wraps(func)     # 保留原函数的 __name__、__doc__
    def wrapper(*args, **kwargs):
        start = time.perf_counter()
        result = func(*args, **kwargs)
        print(f'{func.__name__} 耗时 {time.perf_counter() - start:.3f}s')
        return result
    return wrapper

# 带参数装饰器（三层嵌套）
def retry(times=3, exceptions=(Exception,)):
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            for i in range(times):
                try:
                    return func(*args, **kwargs)
                except exceptions:
                    if i == times - 1: raise
        return wrapper
    return decorator

@timer
@retry(times=5, exceptions=(ConnectionError,))
def fetch_data(url): ...

# 类装饰器
class Singleton:
    def __init__(self, cls):
        self._cls = cls
        self._instance = None
    def __call__(self, *args, **kwargs):
        if self._instance is None:
            self._instance = self._cls(*args, **kwargs)
        return self._instance

@Singleton
class Database:
    def __init__(self, url): self.url = url
```

---

## 生成器

```python
# 基本生成器 —— yield 逐个产出值
def countdown(n):
    while n > 0:
        yield n
        n -= 1
list(countdown(5))  # [5, 4, 3, 2, 1]

# yield from —— 委托给子生成器
def flatten(nested):
    for item in nested:
        if isinstance(item, list):
            yield from flatten(item)  # 递归展平
        else:
            yield item
list(flatten([1, [2, [3, 4]], 5]))  # [1, 2, 3, 4, 5]

# send —— 向生成器发送值
def accumulator():
    total = 0
    while True:
        value = yield total    # yield 返回 total，接收 send 的值
        if value is None: break
        total += value

gen = accumulator()
next(gen)        # 0（启动生成器）
gen.send(10)     # 10
gen.send(20)     # 30
```

---

## lambda 表达式

```python
# 适用于简短的匿名函数
square = lambda x: x ** 2

# 排序时指定 key
users = [{'name': 'Bob', 'age': 25}, {'name': 'Alice', 'age': 30}]
users.sort(key=lambda u: u['age'])

# 搭配 map / filter
list(map(lambda x: x * 2, [1, 2, 3]))       # [2, 4, 6]
list(filter(lambda x: x > 0, [-1, 0, 1]))   # [1]
```

> 复杂逻辑不要用 lambda，定义具名函数更清晰。

---

## 推导式对比

| 类型         | 语法               | 返回类型    | 惰性求值 |
| ------------ | ------------------ | ----------- | -------- |
| 列表推导式   | `[x for x in ...]` | `list`      | 否       |
| 字典推导式   | `{k: v for ...}`   | `dict`      | 否       |
| ��合推导式   | `{x for x in ...}` | `set`       | 否       |
| 生成器表达式 | `(x for x in ...)` | `generator` | 是       |

```python
# 列表推导式
squares = [x**2 for x in range(10)]
evens = [x for x in range(20) if x % 2 == 0]

# 嵌套推导式（展平二维列表）
matrix = [[1, 2, 3], [4, 5, 6]]
flat = [x for row in matrix for x in row]  # [1,2,3,4,5,6]

# 字典 / 集合推导式
d = {k: v for k, v in zip('abc', [1, 2, 3])}
s = {x % 3 for x in range(10)}  # {0, 1, 2}

# 生成器表达式（大数据集节省内存）
total = sum(x**2 for x in range(10**6))  # 不创建中间列表
```

---

## 常见陷阱

```python
# ❌ 可变默认参数：默认值在定义时创建，所有调用共享
def add(item, lst=[]):
    lst.append(item)
    return lst
add(1)  # [1]
add(2)  # [1, 2] —— 不是 [2]！

# ✅ 用 None 作为哨兵
def add(item, lst=None):
    if lst is None: lst = []
    lst.append(item)
    return lst

# ❌ 闭包陷阱：循环变量绑定的是引用
funcs = [lambda: i for i in range(3)]
[f() for f in funcs]  # [2, 2, 2]

# ✅ 用默认参数捕获当前值
funcs = [lambda i=i: i for i in range(3)]
[f() for f in funcs]  # [0, 1, 2]
```
