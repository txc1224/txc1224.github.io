---
title: '常见陷阱'
order: 7
---

# 常见陷阱

> Python 语法简洁但暗藏陷阱，以下是 12 个最常踩的坑，提前知道能省下大量调试时间。

---

## 陷阱速查表

| 陷阱         | 原因                        | 正确做法                   |
| ------------ | --------------------------- | -------------------------- |
| 可变默认参数 | 默认值在定义时创建一次      | 用 `None` + 函数内初始化   |
| `is` vs `==` | `is` 比较身份，`==` 比较值  | 只用 `is` 比较 `None`      |
| 浅拷贝       | `.copy()` 只复制一层        | 嵌套结构用 `copy.deepcopy` |
| 闭包变量     | 循环变量是引用而非快照      | 用默认参数捕获当前值       |
| GIL          | 多线程无法并行 CPU 密集代码 | CPU 密集用 multiprocessing |
| 字符串拼接   | 循环 `+` 产生大量临时对象   | 用 `join`                  |
| 浮点数精度   | 二进制无法精确表示十进制    | 金额用 `Decimal`           |
| import 循环  | 两个模块互相导入            | 延迟导入或重构             |
| 字典迭代修改 | 迭代时修改字典大小          | 迭代副本或推导式           |
| 类变量共享   | 可变类变量被所有实例共享    | 在 `__init__` 中初始化     |
| for-else     | else 在 no break 时执行     | 理解 else = "no break"     |
| 链式赋值     | `a = b = []` 指向同一对象   | `a, b = [], []`            |

---

## 1. 可变默认参数

```python
# ❌ 所有调用共享同一个列表
def add_item(item, lst=[]):
    lst.append(item)
    return lst
add_item(1)  # [1]
add_item(2)  # [1, 2] —— 不是 [2]！

# ✅ 用 None 作为哨兵值
def add_item(item, lst=None):
    if lst is None: lst = []
    lst.append(item)
    return lst
```

---

## 2. is vs ==

```python
# ❌ 用 is 比较值（CPython 小整数缓存 -5~256）
a, b = 257, 257
a is b   # False（大整数不缓存）
a == b   # True
# ✅ 比较值用 ==，只用 is 比较 None
```

---

## 3. 浅拷贝 vs 深拷贝

```python
import copy
# ❌ 浅拷贝：内层对象仍然共享
matrix = [[1, 2], [3, 4]]
shallow = matrix.copy()
shallow[0][0] = 99
matrix[0][0]  # 99 —— 原列表也被修改！

# ✅ 深拷贝：完全独立
deep = copy.deepcopy(matrix)
```

---

## 4. 闭包变量

```python
# ❌ 所有函数引用同一个 i（最终值 4）
funcs = [lambda: i for i in range(5)]
[f() for f in funcs]  # [4, 4, 4, 4, 4]

# ✅ 用默认参数捕获当前值
funcs = [lambda i=i: i for i in range(5)]
[f() for f in funcs]  # [0, 1, 2, 3, 4]
```

---

## 5. GIL 与多线程

```python
from concurrent.futures import ThreadPoolExecutor, ProcessPoolExecutor
# ❌ CPU 密集用多线程（GIL 导致串行）
with ThreadPoolExecutor() as pool:
    pool.map(cpu_heavy, data)

# ✅ CPU 密集用多进程 / I/O 密集用多线程
with ProcessPoolExecutor() as pool:
    pool.map(cpu_heavy, data)
```

---

## 6. 字符串拼接

```python
# ❌ 循环 + 拼接（O(n^2)）
result = ''
for s in large_list: result += s

# ✅ join（O(n)）
result = ''.join(large_list)
```

---

## 7. 浮点数精度

```python
# ❌ 浮点数运算不精确
0.1 + 0.2 == 0.3  # False

# ✅ 金额用 Decimal / 比较用 math.isclose
from decimal import Decimal
Decimal('0.1') + Decimal('0.2') == Decimal('0.3')  # True
```

---

## 8. import 循环

```python
# ❌ a.py 和 b.py 互相导入 → ImportError
# ✅ 延迟导入
def func_a():
    from b import func_b
    return func_b()

# ✅ TYPE_CHECKING 仅用于类型检查
from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from b import TypeB  # 运行时不执行
```

---

## 9. 字典迭代时修改

```python
# ❌ 迭代时修改字典大小 → RuntimeError
d = {'a': 1, 'b': 2, 'c': 3}
for key in d:
    if d[key] < 2: del d[key]

# ✅ 迭代副本或推导式
for key in list(d.keys()):
    if d[key] < 2: del d[key]
d = {k: v for k, v in d.items() if v >= 2}
```

---

## 10. 类变量共享

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
```

---

## 11. for-else 误解

```python
# ❌ 以为 else 在循环没执行时触发
for item in items:
    if item == target: break
else:
    print('未找到')  # 没有 break 时执行，不是"没循环"时执行
```

---

## 12. 链式赋值

```python
# ❌ 链式赋值指向同一对象
a = b = []
a.append(1)
b  # [1] —— a 和 b 是同一个列表！

# ✅ 分别创建
a, b = [], []
```
