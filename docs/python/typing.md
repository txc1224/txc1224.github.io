# 类型注解 / 包管理

## 类型注解

```python
from typing import Optional, Union, List, Dict, Tuple, Any
from typing import TypedDict, Protocol, Callable, Generator
from collections.abc import Sequence

# 基础注解
def add(a: int, b: int) -> int: return a + b
def greet(name: str = 'World') -> str: return f'Hello, {name}'

# Optional（可能为 None）
def find_user(id: int) -> Optional[dict]: ...

# Union（多类型）
def process(value: Union[int, str]) -> str: ...
# Python 3.10+ 简写
def process(value: int | str) -> str: ...

# 集合类型
def sort_list(items: list[int]) -> list[int]: ...  # 3.9+
def get_map() -> dict[str, Any]: ...

# TypedDict（结构化字典）
class UserDict(TypedDict):
    name: str
    age: int
    email: str

# Protocol（结构化子类型，类似 Go interface）
class Drawable(Protocol):
    def draw(self) -> None: ...

# Callable
def apply(fn: Callable[[int, int], int], a: int, b: int) -> int:
    return fn(a, b)

# Generator
def counter() -> Generator[int, None, None]:
    i = 0
    while True:
        yield i
        i += 1
```

---

## 包管理

```bash
# pip
pip install requests
pip install requests==2.31.0
pip install -r requirements.txt
pip freeze > requirements.txt
pip list --outdated

# venv（虚拟环境）
python -m venv .venv
source .venv/bin/activate  # Linux/Mac
.venv\Scripts\activate     # Windows
deactivate

# pyproject.toml（现代标准）
```

```toml
[project]
name = "my-project"
version = "1.0.0"
requires-python = ">=3.11"
dependencies = [
    "requests>=2.31",
    "pydantic>=2.0",
]

[project.optional-dependencies]
dev = ["pytest", "ruff", "mypy"]

[tool.ruff]
line-length = 100

[tool.mypy]
strict = true
```

```bash
# uv（推荐，极速包管理器）
uv sync
uv add requests
uv add --dev pytest
uv run python app.py
```
