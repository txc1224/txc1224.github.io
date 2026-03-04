# 面向对象 / 泛型

## 面向对象

### 抽象类 vs 接口

|          | 抽象类                   | 接口                                          |
| -------- | ------------------------ | --------------------------------------------- |
| 关键字   | `abstract class`         | `interface`                                   |
| 多继承   | ❌ 单继承                | ✅ 多实现                                     |
| 构造方法 | ✅                       | ❌                                            |
| 字段     | 任意                     | `public static final`（常量）                 |
| 方法     | 可有实现                 | 默认 abstract，可有 `default` 方法（Java 8+） |
| 适用场景 | 模板方法模式，有共享状态 | 行为契约，多态能力                            |

```java
// 多态
Animal animal = new Dog(); // 向上转型（自动）
Dog dog = (Dog) animal;    // 向下转型（手动，运行时检查）

// ✅ 安全转型（Java 16+ pattern matching）
if (animal instanceof Dog d) {
    d.bark(); // 直接使用，无需强转
}

// final / static
final class ImmutablePoint {}         // 不可继承
class Counter {
    private static int count = 0;     // 类级别，所有实例共享
    public final void increment() {}  // 不可重写
}
```

---

## 泛型

```java
// 泛型类
public class Pair<A, B> {
    private A first;
    private B second;
    public Pair(A first, B second) {
        this.first = first;
        this.second = second;
    }
}

// 泛型方法
public <T extends Comparable<T>> T max(T a, T b) {
    return a.compareTo(b) >= 0 ? a : b;
}

// 边界通配符
// ? extends T：读取（协变，生产者用 extends）
void printList(List<? extends Number> list) {
    for (Number n : list) System.out.println(n);
}

// ? super T：写入（逆变，消费者用 super）
void addIntegers(List<? super Integer> list) {
    list.add(1);
    list.add(2);
}

// PECS 原则：Producer Extends, Consumer Super

// ⚠️ 类型擦除：泛型信息在编译后被擦除
// List<Integer> 和 List<String> 运行时都是 List
// 不能用 instanceof 判断：list instanceof List<Integer> // 编译错误
```
