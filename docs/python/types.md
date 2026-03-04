# 基础数据类型

## 内置类型速查

```python
# list：有序、可变、允许重复
lst = [1, 2, 3]
lst.append(4)           # [1,2,3,4]
lst.extend([5, 6])      # [1,2,3,4,5,6]
lst.insert(0, 0)        # [0,1,2,3,4,5,6]
lst.pop()               # 删除并返回最后一个
lst.pop(0)              # 删除并返回索引0
lst.remove(3)           # 删除第一个值为3的元素
lst.sort(reverse=True)  # 原地排序
sorted(lst)             # 返回新列表，不修改原列表
lst[1:3]                # 切片 [2,3]
lst[::-1]               # 翻转

# dict：键值对、有序（3.7+）、可变
d = {'name': 'Alice', 'age': 18}
d.get('missing', 'default')   # 安全读取，不存在返回默认值
d.setdefault('city', 'BJ')    # 不存在时设置
d.update({'age': 19})
d.pop('age')
{**d, 'extra': 1}             # 合并字典（3.5+）
d | {'extra': 1}              # 合并运算符（3.9+）

for k, v in d.items(): pass
list(d.keys())
list(d.values())

# tuple：有序、不可变
point = (3, 4)
x, y = point             # 解包
a, *rest = (1, 2, 3, 4)  # *rest = [2,3,4]

# set：无序、唯一、可变
s = {1, 2, 3}
s.add(4)
s.discard(99)   # 不存在不报错（区别于 remove）
a | b           # 并集
a & b           # 交集
a - b           # 差集
a ^ b           # 对称差集

# str：不可变
s = 'hello world'
s.upper() / s.lower()
s.strip() / s.lstrip() / s.rstrip()
s.split(' ')              # ['hello', 'world']
', '.join(['a', 'b'])     # 'a, b'
s.replace('hello', 'hi')
s.startswith('hello') / s.endswith('world')
f'Value: {42:.2f}'        # f-string 格式化
```
