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
