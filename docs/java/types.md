---
title: '基本类型 / String'
order: 2
---

# 基本类型与 String

> Java 有 8 种基本类型和对应的包装类，理解自动装箱、String 池、== vs equals 是避免低级 Bug 的关键。

---

## 基本类型 vs 包装类

| 基本类型  | 包装类      | 大小   | 默认值   | 缓存范围     |
| --------- | ----------- | ------ | -------- | ------------ |
| `byte`    | `Byte`      | 8 bit  | 0        | -128 ~ 127   |
| `short`   | `Short`     | 16 bit | 0        | -128 ~ 127   |
| `int`     | `Integer`   | 32 bit | 0        | -128 ~ 127   |
| `long`    | `Long`      | 64 bit | 0L       | -128 ~ 127   |
| `float`   | `Float`     | 32 bit | 0.0f     | 无缓存       |
| `double`  | `Double`    | 64 bit | 0.0      | 无缓存       |
| `char`    | `Character` | 16 bit | '\u0000' | 0 ~ 127      |
| `boolean` | `Boolean`   | ~1 bit | false    | TRUE / FALSE |

```java
// 自动装箱 / 拆箱（Java 5+）
Integer a = 42;         // 装箱：编译器转为 Integer.valueOf(42)
int b = a;              // 拆箱：编译器转为 a.intValue()

// 选型原则
// - 局部变量、方法参数优先用基本类型（性能好、无 NPE 风险）
// - 集合元素、实体类字段用包装类（支持 null，避免默认值歧义）
```

---

## Integer 缓存机制

```java
// Integer.valueOf() 在 -128 ~ 127 范围内复用对象
Integer x = 127;
Integer y = 127;
System.out.println(x == y);      // true（同一缓存对象）

Integer p = 128;
Integer q = 128;
System.out.println(p == q);      // false（超出缓存，新对象）
System.out.println(p.equals(q)); // true（值相等）

// ❌ 包装类用 == 比较（只在缓存范围内碰巧正确）
if (a == b) { /* 不可靠 */ }

// ✅ 包装类一律用 equals 比较
if (a.equals(b)) { /* 始终正确 */ }
```

---

## == vs equals 详解

| 比较方式         | 基本类型   | 引用类型                   |
| ---------------- | ---------- | -------------------------- |
| `==`             | 比较**值** | 比较**内存地址**           |
| `equals`         | 不适用     | 比较**内容**（需正确重写） |
| `Objects.equals` | 不适用     | 空安全的 equals            |

```java
// Objects.equals 防止 NPE
String a = null;
String b = "hello";

// ❌ a.equals(b) → NullPointerException
// ✅ Objects.equals(a, b) → false，空安全
```

---

## String 池机制

```java
// 字符串常量池（String Pool，位于堆中的特殊区域）
String s1 = "hello";               // 常量池中创建
String s2 = "hello";               // 复用常量池中同一对象
String s3 = new String("hello");   // 堆中创建新对象

s1 == s2;          // true（同一常量池引用）
s1 == s3;          // false（不同对象）
s1.equals(s3);     // true（内容相同）

// intern()：将字符串加入常量池，返回常量池引用
String s4 = s3.intern();
s1 == s4;          // true
```

---

## StringBuilder vs 字符串拼接

```java
// ❌ 循环中用 + 拼接（每次创建新 String 对象，O(n^2) 时间复杂度）
String result = "";
for (String s : list) {
    result += s;   // 编译器无法优化循环中的拼接
}

// ✅ 用 StringBuilder（非线程安全，单线程场景首选）
StringBuilder sb = new StringBuilder(256);  // 预估容量，减少扩容
for (String s : list) {
    sb.append(s);
}
String result = sb.toString();

// StringBuffer（线程安全，性能差，现代代码基本不用）
```

**常用 String 方法速查：**

| 方法                    | 示例                           | 结果          |
| ----------------------- | ------------------------------ | ------------- |
| `length()`              | `"hello".length()`             | 5             |
| `charAt(i)`             | `"hello".charAt(0)`            | 'h'           |
| `substring(begin, end)` | `"hello".substring(1, 3)`      | "el"          |
| `trim()` / `strip()`    | `" hi ".strip()`               | "hi"          |
| `contains(s)`           | `"hello".contains("ell")`      | true          |
| `split(regex)`          | `"a,b,c".split(",")`           | ["a","b","c"] |
| `replace(old, new)`     | `"hello".replace("l", "r")`    | "herro"       |
| `String.format`         | `String.format("Hi %s", name)` | "Hi xxx"      |
| `String.join`           | `String.join(",", list)`       | "a,b,c"       |

---

## 类型转换

```java
// 自动类型提升（小 → 大，无精度损失）
int i = 100;
long l = i;       // int → long，自动
double d = i;     // int → double，自动

// 强制类型转换（大 → 小，可能丢失精度）
double pi = 3.14;
int n = (int) pi;  // 3，截断小数部分

// String 与基本类型互转
int a = Integer.parseInt("123");           // String → int
String s = String.valueOf(42);             // int → String
double d = Double.parseDouble("3.14");     // String → double
```

---

## 常见陷阱

```java
// ❌ 浮点数精度问题
System.out.println(0.1 + 0.2);  // 0.30000000000000004
System.out.println(0.1 + 0.2 == 0.3);  // false

// ✅ 金额计算用 BigDecimal
BigDecimal a = new BigDecimal("0.1");
BigDecimal b = new BigDecimal("0.2");
a.add(b);  // 0.3（精确）

// ❌ BigDecimal 用 double 构造器
new BigDecimal(0.1);  // 0.1000000000000000055511151231257827021181583404541015625

// ✅ BigDecimal 用 String 构造器
new BigDecimal("0.1");  // 0.1
```

```java
// ❌ 拆箱 NullPointerException
Integer n = null;
int val = n;  // NPE！拆箱调用 n.intValue()

// ✅ 先判空再拆箱
int val = (n != null) ? n : 0;
// 或使用 Optional
int val = Optional.ofNullable(n).orElse(0);
```

```java
// ❌ 字符串用 == 比较
String a = new String("hello");
String b = new String("hello");
if (a == b) { /* 永远不会进入 */ }

// ✅ 字符串用 equals 比较
if ("hello".equals(a)) { /* 常量放前面，防 NPE */ }
```
