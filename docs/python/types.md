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

<!-- KNOWLEDGE-IMPORT:START -->

## 推导式(列表/字典/集合)

## TL;DR

> 用一行声明式语法,从可迭代对象构建新容器。

## 背景与动机

「遍历一个序列,对每个元素做变换或过滤,收集成新容器」是最高频的编程模式之一。用 for 循环 + `append` 要写三四行,且读代码的人要扫到结尾才知道「原来在攒一个列表」。推导式把「变换 + 过滤 + 收集」压缩成一行**声明式**表达,意图一眼可见、可读性更高,通常还更快(循环在 C 层做,省掉反复的方法查找和 append 调用)。

它解决的不是「能不能做」,而是「表达是否清晰」。当你脑子里是「我要一个由 X 变换而来的列表」,推导式让你**直接这么写**。

## 核心机制

三种推导式语法同构,差别只在最外层括号与是否键值对:

- **列表推导** `[expr for x in it if cond]` → 产出 `list`(PEP 202)。
- **集合推导** `{expr for x in it if cond}` → 产出 `set`,自动去重(PEP 274 一并引入)。
- **字典推导** `{k_expr: v_expr for x in it if cond}` → 产出 `dict`(PEP 274)。
- 结构都是三段:**输出表达式** + `for` 子句(可多层嵌套) + 可选 `if` 过滤(可多个)。
- **作用域**:Python 3 中推导式有独立作用域,循环变量**不会泄漏**到外层(Python 2 会泄漏,是历史坑)。
- **惰性变体**:把方括号换成圆括号 `(expr for x in it)` 得到**生成器表达式**,不立刻建容器,按需逐个产出,适合大数据或只消费一次的场景,内存友好。

## 代码示例

```python
nums = [1, 2, 3, 4, 5, 6]

# 列表推导:变换 + 过滤
squares = [n * n for n in nums if n % 2 == 0]
print(squares)            # [4, 16, 36]

# 集合推导:自动去重
word = "hello"
uniq = {ch for ch in word}
print(uniq)               # {'h', 'e', 'l', 'o'}(顺序不定)

# 字典推导:键值对
names = ["a", "bb", "ccc"]
length = {n: len(n) for n in names}
print(length)             # {'a': 1, 'bb': 2, 'ccc': 3}

# 嵌套:拍平二维列表
matrix = [[1, 2], [3, 4]]
flat = [x for row in matrix for x in row]
print(flat)               # [1, 2, 3, 4]

# 生成器表达式:惰性,不占整块内存
total = sum(n * n for n in range(1_000_000))
print(total)              # 333332833333500000
```

## 易错点 / 反例

1. **推导式里塞太多逻辑,反而难读**。推导式适合「一行能讲清」的变换;一旦嵌套两层以上或带复杂条件,就该退回 for 循环。

```python
# 反例:过度压缩,可读性反而差
result = [f(x) for x in data if x > 0 if x % 2 == 0 for f in [lambda v: v**2]]
# 更好的写法:拆开
evens = [x for x in data if x > 0 and x % 2 == 0]
result = [x ** 2 for x in evens]
```

2. **在推导式里做副作用**。推导式是为了「构建值」,不该用来执行 print、写文件等动作——那会创建一堆没用的 `None` 列表,纯属浪费且误导。

```python
# 反例:用推导式执行副作用,产生 [None, None, None]
[print(x) for x in range(3)]

# 正确:副作用用普通循环
for x in range(3):
    print(x)
```

3. **混淆生成器表达式与列表推导**:生成器只能消费一次,消费完就空了。

```python
gen = (x for x in range(3))
print(list(gen))  # [0, 1, 2]
print(list(gen))  # [] —— 已被耗尽,不是重复给出
```

## 高频面试题(5 题)

- **Q1**: 列表推导和 for 循环 + append 有什么区别?什么时候用哪个?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - 结果等价时,列表推导更**简洁、声明式**,且通常略快(循环体在 C 层执行)。
  - 简单「变换/过滤后收集」用推导式;逻辑复杂、多分支、需中间状态时用 for 循环。
  - 经验法则:一行写不下、别人读不懂,就该退回普通循环。
  - 副作用操作(print/写库)永远用 for 循环,不用推导式。

  &lt;details&gt;

