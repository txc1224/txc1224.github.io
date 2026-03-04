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
