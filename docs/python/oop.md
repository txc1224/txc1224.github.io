# 面向对象 / 异常处理

## 面向对象

```python
from dataclasses import dataclass, field
from typing import ClassVar

# dataclass（推荐用于数据容器）
@dataclass(order=True, frozen=False)
class Point:
    x: float
    y: float
    label: str = ''
    tags: list = field(default_factory=list)  # ✅ 可变默认值用 field
    _count: ClassVar[int] = 0  # 类变量

    def distance(self) -> float:
        return (self.x**2 + self.y**2) ** 0.5

    def __post_init__(self):
        Point._count += 1

# 继承 & MRO（C3 线性化）
class A: pass
class B(A): pass
class C(A): pass
class D(B, C): pass
D.__mro__  # [D, B, C, A, object]（广度优先）

# 重要的 dunder 方法
class Vector:
    def __init__(self, x, y): self.x, self.y = x, y
    def __repr__(self): return f'Vector({self.x}, {self.y})'
    def __str__(self): return f'({self.x}, {self.y})'
    def __add__(self, other): return Vector(self.x+other.x, self.y+other.y)
    def __len__(self): return 2
    def __getitem__(self, idx): return (self.x, self.y)[idx]
    def __iter__(self): yield self.x; yield self.y
    def __eq__(self, other): return self.x == other.x and self.y == other.y
    def __hash__(self): return hash((self.x, self.y))  # 实现 __eq__ 必须实现 __hash__

# property
class Circle:
    def __init__(self, radius): self._radius = radius

    @property
    def radius(self): return self._radius

    @radius.setter
    def radius(self, value):
        if value < 0: raise ValueError('radius must be non-negative')
        self._radius = value

    @property
    def area(self): return 3.14159 * self._radius ** 2
```

---

## 异常处理

```python
# try / except / else / finally
def read_json(path):
    try:
        with open(path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        raise  # 重新抛出，保留原始 traceback
    except json.JSONDecodeError as e:
        raise ValueError(f'Invalid JSON in {path}') from e  # 异常链
    else:
        # 没有异常才执行
        print('Success')
    finally:
        # 无论如何都执行（清理资源）
        print('Done')

# 自定义异常
class AppError(Exception):
    def __init__(self, message, code=None):
        super().__init__(message)
        self.code = code

class NotFoundError(AppError):
    def __init__(self, resource):
        super().__init__(f'{resource} not found', code='NOT_FOUND')

# 上下文管理器（with 语句）
from contextlib import contextmanager

@contextmanager
def managed_resource():
    resource = acquire()
    try:
        yield resource
    finally:
        release(resource)

# 更简洁的方式：实现 __enter__ / __exit__
class Timer:
    def __enter__(self):
        self.start = time.perf_counter()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.elapsed = time.perf_counter() - self.start
        return False  # 不抑制异常

with Timer() as t:
    do_work()
print(f'Elapsed: {t.elapsed:.3f}s')
```
