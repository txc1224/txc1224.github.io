---
title: '面向对象 / 泛型'
order: 3
---

# 面向对象与泛型

> Java 面向对象三大特性：封装、继承、多态。泛型提供编译期类型安全，反射提供运行时动态能力。

---

## 接口 vs 抽象类

| 特性     | 抽象类 `abstract class` | 接口 `interface`                       |
| -------- | ----------------------- | -------------------------------------- |
| 多继承   | 单继承                  | 多实现                                 |
| 构造方法 | 有                      | 无                                     |
| 字段     | 任意字段                | 仅 `public static final` 常量          |
| 方法     | 抽象 + 具体方法         | 抽象 + `default` + `static`（Java 8+） |
| 私有方法 | 有                      | Java 9+ 支持                           |
| 状态     | 可以有实例状态          | 无状态                                 |
| 设计意图 | "是什么"（is-a）        | "能做什么"（can-do）                   |
| 典型场景 | 模板方法模式，共享代码  | 行为契约，多态能力，解耦               |

---

## 访问修饰符

| 修饰符       | 同类 | 同包 | 子类 | 其他包 |
| ------------ | :--: | :--: | :--: | :----: |
| `private`    |  ✅  |  ❌  |  ❌  |   ❌   |
| 默认（包级） |  ✅  |  ✅  |  ❌  |   ❌   |
| `protected`  |  ✅  |  ✅  |  ✅  |   ❌   |
| `public`     |  ✅  |  ✅  |  ✅  |   ✅   |

> 原则：字段一律 `private`，通过方法暴露。最小化访问范围。

---

## 多态与类型转换

```java
// 向上转型（自动，安全）
Animal animal = new Dog();
animal.speak();  // 调用 Dog 的实现（运行时多态）

// 向下转型（手动，可能 ClassCastException）
Dog dog = (Dog) animal;

// ✅ Java 16+ Pattern Matching for instanceof
if (animal instanceof Dog d) {
    d.fetch();  // 直接使用，无需强转
}

// ✅ sealed 类（Java 17+，限定子类范围）
public sealed class Shape permits Circle, Rectangle, Triangle {}
public final class Circle extends Shape {}
public non-sealed class Rectangle extends Shape {}  // 开放继承
```

---

## record 类（Java 16+）

```java
// 不可变数据载体，编译器自动生成：
// 构造方法、getter、equals、hashCode、toString
public record Point(int x, int y) {}

Point p = new Point(1, 2);
p.x();           // 1（注意没有 get 前缀）
p.toString();    // Point[x=1, y=2]

// 紧凑构造方法：用于参数校验
public record Range(int min, int max) {
    public Range {
        if (min > max) throw new IllegalArgumentException("min > max");
    }
}

// record 与 DTO：替代 Lombok @Data 用于纯数据传输
// ❌ 不适合需要可变状态的场景（record 字段都是 final）
```

---

## 泛型

```java
// 泛型类
public class Pair<A, B> {
    private final A first;
    private final B second;
    public Pair(A first, B second) {
        this.first = first;
        this.second = second;
    }
}

// 泛型方法
public <T extends Comparable<T>> T max(T a, T b) {
    return a.compareTo(b) >= 0 ? a : b;
}
```

---

## 通配符：PECS 原则

> Producer Extends, Consumer Super（生产者用 extends，消费者用 super）

| 通配符        | 含义          |         能读          |   能写    | 场景               |
| ------------- | ------------- | :-------------------: | :-------: | ------------------ |
| `? extends T` | T 或 T 的子类 |       ✅ 读为 T       |    ❌     | 只读集合（生产者） |
| `? super T`   | T 或 T 的父类 | ❌（只能读为 Object） | ✅ 写入 T | 只写集合（消费者） |
| `?`           | 任意类型      | ❌（只能读为 Object） |    ❌     | 不关心类型         |

```java
// 读取：用 extends
void printAll(List<? extends Number> list) {
    for (Number n : list) System.out.println(n);  // 安全读取为 Number
}

// 写入：用 super
void addInts(List<? super Integer> list) {
    list.add(1);  // 安全写入 Integer
    list.add(2);
}

// Collections.copy 就是 PECS 的经典体现
public static <T> void copy(List<? super T> dest, List<? extends T> src)
```

---

## 反射基础

```java
// 获取 Class 对象的三种方式
Class<?> clazz1 = String.class;
Class<?> clazz2 = "hello".getClass();
Class<?> clazz3 = Class.forName("java.lang.String");

// 反射创建实例
Object obj = clazz.getDeclaredConstructor().newInstance();

// 反射调用方法
Method method = clazz.getDeclaredMethod("setName", String.class);
method.setAccessible(true);  // 访问私有方法
method.invoke(obj, "value");

// 反射读写字段
Field field = clazz.getDeclaredField("name");
field.setAccessible(true);
field.set(obj, "value");
```

> 反射性能较差，避免在热路径中使用。Spring/MyBatis 等框架底层大量使用反射。

---

## 常见陷阱

```java
// ❌ 重写 equals 不重写 hashCode（违反契约，HashMap 失效）
public class User {
    private String name;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof User u)) return false;
        return Objects.equals(name, u.name);
    }
    // 忘记重写 hashCode → HashSet/HashMap 中行为异常
}

// ✅ equals 和 hashCode 必须一起重写
@Override
public int hashCode() {
    return Objects.hash(name);
}
```

```java
// ❌ 泛型类型擦除导致的误解
List<Integer> intList = new ArrayList<>();
List<String> strList = new ArrayList<>();
// 运行时 intList.getClass() == strList.getClass() → true
// 不能用 instanceof 判断泛型类型

// ❌ 不能创建泛型数组
// T[] arr = new T[10]; // 编译错误

// ✅ 理解擦除后的边界
// List<Integer> 编译后就是 List，泛型信息只在编译期检查
```

```java
// ❌ 用 getClass() 判断类型（破坏多态）
if (animal.getClass() == Dog.class) { /* 不包含子类 */ }

// ✅ 用 instanceof（包含子类）
if (animal instanceof Dog d) { /* 包含 Dog 及其子类 */ }
```
