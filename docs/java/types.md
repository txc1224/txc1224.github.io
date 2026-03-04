# 基本类型 / String

## 基本类型 vs 包装类

| 基本类型  | 包装类      | 大小   | 默认值   |
| --------- | ----------- | ------ | -------- |
| `int`     | `Integer`   | 32 bit | 0        |
| `long`    | `Long`      | 64 bit | 0L       |
| `double`  | `Double`    | 64 bit | 0.0      |
| `boolean` | `Boolean`   | 1 bit  | false    |
| `char`    | `Character` | 16 bit | '\u0000' |
| `byte`    | `Byte`      | 8 bit  | 0        |

```java
// 自动装箱 / 拆箱
Integer a = 42;          // 装箱：Integer.valueOf(42)
int b = a;               // 拆箱：a.intValue()

// ⚠️ Integer 缓存池（-128 ~ 127 复用对象）
Integer x = 127;
Integer y = 127;
x == y;    // true（缓存池复用）

Integer p = 128;
Integer q = 128;
p == q;    // false（超出缓存范围，新对象）
p.equals(q); // true（比较值用 equals）

// ⚠️ 拆箱 NullPointerException
Integer n = null;
int val = n; // NullPointerException！
```

---

## String 内存模型

```java
// String Pool（字符串常量池，堆中的特殊区域）
String s1 = "hello";        // 常量池
String s2 = "hello";        // 复用常量池
String s3 = new String("hello"); // 堆中新对象

s1 == s2;         // true（同一常量池引用）
s1 == s3;         // false（不同对象）
s1.equals(s3);    // true

s3.intern();      // 将 s3 加入常量池，返回常量池引用

// StringBuilder vs StringBuffer
// ❌ 循环中字符串拼接
String result = "";
for (String s : list) result += s; // 每次创建新对象，O(n²)

// ✅ StringBuilder（非线程安全，单线程用）
StringBuilder sb = new StringBuilder();
for (String s : list) sb.append(s);
String result = sb.toString();

// StringBuffer（线程安全，性能差，基本不用）

// 常用方法
String s = "Hello World";
s.length()              // 11
s.charAt(0)             // 'H'
s.substring(6)          // "World"
s.substring(6, 11)      // "World"
s.toLowerCase() / toUpperCase()
s.trim() / s.strip()    // strip() 处理 Unicode 空白
s.contains("World")
s.startsWith("Hello") / endsWith("World")
s.replace("Hello", "Hi")
s.split(" ")            // ["Hello", "World"]
s.indexOf("o")          // 4
String.format("Hello, %s! Age: %d", name, age)
```
