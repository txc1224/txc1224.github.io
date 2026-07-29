---
title: '集合框架 / Java 8+'
order: 4
---

# 集合框架与 Stream

> Java 集合框架提供了丰富的数据结构实现，Stream API 让集合操作变得声明式和函数式。

---

## 集合框架全景

| 接口    | 实现类                 | 底层结构         |  有序  | 线程安全 | 选用场景             |
| ------- | ---------------------- | ---------------- | :----: | :------: | -------------------- |
| `List`  | `ArrayList`            | 动态数组         |   ✅   |    ❌    | 随机访问多，默认选择 |
| `List`  | `LinkedList`           | 双向链表         |   ✅   |    ❌    | 频繁头部插入删除     |
| `List`  | `CopyOnWriteArrayList` | 写时复制数组     |   ✅   |    ✅    | 读多写极少           |
| `Set`   | `HashSet`              | HashMap          |   ❌   |    ❌    | 去重，不需要顺序     |
| `Set`   | `LinkedHashSet`        | LinkedHashMap    | 插入序 |    ❌    | 去重 + 保持插入顺序  |
| `Set`   | `TreeSet`              | 红黑树           |  排序  |    ❌    | 有序去重，范围查询   |
| `Map`   | `HashMap`              | 数组+链表+红黑树 |   ❌   |    ❌    | 通用 KV 存储         |
| `Map`   | `LinkedHashMap`        | HashMap+双向链表 | 插入序 |    ❌    | 有序 Map / LRU       |
| `Map`   | `TreeMap`              | 红黑树           | 键排序 |    ❌    | 按键排序，范围查询   |
| `Map`   | `ConcurrentHashMap`    | 分段锁/CAS       |   ❌   |    ✅    | 多线程共享 Map       |
| `Queue` | `ArrayDeque`           | 循环数组         |  FIFO  |    ❌    | 栈和队列首选         |
| `Queue` | `PriorityQueue`        | 最小堆           | 优先级 |    ❌    | 优先级队列           |

---

## ArrayList vs LinkedList

| 操作                 | ArrayList          | LinkedList             |
| -------------------- | ------------------ | ---------------------- |
| 随机访问 `get(i)`    | O(1)               | O(n)                   |
| 尾部添加 `add(e)`    | O(1) 均摊          | O(1)                   |
| 中间插入 `add(i, e)` | O(n) 移动元素      | O(n) 查找 + O(1) 插入  |
| 删除 `remove(i)`     | O(n)               | O(n)                   |
| 内存占用             | 紧凑（连续数组）   | 高（每个节点两个指针） |
| 实际场景             | **90% 以上的场景** | 极少使用               |

> 结论：绝大多数情况用 `ArrayList`。LinkedList 的理论优势在实际中因为 CPU 缓存不友好而消失。

---

## HashMap 原理

```java
// 内部结构：数组 + 链表 + 红黑树
// - 默认初始容量 16，负载因子 0.75
// - 链表长度 >= 8 且数组长度 >= 64 时，链表转红黑树
// - 红黑树节点 <= 6 时退化为链表
// - 扩容为 2 倍，重新 hash 分配

Map<String, Integer> map = new HashMap<>(16);  // 指定初始容量避免频繁扩容
map.put("key", 1);
map.getOrDefault("missing", 0);               // 不存在返回默认值
map.putIfAbsent("key", 99);                   // 不存在时才放入
map.computeIfAbsent("list", k -> new ArrayList<>()).add(1);  // 懒初始化
map.merge("count", 1, Integer::sum);          // 计数器模式
```

---

## Stream API 常用操作

| 分类 | 方法                                           | 说明                    |
| ---- | ---------------------------------------------- | ----------------------- |
| 创建 | `stream()` / `Stream.of()` / `Arrays.stream()` | 从集合/数组/值创建流    |
| 过滤 | `filter(predicate)`                            | 保留满足条件的元素      |
| 映射 | `map(func)` / `flatMap(func)`                  | 转换元素 / 展平嵌套     |
| 排序 | `sorted()` / `sorted(comparator)`              | 自然排序 / 自定义排序   |
| 去重 | `distinct()`                                   | 去除重复元素            |
| 截取 | `limit(n)` / `skip(n)`                         | 取前 n 个 / 跳过前 n 个 |
| 终端 | `collect()` / `toList()`                       | 收集结果                |
| 聚合 | `count()` / `sum()` / `reduce()`               | 统计 / 归约             |
| 匹配 | `anyMatch()` / `allMatch()` / `noneMatch()`    | 条件匹配                |
| 查找 | `findFirst()` / `findAny()`                    | 查找元素                |

```java
// 实战示例：处理用户列表
List<String> result = users.stream()
    .filter(u -> u.getAge() >= 18)          // 过滤成年用户
    .sorted(Comparator.comparing(User::getAge))  // 按年龄排序
    .map(User::getName)                     // 提取姓名
    .distinct()                             // 去重
    .limit(10)                              // 取前 10 个
    .toList();                              // Java 16+ 直接 toList()

// 分组统计
Map<String, Long> cityCount = users.stream()
    .collect(Collectors.groupingBy(User::getCity, Collectors.counting()));

// 分区（布尔分组）
Map<Boolean, List<User>> partition = users.stream()
    .collect(Collectors.partitioningBy(u -> u.getAge() >= 18));

// 归约
int totalAge = users.stream()
    .mapToInt(User::getAge)
    .sum();
```

---

## Optional 正确使用

```java
// ✅ 正确用法
Optional<User> opt = findUserById(id);

// 提供默认值
User user = opt.orElse(defaultUser);
User user = opt.orElseGet(() -> createDefault());  // 延迟计算
User user = opt.orElseThrow(() -> new UserNotFoundException(id));

// 链式转换
String cityName = opt
    .map(User::getAddress)
    .map(Address::getCity)
    .orElse("未知");
```

```java
// ❌ Optional 反模式
Optional<User> opt = findUser();

// ❌ 用 isPresent + get（等于没用 Optional）
if (opt.isPresent()) {
    User user = opt.get();
}

// ❌ Optional 作为方法参数
public void process(Optional<String> name) {}  // 不要这样

// ❌ Optional 作为字段
private Optional<String> name;  // 不要这样

// ❌ Optional.of(null)  → NPE
// ✅ Optional.ofNullable(value)  → 安全
```

---

## 不可变集合

```java
// Java 9+ 工厂方法（返回不可变集合）
List<String> list = List.of("a", "b", "c");
Set<String> set = Set.of("a", "b", "c");
Map<String, Integer> map = Map.of("a", 1, "b", 2);

// 不可变集合不允许 add/remove/put，否则抛 UnsupportedOperationException
// 不允许 null 元素

// Collections 工具类
List<String> unmodifiable = Collections.unmodifiableList(mutableList);
List<String> synced = Collections.synchronizedList(new ArrayList<>());
```

