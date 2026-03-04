---
title: '基础数据类型'
order: 2
---

# 基础数据类型

> Python 一切皆对象，理解可变与不可变、值类型与引用类型是避坑的关键。

---

## 数据类型分类

| 类型        | 可变性 | 有序     | 可哈希 | 典型用途             |
| ----------- | ------ | -------- | ------ | -------------------- |
| `int`       | 不可变 | -        | 是     | 整数计算             |
| `float`     | 不可变 | -        | 是     | 浮点计算             |
| `str`       | 不可变 | 是       | 是     | 文本处理             |
| `tuple`     | 不可变 | 是       | 是\*   | 不可变序列、字典 key |
| `frozenset` | 不可变 | 否       | 是     | 不可变集合           |
| `list`      | 可变   | 是       | 否     | 有序集合             |
| `dict`      | 可变   | 是(3.7+) | 否     | 键值映射             |
| `set`       | 可变   | 否       | 否     | 去重、集合运算       |

> \*tuple 内元素全部不可变时才可哈希。

---

## 数字类型

```python
# int —— 任意精度整数
big = 10 ** 100                # Python 整数没有溢出
hex_val = 0xFF                 # 255
bin_val = 0b1010               # 10
readable = 1_000_000           # 下划线分隔，提高可读性

# float —— 双精度浮点数（64位 IEEE 754）
1.0 / 3       # 0.3333333333333333
float('inf')  # 正无穷
float('nan')  # 非数值

# Decimal —— 精确十进制（金额计算必用）
from decimal import Decimal, ROUND_HALF_UP
price = Decimal('19.99')
tax = price * Decimal('0.08')
total = (price + tax).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)

# complex —— 复数
z = 3 + 4j
z.real, z.imag  # 3.0, 4.0
abs(z)          # 5.0（模）
```

---

## 字符串操作速查

```python
# f-string 格式化（推荐，3.6+）
name, age = '橙子', 25
f'{name} is {age}'              # 基本插值
f'{3.14159:.2f}'                # '3.14' —— 保留2位小数
f'{1000000:,}'                  # '1,000,000' —— 千分位
f'{42:08b}'                     # '00101010' —— 二进制补零
f'{"hello":>10}'                # '     hello' —— 右对齐

# 常用方法
s = '  Hello, World!  '
s.strip()                       # 'Hello, World!'
s.split(', ')                   # ['  Hello', 'World!  ']
', '.join(['a', 'b', 'c'])     # 'a, b, c'
s.replace('World', 'Python')   # '  Hello, Python!  '
s.startswith('  He')           # True
'hello'.encode('utf-8')        # b'hello'

# 切片
s = 'abcdefgh'
s[2:5]     # 'cde'
s[::2]     # 'aceg' —— 步长为2
s[::-1]    # 'hgfedcba' —— 反转
```

---

## 列表 vs 元组 vs 集合

| 特性         | `list`      | `tuple`     | `set`         |
| ------------ | ----------- | ----------- | ------------- |
| 语法         | `[1, 2, 3]` | `(1, 2, 3)` | `{1, 2, 3}`   |
| 可变         | 是          | 否          | 是            |
| 有序         | 是          | 是          | 否            |
| 重复元素     | 允许        | 允许        | 不允许        |
| 可做字典 key | 否          | 是          | 否            |
| 查找效率     | O(n)        | O(n)        | O(1)          |
| 典型场景     | 有序集合    | 不可变记录  | 去重/成员检测 |

```python
# list 常用操作
lst = [3, 1, 4, 1, 5]
lst.append(9)                   # 尾部追加
lst.extend([2, 6])              # 批量追加
lst.insert(0, 0)                # 指定位置插入
lst.pop()                       # 弹出最后一个
lst.remove(1)                   # 删除第一个值为1的元素
sorted(lst)                     # 返回新列表（不修改原列表）
lst.sort(reverse=True)          # 原地排序

# tuple 解包
point = (3, 4)
x, y = point                   # 解包赋值
a, *rest = (1, 2, 3, 4)        # rest = [2, 3, 4]

# set 集合运算
a, b = {1, 2, 3}, {2, 3, 4}
a | b    # {1, 2, 3, 4} —— 并集
a & b    # {2, 3} —— 交集
a - b    # {1} —— 差集
a ^ b    # {1, 4} —— 对称差集
```

---

## 字典操作速查

```python
d = {'name': '橙子', 'age': 25}

# 安全读取
d.get('missing', 'default')    # 不存在返回默认值
d.setdefault('city', 'BJ')     # 不存在时设置并返回

# 合并
d.update({'age': 26})           # 原地合并
merged = {**d, 'extra': 1}     # 解包合并（3.5+）
merged = d | {'extra': 1}      # 合并运算符（3.9+）

# 遍历
for k, v in d.items(): pass     # 键值对
for k in d: pass                # 只遍历键（等价于 d.keys()）

# 删除
d.pop('age')                    # 删除并返回值
d.pop('missing', None)          # 不存在不报错
```

---

## 切片语法详解

| 语法         | 含义                | 示例（`lst = [0,1,2,3,4,5]`） |
| ------------ | ------------------- | ----------------------------- |
| `lst[a:b]`   | 从 a 到 b（不含 b） | `lst[1:4]` → `[1,2,3]`        |
| `lst[:b]`    | 从头到 b            | `lst[:3]` → `[0,1,2]`         |
| `lst[a:]`    | 从 a 到末尾         | `lst[3:]` → `[3,4,5]`         |
| `lst[::s]`   | 步长为 s            | `lst[::2]` → `[0,2,4]`        |
| `lst[::-1]`  | 反转                | `[5,4,3,2,1,0]`               |
| `lst[a:b:s]` | 从 a 到 b 步长 s    | `lst[1:5:2]` → `[1,3]`        |

```python
# 切片赋值（list 专属，因为可变）
lst = [0, 1, 2, 3, 4]
lst[1:3] = [10, 20, 30]        # [0, 10, 20, 30, 3, 4]
lst[::2] = [99, 99, 99]        # 步长切片赋值，元素数量必须匹配
```

---

## 常见陷阱

```python
# ❌ 字符串不可变，无法原地修改
s = 'hello'
s[0] = 'H'  # TypeError: 'str' object does not support item assignment

# ✅ 创建新字符串
s = 'H' + s[1:]  # 'Hello'

# ❌ 可变对象作为字典 key
d = {[1, 2]: 'value'}  # TypeError: unhashable type: 'list'

# ✅ 用不可变类型作 key
d = {(1, 2): 'value'}  # tuple 可以做 key

# ❌ 空集合用 set()，不是 {}
a = {}       # 这是空字典！
b = set()    # 这才是空集合
```
