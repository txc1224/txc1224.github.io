# 常用标准库

```python
import os, sys
from pathlib import Path
import json
from datetime import datetime, timedelta
from collections import defaultdict, Counter, OrderedDict, deque
from itertools import chain, islice, groupby, product, combinations

# pathlib（推荐替代 os.path）
p = Path('/tmp/data')
p.mkdir(parents=True, exist_ok=True)
p / 'file.txt'          # 路径拼接
p.exists() / p.is_dir()
p.read_text()
p.write_text('content')
list(p.glob('**/*.py'))  # 递归查找

# collections
word_count = Counter('abracadabra')        # Counter({'a':5,'b':2,'r':2,'c':1,'d':1})
word_count.most_common(3)
groups = defaultdict(list)
for k, v in data: groups[k].append(v)      # 自动初始化 list

dq = deque(maxlen=100)                     # 有界双端队列，自动丢弃旧元素
dq.appendleft(x)                           # 左端 O(1)

# datetime
now = datetime.now()
dt = datetime(2024, 1, 15, 12, 30)
dt.strftime('%Y-%m-%d %H:%M:%S')
datetime.strptime('2024-01-15', '%Y-%m-%d')
dt + timedelta(days=7, hours=2)

# itertools
list(chain([1,2], [3,4]))                  # [1,2,3,4]
list(islice(range(100), 10))               # 前10个
list(combinations([1,2,3], 2))             # [(1,2),(1,3),(2,3)]

# json
json.dumps({'key': 'value'}, ensure_ascii=False, indent=2)
json.loads('{"key": "value"}')
```