---

## 常见陷阱

```java
// ❌ 遍历时修改集合 → ConcurrentModificationException
List<String> list = new ArrayList<>(List.of("a", "b", "c"));
for (String s : list) {
    if (s.equals("b")) list.remove(s);  // 抛异常！
}

// ✅ 使用 Iterator 的 remove
Iterator<String> it = list.iterator();
while (it.hasNext()) {
    if (it.next().equals("b")) it.remove();
}

// ✅ 或用 removeIf（Java 8+）
list.removeIf(s -> s.equals("b"));
```

```java
// ❌ 多线程操作 HashMap → 数据丢失、死循环（Java 7）、数据不一致
Map<String, Integer> map = new HashMap<>();
// 多个线程同时 put...

// ✅ 多线程场景用 ConcurrentHashMap
Map<String, Integer> map = new ConcurrentHashMap<>();
```

```java
// ❌ Arrays.asList 返回的 List 不支持增删
List<String> list = Arrays.asList("a", "b");
list.add("c");  // UnsupportedOperationException

// ✅ 包一层 ArrayList
List<String> list = new ArrayList<>(Arrays.asList("a", "b"));

// ✅ 或直接用 List.of + new ArrayList
List<String> list = new ArrayList<>(List.of("a", "b"));
```

<!-- KNOWLEDGE-IMPORT:START -->

## ConcurrentHashMap 原理与并发 Map 基础

## TL;DR

> `ConcurrentHashMap` 是 Java 并发场景下最常用的线程安全 Map。JDK 8+ 采用**数组 + 链表 / 红黑树 + CAS + synchronized 锁桶头节点**实现高并发读写,读操作通常无锁,写操作尽量缩小锁粒度。

## 背景与动机

`HashMap` 在多线程写入时不安全:

```java
Map<String, Integer> map = new HashMap<>();
```

可能出现:

- 数据丢失
- 结构不一致
- size 不准确
- 扩容并发问题

早期可选方案:

```java
Map<String, Integer> map = Collections.synchronizedMap(new HashMap<>());
```

但它通常用一把大锁保护所有操作,并发性能差。

`ConcurrentHashMap` 的目标:

- 保证线程安全
- 允许高并发读
- 写操作锁粒度小
- 提供原子复合操作,如 `putIfAbsent`、`computeIfAbsent`

## 核心机制

### JDK 7 vs JDK 8+ 实现差异

| 版本   | 核心结构                  | 锁粒度                  |
| ------ | ------------------------- | ----------------------- |
| JDK 7  | Segment 数组 + HashEntry  | Segment 分段锁          |
| JDK 8+ | Node 数组 + 链表 / 红黑树 | CAS + 桶级 synchronized |

面试里经常问“ConcurrentHashMap 是分段锁吗?”

答法要区分版本:

- JDK 7 是 Segment 分段锁
- JDK 8+ 取消 Segment 主结构,使用 CAS + synchronized 锁桶头节点

### JDK 8+ 底层结构

类似 HashMap:

```text
table 数组
index 0: null
index 1: Node -> Node
index 2: TreeBin(红黑树包装)
...
```

但为了并发,它使用:

- volatile table / Node 字段保证可见性
- CAS 初始化 table 和插入空桶
- synchronized 锁住桶头处理冲突写入
- ForwardingNode 协助扩容

### get 通常无锁

```java
V value = map.get(key);
```

get 主要依赖 volatile 可见性读取 table 和 Node:

- 计算 hash 定位桶
- 桶为空返回 null
- 桶首匹配直接返回
- 遍历链表或树查找

读操作不加全局锁,所以并发性能高。

### put 流程简化

```text
put(key, value)
  1. key / value 不能为 null
  2. 计算 hash
  3. table 未初始化则 CAS 初始化
  4. 桶为空则 CAS 放入新 Node
  5. 桶正在扩容则帮助扩容
  6. 桶不为空则 synchronized 锁桶头,链表 / 树中插入或覆盖
  7. 统计 size,必要时触发扩容
```

空桶写入可 CAS 完成,冲突桶才加 synchronized。

### 为什么不允许 null

`ConcurrentHashMap` 不允许 null key 和 null value:

```java
map.put(null, "x"); // NPE
map.put("x", null); // NPE
```

原因是并发语义歧义。比如:

```java
V v = map.get(key);
if (v == null) {
    // 是 key 不存在? 还是 key 存在但 value 是 null?
}
```

在并发环境下,containsKey + get 不是原子组合,所以禁止 null 简化语义。

### 原子复合操作

不要这样:

```java
if (!map.containsKey(key)) {
    map.put(key, value);
}
```

两个操作之间可能被其他线程插入。

用:

```java
map.putIfAbsent(key, value);
```

缓存常用:

```java
User user = cache.computeIfAbsent(userId, id -> loadUser(id));
```

注意:`computeIfAbsent` 的 mapping function 不应执行太慢或递归修改同一个 map,否则可能影响桶锁持有时间或触发异常。

### size 统计

ConcurrentHashMap 的 size 在并发下不是简单 int 自增。它使用类似 LongAdder 的分散计数思想减少竞争。

注意:

- `size()` 在并发变化时只是瞬时估计
- 不适合用 size 做强一致控制
- 需要容量控制时用专门缓存库或额外同步

### 弱一致迭代器

ConcurrentHashMap 的迭代器是 weakly consistent:

- 不会像 HashMap fail-fast 那样抛 ConcurrentModificationException
- 遍历时可以并发修改
- 可能看到部分修改,也可能看不到
- 不保证遍历期间的强一致快照

```java
for (Map.Entry<String, Integer> entry : map.entrySet()) {
    // 并发 put/remove 不会抛 CME
}
```

### 和 Hashtable / synchronizedMap 对比

| 容器              | 锁策略              | null           | 迭代           |
| ----------------- | ------------------- | -------------- | -------------- |
| Hashtable         | 方法级 synchronized | 不允许         | 老旧           |
| synchronizedMap   | 外部包装一把锁      | 取决于底层 Map | 遍历需手动同步 |
| ConcurrentHashMap | 分桶 / CAS 并发控制 | 不允许         | 弱一致         |

现代并发 Map 默认选 ConcurrentHashMap。

## 代码示例

### 线程安全计数

```java
ConcurrentHashMap<String, LongAdder> counts = new ConcurrentHashMap<>();

void record(String word) {
    counts.computeIfAbsent(word, k -> new LongAdder()).increment();
}
```

高并发计数时 `LongAdder` 比 `AtomicLong` 更适合热点更新。

### 安全初始化缓存

```java
class UserCache {
    private final ConcurrentHashMap<Long, User> cache = new ConcurrentHashMap<>();

    User get(long id) {
        return cache.computeIfAbsent(id, this::loadUser);
    }

    private User loadUser(long id) {
        return new User(id, "Alice");
    }
}
```

