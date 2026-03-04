# 集合框架 / Java 8+

## 集合框架

### 选型对比

| 接口    | 实现类              | 特点                    | 选用场景         |
| ------- | ------------------- | ----------------------- | ---------------- |
| `List`  | `ArrayList`         | 动态数组，随机访问 O(1) | 频繁读取         |
| `List`  | `LinkedList`        | 双向链表，插入删除 O(1) | 频繁插入删除     |
| `Map`   | `HashMap`           | 哈希表，O(1)            | 通用             |
| `Map`   | `LinkedHashMap`     | 保持插入顺序            | 需要有序         |
| `Map`   | `TreeMap`           | 红黑树，按键排序        | 范围查询         |
| `Map`   | `ConcurrentHashMap` | 线程安全                | 多线程           |
| `Set`   | `HashSet`           | 基于 HashMap            | 去重，不需要顺序 |
| `Set`   | `TreeSet`           | 有序                    | 需要排序         |
| `Queue` | `ArrayDeque`        | 双端队列                | 栈/队列          |
| `Queue` | `PriorityQueue`     | 最小堆                  | 优先级队列       |

```java
// HashMap 内部原理（简述）
// - 数组 + 链表 + 红黑树
// - 链表长度 >= 8 且数组长度 >= 64 时树化（TreeNode）
// - 负载因子默认 0.75，超过则扩容（2倍）
// - Java 8 之前头插法（多线程扩容死循环），之后尾插法

// 常用操作
Map<String, Integer> map = new HashMap<>();
map.put("a", 1);
map.getOrDefault("missing", 0);
map.putIfAbsent("a", 99);          // 不存在时才放入
map.computeIfAbsent("list", k -> new ArrayList<>()).add(1);
map.merge("count", 1, Integer::sum); // 不存在则put，存在则用函数合并
```

---

## Java 8+ 特性

```java
// Lambda
Runnable r = () -> System.out.println("Hello");
Comparator<String> cmp = (a, b) -> a.compareTo(b);

// 方法引用
Arrays.sort(names, String::compareTo);          // 实例方法引用
list.forEach(System.out::println);              // 实例方法引用
Stream.of("a","b").map(String::toUpperCase);    // 实例方法引用
Stream.generate(Random::new);                   // 构造方法引用

// Stream API
List<Integer> result = numbers.stream()
    .filter(n -> n > 0)
    .map(n -> n * 2)
    .sorted()
    .distinct()
    .limit(10)
    .collect(Collectors.toList());

// 聚合
int sum = numbers.stream().reduce(0, Integer::sum);
Map<Boolean, List<Integer>> partition =
    numbers.stream().collect(Collectors.partitioningBy(n -> n % 2 == 0));
Map<String, List<Person>> byCity =
    people.stream().collect(Collectors.groupingBy(Person::getCity));

// Optional（避免 NPE）
Optional<String> opt = Optional.ofNullable(value);
opt.isPresent()
opt.get()                         // 不存在抛异常
opt.orElse("default")
opt.orElseGet(() -> compute())
opt.orElseThrow(() -> new RuntimeException())
opt.map(String::toUpperCase).filter(s -> s.startsWith("A"))

// 接口 default 方法
interface Greeting {
    default String greet(String name) { return "Hello, " + name; }
    static Greeting simple() { return name -> "Hi " + name; } // 工厂方法
}
```
