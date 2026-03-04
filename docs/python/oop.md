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
