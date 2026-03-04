# 函数 / 推导式

## 函数

```python
# 默认参数 & 关键字参数
def greet(name, greeting='Hello', *, separator=', '):
    # * 之后的参数强制关键字传入
    return f'{greeting}{separator}{name}'

greet('Alice')                     # 'Hello, Alice'
greet('Bob', greeting='Hi')        # 'Hi, Bob'
greet('Eve', separator=' - ')      # 'Hello - Eve'

# *args & **kwargs
def func(*args, **kwargs):
    print(args)   # tuple
    print(kwargs) # dict

func(1, 2, name='Alice') # (1, 2) {'name': 'Alice'}

# Lambda
square = lambda x: x ** 2
pairs = [(1, 'b'), (2, 'a')]
pairs.sort(key=lambda x: x[1])  # 按第二个元素排序

# 装饰器
import functools

def timer(func):
    @functools.wraps(func)  # 保留原函数的 __name__ 等属性
    def wrapper(*args, **kwargs):
        import time
        start = time.perf_counter()
        result = func(*args, **kwargs)
        print(f'{func.__name__} took {time.perf_counter() - start:.3f}s')
        return result
    return wrapper

def retry(times=3):
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            for i in range(times):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    if i == times - 1: raise
        return wrapper
    return decorator

@timer
@retry(times=3)
def fetch_data(url): ...
```

---

## 列表推导式 & 生成器表达式

```python
# 列表推导式
squares = [x**2 for x in range(10)]
evens   = [x for x in range(20) if x % 2 == 0]
matrix  = [[i*j for j in range(3)] for i in range(3)]
flat    = [x for row in matrix for x in row]  # 展平

# 字典/集合推导式
d = {k: v for k, v in zip('abc', [1, 2, 3])}  # {'a':1,'b':2,'c':3}
s = {x**2 for x in range(-3, 4)}              # 去重平方集合

# 生成器表达式（惰性求值，节省内存）
gen = (x**2 for x in range(10**6))  # 不立即计算
next(gen)    # 0
sum(x for x in range(100))  # 直接传给 sum，无需 []

# 生成器函数
def fib():
    a, b = 0, 1
    while True:
        yield a
        a, b = b, a + b

from itertools import islice
list(islice(fib(), 10))  # [0,1,1,2,3,5,8,13,21,34]
```
