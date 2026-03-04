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