### 避免 containsKey + put

```java
// ❌ 非原子
if (!map.containsKey(key)) {
    map.put(key, value);
}

// ✅ 原子
map.putIfAbsent(key, value);
```

## 易错点 / 反例

### 1. 说 JDK 8 ConcurrentHashMap 还是 Segment 分段锁

JDK 8+ 主实现已经不是 Segment 分段锁,而是 CAS + synchronized 锁桶头节点。Segment 主要是兼容序列化等历史结构。

### 2. 使用 null 表示空值

ConcurrentHashMap 不允许 null key / value。需要表达空值时用 Optional、特殊对象或额外状态。

### 3. containsKey + put 当成原子操作

两个方法单独都是线程安全,组合起来不是原子。应使用 `putIfAbsent`、`computeIfAbsent`、`compute`、`merge`。

### 4. 在 computeIfAbsent 里做重操作

mapping function 可能在桶锁保护下执行。耗时太长会阻塞同桶其他更新。复杂加载可考虑 Future 缓存、异步加载或专门缓存库。

### 5. 依赖 size 做强一致判断

并发修改下 `size()` 只是瞬时视图。不要用 `if (map.size() < limit) put()` 实现严格容量控制。

### 6. 以为迭代器是快照

ConcurrentHashMap 迭代器弱一致,不抛 CME,但不保证看到遍历期间所有变更。需要一致快照时复制一份。

## 高频面试题(5 题)

- **Q1**: ConcurrentHashMap 如何保证线程安全?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  JDK 8+ 通过 volatile 保证可见性,CAS 处理空桶插入和初始化,synchronized 锁桶头节点处理冲突写入,扩容时用 ForwardingNode 和协助迁移机制。读操作通常无锁。

  &lt;details&gt;

- **Q2**: JDK 7 和 JDK 8 ConcurrentHashMap 有什么区别?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  JDK 7 使用 Segment 分段锁,每个 Segment 类似一个小 HashMap。JDK 8+ 取消 Segment 主结构,改为 Node 数组 + 链表 / 红黑树,用 CAS + synchronized 做桶级并发控制。

  &lt;details&gt;

- **Q3**: ConcurrentHashMap 为什么不允许 null?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  为避免并发语义歧义。`get(key)` 返回 null 时无法区分 key 不存在还是 value 本身为 null,而 containsKey + get 在并发下不是原子组合。所以 ConcurrentHashMap 禁止 null key / value。

  &lt;details&gt;

- **Q4**: `putIfAbsent` 和 `containsKey + put` 有什么区别?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  `containsKey + put` 是两个独立操作,中间可能被其他线程插入,不是原子。`putIfAbsent` 是 ConcurrentHashMap 提供的原子复合操作,能保证 key 不存在时才插入。

  &lt;details&gt;

- **Q5**: ConcurrentHashMap 迭代器是什么一致性?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  是弱一致迭代器。遍历时允许并发修改,不会抛 ConcurrentModificationException,但不保证看到所有修改,也不提供强一致快照。

  &lt;details&gt;

## 延伸资源