- **Q2**: 列表推导的循环变量会泄漏到外层作用域吗?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - **Python 3 不会**:推导式有独立作用域,`[x for x in ...]` 之后外层访问 `x` 报 `NameError`。
  - **Python 2 会泄漏**,循环变量覆盖外层同名变量——这是升级到 3 后才修掉的历史坑。
  - 生成器表达式、字典/集合推导同样不泄漏。

  &lt;details&gt;

- **Q3**: 生成器表达式和列表推导的关键差异?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - 语法:`()` vs `[]`;产物:`generator` vs `list`。
  - 生成器**惰性**求值、省内存,适合大数据或只遍历一次;列表**立即**求值、可重复访问、支持索引/len。
  - 生成器是**一次性**的,迭代完即耗尽,再次迭代得到空。
  - 作为函数唯一实参时,生成器可省一层括号:`sum(x*x for x in xs)`。

  &lt;details&gt;

- **Q4**: 如何用推导式实现「矩阵转置」或「拍平嵌套列表」?嵌套 for 的顺序怎么读?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - 嵌套推导的阅读顺序 = 等价 for 循环的书写顺序(从左到右,外层在前)。
  - 拍平:`[x for row in matrix for x in row]` 等价于先 `for row` 再 `for x`。
  - 转置:`[[row[i] for row in matrix] for i in range(len(matrix[0]))]`。
  - 超过两层嵌套通常该换 for 循环或 `itertools.chain.from_iterable` 拍平。

  &lt;details&gt;

- **Q5**: 字典推导中键重复会怎样?能用它做什么常见变换?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - 键重复时**后写覆盖先写**,最终只留一个(和普通 dict 赋值一致),不报错。
  - 常见用途:键值互换 `{v: k for k, v in d.items()}`(注意值必须可哈希且唯一)。
  - 还可做过滤 `{k: v for k, v in d.items() if v > 0}`、批量变换值等。

  &lt;details&gt;

## 延伸资源

