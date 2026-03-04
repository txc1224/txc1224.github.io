# 常见陷阱

```python
# ❌ 可变默认参数（所有调用共享同一个列表）
def add_item(item, lst=[]):
    lst.append(item)
    return lst

add_item(1)  # [1]
add_item(2)  # [1, 2]（不是 [2]！）

# ✅ 正确写法
def add_item(item, lst=None):
    if lst is None: lst = []
    lst.append(item)
    return lst

# ❌ GIL（全局解释器锁）：多线程无法并行执行 Python 代码
# CPU 密集型用 multiprocessing，I/O 密集型用 threading 或 asyncio

# ❌ is vs ==
a = 256
b = 256
a is b  # True（小整数缓存 -5 ~ 256）

a = 257
b = 257
a is b  # False（CPython 不缓存大整数）
a == b  # True

# ✅ 比较值用 ==，比较对象身份用 is
# ✅ 只用 is 比较 None：if value is None

# 字符串 intern 陷阱
s1 = 'hello world'
s2 = 'hello world'
s1 is s2  # 可能 True 也可能 False（取决于实现）
s1 == s2  # 始终 True

# 深拷贝 vs 浅拷贝
import copy
lst = [[1, 2], [3, 4]]
shallow = lst.copy()       # 或 list(lst)，内层列表共享
deep    = copy.deepcopy(lst)  # 完全独立
```