- [ConcurrentHashMap API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/ConcurrentHashMap.html)
- [OpenJDK ConcurrentHashMap 源码](https://github.com/openjdk/jdk/blob/jdk-21%2B35/src/java.base/share/classes/java/util/concurrent/ConcurrentHashMap.java)
- [java.util.concurrent 包说明](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/package-summary.html)

## (留白) 我的理解

> 这一段不强制填。

---

## HashMap 原理、扩容与 equals/hashCode

## TL;DR

> HashMap 是基于哈希表的 key-value 容器。JDK 8+ 底层是**数组 + 链表 + 红黑树**:先用 hash 定位桶,冲突时链表挂接,链表过长且容量足够时树化。正确使用 HashMap 的关键是理解 `equals` / `hashCode` 契约。

## 背景与动机

HashMap 解决的是按 key 快速查找 value 的问题:

```java
Map<Long, User> users = new HashMap<>();
users.put(1L, new User("Alice"));
User user = users.get(1L);
```

理想情况下,put / get 时间复杂度接近 O(1)。

但要理解这些问题:

- key 是怎么定位到数组下标的
- 哈希冲突怎么办
- 为什么重写 equals 必须重写 hashCode
- 扩容为什么影响性能
- 为什么 HashMap 不是线程安全的
- JDK 8 为什么引入红黑树

## 核心机制

### 底层结构

JDK 8+ HashMap 简化结构:

```text
table 数组
index 0: null
index 1: Node -> Node -> Node
index 2: null
index 3: TreeNode(红黑树)
...
```

每个 Node 保存:

```java
static class Node<K,V> {
    final int hash;
    final K key;
    V value;
    Node<K,V> next;
}
```

### put 流程

简化流程:

```text
put(key, value)
  1. 计算 key 的 hash
  2. 根据 hash 定位数组下标
  3. 桶为空:直接放新 Node
  4. 桶不为空:
      - key 相同:覆盖 value
      - key 不同:追加到链表或红黑树
  5. size 超过 threshold:扩容
```

下标计算:

```java
index = (table.length - 1) & hash;
```

HashMap 容量是 2 的幂,这样可以用位运算快速取模。

### hash 扰动

HashMap 会对 key 的 hashCode 做扰动:

```java
static final int hash(Object key) {
    int h;
    return (key == null) ? 0 : (h = key.hashCode()) ^ (h >>> 16);
}
```

目的:让高位信息参与低位计算,减少低位分布差导致的冲突。

### 哈希冲突

不同 key 可能定位到同一个桶:

```text
hash(key1) & (n - 1) == hash(key2) & (n - 1)
```

处理方式:

- 少量冲突:链表
- 链表过长且数组容量足够:红黑树

树化条件常见为:

- 链表长度达到 8
- table 容量至少 64

如果容量还小,优先扩容而不是树化。

### 扩容 resize

HashMap 默认:

- 初始容量 16
- 负载因子 0.75
- threshold = capacity × loadFactor

当 size 超过 threshold,触发扩容:

```text
容量翻倍 → 重新分布节点
```

JDK 8 优化:扩容时节点要么留在原 index,要么移动到 `oldIndex + oldCapacity`,不需要重新完整计算 hash。

扩容代价不小,如果预估元素数量较大,应指定初始容量:

```java
Map<Long, User> map = new HashMap<>(expectedSize * 4 / 3 + 1);
```

### equals / hashCode 契约

Object 契约要求:

- 如果 `a.equals(b)` 为 true,则 `a.hashCode() == b.hashCode()` 必须为 true
- hashCode 相同,equals 不一定 true
- equals 比较应满足自反、对称、传递、一致性

错误示例:

```java
class User {
    private Long id;

    @Override
    public boolean equals(Object o) {
        return o instanceof User user && Objects.equals(id, user.id);
    }

    // ❌ 没重写 hashCode
}
```

放入 HashMap / HashSet 后会查找失败。

正确:

```java
@Override
public int hashCode() {
    return Objects.hash(id);
}
```

### null key / null value

HashMap 允许:

- 一个 null key
- 多个 null value

```java
map.put(null, "x");
map.put("a", null);
```

ConcurrentHashMap 不允许 null key / value,避免并发语义歧义。

### HashMap 不是线程安全的

多线程同时读写 HashMap 可能导致:

- 数据丢失
- 读到不一致状态
- size 不准
- 扩容时结构异常

并发场景用 `ConcurrentHashMap` 或外部同步。

## 代码示例

### 正确的 key 类型

```java
import java.util.Objects;

public final class UserKey {
    private final long tenantId;
    private final long userId;

    public UserKey(long tenantId, long userId) {
        this.tenantId = tenantId;
        this.userId = userId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof UserKey key)) return false;
        return tenantId == key.tenantId && userId == key.userId;
    }

    @Override
    public int hashCode() {
        return Objects.hash(tenantId, userId);
    }
}
```

### 预估容量

```java
int expectedSize = 10_000;
Map<Long, User> users = new HashMap<>((int) (expectedSize / 0.75f) + 1);
```

### 统计次数

```java
Map<String, Integer> counts = new HashMap<>();
for (String word : words) {
    counts.merge(word, 1, Integer::sum);
}
```

## 易错点 / 反例

### 1. 重写 equals 不重写 hashCode

HashMap 先按 hash 定位桶,hash 不一致时根本找不到同一个桶。equals 相等但 hashCode 不等会导致 get / containsKey 失败。

### 2. 用可变对象做 key

```java
UserKey key = new UserKey(1L);
map.put(key, value);
key.setId(2L); // ❌ hash 变了
map.get(key);  // 可能找不到
```

HashMap key 应尽量不可变。

### 3. 以为 HashMap 有顺序

HashMap 不保证遍历顺序。需要插入顺序用 LinkedHashMap,需要排序用 TreeMap。

### 4. 并发写 HashMap

HashMap 不是线程安全容器。并发写用 ConcurrentHashMap,或在外层加锁。

### 5. 初始容量设成元素数量

如果要放 1000 个元素,`new HashMap<>(1000)` 不等于不会扩容。因为 threshold = capacity × 0.75。应按负载因子换算容量。

### 6. 认为链表长度到 8 一定树化

还要看 table 容量是否至少达到树化阈值。容量太小时优先扩容。

## 高频面试题(5 题)

- **Q1**: HashMap 底层结构是什么?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  JDK 8+ HashMap 底层是数组 + 链表 + 红黑树。数组每个位置是桶,hash 冲突时节点挂成链表,链表过长且容量足够时转换成红黑树,降低极端冲突下查询复杂度。

  &lt;details&gt;

- **Q2**: HashMap put 流程是什么?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  先计算 key 的 hash,根据 `(n - 1) & hash` 定位桶。桶为空直接插入;桶不为空则比较 hash 和 equals,相同 key 覆盖 value,不同 key 追加链表或红黑树。插入后 size 超过 threshold 则扩容。

  &lt;details&gt;

- **Q3**: 为什么重写 equals 必须重写 hashCode?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  HashMap 先用 hashCode 定位桶,再用 equals 判断 key 是否相等。如果两个对象 equals 相等但 hashCode 不同,它们会落到不同桶,导致 get / containsKey 找不到。

  &lt;details&gt;

- **Q4**: HashMap 扩容机制是什么?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  当 size 超过 capacity × loadFactor 时扩容,默认容量 16、负载因子 0.75。扩容通常容量翻倍,JDK 8 中节点要么留在原位置,要么移动到 oldIndex + oldCapacity。

  &lt;details&gt;

- **Q5**: HashMap 为什么线程不安全?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  HashMap 的 put、resize、链表 / 树结构修改都没有同步保护。多线程同时写可能导致数据丢失、结构不一致、size 错误等问题。并发场景应使用 ConcurrentHashMap。

  &lt;details&gt;

## 延伸资源

- [HashMap API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/HashMap.html)
- [OpenJDK HashMap 源码](https://github.com/openjdk/jdk/blob/jdk-21%2B35/src/java.base/share/classes/java/util/HashMap.java)
- [Object.hashCode API](<https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Object.html#hashCode()>)

## (留白) 我的理解

> 这一段不强制填。

---

## Java 集合框架总览(List / Set / Map)

## TL;DR

> Java 集合框架分两条主线:**Collection 存单个元素,List / Set / Queue 都属于它;Map 存 key-value 映射,不属于 Collection。** 选择集合看四件事:是否有序、是否去重、是否按 key 查找、是否需要线程安全。

## 背景与动机

真实业务大量处理一组数据:

- 用户列表
- 商品去重集合
- id 到对象的映射
- 任务队列
- 排序结果
- 缓存

数组长度固定,API 简单,不适合复杂业务。Java 集合框架提供统一接口和多种实现,让你按场景选择合适的数据结构。

核心价值:

- 统一抽象:`List` / `Set` / `Map`
- 泛型类型安全
- 丰富算法和工具类
- 可替换实现
- 支撑 Stream、并发集合等高级能力

## 核心机制

### 集合体系结构

```text
Iterable
└─ Collection
   ├─ List
   │  ├─ ArrayList
   │  └─ LinkedList
   ├─ Set
   │  ├─ HashSet
   │  ├─ LinkedHashSet
   │  └─ TreeSet
   └─ Queue / Deque
      ├─ ArrayDeque
      └─ PriorityQueue

Map
├─ HashMap
├─ LinkedHashMap
├─ TreeMap
└─ ConcurrentHashMap
```

注意:`Map` 不继承 `Collection`,因为它存的是 key-value 映射,不是单个元素集合。

### List:有序、可重复

`List` 特点:

- 保持插入顺序
- 允许重复元素
- 支持按 index 访问

常用实现:

| 实现         | 底层     | 特点                        | 适合场景                |
| ------------ | -------- | --------------------------- | ----------------------- |
| `ArrayList`  | 动态数组 | 随机访问快,尾部追加快       | 默认首选 List           |
| `LinkedList` | 双向链表 | 首尾插入删除方便,随机访问慢 | 队列 / 双端队列少量场景 |

`ArrayList` 通常是默认选择:

```java
List&lt;String&gt; names = new ArrayList<>();
names.add("Alice");
names.add("Bob");
System.out.println(names.get(0));
```

### Set:去重

`Set` 特点:

- 不允许重复元素
- 是否有序取决于实现

常用实现:

| 实现            | 顺序     | 底层           | 适合场景       |
| --------------- | -------- | -------------- | -------------- |
| `HashSet`       | 无保证   | HashMap        | 默认去重       |
| `LinkedHashSet` | 插入顺序 | HashMap + 链表 | 去重且保持顺序 |
| `TreeSet`       | 排序     | 红黑树         | 去重且排序     |

```java
Set&lt;String&gt; tags = new HashSet<>();
tags.add("java");
tags.add("java");
System.out.println(tags.size()); // 1
```

### Map:key-value 映射

`Map` 特点:

- key 唯一
- value 可重复
- 按 key 快速查找 value

常用实现:

| 实现                | 顺序            | 底层           | 适合场景            |
| ------------------- | --------------- | -------------- | ------------------- |
| `HashMap`           | 无保证          | 哈希表         | 默认 key-value 映射 |
| `LinkedHashMap`     | 插入 / 访问顺序 | HashMap + 链表 | LRU、保持顺序       |
| `TreeMap`           | key 排序        | 红黑树         | 范围查询、排序遍历  |
| `ConcurrentHashMap` | 无保证          | 并发哈希表     | 多线程并发读写      |

```java
Map<Long, String> userNames = new HashMap<>();
userNames.put(1L, "Alice");
System.out.println(userNames.get(1L));
```

### Iterator

`Iterable` 支持增强 for:

```java
for (String name : names) {
    System.out.println(name);
}
```

底层使用 `Iterator`:

```java
Iterator&lt;String&gt; it = names.iterator();
while (it.hasNext()) {
    String name = it.next();
}
```

遍历中安全删除:

```java
Iterator&lt;String&gt; it = names.iterator();
while (it.hasNext()) {
    if (it.next().isBlank()) {
        it.remove();
    }
}
```

更常用:

```java
names.removeIf(String::isBlank);
```

### Collections 工具类

`Collections` 提供集合工具方法:

```java
Collections.sort(list);
Collections.reverse(list);
Collections.unmodifiableList(list);
Collections.emptyList();
```

Java 9+ 常用不可变集合工厂:

```java
List&lt;String&gt; names = List.of("Alice", "Bob");
Set&lt;String&gt; tags = Set.of("java", "jvm");
Map<String, Integer> scores = Map.of("Alice", 90);
```

注意:`List.of` 不允许 null,返回不可变集合。

### 如何选择集合

```text
需要 key-value 查找? → Map
  ├─ 普通场景 → HashMap
  ├─ 保持插入顺序 → LinkedHashMap
  ├─ key 排序 / 范围查询 → TreeMap
  └─ 并发读写 → ConcurrentHashMap

只存元素? → Collection
  ├─ 允许重复且按下标访问 → ArrayList
  ├─ 去重 → HashSet
  ├─ 去重且保持插入顺序 → LinkedHashSet
  ├─ 去重且排序 → TreeSet
  └─ 队列 / 双端队列 → ArrayDeque
```

## 代码示例

### 按 id 去重并保持顺序

```java
List&lt;User&gt; users = List.of(
    new User(1L, "Alice"),
    new User(2L, "Bob"),
    new User(1L, "Alice2")
);

Map<Long, User> map = new LinkedHashMap<>();
for (User user : users) {
    map.putIfAbsent(user.id(), user);
}

List&lt;User&gt; deduped = new ArrayList<>(map.values());
```

### 统计词频

```java
Map<String, Integer> counts = new HashMap<>();
for (String word : words) {
    counts.merge(word, 1, Integer::sum);
}
```

### 排序去重

```java
Set&lt;Integer&gt; sorted = new TreeSet<>(List.of(3, 1, 2, 1));
System.out.println(sorted); // [1, 2, 3]
```

## 易错点 / 反例

### 1. 以为 HashMap / HashSet 有稳定顺序

HashMap 和 HashSet 不保证遍历顺序。需要顺序时用 LinkedHashMap / LinkedHashSet,需要排序时用 TreeMap / TreeSet。

### 2. 增强 for 中修改集合

```java
for (String name : names) {
    if (name.isBlank()) {
        names.remove(name); // ❌ ConcurrentModificationException
    }
}
```

用 `removeIf` 或 Iterator.remove。

### 3. `List.of` 后继续 add

```java
List&lt;String&gt; names = List.of("Alice");
names.add("Bob"); // ❌ UnsupportedOperationException
```

`List.of` 返回不可变集合。

### 4. TreeSet 元素没有比较规则

TreeSet 需要元素实现 Comparable,或构造时传 Comparator。否则添加时可能抛 `ClassCastException`。

### 5. 自定义对象放 HashSet 但不重写 equals/hashCode

Set 去重依赖 equals/hashCode。对象默认按引用比较,业务相同的两个对象不会被认为重复。

### 6. 滥用 LinkedList

很多人以为 LinkedList 插入删除一定更快。实际业务中随机访问和 CPU 缓存局部性很重要,ArrayList 通常更快。LinkedList 只在特定队列 / 频繁已知节点位置插删场景有价值。

## 高频面试题(5 题)

- **Q1**: Collection 和 Map 有什么区别?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  Collection 表示单个元素的集合,List / Set / Queue 都继承它。Map 表示 key-value 映射,key 唯一,value 可重复,不继承 Collection。

  &lt;details&gt;

- **Q2**: ArrayList 和 LinkedList 怎么选?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  ArrayList 基于动态数组,随机访问快,尾部追加快,通常是默认选择。LinkedList 基于双向链表,随机访问慢,每个节点有额外对象开销,只在少数队列 / 双端操作场景考虑。

  &lt;details&gt;

- **Q3**: HashSet、LinkedHashSet、TreeSet 区别是什么?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  HashSet 不保证顺序,默认去重;LinkedHashSet 保持插入顺序;TreeSet 按自然顺序或 Comparator 排序。三者都不允许重复元素。

  &lt;details&gt;

- **Q4**: HashMap、LinkedHashMap、TreeMap 区别是什么?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  HashMap 基于哈希表,不保证顺序;LinkedHashMap 在 HashMap 基础上维护链表,可保持插入或访问顺序;TreeMap 基于红黑树,按 key 排序,支持范围查询。

  &lt;details&gt;

- **Q5**: 遍历集合时如何安全删除元素?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  不能在增强 for 中直接调用集合 remove。可使用 Iterator 的 `remove()` 方法,或更推荐使用 `removeIf`。否则可能触发 fail-fast 的 `ConcurrentModificationException`。

  &lt;details&gt;

## 延伸资源

- [Collection API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Collection.html)
- [List API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/List.html)
- [Map API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Map.html)

## (留白) 我的理解

> 这一段不强制填。

---

## HTTP 协议基础与会话管理（Cookie / Session / Token）

## TL;DR

> HTTP 是无状态的请求-响应协议。会话管理通过 **Cookie + Session**（服务端存储）或 **Token**（JWT，客户端携带）实现。理解 HTTP 方法、状态码、请求头和会话机制是 Web 开发的基础。

## 背景与动机

HTTP（HyperText Transfer Protocol）是 Web 通信的基础协议。后端开发者需要理解：

- 请求和响应的结构
- 常用状态码的含义
- 无状态协议如何维持会话
- Cookie / Session / Token 的区别和选择
- HTTPS 的作用

## 核心机制

### HTTP 请求结构

```text
POST /api/users HTTP/1.1          ← 请求行（方法 路径 协议版本）
Host: example.com                  ← 请求头
Content-Type: application/json
Authorization: Bearer eyJhbG...
                                   ← 空行
{"name": "Alice", "age": 25}      ← 请求体
```

### HTTP 方法

| 方法    | 语义                        | 幂等 | 安全 |
| ------- | --------------------------- | ---- | ---- |
| GET     | 获取资源                    | 是   | 是   |
| POST    | 创建资源                    | 否   | 否   |
| PUT     | 全量更新                    | 是   | 否   |
| PATCH   | 部分更新                    | 否   | 否   |
| DELETE  | 删除资源                    | 是   | 否   |
| HEAD    | 获取响应头（不含 body）     | 是   | 是   |
| OPTIONS | 查询支持的方法（CORS 预检） | 是   | 是   |

幂等：多次执行结果相同。安全：不修改服务器状态。

### HTTP 状态码

| 范围 | 含义       | 常见                                                                                                           |
| ---- | ---------- | -------------------------------------------------------------------------------------------------------------- |
| 2xx  | 成功       | 200 OK、201 Created、204 No Content                                                                            |
| 3xx  | 重定向     | 301 永久重定向、302 临时重定向、304 Not Modified                                                               |
| 4xx  | 客户端错误 | 400 Bad Request、401 Unauthorized、403 Forbidden、404 Not Found、405 Method Not Allowed、429 Too Many Requests |
| 5xx  | 服务端错误 | 500 Internal Server Error、502 Bad Gateway、503 Service Unavailable、504 Gateway Timeout                       |

重点区分：

- **401 Unauthorized**：未认证（没有登录或 Token 无效）
- **403 Forbidden**：已认证但无权限
- **502 Bad Gateway**：网关（Nginx）无法连接上游服务
- **504 Gateway Timeout**：上游服务响应超时

### 常用请求头

| 头                   | 作用                                                |
| -------------------- | --------------------------------------------------- |
| `Content-Type`       | 请求体格式（application/json, multipart/form-data） |
| `Accept`             | 客户端期望的响应格式                                |
| `Authorization`      | 认证凭据（Bearer Token）                            |
| `Cookie`             | 携带 Cookie                                         |
| `User-Agent`         | 客户端标识                                          |
| `Origin` / `Referer` | 请求来源（CORS 相关）                               |
| `Cache-Control`      | 缓存策略                                            |

### 常用响应头

| 头                            | 作用           |
| ----------------------------- | -------------- |
| `Content-Type`                | 响应体格式     |
| `Set-Cookie`                  | 设置 Cookie    |
| `Location`                    | 重定向目标 URL |
| `Access-Control-Allow-Origin` | CORS 允许的源  |
| `Cache-Control`               | 缓存控制       |

### Cookie

Cookie 是服务端通过 `Set-Cookie` 头写入客户端浏览器的小段数据，后续请求自动携带：

```text
响应: Set-Cookie: session_id=abc123; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=3600
请求: Cookie: session_id=abc123
```

关键��性：

| 属性                  | 作用                     |
| --------------------- | ------------------------ |
| `HttpOnly`            | JS 无法读取，防 XSS 窃取 |
| `Secure`              | 只在 HTTPS 下发送        |
| `SameSite`            | 跨站请求限制（防 CSRF）  |
| `Max-Age` / `Expires` | 过期时间                 |
| `Path` / `Domain`     | 有效范围                 |

Java 中操作 Cookie：

```java
// 设置 Cookie
Cookie cookie = new Cookie("token", "abc123");
cookie.setHttpOnly(true);
cookie.setSecure(true);
cookie.setMaxAge(3600);
cookie.setPath("/");
response.addCookie(cookie);

// 读取 Cookie
Cookie[] cookies = request.getCookies();
```

### Session

Session 是服务端存储的用户会话数据，通过 Cookie 中的 Session ID 关联：

```text
客户端                          服务端
  │                              │
  │── 首次请求 ──────────────────>│
  │                              │ 创建 Session（内存/Redis）
  │<── Set-Cookie: JSESSIONID ──│ 返回 Session ID
  │                              │
  │── 带 JSESSIONID 请求 ──────>│
  │                              │ 根据 ID 查找 Session
  │<── 响应（个性化内容）────────│
```

Java 中操作 Session：

```java
HttpSession session = request.getSession();
session.setAttribute("user", currentUser);
User user = (User) session.getAttribute("user");
session.invalidate(); // 销毁 Session（退出登录）
```

Session 的问题：

- 服务端存储，占内存
- 集群环境需要共享 Session（Redis）
- 不适合移动端、微服务架构

### Token（JWT）

JWT（JSON Web Token）是无状态的认证方案：

```text
Header.Payload.Signature

eyJhbGciOiJIUzI1NiJ9.     ← Header（算法）
eyJ1c2VySWQiOjEsImV4cCI6MTcxNTEyMDAwMH0.  ← Payload（数据）
SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c  ← Signature（签名）
```

流程：

```text
登录 → 服务端生成 JWT → 返回给客户端
后续请求 → 客户端带 Authorization: Bearer &lt;jwt&gt;
服务端验证签名 → 解析 Payload → 获取用户信息
```

JWT vs Session：

|          | Session                | JWT                 |
| -------- | ---------------------- | ------------------- |
| 存储位置 | 服务端                 | 客户端              |
| 状态     | 有状态（服务端维护）   | 无状态              |
| 集群     | 需要共享存储           | 天然支持            |
| 注销     | 直接删除 Session       | 需要黑名单或短过期  |
| 大小     | Cookie 只存 ID（很小） | Token 较大          |
| 适用     | 传统 Web 应用          | API、微服务、移动端 |

### HTTPS

HTTPS = HTTP + TLS/SSL 加密：

```text
客户端 → TCP 连接 → TLS 握手（证书验证 + 密钥协商）→ 加密通信
```

作用：

- 加密传输内容（防窃听）
- 验证服务器身份（防中间人攻击）
- 数据完整性（防篡改）

生产环境必须使用 HTTPS。

### HTTP/1.1 vs HTTP/2

|      | HTTP/1.1                     | HTTP/2                     |
| ---- | ---------------------------- | -------------------------- |
| 连接 | 一个请求一个响应（队头阻塞） | 多路复用（一个连接多个流） |
| 头部 | 文本，重复传输               | HPACK 压缩                 |
| 推送 | 不支持                       | Server Push                |
| 格式 | 文本                         | 二进制帧                   |

## 代码示例

### Spring Boot 中使用 JWT

```java
// 生成 Token
String token = Jwts.builder()
    .setSubject(String.valueOf(userId))
    .setIssuedAt(new Date())
    .setExpiration(new Date(System.currentTimeMillis() + 3600_000))
    .signWith(secretKey, SignatureAlgorithm.HS256)
    .compact();

// 验证 Token
Claims claims = Jwts.parserBuilder()
    .setSigningKey(secretKey)
    .build()
    .parseClaimsJws(token)
    .getBody();
Long userId = Long.valueOf(claims.getSubject());
```

## 易错点 / 反例

### 1. 混淆 401 和 403

401 是"未认证"（需要登录），403 是"已认证但无权限"。很多 API 不区分这两个，容易误导客户端。

### 2. 在 Cookie 中存敏感数据

```java
new Cookie("password", "123456"); // ❌ Cookie 可被客户端读取和篡改
```

Cookie 只应存 Session ID 或 Token。敏感数据存服务端。

### 3. JWT 过大影响性能

JWT 每次请求都在 Header 中传输。Payload 塞太多数据会增加网络开销。JWT 应只包含必要的用户标识信息。

### 4. JWT 无法主动失效

JWT 在过期前都有效。用户修改密码或被封禁后，已签发的 JWT 仍可使用。解决：维护黑名单（Redis）或使用短过期 + Refresh Token。

### 5. 不设置 Cookie 的安全属性

```java
Cookie cookie = new Cookie("session", sid);
// ❌ 没有 HttpOnly、Secure、SameSite → 易受 XSS/CSRF 攻击
```

生产环境必须设置 HttpOnly、Secure、SameSite。

## 高频面试题（5 题）

- **Q1**: HTTP 和 HTTPS 的区别？
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  HTTP 明文传输，HTTPS 在 HTTP 基础上加 TLS/SSL 加密层。HTTPS 保证数据加密、服务器身份验证和数据完整性。默认端口 HTTP 80、HTTPS 443。生产环境必须 HTTPS。

  &lt;details&gt;

- **Q2**: Cookie 和 Session 的区别？
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  Cookie 存储在客户端浏览器，通过 HTTP 头自动携带，有大小限制。Session 存储在服务端，通过 Cookie 中的 Session ID 关联。Session 更安全但占服务端资源，集群需共享。

  &lt;details&gt;

- **Q3**: JWT 的优缺点？
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  优点：无状态，天然支持分布式，不需要服务端存储。缺点：无法主动失效，Token 较大增加传输开销，Payload 可被 Base64 解码（不应存敏感信息）。适合 API 和微服务场景。

  &lt;details&gt;

- **Q4**: GET 和 POST 的区别？
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  GET 语义是获取资源，参数在 URL 中，幂等且安全，可缓存。POST 语义是创建/提交数据，参数在 body 中，非幂等。GET 有 URL 长度限制，POST 没有。GET 请求不应有副作用。

  &lt;details&gt;

- **Q5**: 常见 HTTP 状态码？
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  200 成功、201 已创建、204 无内容、301 永久重定向、304 未修改、400 请求错误、401 未认证、403 无权限、404 未找到、500 服务器错误、502 网关错误、503 服务不可用、504 网关超时。

  &lt;details&gt;

## 延伸资源

- [MDN HTTP 文档](https://developer.mozilla.org/en-US/docs/Web/HTTP)
- [HTTP 状态码](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status)
- [JWT 规范 RFC 7519](https://datatracker.ietf.org/doc/html/rfc7519)

## (留白) 我的理解

> 这一段不强制填。

---

## Servlet 规范与 Tomcat 架构

## TL;DR

> Servlet 是 Java Web 的基础规范，定义了 HTTP 请求处理的标准接口。Tomcat 是最常用的 Servlet 容器，负责接收 HTTP 请求、创建 Request/Response 对象、调用 Servlet 处理、返回响应。Spring MVC 的 DispatcherServlet 本质就是一个 Servlet。

## 背景与动机

Web 应用需要：

- 监听 HTTP 端口
- 解析 HTTP 请求
- 路由到对应的处理逻辑
- 构建 HTTP 响应

Java 通过 Servlet 规范定义了标准接口，Web 容器（Tomcat、Jetty、Undertow）负责实现底层网络处理，开发者只需实现 Servlet 接口处理业务逻辑。

虽然现代开发很少直接写 Servlet（都用 Spring MVC），但理解 Servlet 是理解整个 Java Web 体系的基础。

## 核心机制

### Servlet 接口与生命周期

```text
容器启动 / 首次请求
    ↓
init(ServletConfig)  ← 初始化，只调用一次
    ↓
service(request, response)  ← 每次请求调用
    ↓ 根据 HTTP 方法分发
doGet / doPost / doPut / doDelete
    ↓
容器关闭
    ↓
destroy()  ← 销毁，只调用一次
```

```java
@WebServlet("/hello")
public class HelloServlet extends HttpServlet {

    @Override
    public void init() throws ServletException {
        // 初始化资源（一次）
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp)
            throws IOException {
        String name = req.getParameter("name");
        resp.setContentType("application/json;charset=UTF-8");
        resp.getWriter().write("{\"hello\": \"" + name + "\"}");
    }

    @Override
    public void destroy() {
        // 释放资源
    }
}
```

关键点：

- Servlet 是单实例多线程的（一个实例处理所有请求）
- 不要在 Servlet 中使用实例变量存请求级数据（线程不安全）
- init 和 destroy 只调用一次，service 每次请求调用

### Tomcat 架构

```text
Server（Tomcat 实例）
└── Service
    ├── Connector（HTTP/AJP 连接器，处理网络协议）
    │   ├── HTTP/1.1 NIO Connector（默认，端口 8080）
    │   └── AJP Connector（与 Nginx/Apache 交互）
    └── Engine（请求处理引擎）
        └── Host（虚拟主机，如 localhost）
            └── Context（Web 应用，如 /myapp）
                └── Wrapper（Servlet 包装）
```

请求处理流程：

```text
客户端请求 → Connector 接收 → 创建 Request/Response 对象
    → Engine → Host → Context → Filter 链 → Servlet
    → 响应写入 Response → Connector 发送回客户端
```

### Tomcat 线程模型

```text
Acceptor 线程 → 接受新连接
    ↓
Poller 线程 → NIO 多路复用，检测就绪事件
    ↓
Worker 线程池 → 执行 Servlet 处理请求
```

关键配置：

```xml
<Connector port="8080" protocol="HTTP/1.1"
    maxThreads="200"          <!-- Worker 线程池大小 -->
    minSpareThreads="10"      <!-- 最小空闲线程 -->
    acceptCount="100"         <!-- 等待队列长度 -->
    connectionTimeout="20000" <!-- 连接超时 ms -->
    maxConnections="10000"    <!-- 最大连接数 -->
/>
```

Spring Boot 配置：

```yaml
server:
  tomcat:
    threads:
      max: 200
      min-spare: 10
    accept-count: 100
    max-connections: 10000
```

### Filter（过滤器）

Filter 在 Servlet 之前/之后执行，形成链式调用：

```text
请求 → Filter1 → Filter2 → Filter3 → Servlet
响应 ← Filter1 ← Filter2 ← Filter3 ←
```

```java
@WebFilter("/*")
public class LogFilter implements Filter {

    @Override
    public void doFilter(ServletRequest request, ServletResponse response,
                         FilterChain chain) throws IOException, ServletException {
        long start = System.currentTimeMillis();

        chain.doFilter(request, response); // 继续链，不调用则请求中断

        long elapsed = System.currentTimeMillis() - start;
        log.info("{} {}ms", ((HttpServletRequest) request).getRequestURI(), elapsed);
    }
}
```

Spring Boot 中注册 Filter：

```java
@Bean
public FilterRegistrationBean&lt;LogFilter&gt; logFilter() {
    FilterRegistrationBean&lt;LogFilter&gt; reg = new FilterRegistrationBean<>();
    reg.setFilter(new LogFilter());
    reg.addUrlPatterns("/api/*");
    reg.setOrder(1);
    return reg;
}
```

常见 Filter 用途：编码设置、CORS、认证、日志、压缩。

### Listener（监听器）

监听 Servlet 容器事件：

| 监听器                   | 事件              |
| ------------------------ | ----------------- |
| `ServletContextListener` | 应用启动/关闭     |
| `HttpSessionListener`    | Session 创建/销毁 |
| `ServletRequestListener` | 请求开始/结束     |

```java
@WebListener
public class AppStartupListener implements ServletContextListener {
    @Override
    public void contextInitialized(ServletContextEvent sce) {
        log.info("应用启动");
    }

    @Override
    public void contextDestroyed(ServletContextEvent sce) {
        log.info("应用关闭");
    }
}
```

### ServletContext、Request、Session 作用域

| 作用域      | 对象               | 生命周期       |
| ----------- | ------------------ | -------------- |
| Application | ServletContext     | 应用启动到关闭 |
| Session     | HttpSession        | 用户会话期间   |
| Request     | HttpServletRequest | 一次请求       |

### Spring MVC 与 Servlet 的关系

```text
所有请求 → DispatcherServlet（本质是 HttpServlet 子类）
    → HandlerMapping → Controller → ViewResolver → 响应
```

Spring Boot 自动注册 DispatcherServlet，映射到 `/`。Spring MVC 是 Servlet 之上的高层抽象。

## 代码示例

### 编码 Filter

```java
public class EncodingFilter implements Filter {
    @Override
    public void doFilter(ServletRequest req, ServletResponse resp,
                         FilterChain chain) throws IOException, ServletException {
        req.setCharacterEncoding("UTF-8");
        resp.setCharacterEncoding("UTF-8");
        chain.doFilter(req, resp);
    }
}
```

### 获取请求信息

```java
protected void doGet(HttpServletRequest req, HttpServletResponse resp) {
    String method = req.getMethod();           // GET
    String uri = req.getRequestURI();          // /api/users
    String queryString = req.getQueryString(); // name=alice&age=25
    String ip = req.getRemoteAddr();           // 客户端 IP
    String header = req.getHeader("User-Agent");
}
```

## 易错点 / 反例

### 1. Servlet 中用实例变量存请求数据

```java
public class MyServlet extends HttpServlet {
    private String userName; // ❌ 实例变量，多线程共享

    protected void doGet(HttpServletRequest req, ...) {
        userName = req.getParameter("name"); // 线程不安全
    }
}
```

Servlet 是单实例多线程，请求级数据用局部变量。

### 2. Filter 忘记调用 chain.doFilter

```java
public void doFilter(...) {
    // 做了一些处理
    // ❌ 忘记 chain.doFilter → 请求到不了 Servlet
}
```

除非刻意中断请求（如鉴权失败），否则必须调用 `chain.doFilter`。

### 3. 不了解 Tomcat 线程池配置

默认 maxThreads=200，高并发场景可能不够。但设太大线程上下文切换也有开销。需要根据业务类型（CPU 密集 / IO 密集）压测调优。

### 4. 混淆 Servlet 的 javax 和 jakarta 包

Java EE 转到 Jakarta EE 后，包名从 `javax.servlet` 变为 `jakarta.servlet`。Spring Boot 3.x / Tomcat 10+ 使用 jakarta 包。注意依赖版本一致。

## 高频面试题（5 题）

- **Q1**: Servlet 的生命周期？
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  init（初始化，一次）→ service/doGet/doPost（每次请求）→ destroy（销毁，一次）。Servlet 是单实例多线程，容器管理其生命周期。

  &lt;details&gt;

- **Q2**: Filter 和 Interceptor 的区别？
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  Filter 是 Servlet 规范，在 DispatcherServlet 之前执行，基于回调（chain.doFilter）。Interceptor 是 Spring MVC 层，在 Handler 执行前后调用，可访问 Spring Bean 和 Handler 信息。Filter 更底层，Interceptor 更贴近业务。

  &lt;details&gt;

- **Q3**: Tomcat 的线程模型？
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  默认 NIO 模型：Acceptor 线程接受连接，Poller 线程用 NIO Selector 检测就绪事件，就绪后提交给 Worker 线程池执行 Servlet。maxThreads 控制 Worker 线程数，maxConnections 控制最大连接数。

  &lt;details&gt;

- **Q4**: DispatcherServlet 是什么？
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  DispatcherServlet 是 Spring MVC 的前端控制器，本质是 HttpServlet 的子类。所有请求进入 DispatcherServlet，由它分发到对应的 Controller。Spring Boot 自动注册并映射到 `/`。

  &lt;details&gt;

- **Q5**: Servlet 是线程安全的吗？
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  不是。Servlet 容器中一个 Servlet 类通常只有一个实例，多个请求由多个线程并发调用同一实例的 service 方法。不应在 Servlet 中使用实例变量存放请求级数据，应使用局部变量或 ThreadLocal。

  &lt;details&gt;

## 延伸资源

- [Jakarta Servlet 规范](https://jakarta.ee/specifications/servlet/6.0/)
- [Tomcat 架构概览](https://tomcat.apache.org/tomcat-10.1-doc/architecture/overview.html)

## (留白) 我的理解

> 这一段不强制填。

<!-- KNOWLEDGE-IMPORT:END -->