- [Python 官方教程 – List Comprehensions](https://docs.python.org/3/tutorial/datastructures.html#list-comprehensions)
- [PEP 202 – List Comprehensions](https://peps.python.org/pep-0202/)
- [PEP 274 – Dict Comprehensions](https://peps.python.org/pep-0274/)
- 《Fluent Python》第 2 章:listcomp 与 genexp 的取舍

## (留白) 我的理解

> 这一段不强制填。学完后用自己的话复述、记下踩过的坑、和其他知识的连接。AI 写不出这段。

---

## 动态类型与鸭子类型

## TL;DR

> 类型属于对象而非变量;只看行为不看血统。

## 背景与动机

静态类型语言(C/Java)在编译期把类型钉死在变量上,改一处类型往往牵动一串声明。Python 选择把类型信息挂在**对象**上,变量只是一个指向对象的「名字」,因此同一个变量可以先绑 int、再绑 str,无需声明。这把「写代码」和「改代码」的成本大幅降低,是 Python 表达力强、原型开发快的根基。

代价是:类型错误被推迟到运行期才暴露(`TypeError` 在调用那一刻才炸),大型项目里这类 bug 更隐蔽。鸭子类型(duck typing)是动态类型的自然推论——「如果它走起来像鸭子、叫起来像鸭子,那它就是鸭子」。它让代码面向**行为(协议)**而非**具体类**,从而实现松耦合。

## 核心机制

- **变量 = 名字绑定**:`a = 1` 不是「声明一个 int 变量 a」,而是「创建一个 int 对象 1,把名字 a 贴上去」。类型、方法、值都在对象身上,名字本身无类型。可用 `id()` 看到绑定对象的地址,`type()` 看到对象当前的类型。
- **鸭子类型**:调用方只关心对象有没有需要的方法/属性,不关心它的类。`len(x)` 能 work,是因为 x 实现了 `__len__`,而不是因为 x 是某个「可测长基类」的子类。这种「靠特殊方法支撑的非正式接口」在 Python 里叫**协议(protocol)**。
- **EAFP 风格**:「 Easier to Ask Forgiveness than Permission 」——直接 try 调用、出错再 except,通常比先 `isinstance` 一串判断更 Pythonic,也更贴合鸭子类型。
- **可选的静态补强**:PEP 484 引入类型注解,PEP 544 引入 `typing.Protocol`,让你**显式**描述「我需要的是有 `.read()` 方法的对象」这类结构化鸭子类型,配合 mypy 在运行前做静态检查。注解不改变运行时行为,纯工具友好。

## 代码示例

```python
# 类型属于对象,名字只是标签
a = 10          # a 绑定到 int 对象
print(type(a))  # <class 'int'>
a = "hello"     # 同一个名字,改绑到 str 对象,合法
print(type(a))  # <class 'str'>

# 鸭子类型:只要实现了 __len__,len() 就认它
class Team:
    def __init__(self, members):
        self._members = members
    def __len__(self):          # 满足「可测长」协议
        return len(self._members)

t = Team(["a", "b", "c"])
print(len(t))   # 3 —— Team 不是 list,照样能 len

# EAFP:直接试,失败再兜底
def first_char(obj):
    try:
        return obj[0]           # 不预判类型,能取下标就行
    except (TypeError, KeyError, IndexError):
        return None

print(first_char("hi"))   # 'h'
print(first_char([7, 8])) # 7
print(first_char(123))    # None
```

## 易错点 / 反例

1. **误以为变量有固定类型**:把「动态类型」理解成「无类型」,写出依赖隐式转换的代码。

```python
def add(a, b):
    return a + b

add(1, 2)       # 3,int + int
add("1", "2")   # '12',str + str(拼接),不是数值相加
add(1, "2")     # TypeError:运行时才发现 int 不能加 str
```

「动态」指**绑定**灵活,Python 仍是**强类型**——不会悄悄把 `1` 变 `"1"`。

2. **过度 isinstance 检查,杀死鸭子类型**:

```python
# 反例:把鸭子类型用回静态思维
def area(shape):
    if isinstance(shape, Circle):
        return 3.14159 * shape.r ** 2
    elif isinstance(shape, Square):
        return shape.side ** 2
    # 每加一种图形都得改这里,扩展性差
```

更好的做法是让每个图形自带 `.area()` 方法,调用方直接 `shape.area()`——面向协议而非类型判断。

3. **hasattr 的误判**:`hasattr(obj, "read")` 只说明名字存在,不保证它是可调用的方法(可能是 None 或属性),真要用行为判断,`callable(getattr(obj, "read", None))` 更稳。

## 高频面试题(5 题)

- **Q1**: Python 是强类型还是弱类型?动态还是静态?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - 是**强类型 + 动态类型**。
  - 动态:类型检查发生在运行期,变量可随时改绑不同类型的对象。
  - 强类型:不做危险的隐式类型转换,`1 + "1"` 直接 `TypeError`,而不是像 JS 那样悄悄拼成 `"11"`。
  - 常见误区:把「动态」当成「弱类型」,二者是正交概念。

  &lt;details&gt;

- **Q2**: 什么是鸭子类型?给一个工程上的好处和坏处。
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - 定义:不检查对象的类,只检查它是否具备所需的方法/属性,「行为像就当它是」。
  - 好处:松耦合、易扩展——新类型只要实现相同协议即可无缝接入,无需继承。
  - 坏处:接口是**非正式**的,拼错方法名、漏实现协议要到运行期才报错;可读性依赖约定。
  - 缓解:用 `typing.Protocol`(PEP 544)把协议显式化,配合静态检查。

  &lt;details&gt;

- **Q3**: `is` 和 `==` 的区别?和动态类型有什么关系?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - `==` 比较**值是否相等**(调用 `__eq__`),`is` 比较**是不是同一个对象**(比较 `id`)。
  - 因为变量只是绑定到对象的名字,理解「同一对象可被多个名字引用」才能懂 `is`。
  - 判断 `None` 用 `is None`(单例),不要用 `==`。
  - 小整数、短字符串有缓存/驻留,`is` 可能偶然为 True,不能依赖。

  &lt;details&gt;

- **Q4**: 既然有鸭子类型,为什么还需要 PEP 484 类型注解?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - 注解**不改变运行时行为**,是给工具和读者看的元数据。
  - 价值:mypy/pyright 静态检查在运行前抓类型错误;IDE 自动补全与重构;接口文档化。
  - `typing.Protocol` 把鸭子类型的「隐式协议」变成「显式契约」,兼顾灵活与安全。
  - 大型团队协作、长期维护项目收益最大;小脚本可不用。

  &lt;details&gt;

- **Q5**: EAFP 和 LBYL 分别是什么?Python 更推荐哪种?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - EAFP:先做了再说,出异常再处理(try/except);LBYL:先做检查再行动(if 判断)。
  - Python 惯用 EAFP,与鸭子类型契合:不预判类型,直接试行为。
  - EAFP 还能避免「检查」与「使用」之间的竞态(如文件刚判存在就被删)。
  - 注意 except 要捕获**具体**异常,别裸 `except:` 吞掉一切。

  &lt;details&gt;

## 延伸资源

- [Python 数据模型(特殊方法/协议)](https://docs.python.org/3/reference/datamodel.html)
- [PEP 484 – Type Hints](https://peps.python.org/pep-0484/)
- [PEP 544 – Protocols: Structural subtyping](https://peps.python.org/pep-0544/)
- 《Fluent Python》:第 1 章 Python 数据模型、第 13 章接口与协议

## (留白) 我的理解

> 这一段不强制填。学完后用自己的话复述、记下踩过的坑、和其他知识的连接。AI 写不出这段。

---

## 异常体系与自定义异常

## TL;DR

> 所有异常继承自 BaseException;业务异常该继承 Exception,用「捕获具体类型 + raise 转换」管理错误。

## 背景与动机

错误处理有两种哲学:返回错误码(C 风格)或抛异常。Python 选择异常,因为它把**正常流程**和**错误处理**在代码上分离,且错误会沿调用栈自动上抛,不会被静默忽略——「显式优于隐式」。统一的可继承异常体系让我们能「按类别」精确捕获,自定义异常则让业务错误有名字、可区分、可携带上下文,而不是到处抛笼统的 `Exception("error")`。

工程价值:清晰的异常层级 = 调用方能只捕获它在意的错误;`finally` 保证资源释放;异常链(`raise ... from ...`)保留根因,线上排查不丢线索。

## 核心机制

**内置异常层级**(关键几层):

- `BaseException`:所有异常的根。直接子类有 `SystemExit`、`KeyboardInterrupt`、`GeneratorExit`(这三个**不该被业务代码捕获**)和 `Exception`。
- `Exception`:所有**常规**错误的基类,业务自定义异常应继承它。
  - 常见子类:`ValueError`(值不对)、`TypeError`(类型不对)、`KeyError`/`IndexError`/`AttributeError`(查找失败)、`RuntimeError`、`OSError`(其下有 `FileNotFoundError` 等)、`StopIteration`。

**try 语句的完整结构**:`try` → `except`(可多个,按顺序匹配,子类要先于父类)→ `else`(try 无异常才执行)→ `finally`(无论是否异常都执行,做清理)。

**抛出与链式**:`raise` 抛出;`raise NewErr(...) from orig`(PEP 3134)显式指明直接原因,`__cause__` 被设置,traceback 显示 "The above exception was the direct cause..."。在 except 块里裸 `raise` 则自动带 `__context__`(隐式链)。

## 代码示例

```python
class AppError(Exception):
    """业务异常基类,便于统一捕获"""

class InsufficientBalance(AppError):
    def __init__(self, balance, need):
        self.balance, self.need = balance, need
        super().__init__(f"余额 {balance} 不足,需 {need}")

def withdraw(balance, amount):
    if amount > balance:
        raise InsufficientBalance(balance, amount)   # 抛自定义异常
    return balance - amount

try:
    withdraw(100, 300)
except InsufficientBalance as e:        # 捕获具体类型
    print("处理:", e, "| 差额:", e.need - e.balance)
except AppError:
    print("其它业务错误")
finally:
    print("总会执行:收尾/释放资源")
```

## 易错点 / 反例

**坑 1:裸 `except:` 吞掉一切,包括 Ctrl+C 和 sys.exit()**

```python
try:
    do_work()
except:                # 等价 except BaseException,连 KeyboardInterrupt 都吞
    pass               # 错误彻底消失,程序行为无法解释
```

为什么:裸 except 捕获 `BaseException`,把本该终止程序的信号也按下了。修法:至少写 `except Exception:`,且不要空 `pass`,要记录日志或上抛。

**坑 2:捕获范围过大 / 用异常控制正常流程**

```python
except Exception as e:   # 把 ValueError、KeyError、TypeError 混为一谈
    return default       # 真正的 bug(如 TypeError)被当成"可预期错误"掩盖
```

原则:**只捕获你能处理的、具体的异常类型**;让意料之外的异常暴露出来。也不要用 `try/except KeyError` 代替 `if key in d` 做常规判断(除非并发场景用 EAFP 更优)。

**坑 3:在 except 里 `raise` 新异常却丢了根因**

```python
except OSError:
    raise AppError("读取失败")          # 隐式链(__context__),信息较弱
    # 更好:raise AppError("读取失败") from e   # 显式链(__cause__),根因清晰
```

**坑 4:`return` 写在 finally 里会吞掉正在传播的异常**——finally 的 return 会覆盖 try/except 里的返回值和未处理异常,极难排查。

## 高频面试题(5 题)

- **Q1**: Python 异常体系的根基类是什么?业务自定义异常应该继承谁,为什么?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - 根基类是 `BaseException`。
  - 它的直接子类:`SystemExit`、`KeyboardInterrupt`、`GeneratorExit`、`Exception`。
  - 业务异常应继承 `Exception` 而非 `BaseException`。
  - 原因:`BaseException` 包含不应被业务捕获的系统退出类信号;继承 `Exception` 才能被 `except Exception` 正常兜住且不拦截退出信号。

  &lt;details&gt;

- **Q2**: try / except / else / finally 各自的执行时机?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - `try`:包裹可能出错的代码。
  - `except`:try 中抛出**匹配类型**的异常时执行,按书写顺序匹配,子类应写在父类前。
  - `else`:try 块**没有**抛任何异常时才执行(放成功后的后续逻辑)。
  - `finally`:**无论**是否异常、是否 return 都执行,用于释放资源。
  - 注意 finally 中的 return 会覆盖 try/except 的返回值并吞掉异常。

  &lt;details&gt;

- **Q3**: 为什么要自定义异常?设计自定义异常体系的好习惯有哪些?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - 让错误有名字、可被精确捕获,区别于其它无关异常。
  - 建立业务基类(如 `AppError(Exception)`),具体异常继承它,便于统一兜底。
  - 在 `__init__` 里携带上下文(余额、订单号),并调用 `super().__init__(msg)`。
  - 命名以 Error 结尾,遵循 PEP 8;异常信息面向排查者写清楚。

  &lt;details&gt;

- **Q4**: 裸 `except:` 有什么问题?正确姿势是什么?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - 裸 `except:` 等价于 `except BaseException:`。
  - 会连 `KeyboardInterrupt`、`SystemExit` 一起捕获,导致程序无法正常退出。
  - 常配合空 `pass`,把错误彻底吞掉,排查无门。
  - 正确:写具体异常类型;兜底至少用 `except Exception:`;不要吞,要记录或转换上抛。

  &lt;details&gt;

- **Q5**: `raise X from e` 和裸 `raise X` 在 except 块里有什么区别?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - `raise X from e`:显式异常链,设置 `__cause__`,traceback 显示 "direct cause",根因最清晰(PEP 3134)。
  - 在 except 里裸 `raise X`:设置 `__context__`(隐式链),显示 "During handling...",关系较弱。
  - `raise X from None`:主动**屏蔽**上下文, traceback 更干净(用于对用户友好的报错)。
  - 排查根因时优先用显式 `from`。

  &lt;details&gt;

## 延伸资源

- [Python 官方文档:Built-in Exceptions](https://docs.python.org/3/library/exceptions.html)
- [Python 官方教程:Errors and Exceptions](https://docs.python.org/3/tutorial/errors.html)
- [PEP 3134 — Exception Chaining and Embedded Tracebacks](https://peps.python.org/pep-3134/)
- 书籍:《Python Cookbook》第 14 章、《Fluent Python》上下文管理器与 else 块相关章节

## (留白) 我的理解

> 这一段不强制填。学完后用自己的话复述、记下踩过的坑、和其他知识的连接。AI 写不出这段。

---

## 作用域 LEGB 与闭包

## TL;DR

> 名字按 Local→Enclosing→Global→Built-in 逐层查找;闭包是「记住了定义时外层变量的函数」。

## 背景与动机

「变量在哪一层可见」是每个语言都要回答的问题。Python 用 LEGB 规则给出一个确定性的查找顺序,避免名字冲突时的歧义。闭包则解决另一个问题:**如何让函数携带一段私有状态**,而不必引入类。装饰器、回调、工厂函数都建立在闭包之上——不理解闭包就看不懂装饰器,写不出参数化的中间件。

工程价值:闭包让「带状态的函数」零样板,是函数式风格在 Python 落地的基础;LEGB 则解释了为什么函数内能直接读模块级常量、为什么要用 `nonlocal` 才能改外层变量。

## 核心机制

**LEGB 查找顺序**(名字解析的规则,PEP 227 引入嵌套作用域):

- **L**ocal:当前函数/方法的局部命名空间。
- **E**nclosing:外层嵌套函数的命名空间(可能多层,由内向外)。
- **G**lobal:当前模块的全局命名空间。
- **B**uilt-in:`builtins` 模块(len、print 等),最后一道兜底。
  找到即停,找不到抛 `NameError`。注意:**赋值会让名字在整个函数内成为局部变量**,即使赋值语句在引用之后(见易错点)。

**闭包三要素**(PEP 3104 引入 `nonlocal` 补全可写闭包):

1. 存在嵌套函数(内层函数定义在外层函数体内)。
2. 内层函数引用了外层函数的局部变量(称为**自由变量** free variable)。
3. 外层函数把内层函数作为返回值返回。
   自由变量的值被存进内层函数的 `__closure__` 单元格(cell),因此外层函数返回后这些变量依然存活。

**改外层变量必须声明**:`global x` 声明改模块级;`nonlocal x` 声明改外层函数级。只读不需要声明。

## 代码示例

```python
def make_counter():
    count = 0                    # 自由变量,被内层函数记住

    def inc():
        nonlocal count           # 声明后才能改外层变量
        count += 1
        return count

    return inc                   # 返回闭包

c1, c2 = make_counter(), make_counter()
print(c1(), c1(), c1())          # 1 2 3 —— c1 私有状态
print(c2())                      # 1     —— c2 状态独立

x = "global"
def outer():
    x = "enclosing"
    def inner():
        return x                 # 按 LEGB 命中 Enclosing
    return inner
print(outer()())                 # enclosing
```

## 易错点 / 反例

**坑 1:函数内「先读后赋值」导致整个名字变局部 → UnboundLocalError**

```python
x = 10
def f():
    print(x)   # UnboundLocalError! 因为下面有赋值,x 被判定为局部
    x = 20     # 即使这行在 print 之后
```

为什么:Python 在**编译时**就根据「函数内是否有对 x 的赋值」把 x 标记为局部变量,与执行顺序无关。修法:要么加 `global x`,要么不要混用。

**坑 2:循环里的延迟绑定(late binding)——闭包记住的是变量不是值**

```python
funcs = [lambda: i for i in range(3)]
print([f() for f in funcs])   # [2, 2, 2] 不是 [0, 1, 2]!
```

为什么:三个 lambda 共享同一个自由变量 `i`,调用时才去取它的**最终值** 2。修法:用默认参数在定义时锁定 `lambda i=i: i`。

**坑 3:以为只读就不用声明,却在闭包里「改」了可变对象的方法**——`lst.append()` 不算赋值(没重绑定名字),合法;但 `lst = lst + [x]` 是重绑定,需要 `nonlocal`。

## 高频面试题(5 题)

- **Q1**: LEGB 四个字母分别代表什么?查找顺序如何?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - Local 当前函数局部作用域。
  - Enclosing 外层嵌套函数作用域(可多层)。
  - Global 模块级作用域。
  - Built-in `builtins` 内置作用域,最后兜底。
  - 由内向外逐层找,找到即停,全找不到抛 `NameError`。

  &lt;details&gt;

- **Q2**: 什么是闭包?判断一个函数是不是闭包看哪几点?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - 有嵌套函数定义。
  - 内层函数引用外层函数的局部变量(自由变量)。
  - 外层函数返回内层函数。
  - 可通过 `func.__closure__` 是否为 None、`func.__code__.co_freevars` 验证。
  - 闭包让自由变量在外层函数返回后仍然存活。

  &lt;details&gt;

- **Q3**: `global` 和 `nonlocal` 的区别是什么?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - `global x`:声明 x 指模块级名字,赋值/修改都落到全局。
  - `nonlocal x`:声明 x 指最近一层**外层函数**的局部变量(不能是全局)。
  - `nonlocal` 要求外层确实存在该名字,否则 SyntaxError;`global` 不要求已存在。
  - 只读外层变量时两者都不需要,仅重绑定才需要。

  &lt;details&gt;

- **Q4**: 为什么循环里定义的一组 lambda 打印同一个值?怎么修?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - 原因:闭包保存的是**变量引用**而非当时的值,调用时才取 `i` 的最终值(late binding)。
  - 修法 1:默认参数锁定 `lambda i=i: i`(定义时求值)。
  - 修法 2:用 `functools.partial` 或再包一层函数把 `i` 传进去。
  - 本质:把「运行时取变量」变成「定义时绑定值」。

  &lt;details&gt;

- **Q5**: 函数内 `print(x)` 之后再 `x = 1` 为什么报 UnboundLocalError 而不是用全局 x?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - Python 在**编译期**扫描整个函数体,只要存在对 x 的赋值,就把 x 标记为局部变量。
  - 与语句执行先后无关,因此 `print(x)` 时局部 x 尚未绑定。
  - 报 `UnboundLocalError`(局部变量未赋值),不是 `NameError`。
  - 解决:加 `global x` 明确意图,或重命名局部变量避免遮蔽。

  &lt;details&gt;

## 延伸资源

- [Python 官方文档:Naming and binding](https://docs.python.org/3/reference/executionmodel.html#naming-and-binding)
- [PEP 3104 — Access to Names in Outer Scopes(nonlocal)](https://peps.python.org/pep-3104/)
- [PEP 227 — Statically Nested Scopes](https://peps.python.org/pep-0227/)
- 书籍:《Fluent Python》第 7 章(函数装饰器和闭包)、《Python Cookbook》第 7 章

## (留白) 我的理解

> 这一段不强制填。学完后用自己的话复述、记下踩过的坑、和其他知识的连接。AI 写不出这段。

---

## 可变默认参数陷阱

## TL;DR

> 默认参数只在 def 时求值一次,可变对象会被所有调用共享。

## 背景与动机

这是 Python 最经典的「 Surprise 」之一。直觉上 `def f(x=[])` 应该是「每次调用都给 x 一个新的空列表」,但实际行为是:**整个程序运行期间,这个空列表只创建一次**,之后所有不显式传参的调用都往**同一个**列表里塞东西。第一次调用正常,第二次就「脏」了——上一个调用残留的数据悄悄漏进本次结果。

这种 bug 极其隐蔽:单测只测一次往往通过,真实场景连续调用几次才暴露,且每行代码单看都「对」。理解它需要对齐一个心智模型——**默认参数是「定义时绑定」而非「调用时绑定」**。

## 核心机制

- **默认值在函数定义时求值一次**:Python 执行到 `def` 语句那一刻,就把默认值算出来,存进函数对象的 `__defaults__` 元组里。之后每次调用,凡是没传该参数的,都直接引用这**同一份**对象。
- **不可变默认值没事**:`def f(n=0)`、`def f(s="x")` 安全,因为 int/str 不可变,你无法「改」它,只能在函数内重新绑定——重新绑定不影响那份共享对象。
- **可变默认值才出坑**:list、dict、set 等可在原地修改(`append`、`add`),所有共享它的调用看到的是同一个被改过的对象。
- **正确写法:用 `None` 当哨兵,函数体内再初始化**。这同时是官方教程与《Effective Python》的推荐。
- 顺带区分:这和闭包的 **late binding**(循环变量在闭包里取最终值)是两个不同的「定义时 vs 调用时」坑,别混淆。

## 代码示例

```python
# 反例:可变默认参数被所有调用共享
def add_item(item, box=[]):
    box.append(item)
    return box

print(add_item(1))   # [1]          第一次看似正常
print(add_item(2))   # [1, 2]       陷阱!残留了上次的 1
print(add_item(3))   # [1, 2, 3]    数据不断累积

# 正确:用 None 作哨兵,调用时才新建列表
def add_item_ok(item, box=None):
    if box is None:   # 区分「没传」和「传了空列表」
        box = []
    box.append(item)
    return box

print(add_item_ok(1))   # [1]
print(add_item_ok(2))   # [2]        每次独立,正确
```

## 易错点 / 反例

1. **默认值在 import 时就定死,而非每次调用**。常见误区是以为 `def f(t=datetime.now())` 每次调用都取当前时间——其实 `now()` 在模块加载时执行一次,所有调用拿到的是**同一个启动时刻的时间戳**。

```python
from datetime import datetime

# 反例:时间戳被冻结在定义那一刻
def log(msg, when=datetime.now()):
    return f"[{when}] {msg}"

# 正确:None 哨兵 + 函数体内取时间
def log_ok(msg, when=None):
    when = when or datetime.now()
    return f"[{when}] {msg}"
```

2. **用 `if not box` 判空,误伤「传了空列表」的调用方**。`box or []` 会把调用方显式传入的空列表也替换掉。

```python
# 反例:调用方传了空列表,却被换成新对象,改不到他那份
def f(box=None):
    box = box or []   # 传入 [] 时也被替换,bug
    box.append(1)
    return box

mine = []
f(mine)
print(mine)  # [] —— 期望 [1],却因为 or 丢了引用

# 正确:用 is None 精确判断「未传参」
def f_ok(box=None):
    if box is None:
        box = []
    box.append(1)
    return box
```

3. **类属性层面的同类坑**:把可变对象当类属性默认值,所有实例共享。应放 `__init__` 里赋值。

```python
# 反例
class Cart:
    items = []        # 类属性,所有实例共享同一个列表

# 正确
class CartOk:
    def __init__(self):
        self.items = []   # 每个实例各一份
```

## 高频面试题(5 题)

- **Q1**: 为什么 `def f(x=[])` 会有问题?根本原因是什么?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - 默认参数值在**函数定义时求值一次**,存于 `f.__defaults__`,不是每次调用重新创建。
  - 可变对象(list/dict/set)可被原地修改,所有未传参的调用共享并累积这同一份。
  - 于是出现「第一次调用正常、后续调用脏数据残留」的诡异现象。
  - 不可变默认值(int/str/tuple)因无法原地修改而安全。

  &lt;details&gt;

- **Q2**: 标准修复方案是什么?为什么用 `None` 而不是直接判断 `if not x`?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - 用 `x=None` 作哨兵,函数体内 `if x is None: x = []` 再初始化。
  - 用 `is None` 而非 `if not x`/`x or []`,因为后者会把调用方**显式传入的空列表/空 dict** 也误判为「未传」而替换掉。
  - `None` 哨兵能精确区分「没传参数」和「传了一个假值」。

  &lt;details&gt;

- **Q3**: 如何观察/验证默认值是定义时绑定的?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - 查看 `f.__defaults__`,这是一个元组,存放各默认值的**同一个对象**。
  - 对 `def f(x=[])`,多次调用后 `f.__defaults__[0]` 里的列表会累积变化,证明是同一对象。
  - 也可用 `id()` 比对:不同调用未传参时拿到的默认值 `id` 相同。

  &lt;details&gt;

- **Q4**: 这个陷阱和闭包的「延迟绑定」(late binding)是一回事吗?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - 不是。两者都涉及「定义时 vs 调用时」,但机制不同。
  - 可变默认参数:默认值**定义时只求值一次**并被共享。
  - 闭包 late binding:循环里定义的函数引用**同一个循环变量**,取的是循环结束后的最终值,可用默认参数 `lambda i=i: i` 固定。
  - 有趣的是,闭包 late binding 恰好**用**「默认参数定义时绑定」这个特性来修复。

  &lt;details&gt;

- **Q5**: 除了函数默认参数,还有哪些场景属于同一类「可变对象被意外共享」的坑?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - **类属性**:把 list/dict 写成类属性,所有实例共享,应放 `__init__` 里初始化。
  - **浅拷贝嵌套**:`copy.copy` 只拷一层,内层可变对象仍共享,深拷贝用 `copy.deepcopy`。
  - **列表乘法拉引用**:`[[0]*3]*3` 内层是同一列表的三份引用,改一个全变,应用列表推导。
  - 共同根源:多个名字/槽位引用了同一个可变对象。

  &lt;details&gt;

## 延伸资源

- [Python 官方教程 – Default Argument Values](https://docs.python.org/3/tutorial/controlflow.html#default-argument-values)
- [Python 官方 FAQ – Why are default values shared between objects?](https://docs.python.org/3/faq/programming.html#why-are-default-values-shared-between-objects)
- 《Effective Python》第 24 条:用 None 和 docstring 指定动态的默认参数

## (留白) 我的理解

> 这一段不强制填。学完后用自己的话复述、记下踩过的坑、和其他知识的连接。AI 写不出这段。

<!-- KNOWLEDGE-IMPORT:END -->
