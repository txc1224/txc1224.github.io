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

<!-- KNOWLEDGE-IMPORT:START -->

## Java 控制流(if / switch / loop)

## TL;DR

> Java 控制流决定代码执行路径:`if` 处理条件分支,`switch` 处理多分支匹配,`for / while` 处理循环。现代 Java 的 `switch expression` 可以返回值,比传统 switch 更安全、更清晰。

## 背景与动机

程序不是从上到下一直顺序执行。真实业务需要:

- 按条件走不同逻辑
- 根据状态码选择处理方式
- 遍历集合 / 数组
- 在满足条件时提前退出
- 对异常输入做保护性返回

控制流就是组织这些执行路径的基础语法。Java 的控制流看似简单,但面试和实际项目里常见坑集中在:

- switch 漏写 `break`
- `==` 比较字符串
- 循环边界 off-by-one
- 增强 for 中修改集合
- `return / break / continue` 语义混淆

## 核心机制

### `if / else`

```java
if (score >= 90) {
    grade = "A";
} else if (score >= 60) {
    grade = "Pass";
} else {
    grade = "Fail";
}
```

Java 的 `if` 条件必须是 boolean,不能像 JS 那样用 truthy / falsy:

```java
int count = 1;
// if (count) {} // ❌ 编译错误
if (count > 0) {} // ✅
```

Guard Clause 可以减少嵌套:

```java
void createOrder(User user, List&lt;Item&gt; items) {
    if (user == null) {
        throw new IllegalArgumentException("user is required");
    }
    if (items == null || items.isEmpty()) {
        throw new IllegalArgumentException("items is empty");
    }

    // main logic
}
```

### 传统 `switch statement`

```java
switch (status) {
    case "NEW":
        handleNew();
        break;
    case "PAID":
        handlePaid();
        break;
    default:
        handleUnknown();
}
```

传统 switch 如果不写 `break`,会继续执行下一个 case,叫 fall-through:

```java
switch (level) {
    case 1:
        System.out.println("one");
    case 2:
        System.out.println("two");
}
```

`level = 1` 时会输出 `one` 和 `two`。

### `switch expression`

现代 Java 支持 switch 作为表达式返回值:

```java
String label = switch (status) {
    case "NEW" -> "新建";
    case "PAID" -> "已支付";
    case "CANCELLED" -> "已取消";
    default -> "未知";
};
```

多语句分支用 `yield`:

```java
String label = switch (status) {
    case "PAID" -> {
        logPaid();
        yield "已支付";
    }
    default -> "未知";
};
```

优点:

- 不需要 `break`
- 可以返回值
- 分支更清晰
- 搭配 enum 时更容易检查覆盖完整性

### `for` 循环

```java
for (int i = 0; i < 10; i++) {
    System.out.println(i);
}
```

三段含义:

```text
初始化 → 条件判断 → 循环体 → 更新 → 条件判断 → ...
```

常见边界:

- 从 `0` 开始
- 条件用 `< length`
- 最后一个下标是 `length - 1`

### 增强 for

```java
for (String name : names) {
    System.out.println(name);
}
```

适合只读遍历数组 / Iterable。需要下标时用普通 for。

不要在增强 for 中直接修改集合结构:

```java
for (String name : names) {
    if (name.isBlank()) {
        names.remove(name); // ❌ 可能 ConcurrentModificationException
    }
}
```

修复:

```java
names.removeIf(String::isBlank);
```

### `while` 和 `do while`

`while`:先判断再执行。

```java
while (reader.hasNext()) {
    process(reader.next());
}
```

`do while`:先执行一次再判断。

```java
do {
    input = readInput();
} while (!isValid(input));
```

`do while` 至少执行一次,适合“先读一次再判断”的场景。

### `break` / `continue` / `return`

| 语句       | 作用                            |
| ---------- | ------------------------------- |
| `break`    | 退出当前循环或 switch           |
| `continue` | 跳过本轮循环剩余代码,进入下一轮 |
| `return`   | 退出当前方法                    |

```java
for (int n : nums) {
    if (n < 0) {
        continue;
    }
    if (n == 0) {
        break;
    }
    System.out.println(n);
}
```

### 标签 break

Java 支持标签跳出外层循环:

```java
outer:
for (int i = 0; i < rows; i++) {
    for (int j = 0; j < cols; j++) {
        if (grid[i][j] == target) {
            break outer;
        }
    }
}
```

实际项目中少用。复杂嵌套通常更适合提取方法并用 `return`。

## 代码示例

### enum + switch expression

```java
enum OrderStatus {
    NEW, PAID, SHIPPED, CANCELLED
}

class OrderView {
    static String label(OrderStatus status) {
        return switch (status) {
            case NEW -> "新建";
            case PAID -> "已支付";
            case SHIPPED -> "已发货";
            case CANCELLED -> "已取消";
        };
    }
}
```

### 安全删除集合元素

```java
List&lt;String&gt; names = new ArrayList<>(List.of("Alice", "", "Bob"));
names.removeIf(String::isBlank);
```

### Guard Clause

```java
void pay(Order order) {
    if (order == null) {
        throw new IllegalArgumentException("order is required");
    }
    if (!order.canPay()) {
        throw new IllegalStateException("order cannot pay");
    }

    order.pay();
}
```

## 易错点 / 反例

### 1. 传统 switch 漏 `break`

```java
switch (type) {
    case "A":
        handleA();
    case "B":
        handleB();
}
```

如果不是刻意 fall-through,优先用 `switch expression` 的 `->`。

### 2. 字符串用 `==` 比较

```java
if (status == "PAID") { // ❌ 比引用
}
```

修复:

```java
if ("PAID".equals(status)) {
}
```

### 3. 循环边界写错

```java
for (int i = 0; i <= arr.length; i++) { // ❌ 最后一次越界
    System.out.println(arr[i]);
}
```

应使用 `i < arr.length`。

### 4. 增强 for 中修改集合

```java
for (Item item : items) {
    items.remove(item); // ❌
}
```

使用 `Iterator.remove()` 或 `removeIf`。

### 5. `continue` 误以为退出循环

`continue` 只跳过本轮,不是退出循环。退出循环用 `break`,退出方法用 `return`。

### 6. 条件表达式过深

嵌套多层 `if` 会降低可读性。优先 guard clause、拆方法、用策略表或 enum 行为封装。

## 高频面试题(5 题)

- **Q1**: Java 的 `if` 条件和 JavaScript 有什么不同?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  Java 的 `if` 条件必须是 boolean 表达式,不能使用数字、字符串、对象的 truthy/falsy。比如 `if (count)` 在 Java 中编译失败,必须写 `if (count > 0)`。

  &lt;details&gt;

- **Q2**: 传统 switch 为什么容易出 bug?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  传统 switch statement 需要手写 `break`,否则会 fall-through 到后续 case。这个机制有时有用,但大多数业务分支里容易漏写导致多执行。现代 Java 可用 `switch expression` 和 `->` 避免。

  &lt;details&gt;

- **Q3**: `switch expression` 有什么优势?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  它可以返回值,使用 `->` 避免默认 fall-through,分支表达更清晰。多语句分支可用 `yield` 返回值。搭配 enum 时更适合表达状态到结果的映射。

  &lt;details&gt;

- **Q4**: 为什么增强 for 中不能随便删除集合元素?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  增强 for 底层使用 Iterator。遍历过程中直接通过集合修改结构会导致迭代器检测到并发修改,抛出 `ConcurrentModificationException`。应使用 `Iterator.remove()` 或 `removeIf`。

  &lt;details&gt;

- **Q5**: `break`、`continue`、`return` 的区别是什么?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  `break` 退出当前循环或 switch;`continue` 跳过当前循环剩余代码进入下一轮;`return` 直接退出当前方法,可带返回值。

  &lt;details&gt;

## 延伸资源

- [JLS 14: Blocks, Statements, and Patterns](https://docs.oracle.com/javase/specs/jls/se21/html/jls-14.html)
- [Oracle: Switch Expressions](https://docs.oracle.com/en/java/javase/21/language/switch-expressions.html)
- [Oracle Tutorial: Control Flow Statements](https://docs.oracle.com/javase/tutorial/java/nutsandbolts/flow.html)

## (留白) 我的理解

> 这一段不强制填。

---

## Java 异常处理(checked / unchecked / try-with-resources)

## TL;DR

> Java 异常是错误传播机制。`checked exception` 强制调用方处理或声明,`unchecked exception` 表示编程错误或运行期不可恢复问题。好异常处理的关键是:**不吞异常、保留上下文、在合适边界转换异常。**

## 背景与动机

程序运行时一定会遇到异常情况:

- 文件不存在
- 网络超时
- 参数非法
- 数据库连接失败
- 空指针
- 数组越界

如果每个方法都用错误码返回,调用方很容易忘记检查。异常机制让错误可以沿调用栈传播,直到被合适的层处理。

```java
try {
    service.createOrder(request);
} catch (IllegalArgumentException e) {
    return badRequest(e.getMessage());
}
```

异常处理不是“哪里报错哪里 catch”,而是要在能做出决策的边界处理。

## 核心机制

### Throwable 层级

```text
Throwable
├─ Error
│  ├─ OutOfMemoryError
│  └─ StackOverflowError
└─ Exception
   ├─ IOException              checked exception
   ├─ SQLException             checked exception
   └─ RuntimeException         unchecked exception
      ├─ NullPointerException
      ├─ IllegalArgumentException
      └─ IndexOutOfBoundsException
```

分类:

- `Error`:JVM 或系统级严重错误,通常不应捕获
- `Exception`:业务代码可处理的问题
- `RuntimeException`:非受检异常,编译器不强制处理

### checked vs unchecked

checked exception:

```java
void readFile(String path) throws IOException {
    Files.readString(Path.of(path));
}
```

调用方必须处理或继续声明:

```java
try {
    readFile("a.txt");
} catch (IOException e) {
    log.warn("read file failed", e);
}
```

unchecked exception:

```java
void updateAge(int age) {
    if (age < 0) {
        throw new IllegalArgumentException("age must be positive");
    }
}
```

调用方不需要强制 catch。

经验:

- 参数错误、状态错误:常用 unchecked
- 外部资源失败、调用方可能恢复:可用 checked
- Web 业务里通常在边界统一转成业务异常 / HTTP 响应

### `throw` vs `throws`

`throw`:真正抛出一个异常对象。

```java
throw new IllegalArgumentException("invalid age");
```

`throws`:方法签名声明可能抛出的 checked exception。

```java
void load() throws IOException {
}
```

### try-catch-finally

```java
try {
    riskyOperation();
} catch (IOException e) {
    log.warn("operation failed", e);
} finally {
    cleanup();
}
```

`finally` 通常用于清理资源,无论是否异常都会执行。注意不要在 finally 中覆盖原异常:

```java
try {
    throw new RuntimeException("main");
} finally {
    throw new RuntimeException("finally"); // ❌ main 异常被覆盖
}
```

### try-with-resources

实现 `AutoCloseable` 的资源可以自动关闭:

```java
try (BufferedReader reader = Files.newBufferedReader(Path.of("a.txt"))) {
    return reader.readLine();
}
```

编译器会生成关闭逻辑,并正确处理 suppressed exception。

多个资源按声明的反序关闭:

```java
try (
    InputStream in = Files.newInputStream(source);
    OutputStream out = Files.newOutputStream(target)
) {
    in.transferTo(out);
}
```

### 异常链

捕获底层异常后转换为业务异常时,应保留 cause:

```java
try {
    repository.save(order);
} catch (SQLException e) {
    throw new OrderCreateException("failed to create order: " + order.id(), e);
}
```

不要只保留 message:

```java
throw new OrderCreateException(e.getMessage()); // ❌ 丢失堆栈和根因
```

### 自定义异常

```java
class OrderCreateException extends RuntimeException {
    OrderCreateException(String message, Throwable cause) {
        super(message, cause);
    }
}
```

自定义异常适合表达业务边界的失败类型,不要为每个小错误都创建一个异常类。

## 代码示例

### 参数校验用 unchecked exception

```java
class UserService {
    void updateAge(long userId, int age) {
        if (age < 0 || age > 150) {
            throw new IllegalArgumentException("age out of range: " + age);
        }
        // update user
    }
}
```

### 资源读取用 try-with-resources

```java
import java.io.BufferedReader;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

class FileLoader {
    String firstLine(Path path) throws IOException {
        try (BufferedReader reader = Files.newBufferedReader(path)) {
            return reader.readLine();
        }
    }
}
```

### 转换异常并保留上下文

```java
class UserRepositoryException extends RuntimeException {
    UserRepositoryException(String message, Throwable cause) {
        super(message, cause);
    }
}

class UserRepository {
    void save(User user) {
        try {
            // jdbc save
        } catch (RuntimeException e) {
            throw new UserRepositoryException("save user failed, id=" + user.id(), e);
        }
    }
}
```

## 易错点 / 反例

### 1. 空 catch 吞异常

```java
try {
    doSomething();
} catch (Exception e) {
    // ❌ 什么都不做
}
```

这会让错误消失,后续问题更难排查。至少记录日志或转换后抛出。

### 2. 捕获过宽

```java
catch (Exception e) {
}
```

过宽捕获会把本不该处理的异常也吞掉。能捕获具体异常就捕获具体异常。

### 3. 日志 + 重新抛出导致重复日志

```java
catch (IOException e) {
    log.error("failed", e);
    throw new RuntimeException(e);
}
```

如果上层也会统一记录,这里会重复。通常在边界层记录,中间层保留上下文后抛出。

### 4. finally 里 return

```java
try {
    return "try";
} finally {
    return "finally"; // ❌ 覆盖 try 的返回和异常
}
```

finally 里不要 return,也不要抛出不必要的新异常。

### 5. 丢失异常 cause

```java
catch (SQLException e) {
    throw new RuntimeException("db failed"); // ❌ 丢失原始堆栈
}
```

应写:

```java
throw new RuntimeException("db failed", e);
```

### 6. 用异常控制正常流程

```java
try {
    Integer.parseInt(input);
} catch (NumberFormatException e) {
    // 大量正常分支靠异常驱动会影响可读性和性能
}
```

用户输入校验可以先判断格式,异常留给真正异常情况。

## 高频面试题(5 题)

- **Q1**: checked exception 和 unchecked exception 有什么区别?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  checked exception 是 `Exception` 下但不属于 `RuntimeException` 的异常,编译器强制调用方 catch 或 throws。unchecked exception 包括 `RuntimeException` 和 `Error`,编译器不强制处理。checked 常用于可恢复的外部失败,unchecked 常用于参数错误、状态错误、编程错误。

  &lt;details&gt;

- **Q2**: `throw` 和 `throws` 有什么区别?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  `throw` 是语句,用于实际抛出一个异常对象。`throws` 是方法签名的一部分,声明该方法可能向外抛出某些异常,主要用于 checked exception 的编译期检查。

  &lt;details&gt;

- **Q3**: try-with-resources 解决什么问题?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  它自动关闭实现 `AutoCloseable` 的资源,避免手写 finally 关闭遗漏或覆盖异常。多个资源会按声明反序关闭,关闭过程中产生的异常会作为 suppressed exception 保留。

  &lt;details&gt;

- **Q4**: 为什么不能空 catch?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  空 catch 会吞掉错误,调用方以为操作成功,但系统状态可能已经异常,排查时也没有日志和堆栈。正确做法是能处理就处理,不能处理就记录上下文后抛给上层。

  &lt;details&gt;

- **Q5**: 什么时候应该自定义异常?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  当需要表达业务边界的特定失败类型,或上层需要按类型区分处理时可以自定义异常。自定义异常应保留 message 和 cause,不要为每个底层小错误都创建异常类。

  &lt;details&gt;

## 延伸资源

- [JLS 11: Exceptions](https://docs.oracle.com/javase/specs/jls/se21/html/jls-11.html)
- [Oracle Java Tutorial: Exceptions](https://docs.oracle.com/javase/tutorial/essential/exceptions/)
- [Throwable API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Throwable.html)

## (留白) 我的理解

> 这一段不强制填。

---

## Java 泛型基础、类型擦除与通配符

## TL;DR

> Java 泛型是在编译期给类型加约束,让集合和 API 更安全。它通过**类型擦除**实现,运行期大多看不到具体泛型参数。通配符核心口诀:**PECS: Producer Extends, Consumer Super**。

## 背景与动机

没有泛型时,集合只能存 Object:

```java
List list = new ArrayList();
list.add("Alice");
Integer n = (Integer) list.get(0); // 运行期 ClassCastException
```

泛型把错误提前到编译期:

```java
List&lt;String&gt; names = new ArrayList<>();
names.add("Alice");
// names.add(123); // 编译错误
String name = names.get(0); // 不需要强转
```

泛型的价值:

- 编译期类型安全
- 减少强制类型转换
- 让 API 表达更清晰
- 支撑集合框架、Optional、Stream 等现代 Java API

## 核心机制

### 泛型类

```java
class Box&lt;T&gt; {
    private T value;

    public void set(T value) {
        this.value = value;
    }

    public T get() {
        return value;
    }
}
```

使用:

```java
Box&lt;String&gt; box = new Box<>();
box.set("hello");
String value = box.get();
```

常见类型参数命名:

- `T`:Type
- `E`:Element
- `K`:Key
- `V`:Value
- `R`:Result

### 泛型方法

类型参数写在返回类型前:

```java
static &lt;T&gt; T first(List&lt;T&gt; list) {
    if (list.isEmpty()) {
        throw new IllegalArgumentException("list is empty");
    }
    return list.get(0);
}
```

调用时通常由编译器推断:

```java
String name = first(List.of("Alice", "Bob"));
```

### 有界类型参数

限制 T 必须是某个类型的子类型:

```java
static <T extends Number> double sum(List&lt;T&gt; nums) {
    double total = 0;
    for (T n : nums) {
        total += n.doubleValue();
    }
    return total;
}
```

多重边界:

```java
<T extends Number & Comparable&lt;T&gt;>
```

如果有类边界,类必须放第一个,接口放后面。

### 类型擦除

Java 泛型主要在编译期生效。编译后类型参数会被擦除:

```java
List&lt;String&gt; names = new ArrayList<>();
List&lt;Integer&gt; nums = new ArrayList<>();
```

运行期它们都是 `List`:

```java
System.out.println(names.getClass() == nums.getClass()); // true
```

擦除大致规则:

- 无边界类型参数擦成 `Object`
- 有边界类型参数擦成第一个边界
- 编译器在必要处插入强转
- 为泛型重写生成 bridge method

这解释了为什么不能:

```java
// new T();               // ❌ 不知道 T 的运行期类型
// new List&lt;String&gt;[10];  // ❌ 泛型数组创建受限
// if (x instanceof List&lt;String&gt;) {} // ❌ 运行期没有 String 参数
```

### 泛型不变性

`List&lt;Integer&gt;` 不是 `List&lt;Number&gt;` 的子类型:

```java
List&lt;Integer&gt; ints = List.of(1, 2, 3);
// List&lt;Number&gt; nums = ints; // ❌ 编译错误
```

否则会破坏类型安全:

```java
// 如果允许:
List&lt;Integer&gt; ints = new ArrayList<>();
List&lt;Number&gt; nums = ints;
nums.add(3.14);          // 往 Integer 列表塞 Double
Integer x = ints.get(0); // 类型炸了
```

### 上界通配符 `? extends T`

表示某个未知的 T 子类型:

```java
static double sum(List<? extends Number> nums) {
    double total = 0;
    for (Number n : nums) {
        total += n.doubleValue();
    }
    return total;
}
```

可以读成 Number,但不能安全写入具体 Number 子类:

```java
void add(List<? extends Number> nums) {
    // nums.add(1); // ❌ 可能实际是 List&lt;Double&gt;
}
```

适合 producer:从里面生产 / 读取 T。

### 下界通配符 `? super T`

表示某个未知的 T 父类型:

```java
static void addIntegers(List<? super Integer> list) {
    list.add(1);
    list.add(2);
}
```

可以写入 Integer,但读出来只能当 Object:

```java
Object value = list.get(0);
```

适合 consumer:向里面消费 / 写入 T。

### PECS

**Producer Extends, Consumer Super**:

- 如果参数是生产者,你主要从里面读 T → `? extends T`
- 如果参数是消费者,你主要往里面写 T → `? super T`

例子:

```java
static &lt;T&gt; void copy(List<? extends T> src, List<? super T> dest) {
    for (T item : src) {
        dest.add(item);
    }
}
```

`src` 生产 T,用 extends;`dest` 消费 T,用 super。

### Raw Type

不写泛型参数就是 raw type:

```java
List list = new ArrayList(); // ❌ raw type
list.add("hello");
list.add(123);
```

raw type 会绕过泛型检查,把错误推迟到运行期。除兼容老代码外应避免。

## 代码示例

### 泛型 Repository

```java
interface Repository<ID, T> {
    T findById(ID id);
    void save(T entity);
}

class UserRepository implements Repository<Long, User> {
    @Override
    public User findById(Long id) {
        return new User(id, "Alice");
    }

    @Override
    public void save(User entity) {
        // save user
    }
}
```

### PECS copy

```java
static &lt;T&gt; void copy(List<? extends T> source, List<? super T> target) {
    for (T item : source) {
        target.add(item);
    }
}

List&lt;Integer&gt; ints = List.of(1, 2, 3);
List&lt;Number&gt; nums = new ArrayList<>();
copy(ints, nums);
```

### 类型擦除观察

```java
List&lt;String&gt; names = new ArrayList<>();
List&lt;Integer&gt; ages = new ArrayList<>();
System.out.println(names.getClass() == ages.getClass()); // true
```

## 易错点 / 反例

### 1. 以为 `List&lt;Integer&gt;` 是 `List&lt;Number&gt;`

```java
List&lt;Integer&gt; ints = new ArrayList<>();
// List&lt;Number&gt; nums = ints; // ❌
```

泛型是不变的。读用 `? extends Number`,写用 `? super Integer`。

### 2. `? extends` 里写数据

```java
void add(List<? extends Number> nums) {
    nums.add(1); // ❌
}
```

因为实际类型可能是 `List&lt;Double&gt;`。

### 3. `? super` 读取成具体类型

```java
void read(List<? super Integer> nums) {
    Integer n = nums.get(0); // ❌ 只能保证是 Object
}
```

### 4. 使用 raw type

```java
List list = new ArrayList();
list.add("x");
Integer n = (Integer) list.get(0); // 运行期炸
```

### 5. 运行期判断泛型参数

```java
if (list instanceof List&lt;String&gt;) { // ❌
}
```

类型擦除后运行期没有 `String` 参数信息。

### 6. 创建泛型数组

```java
List&lt;String&gt;[] arr = new List&lt;String&gt;[10]; // ❌
```

数组是运行期知道元素类型的,泛型参数会擦除,两者机制冲突。

## 高频面试题(5 题)

- **Q1**: Java 泛型解决什么问题?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  泛型让类型约束前移到编译期,避免集合里混入错误类型,减少强制类型转换,让 API 契约更清晰。比如 `List&lt;String&gt;` 保证只能放 String,取出时不用强转。

  &lt;details&gt;

- **Q2**: 什么是类型擦除?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  Java 泛型主要在编译期生效,编译后类型参数会被擦除。无边界擦成 Object,有边界擦成第一个边界,必要时插入强转和 bridge method。因此运行期通常无法知道 `List&lt;String&gt;` 的 String 参数。

  &lt;details&gt;

- **Q3**: 为什么 `List&lt;Integer&gt;` 不是 `List&lt;Number&gt;`?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  泛型是不变的。如果允许把 `List&lt;Integer&gt;` 赋给 `List&lt;Number&gt;`,就可以往里面添加 Double,破坏原列表只能存 Integer 的类型安全。

  &lt;details&gt;

- **Q4**: `? extends T` 和 `? super T` 有什么区别?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  `? extends T` 表示未知的 T 子类型,适合读取为 T,不适合写入具体 T;`? super T` 表示未知的 T 父类型,适合写入 T,读取时只能安全当 Object。

  &lt;details&gt;

- **Q5**: PECS 是什么?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  PECS 是 Producer Extends, Consumer Super。如果一个参数主要生产数据给你读,用 `? extends T`;如果它主要消费你写入的数据,用 `? super T`。典型例子是 `copy(List<? extends T> src, List<? super T> dest)`。

  &lt;details&gt;

## 延伸资源

- [JLS 4.5: Parameterized Types](https://docs.oracle.com/javase/specs/jls/se21/html/jls-4.html#jls-4.5)
- [Oracle Tutorial: Generics](https://docs.oracle.com/javase/tutorial/java/generics/)
- [Oracle Tutorial: Type Erasure](https://docs.oracle.com/javase/tutorial/java/generics/erasure.html)

## (留白) 我的理解

> 这一段不强制填。

---

## Java 方法、参数传递与重载

## TL;DR

> Java 方法是类中封装行为的基本单位。Java **只有值传递**:基本类型传值本身,引用类型传“引用的副本”。方法重载由编译期根据参数列表选择,不是运行期多态。

## 背景与动机

方法的作用:

- 给一段行为命名
- 复用逻辑
- 隐藏实现细节
- 降低单个方法复杂度
- 形成类对外的 API 契约

一个好的方法应该:

- 名字体现动作
- 参数少且语义清晰
- 返回值明确
- 单一职责
- 不依赖隐式副作用

## 核心机制

### 方法声明

```java
public int add(int a, int b) {
    return a + b;
}
```

组成:

```text
访问修饰符 返回类型 方法名(参数列表) throws 异常 { 方法体 }
```

例子:

```java
public String findNameById(long id) throws IOException {
    return "Alice";
}
```

### 方法签名

Java 方法签名由**方法名 + 参数类型列表**组成,不包含返回类型:

```java
void print(String value) {}
void print(int value) {}
// int print(String value) {} // ❌ 不能只靠返回类型区分重载
```

### 参数传递:Java 只有值传递

基本类型:

```java
static void change(int x) {
    x = 100;
}

public static void main(String[] args) {
    int a = 1;
    change(a);
    System.out.println(a); // 1
}
```

引用类型:

```java
static void rename(User user) {
    user.name = "Bob";
}

User u = new User("Alice");
rename(u);
System.out.println(u.name); // Bob
```

这看起来像引用传递,但本质是“引用值的副本”被传入。方法可以通过这个副本修改同一个对象,但不能让外部变量改指向:

```java
static void replace(User user) {
    user = new User("Bob");
}

User u = new User("Alice");
replace(u);
System.out.println(u.name); // Alice
```

内存模型直觉:

```text
main: u ───────▶ User("Alice")
          │
replace: user ─┘  // user 是引用副本

user = new User("Bob") 只改变副本 user 的指向,不改变 main 里的 u
```

### 方法重载 overload

同一个类中,方法名相同,参数列表不同:

```java
void log(String message) {}
void log(String message, Throwable error) {}
void log(int code, String message) {}
```

重载选择在编译期完成:

```java
void print(Object o) { System.out.println("Object"); }
void print(String s) { System.out.println("String"); }

Object value = "hello";
print(value); // Object,因为编译期类型是 Object
```

### 可变参数 varargs

```java
static int sum(int... nums) {
    int total = 0;
    for (int n : nums) {
        total += n;
    }
    return total;
}
```

调用:

```java
sum(1, 2, 3);
sum(new int[]{1, 2, 3});
```

规则:

- 可变参数本质是数组
- 一个方法最多一个可变参数
- 可变参数必须放最后

```java
void bad(String... names, int age) {} // ❌
```

### 递归

递归是方法调用自身:

```java
static long factorial(int n) {
    if (n < 0) {
        throw new IllegalArgumentException("n must be >= 0");
    }
    if (n <= 1) {
        return 1;
    }
    return n * factorial(n - 1);
}
```

递归必须有:

- 终止条件
- 每次递归向终止条件靠近

Java 没有保证尾递归优化,深递归可能 `StackOverflowError`。

### 返回值设计

常见返回方式:

- 返回实体:`User findById(long id)`
- 返回可空值:`User` 或 `null`
- 返回 Optional:`Optional&lt;User&gt;`
- 返回集合:`List&lt;User&gt;`
- 无返回:`void`

实践建议:

- 查询多条时返回空集合,不要返回 null
- 查询单条可能不存在时可用 `Optional&lt;T&gt;`
- 参数错误直接抛异常,不要返回特殊值混淆

```java
List&lt;User&gt; listUsers() {
    return List.of(); // 比 null 更安全
}
```

## 代码示例

### 引用副本示例

```java
class User {
    String name;
    User(String name) { this.name = name; }
}

public class PassByValueDemo {
    static void rename(User user) {
        user.name = "Bob";
    }

    static void replace(User user) {
        user = new User("Carol");
    }

    public static void main(String[] args) {
        User u = new User("Alice");
        rename(u);
        System.out.println(u.name); // Bob
        replace(u);
        System.out.println(u.name); // Bob
    }
}
```

### 参数对象减少长参数列表

```java
record CreateUserCommand(String name, String email, int age) {}

class UserService {
    User createUser(CreateUserCommand command) {
        return new User(command.name());
    }
}
```

## 易错点 / 反例

### 1. 说 Java 有引用传递

Java 没有引用传递。它传的是值;当参数是对象时,这个值是对象引用的副本。能改对象内容,不能改调用方变量指向。

### 2. 只靠返回类型重载

```java
int parse(String s) { return 1; }
long parse(String s) { return 1L; } // ❌ 编译错误
```

返回类型不是方法签名的一部分。

### 3. 重载 + null 造成歧义

```java
void test(String s) {}
void test(Integer i) {}

test(null); // ❌ 编译错误: ambiguous
```

需要显式转型:

```java
test((String) null);
```

### 4. 可变参数重载混乱

```java
void log(String message, Object... args) {}
void log(String message, Throwable error) {}
```

调用时可能不直观。API 设计应避免过度重载和 varargs 混用。

### 5. 递归没有终止条件

```java
int f(int n) {
    return f(n + 1); // ❌ StackOverflowError
}
```

### 6. 方法参数过多

```java
createUser(name, email, age, city, phone, role, source);
```

超过 4 个参数通常考虑封装成 command / request 对象。

## 高频面试题(5 题)

- **Q1**: Java 是值传递还是引用传递?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  Java 只有值传递。基本类型传值本身;引用类型传的是引用值的副本。方法里可以通过引用副本修改同一个对象的内部状态,但不能改变调用方变量指向。

  &lt;details&gt;

- **Q2**: 方法重载由什么决定?返回类型能否区分重载?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  方法重载由方法名和参数类型列表决定,返回类型不参与方法签名,不能只靠返回类型区分重载。重载选择发生在编译期。

  &lt;details&gt;

- **Q3**: 重载和重写的绑定时机有什么不同?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  重载是编译期根据参数静态类型选择方法;重写是运行期根据对象真实类型动态绑定。重载看引用的编译期类型,重写看对象的运行期类型。

  &lt;details&gt;

- **Q4**: 可变参数的本质和限制是什么?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  可变参数本质是数组。一个方法最多只能有一个可变参数,且必须位于参数列表最后。调用方可以传多个值,也可以直接传数组。

  &lt;details&gt;

- **Q5**: 递归方法要注意什么?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  必须有明确终止条件,每次递归都要向终止条件靠近。Java 不保证尾递归优化,深递归会导致 `StackOverflowError`,大规模递归可考虑改成循环或显式栈。

  &lt;details&gt;

## 延伸资源

- [JLS 8.4: Method Declarations](https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html#jls-8.4)
- [JLS 15.12: Method Invocation Expressions](https://docs.oracle.com/javase/specs/jls/se21/html/jls-15.html#jls-15.12)
- [Oracle Tutorial: Defining Methods](https://docs.oracle.com/javase/tutorial/java/javaOO/methods.html)

## (留白) 我的理解

> 这一段不强制填。

---

## Java 面向对象基础(类、封装、继承、多态)

## TL;DR

> Java 面向对象的核心是:**用类描述数据和行为,用封装控制访问,用继承表达 is-a 关系,用多态让同一调用在运行期绑定到不同实现。**接口是 Java 里最重要的抽象边界。

## 背景与动机

面向对象不是“把函数塞进 class”。它解决的是大型程序的组织问题:

- 数据和行为放在一起,形成清晰的业务对象
- 内部实现隐藏起来,外部只依赖稳定 API
- 通过抽象减少调用方对具体实现的依赖
- 运行时根据对象真实类型选择行为

Java 从语言层面支持 OOP:

- `class` 定义类型
- `private / protected / public` 控制访问
- `extends` 单继承
- `implements` 实现接口
- `abstract` 定义抽象父类 / 抽象方法
- 方法调用默认支持动态绑定

## 核心机制

### 类与对象

类是模板,对象是实例:

```java
class User {
    private String name;
    private int age;

    User(String name, int age) {
        this.name = name;
        this.age = age;
    }

    String displayName() {
        return name + "(" + age + ")";
    }
}
```

使用:

```java
User user = new User("Alice", 18);
System.out.println(user.displayName());
```

### 封装

封装的目标是隐藏内部状态,暴露受控行为:

```java
class Account {
    private long balanceCent;

    public void deposit(long amountCent) {
        if (amountCent <= 0) {
            throw new IllegalArgumentException("amount must be positive");
        }
        balanceCent += amountCent;
    }

    public long balanceCent() {
        return balanceCent;
    }
}
```

不要把字段全部 public:

```java
class BadAccount {
    public long balanceCent; // ❌ 外部可随意改成负数
}
```

封装不是为了“多写 getter/setter”,而是为了保护对象不变量。

### 继承

继承表达 is-a 关系:

```java
class Animal {
    void speak() {
        System.out.println("...");
    }
}

class Dog extends Animal {
    @Override
    void speak() {
        System.out.println("wang");
    }
}
```

Java 类只支持单继承:

```java
class Dog extends Animal { }
```

原因是避免多继承带来的菱形继承和状态冲突。多能力组合用 interface。

### 多态

父类引用可以指向子类对象,运行时调用子类实现:

```java
Animal animal = new Dog();
animal.speak(); // wang
```

这叫动态绑定。调用方只依赖抽象类型:

```java
void makeSound(Animal animal) {
    animal.speak();
}
```

后续新增 `Cat extends Animal`,调用方不用改。

### 重载 vs 重写

| 概念 | 英文     | 发生位置     | 判断依据                | 绑定时机 |
| ---- | -------- | ------------ | ----------------------- | -------- |
| 重载 | overload | 同一个类中   | 方法名相同,参数列表不同 | 编译期   |
| 重写 | override | 子类覆盖父类 | 方法签名兼容            | 运行期   |

重载:

```java
void print(String s) {}
void print(int n) {}
```

重写:

```java
class Parent {
    void run() {}
}
class Child extends Parent {
    @Override
    void run() {}
}
```

### 抽象类

抽象类可以有字段、构造器、普通方法和抽象方法:

```java
abstract class Shape {
    abstract double area();

    String type() {
        return getClass().getSimpleName();
    }
}

class Circle extends Shape {
    private final double radius;

    Circle(double radius) {
        this.radius = radius;
    }

    @Override
    double area() {
        return Math.PI * radius * radius;
    }
}
```

适合表达“同一类事物的公共骨架”。

### 接口

接口定义能力 / 契约:

```java
interface Payable {
    void pay(long amountCent);
}

class WeChatPay implements Payable {
    @Override
    public void pay(long amountCent) {
        System.out.println("pay by WeChat");
    }
}
```

调用方依赖接口:

```java
class OrderService {
    private final Payable payable;

    OrderService(Payable payable) {
        this.payable = payable;
    }

    void checkout(long amountCent) {
        payable.pay(amountCent);
    }
}
```

这就是依赖倒置:业务逻辑依赖抽象,不依赖具体支付实现。

### 抽象类 vs 接口

| 维度     | 抽象类       | 接口                |
| -------- | ------------ | ------------------- |
| 关系     | is-a         | can-do / capability |
| 继承数量 | 单继承       | 可实现多个          |
| 状态     | 可有实例字段 | 不适合放状态        |
| 构造器   | 有           | 无实例构造器        |
| 典型用途 | 公共骨架     | 能力契约 / SPI      |

经验:

- 优先用接口定义边界
- 需要共享状态和模板流程时才用抽象类
- 继承要谨慎,组合通常更灵活

## 代码示例

### 用接口实现可替换策略

```java
interface DiscountPolicy {
    long discount(long amountCent);
}

class NoDiscount implements DiscountPolicy {
    @Override
    public long discount(long amountCent) {
        return 0;
    }
}

class FullReduction implements DiscountPolicy {
    @Override
    public long discount(long amountCent) {
        return amountCent >= 10_000 ? 1_000 : 0;
    }
}

class PriceCalculator {
    private final DiscountPolicy policy;

    PriceCalculator(DiscountPolicy policy) {
        this.policy = policy;
    }

    long finalPrice(long amountCent) {
        return amountCent - policy.discount(amountCent);
    }
}
```

### 多态调用

```java
List&lt;DiscountPolicy&gt; policies = List.of(new NoDiscount(), new FullReduction());
for (DiscountPolicy policy : policies) {
    System.out.println(policy.discount(20_000));
}
```

## 易错点 / 反例

### 1. 把继承当代码复用工具

继承表达 is-a,不是“我想复用几个方法”。如果两个类不是稳定父子关系,优先组合:

```java
class OrderService {
    private final PriceCalculator calculator;
}
```

### 2. public setter 破坏封装

```java
public void setBalanceCent(long balanceCent) {
    this.balanceCent = balanceCent;
}
```

账户余额不应该被任意设置。应提供业务行为如 `deposit`、`withdraw`。

### 3. 忘记 `@Override`

```java
class Child extends Parent {
    void rum() {} // 拼错,本想重写 run
}
```

加 `@Override` 后编译器能发现错误。

### 4. 静态方法没有多态重写

`static` 方法属于类,不是对象实例。子类定义同名 static 方法是隐藏,不是运行期多态。

### 5. `private` 方法不能被重写

父类 private 方法对子类不可见。子类写同名方法只是新方法,不是 override。

### 6. 接口过大

一个接口塞太多方法会让实现类被迫依赖不需要的行为。应遵循接口隔离原则,拆成小而专一的接口。

## 高频面试题(5 题)

- **Q1**: 封装的意义是什么?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  封装是隐藏内部状态和实现细节,通过受控方法维护对象不变量。它不是简单地把字段改 private 再生成 getter/setter,而是让外部只能通过业务行为改变对象。

  &lt;details&gt;

- **Q2**: 重载和重写有什么区别?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  重载发生在同一类中,方法名相同但参数列表不同,编译期决定调用哪个。重写发生在子类覆盖父类方法,签名兼容,运行期根据对象真实类型动态绑定。

  &lt;details&gt;

- **Q3**: Java 多态是怎么体现的?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  父类或接口引用指向子类对象,调用方法时根据对象真实类型执行对应实现。比如 `Animal a = new Dog(); a.speak()` 调用的是 Dog 的 `speak`。

  &lt;details&gt;

- **Q4**: 抽象类和接口怎么选?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  接口表达能力和契约,一个类可实现多个接口,适合定义边界。抽象类表达共同骨架,可包含状态和模板方法,但只能单继承。一般优先接口,需要共享状态 / 流程时用抽象类。

  &lt;details&gt;

- **Q5**: 为什么说组合优于继承?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  继承会把子类和父类强耦合,父类变化容易影响子类,且 Java 只支持单继承。组合通过持有另一个对象来复用能力,关系更灵活、可替换、符合依赖倒置。

  &lt;details&gt;

## 延伸资源

- [JLS 8: Classes](https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html)
- [Oracle Java Tutorial: Object-Oriented Programming Concepts](https://docs.oracle.com/javase/tutorial/java/concepts/)
- [Oracle Java Tutorial: Interfaces and Inheritance](https://docs.oracle.com/javase/tutorial/java/IandI/)

## (留白) 我的理解

> 这一段不强制填。

---

## Java 基本类型、引用类型与包装类

## TL;DR

> Java 类型分两大类:**基本类型**直接存值,**引用类型**存对象引用。包装类让基本类型能作为对象使用,但自动装箱 / 拆箱会带来 `NullPointerException`、性能和 `==` 比较陷阱。

## 背景与动机

Java 是静态强类型语言。变量声明时必须有明确类型:

```java
int age = 18;
String name = "Alice";
```

这套类型系统解决三个问题:

- 编译期发现类型错误
- JVM 能高效分配和操作内存
- API 契约清晰,方法入参 / 返回值可预测

Java 同时保留基本类型,是为了性能:

- `int`、`double` 等直接存值,没有对象头和引用间接访问
- 大量数值计算不需要创建对象

但集合和泛型只能放对象,所以又需要包装类:

```java
List&lt;Integer&gt; nums = new ArrayList<>();
```

## 核心机制

### 8 种基本类型

| 类型      |               大小 | 默认值  | 说明             |
| --------- | -----------------: | ------- | ---------------- |
| `byte`    |              8 bit | `0`     | 小整数           |
| `short`   |             16 bit | `0`     | 小整数           |
| `int`     |             32 bit | `0`     | 默认整数类型     |
| `long`    |             64 bit | `0L`    | 大整数           |
| `float`   |             32 bit | `0.0f`  | 单精度浮点       |
| `double`  |             64 bit | `0.0d`  | 默认浮点类型     |
| `char`    |             16 bit | `' '`    | UTF-16 code unit |
| `boolean` | JVM 未规定精确大小 | `false` | 逻辑值           |

局部变量没有默认值,必须先赋值:

```java
void test() {
    int x;
    // System.out.println(x); // 编译错误: variable x might not have been initialized
}
```

成员变量才有默认值:

```java
class User {
    int age;        // 默认 0
    boolean active; // 默认 false
    String name;    // 默认 null
}
```

### 引用类型

除 8 种基本类型外,其他都是引用类型:

- class
- interface
- array
- enum
- record
- annotation

```java
String s = "hello";
int[] arr = {1, 2, 3};
User user = new User();
```

变量里保存的是对象引用,不是对象本身。多个变量可以指向同一个对象:

```java
User a = new User();
User b = a;
b.name = "Bob";
System.out.println(a.name); // Bob
```

### 包装类

基本类型和包装类对应关系:

| 基本类型  | 包装类      |
| --------- | ----------- |
| `byte`    | `Byte`      |
| `short`   | `Short`     |
| `int`     | `Integer`   |
| `long`    | `Long`      |
| `float`   | `Float`     |
| `double`  | `Double`    |
| `char`    | `Character` |
| `boolean` | `Boolean`   |

包装类用途:

- 放进集合 / 泛型
- 表示可空值 `null`
- 提供工具方法,如 `Integer.parseInt`
- 和反射、注解、框架绑定配合

### 自动装箱 / 自动拆箱

```java
Integer a = 10; // 自动装箱:Integer.valueOf(10)
int b = a;      // 自动拆箱:a.intValue()
```

编译器会改写成类似:

```java
Integer a = Integer.valueOf(10);
int b = a.intValue();
```

所以拆箱 null 会抛 `NullPointerException`:

```java
Integer count = null;
int n = count; // NPE: count.intValue()
```

### Integer 缓存

`Integer.valueOf` 默认缓存 `-128 ~ 127` 范围内的对象:

```java
Integer a = 127;
Integer b = 127;
System.out.println(a == b); // true

Integer c = 128;
Integer d = 128;
System.out.println(c == d); // false
```

原因:`==` 比较引用是否同一个对象,不是数值是否相等。比较包装类数值应使用 `equals`:

```java
System.out.println(c.equals(d)); // true
```

### 数值提升和溢出

整数运算默认至少提升到 `int`:

```java
byte a = 1;
byte b = 2;
// byte c = a + b; // 编译错误:a + b 是 int
byte c = (byte) (a + b);
```

整数会溢出,不会自动报错:

```java
int max = Integer.MAX_VALUE;
System.out.println(max + 1); // -2147483648
```

### 浮点精度与 BigDecimal

二进制浮点无法精确表示很多十进制小数:

```java
System.out.println(0.1 + 0.2); // 0.30000000000000004
```

金额计算应使用 `BigDecimal`,且优先用字符串构造:

```java
BigDecimal a = new BigDecimal("0.1");
BigDecimal b = new BigDecimal("0.2");
System.out.println(a.add(b)); // 0.3
```

不要这样:

```java
new BigDecimal(0.1); // ❌ 已经把 double 的误差带进来了
```

## 代码示例

### 包装类比较

```java
public class WrapperCompareDemo {
    public static void main(String[] args) {
        Integer a = 128;
        Integer b = 128;

        System.out.println(a == b);      // false
        System.out.println(a.equals(b)); // true
    }
}
```

### 拆箱 null

```java
public class UnboxingDemo {
    public static void main(String[] args) {
        Integer count = null;
        if (count != null && count > 0) {
            System.out.println("positive");
        }
    }
}
```

## 易错点 / 反例

### 1. 包装类用 `==` 比数值

```java
Integer a = 1000;
Integer b = 1000;
System.out.println(a == b); // ❌ false
```

修复:

```java
System.out.println(a.equals(b));
```

如果可能为 null:

```java
System.out.println(Objects.equals(a, b));
```

### 2. 自动拆箱导致 NPE

```java
Boolean enabled = null;
if (enabled) { // ❌ NPE
}
```

修复:

```java
if (Boolean.TRUE.equals(enabled)) {
}
```

### 3. 金额使用 double

```java
double price = 0.1 + 0.2; // ❌ 精度问题
```

修复:

```java
BigDecimal price = new BigDecimal("0.1").add(new BigDecimal("0.2"));
```

### 4. 忽略整数溢出

```java
int total = unitPriceCent * count; // 可能溢出
```

金额分单位计算时常用 `long`,极端场景用 `BigInteger` 或范围校验。

### 5. 误解 `char` 等于完整 Unicode 字符

`char` 是 16-bit UTF-16 code unit,不一定能表示一个完整 Unicode 字符。emoji 等可能需要两个 `char` 组成代理对。

## 高频面试题(5 题)

- **Q1**: Java 基本类型和引用类型有什么区别?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  基本类型变量直接保存值,如 `int`、`double`;引用类型变量保存对象引用,对象在堆上。基本类型不能为 null,引用类型可以为 null。基本类型性能更高,引用类型可参与面向对象、泛型、集合等机制。

  &lt;details&gt;

- **Q2**: 自动装箱和拆箱是什么?有什么风险?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  自动装箱是基本类型自动转包装类,如 `int` → `Integer.valueOf`;拆箱是包装类转基本类型,如 `Integer.intValue()`。风险包括拆箱 null 导致 NPE、循环中频繁装箱带来性能开销、包装类用 `==` 比较出错。

  &lt;details&gt;

- **Q3**: 为什么 `Integer a = 127; Integer b = 127; a == b` 是 true,但 128 可能是 false?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  `Integer.valueOf` 默认缓存 `-128 ~ 127` 的 Integer 对象。127 返回同一缓存对象,`==` 为 true;128 通常创建不同对象,`==` 为 false。数值比较应使用 `equals` 或 `Objects.equals`。

  &lt;details&gt;

- **Q4**: 为什么金额不能用 double?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  double 是二进制浮点,无法精确表示很多十进制小数,会产生精度误差。金额计算要求精确,应使用 `BigDecimal` 或以分为单位用 long 表示。使用 BigDecimal 时优先用字符串构造。

  &lt;details&gt;

- **Q5**: 局部变量和成员变量默认值有什么区别?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  成员变量有默认值,如 int 为 0、boolean 为 false、引用类型为 null。局部变量没有默认值,必须显式赋值后才能使用,否则编译报错。

  &lt;details&gt;

## 延伸资源

- [JLS 4: Types, Values, and Variables](https://docs.oracle.com/javase/specs/jls/se21/html/jls-4.html)
- [Integer API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Integer.html)
- [BigDecimal API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/math/BigDecimal.html)

## (留白) 我的理解

> 这一段不强制填。

---

## Java 内存模型 JMM、volatile 与 happens-before

## TL;DR

> **JMM** 定义多线程下读写共享变量的规则,核心解决**可见性、有序性、原子性**。`happens-before` 是判断一个线程的写入是否对另一个线程可见的关键规则;`volatile` 保证可见性和有序性,但不保证复合操作原子性。

## 背景与动机

现代 CPU 和 JVM 为了性能会做很多优化:

- CPU 缓存
- 写缓冲
- 指令重排
- 编译器优化
- JIT 优化

单线程下这些优化不改变结果,但多线程共享变量时可能出现反直觉行为:

```java
boolean running = true;

void stop() {
    running = false;
}

void loop() {
    while (running) {
        // do work
    }
}
```

如果 `running` 没有同步保护,一个线程修改为 false,另一个线程可能迟迟看不到。

JMM 的目标是定义清楚:

- 什么时候写入对另一个线程可见
- 哪些重排是允许的
- synchronized / volatile / final 的语义是什么
- 正确同步的程序应表现得像顺序一致

## 核心机制

### 三大问题:原子性、可见性、有序性

#### 原子性

一个操作不可被中断。

```java
count++; // 不是原子操作
```

字段自增包含读、加、写多个步骤,多线程下会丢失更新。

#### 可见性

一个线程写入共享变量,另一个线程能及时看到。

```java
volatile boolean running = true;
```

`volatile` 写对后续读可见。

#### 有序性

程序执行顺序在优化后仍要满足 JMM 规则。没有同步时,编译器和 CPU 可重排不影响单线程语义的指令。

### 主内存 / 工作内存模型

JMM 抽象模型:

```text
主内存:共享变量
   ↑↓
线程 A 工作内存:变量副本
   ↑↓
线程 B 工作内存:变量副本
```

线程对共享变量的操作可能先发生在自己的工作内存 / CPU 缓存中,再同步到主内存。JMM 不要求你记具体 read/load/use/assign/store/write 操作,核心是理解线程之间需要同步边界。

### happens-before

如果 A happens-before B,则 A 的结果对 B 可见,且 A 的执行顺序排在 B 之前。

常见规则:

| 规则          | 含义                                           |
| ------------- | ---------------------------------------------- |
| 程序次序规则  | 单线程内前面的操作 happens-before 后面的操作   |
| 监视器锁规则  | unlock happens-before 后续对同一锁的 lock      |
| volatile 规则 | volatile 写 happens-before 后续 volatile 读    |
| 线程启动规则  | `Thread.start()` happens-before 新线程内动作   |
| 线程终止规则  | 线程内动作 happens-before 其他线程检测到它结束 |
| 传递性        | A hb B, B hb C,则 A hb C                       |

happens-before 是分析并发可见性的核心工具。

### synchronized 的内存语义

```java
synchronized (lock) {
    shared = 1;
}
```

语义:

- 进入 synchronized:获取锁,读取最新共享状态
- 退出 synchronized:释放锁,把修改刷新出去
- 同一把锁的 unlock happens-before 后续 lock

```java
synchronized (lock) {
    value = 42;
    ready = true;
}

synchronized (lock) {
    if (ready) {
        System.out.println(value); // 一定能看到 42
    }
}
```

前提是使用同一把锁。

### volatile 的语义

```java
private volatile boolean running = true;
```

volatile 保证:

- 可见性:一个线程写 volatile,其他线程读 volatile 能看到
- 有序性:volatile 读写前后有内存屏障约束,限制重排

volatile 不保证复合操作原子性:

```java
volatile int count = 0;
count++; // ❌ 仍不是线程安全
```

因为 `count++` 是读-改-写三步。

适合 volatile 的场景:

- 状态标记
- 开关变量
- 单写多读配置引用
- DCL 单例中的实例引用

### 指令重排

源码顺序:

```java
a = 1;
b = 2;
```

在不影响单线程结果的情况下,编译器 / CPU 可能调整执行顺序。

经典问题:双重检查锁 DCL。

```java
class Singleton {
    private static Singleton instance;

    static Singleton getInstance() {
        if (instance == null) {
            synchronized (Singleton.class) {
                if (instance == null) {
                    instance = new Singleton();
                }
            }
        }
        return instance;
    }
}
```

`new Singleton()` 不是单一操作,可能包含:

1. 分配内存
2. 初始化对象
3. 引用赋值给 instance

如果 3 和 2 重排,其他线程可能看到未初始化完成的对象。

修复:加 volatile。

```java
private static volatile Singleton instance;
```

### final 字段语义

final 字段在构造完成后有特殊可见性保证。正确构造对象且 `this` 不在构造期间逸出时,其他线程看到对象引用后,能看到 final 字段的正确值。

```java
class User {
    private final String name;

    User(String name) {
        this.name = name;
    }
}
```

不要在构造函数中让 `this` 逸出:

```java
class Bad {
    Bad() {
        Global.list.add(this); // ❌ 对象未构造完就发布
    }
}
```

### 正确同步的程序

如果所有共享可变状态都通过 synchronized、volatile、Lock、并发容器、线程安全发布等方式同步,程序就更接近顺序一致的直觉。

没有同步的数据竞争会导致结果不可预测,不要依赖“我本机看起来没问题”。

## 代码示例

### volatile 停止线程

```java
class Worker implements Runnable {
    private volatile boolean running = true;

    public void stop() {
        running = false;
    }

    @Override
    public void run() {
        while (running) {
            doWork();
        }
    }

    private void doWork() {}
}
```

### volatile 不能保证自增原子性

```java
class Counter {
    private volatile int count;

    void inc() {
        count++; // 非线程安全
    }
}
```

修复:

```java
class SafeCounter {
    private final AtomicInteger count = new AtomicInteger();

    void inc() {
        count.incrementAndGet();
    }
}
```

### DCL 单例

```java
class Singleton {
    private static volatile Singleton instance;

    private Singleton() {}

    static Singleton getInstance() {
        if (instance == null) {
            synchronized (Singleton.class) {
                if (instance == null) {
                    instance = new Singleton();
                }
            }
        }
        return instance;
    }
}
```

## 易错点 / 反例

### 1. 以为 volatile 能保证所有线程安全

volatile 只保证单次读写的可见性和有序性,不保证 `count++` 这种复合操作原子性。

### 2. synchronized 锁对象不一致

```java
synchronized (lockA) {
    value = 1;
}

synchronized (lockB) {
    System.out.println(value);
}
```

不同锁之间没有监视器锁 happens-before 关系。

### 3. 认为 sleep 能解决可见性

`Thread.sleep()` 不建立 happens-before。它可能让问题不容易复现,但不保证可见性。

### 4. DCL 忘记 volatile

双重检查锁中的实例字段必须 volatile,否则可能因为重排看到半初始化对象。

### 5. 构造期间 this 逸出

对象还没构造完成就发布给其他线程,final 字段语义也可能被破坏。

### 6. 混淆 JMM 和 JVM 内存结构

JVM 内存结构讲堆、栈、方法区等运行时区域;JMM 讲多线程下共享变量读写、可见性、有序性和 happens-before 规则。两者不是同一概念。

## 高频面试题(5 题)

- **Q1**: JMM 解决什么问题?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  JMM 定义多线程环境下共享变量读写的可见性、有序性和原子性规则,说明哪些写入对哪些读取可见,哪些重排允许,以及 synchronized、volatile、final 等关键字的内存语义。

  &lt;details&gt;

- **Q2**: happens-before 是什么?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  happens-before 是 JMM 中判断可见性和顺序性的关系。如果 A happens-before B,则 A 的结果对 B 可见,且 A 在内存语义上先于 B。常见规则包括程序次序、锁释放-获取、volatile 写-读、线程 start / join 等。

  &lt;details&gt;

- **Q3**: volatile 保证什么?不保证什么?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  volatile 保证可见性和有序性:volatile 写对后续 volatile 读可见,并通过内存屏障限制重排。不保证复合操作原子性,如 `volatile int count; count++` 仍不是线程安全。

  &lt;details&gt;

- **Q4**: synchronized 的内存语义是什么?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  退出 synchronized 释放锁时会把修改刷新出去,进入同一把锁的 synchronized 时能看到之前释放锁前的修改。同一锁的 unlock happens-before 后续 lock。同时 synchronized 还保证临界区互斥。

  &lt;details&gt;

- **Q5**: 为什么 DCL 单例需要 volatile?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  `new Singleton()` 可能被分解为分配内存、初始化对象、引用赋值。没有 volatile 时引用赋值可能与初始化重排,其他线程可能看到非 null 但未初始化完成的对象。volatile 禁止相关重排并保证可见性。

  &lt;details&gt;

## 延伸资源

- [JLS 17: Threads and Locks](https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html)
- [JLS 17.4.5: Happens-before Order](https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html#jls-17.4.5)
- [java.util.concurrent 包说明](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/package-summary.html)

## (留白) 我的理解

> 这一段不强制填。

---

## JVM 字节码基础与 javap 分析

## TL;DR

> Java 源码先编译成 `.class` 字节码,JVM 执行的是字节码而不是 `.java`。字节码基于**操作数栈**运行,配合局部变量表、常量池和方法调用指令完成计算与调用。`javap -c -v` 是观察字节码的核心工具。

## 背景与动机

理解字节码能解释很多“源码看起来简单但运行机制不简单”的问题:

- `i++` 到底是不是原子操作
- 方法重载 / 重写在字节码层怎么调用
- `try-finally` 怎么保证 finally 执行
- lambda / inner class 编译后是什么
- 泛型擦除后类型去哪了
- synchronized 在字节码里长什么样

Java 的跨平台能力来自:

```text
.java 源码 → javac → .class 字节码 → JVM 解释执行 / JIT 编译
```

`.class` 是 JVM 的输入格式,不是机器码。

## 核心机制

### class 文件包含什么

`.class` 文件是有严格格式的二进制文件,主要包含:

- 魔数和版本号
- 常量池
- 访问标志
- 类名 / 父类 / 接口
- 字段表
- 方法表
- 属性表

简化结构:

```text
ClassFile
├─ magic: 0xCAFEBABE
├─ version
├─ constant_pool
├─ access_flags
├─ this_class / super_class
├─ interfaces
├─ fields
├─ methods
└─ attributes
```

魔数 `CAFEBABE` 用于识别 class 文件。

### 常量池

常量池保存字面量和符号引用:

- 字符串字面量
- 类 / 接口符号引用
- 字段符号引用
- 方法符号引用
- NameAndType
- MethodHandle / InvokeDynamic 等

源码:

```java
System.out.println("hello");
```

字节码不会直接保存完整调用对象,而是通过常量池引用 `java/lang/System.out`、`java/io/PrintStream.println` 等符号。

### 操作数栈与局部变量表

JVM 字节码执行是栈式模型。

每个方法栈帧有:

- 局部变量表:保存参数和局部变量
- 操作数栈:执行指令时临时压栈 / 出栈

例子:

```java
int add(int a, int b) {
    return a + b;
}
```

典型字节码:

```text
0: iload_1   // 把局部变量 a 压入操作数栈
1: iload_2   // 把局部变量 b 压入操作数栈
2: iadd      // 弹出两个 int 相加,结果压栈
3: ireturn   // 返回栈顶 int
```

### 用 javap 看字节码

编译:

```bash
javac Demo.java
```

查看字节码:

```bash
javap -c Demo
```

查看详细信息:

```bash
javap -c -v Demo
```

常用参数:

- `-c`:反汇编方法字节码
- `-v`:显示常量池、栈大小、局部变量表等详细信息
- `-p`:显示 private 成员

### 常见加载 / 存储指令

| 指令       | 含义                            |
| ---------- | ------------------------------- |
| `iload`    | 从局部变量表加载 int 到操作数栈 |
| `istore`   | 把操作数栈 int 存入局部变量表   |
| `aload`    | 加载引用类型                    |
| `astore`   | 存储引用类型                    |
| `ldc`      | 从常量池加载常量                |
| `iconst_0` | 加载 int 常量 0                 |

不同类型有不同前缀:

- `i`:int
- `l`:long
- `f`:float
- `d`:double
- `a`:reference

### 方法调用指令

| 指令              | 用途                                 |
| ----------------- | ------------------------------------ |
| `invokestatic`    | 调用静态方法                         |
| `invokevirtual`   | 调用普通实例方法,支持多态            |
| `invokespecial`   | 调用构造器、private 方法、super 方法 |
| `invokeinterface` | 调用接口方法                         |
| `invokedynamic`   | 动态语言特性、lambda 等              |

例子:

```java
String.valueOf(1);  // invokestatic
obj.toString();     // invokevirtual
new User();         // invokespecial &lt;init&gt;
service.run();      // invokeinterface 如果 service 是接口类型
```

### `i++` 字节码

```java
int i = 0;
i++;
```

局部变量自增常见为:

```text
0: iconst_0
1: istore_1
2: iinc 1, 1
```

但如果是字段或共享变量,不是简单一个原子指令:

```java
count++;
```

通常涉及读字段、加一、写回,多线程下不是原子操作。

### 对象创建字节码

源码:

```java
User user = new User();
```

典型字节码:

```text
new           #2  // class User
dup
invokespecial #3  // Method User."&lt;init&gt;":()V
astore_1
```

含义:

1. `new` 分配对象并压引用
2. `dup` 复制引用,一份给构造器调用,一份留着存变量
3. `invokespecial` 调用构造器 `&lt;init&gt;`
4. `astore` 存入局部变量表

### synchronized 字节码

同步代码块:

```java
synchronized (lock) {
    count++;
}
```

字节码会出现:

```text
monitorenter
...
monitorexit
```

编译器会生成异常路径,确保异常时也执行 `monitorexit`。

同步方法则通过方法访问标志 `ACC_SYNCHRONIZED` 表示。

## 代码示例

### 示例源码

```java
public class BytecodeDemo {
    public int add(int a, int b) {
        return a + b;
    }

    public static void main(String[] args) {
        BytecodeDemo demo = new BytecodeDemo();
        System.out.println(demo.add(1, 2));
    }
}
```

查看:

```bash
javac BytecodeDemo.java
javap -c -v BytecodeDemo
```

你会看到:

- 构造器 `&lt;init&gt;`
- `add` 方法的 `iload / iadd / ireturn`
- `main` 中的 `new / dup / invokespecial / invokevirtual`

### 字段自增不是原子操作

```java
class Counter {
    private int count;

    void inc() {
        count++;
    }
}
```

字段自增大致包含:

```text
aload_0
aload_0
getfield count
iconst_1
iadd
putfield count
```

读-改-写分多步,多线程下需要同步或原子类。

## 易错点 / 反例

### 1. 以为 `.class` 是机器码

`.class` 是 JVM 字节码,不是 CPU 机器码。JVM 可以解释执行,也可以通过 JIT 编译成本地机器码。

### 2. 以为 `i++` 总是原子

局部变量的 `i++` 可能是 `iinc`,但共享字段的 `count++` 是读-改-写多个步骤,多线程下不是原子。

### 3. 混淆 `&lt;init&gt;` 和 `&lt;clinit&gt;`

`&lt;init&gt;` 是实例构造器,每次 new 对象时执行。`&lt;clinit&gt;` 是类初始化方法,由 static 变量赋值和 static 块组成,类初始化时执行。

### 4. 以为重载是运行期选择

方法重载在编译期根据静态类型确定,字节码里已经写死调用哪个方法符号引用。运行期多态主要体现在 `invokevirtual / invokeinterface`。

### 5. 忽略常量池

字节码大量通过常量池引用类、字段、方法。理解常量池是理解类加载解析、方法调用的基础。

### 6. 直接读字节码不看版本

不同 JDK 版本编译同一源码可能生成不同字节码,例如 switch、lambda、字符串拼接等实现会演进。分析时要记录 javac 版本。

## 高频面试题(5 题)

- **Q1**: JVM 字节码是什么?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  字节码是 javac 编译 `.java` 后生成的 `.class` 指令格式,由 JVM 加载和执行。它不是机器码,而是跨平台的中间表示,JVM 可解释执行或 JIT 编译成本地机器码。

  &lt;details&gt;

- **Q2**: JVM 栈帧里有什么?字节码如何执行计算?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  栈帧包含局部变量表、操作数栈、动态链接、返回地址等。JVM 字节码基于操作数栈执行,例如 `iload` 把局部变量压栈,`iadd` 弹出两个 int 相加并把结果压回栈顶。

  &lt;details&gt;

- **Q3**: 常见方法调用字节码指令有哪些?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  `invokestatic` 调静态方法,`invokevirtual` 调普通实例方法并支持多态,`invokespecial` 调构造器 / private / super 方法,`invokeinterface` 调接口方法,`invokedynamic` 支持 lambda 等动态调用场景。

  &lt;details&gt;

- **Q4**: 为什么 `count++` 不是线程安全的?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  对字段的 `count++` 通常是读取字段、加一、写回字段多个字节码步骤。多个线程交错执行会丢失更新,需要 synchronized、Lock 或 AtomicInteger 等保证原子性和可见性。

  &lt;details&gt;

- **Q5**: `&lt;init&gt;` 和 `&lt;clinit&gt;` 有什么区别?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  `&lt;init&gt;` 是实例构造器,每次创建对象时执行。`&lt;clinit&gt;` 是类初始化方法,由静态变量显式赋值和 static 代码块合成,在类初始化阶段执行,一个类加载器下通常只执行一次。

  &lt;details&gt;

## 延伸资源

- [JVM Spec 4: The class File Format](https://docs.oracle.com/javase/specs/jvms/se21/html/jvms-4.html)
- [JVM Spec 6: Instruction Set](https://docs.oracle.com/javase/specs/jvms/se21/html/jvms-6.html)
- [javap 工具文档](https://docs.oracle.com/en/java/javase/21/docs/specs/man/javap.html)

## (留白) 我的理解

> 这一段不强制填。

---

## JVM 类加载机制与双亲委派

## TL;DR

> 类加载是 JVM 把 `.class` 字节码变成运行时 `Class` 对象的过程,包括**加载、验证、准备、解析、初始化**。双亲委派让类加载优先交给父加载器,保证核心类安全和类身份稳定。

## 背景与动机

Java 程序不是一次性把所有类都加载进内存,而是在运行过程中按需加载。JVM 需要解决:

- 从哪里找到 class 字节码
- 如何校验字节码是否合法
- 静态变量什么时候分配和赋值
- `static {}` 什么时候执行
- 同名类如何区分身份
- 为什么不能随便替换 `java.lang.String`

类加载机制是理解框架、热部署、SPI、JDBC Driver、Tomcat 类隔离的基础。

## 核心机制

### 类加载生命周期

```text
Loading 加载
   ↓
Verification 验证
   ↓
Preparation 准备
   ↓
Resolution 解析
   ↓
Initialization 初始化
   ↓
Using 使用
   ↓
Unloading 卸载
```

其中验证、准备、解析统称 Linking。

### 加载 Loading

加载阶段做三件事:

1. 通过类的全限定名获取二进制字节流
2. 把字节流转成方法区 / Metaspace 中的运行时数据结构
3. 在堆中生成一个 `java.lang.Class` 对象作为访问入口

类字节流来源可以是:

- 本地 `.class` 文件
- jar 包
- 网络
- 动态代理生成
- 字节码增强工具生成

### 验证 Verification

验证阶段确保 class 字节码合法、安全,不会破坏 JVM:

- 文件格式验证
- 元数据验证
- 字节码验证
- 符号引用验证

这是 Java 安全模型的一部分。

### 准备 Preparation

准备阶段为类变量分配内存并设置默认初始值。

```java
class Demo {
    static int x = 10;
}
```

准备阶段 `x` 是 `0`,不是 `10`。`10` 会在初始化阶段赋值。

特殊情况:`static final` 编译期常量可能在准备阶段就有 ConstantValue:

```java
static final int A = 10;
```

### 解析 Resolution

解析阶段把常量池里的符号引用转换为直接引用。

例如把“某个类的某个方法名”解析成 JVM 可以直接定位的方法引用。

解析可以在初始化前完成,也可以延迟到实际使用时。

### 初始化 Initialization

初始化阶段执行类构造器 `&lt;clinit&gt;`:

- 静态变量显式赋值
- static 代码块

```java
class Demo {
    static int x = 10;
    static {
        x = 20;
    }
}
```

`&lt;clinit&gt;` 按源码顺序收集静态赋值和 static 块,最终 `x = 20`。

初始化触发时机常见有:

- `new` 创建对象
- 读取 / 设置非编译期常量的 static 字段
- 调用 static 方法
- 反射调用类
- 初始化子类前先初始化父类
- JVM 启动主类

### 不会触发初始化的情况

访问编译期常量不会触发定义类初始化:

```java
class Consts {
    static final int PORT = 8080;
    static {
        System.out.println("init Consts");
    }
}

System.out.println(Consts.PORT); // 通常不打印 init Consts
```

创建数组也不会触发元素类初始化:

```java
User[] users = new User[10]; // 不初始化 User 类
```

### ClassLoader 层级

常见类加载器:

```text
Bootstrap ClassLoader       加载 java.base 等核心类
        ↑
Platform ClassLoader        加载平台模块
        ↑
Application ClassLoader     加载应用 classpath / modulepath
        ↑
Custom ClassLoader          自定义加载器
```

Bootstrap ClassLoader 通常由 JVM 内部实现,Java 层拿到可能是 null。

### 双亲委派模型

类加载默认流程:

```text
loadClass(name)
  1. 先检查是否已加载
  2. 委派父加载器加载
  3. 父加载器失败后,自己 findClass
```

伪代码:

```java
protected Class<?> loadClass(String name, boolean resolve) {
    Class<?> c = findLoadedClass(name);
    if (c == null) {
        try {
            c = parent.loadClass(name);
        } catch (ClassNotFoundException e) {
            c = findClass(name);
        }
    }
    return c;
}
```

好处:

- 防止核心类被篡改,如自定义 `java.lang.String`
- 避免同一个类被重复加载
- 保证类身份稳定

### 类身份:类名 + 类加载器

JVM 判断两个类是否相同,不只看全限定名,还看加载它的 ClassLoader。

```text
同一个 com.example.User
由 LoaderA 加载 ≠ 由 LoaderB 加载
```

这解释了热部署、插件系统、Tomcat 多 WebApp 隔离中常见的 `ClassCastException: com.X cannot be cast to com.X`。

## 代码示例

### 初始化顺序

```java
class Parent {
    static {
        System.out.println("parent init");
    }
}

class Child extends Parent {
    static int value = 1;
    static {
        System.out.println("child init");
    }
}

public class InitDemo {
    public static void main(String[] args) {
        System.out.println(Child.value);
    }
}
```

输出:

```text
parent init
child init
1
```

初始化子类前,父类先初始化。

### 编译期常量不触发初始化

```java
class Config {
    static final int PORT = 8080;
    static {
        System.out.println("Config init");
    }
}

public class ConstDemo {
    public static void main(String[] args) {
        System.out.println(Config.PORT);
    }
}
```

通常只输出 `8080`,不输出 `Config init`。

### 查看类加载器

```java
public class ClassLoaderDemo {
    public static void main(String[] args) {
        System.out.println(String.class.getClassLoader());
        System.out.println(ClassLoaderDemo.class.getClassLoader());
        System.out.println(ClassLoaderDemo.class.getClassLoader().getParent());
    }
}
```

## 易错点 / 反例

### 1. 以为“加载”就等于“初始化”

加载只是把 class 字节码变成运行时结构。初始化是执行 static 赋值和 static 代码块。类可以已加载但尚未初始化。

### 2. 以为 static 变量准备阶段就是代码里的值

准备阶段先给默认值,如 int 是 0。显式赋值在初始化阶段执行。`static final` 编译期常量是特殊情况。

### 3. 自定义 ClassLoader 重写 `loadClass`

大多数场景只应重写 `findClass`,保留双亲委派。直接重写 `loadClass` 容易破坏委派模型和核心类安全。

### 4. 只用类名判断类相等

同名类由不同 ClassLoader 加载,在 JVM 看来是不同类。插件化、热部署、Web 容器中尤其常见。

### 5. 以为双亲委派不能被打破

双亲委派是推荐模型,不是强制不可变。Tomcat、OSGi、SPI、某些框架会为了隔离或扩展采用不同加载策略。

### 6. 混淆 Class 对象位置

类元数据主要在 Metaspace,但 `java.lang.Class` 对象本身在 Java 堆中,作为访问类元数据的入口。

## 高频面试题(5 题)

- **Q1**: 类加载过程有哪些阶段?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  包括加载、验证、准备、解析、初始化、使用、卸载。其中验证、准备、解析属于链接。加载获取字节流并生成 Class 对象;准备给类变量默认值;初始化执行 static 赋值和 static 代码块。

  &lt;details&gt;

- **Q2**: 准备阶段和初始化阶段有什么区别?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  准备阶段为类变量分配内存并设置默认值,如 int 为 0。初始化阶段执行 `&lt;clinit&gt;`,也就是静态变量显式赋值和 static 代码块。`static int x = 10` 在准备阶段是 0,初始化后才是 10。

  &lt;details&gt;

- **Q3**: 双亲委派模型是什么?有什么好处?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  类加载器收到加载请求后,先委派父加载器尝试加载,父加载器失败后才自己加载。好处是保护核心类不被篡改、避免重复加载、保证类身份稳定。

  &lt;details&gt;

- **Q4**: JVM 如何判断两个类是否是同一个类?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  由类的全限定名和加载它的 ClassLoader 共同决定。同名 class 如果由不同 ClassLoader 加载,在 JVM 中也是不同类。

  &lt;details&gt;

- **Q5**: 哪些情况会触发类初始化?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  常见包括 new 对象、访问或设置非编译期常量 static 字段、调用 static 方法、反射调用类、初始化子类前初始化父类、JVM 启动主类。访问编译期常量和创建数组通常不触发元素类初始化。

  &lt;details&gt;

## 延伸资源

- [JVM Spec 5: Loading, Linking, and Initializing](https://docs.oracle.com/javase/specs/jvms/se21/html/jvms-5.html)
- [ClassLoader API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/ClassLoader.html)
- [JLS 12: Execution](https://docs.oracle.com/javase/specs/jls/se21/html/jls-12.html)

## (留白) 我的理解

> 这一段不强制填。

---

## JVM GC 基础(对象存活、分代与收集器)

## TL;DR

> GC 负责自动回收不再使用的对象。JVM 主要通过**可达性分析**判断对象是否存活,基于**分代假说**优化回收效率。理解 GC 要抓住三件事:对象从哪里可达、对象在哪个代、暂停时间和吞吐量如何权衡。

## 背景与动机

Java 不需要手动 `free` 内存,但这不等于不需要理解内存。GC 自动管理对象生命周期,解决:

- 释放无用对象
- 减少手动内存错误
- 整理碎片
- 提升长期运行程序稳定性

但 GC 也会带来问题:

- Stop-The-World 暂停
- Full GC 卡顿
- 内存泄漏导致频繁 GC
- 配置不合理导致吞吐下降
- 低延迟系统对暂停敏感

## 核心机制

### 如何判断对象已死

#### 引用计数法

每个对象记录被引用次数,引用为 0 就回收。

问题:循环引用无法处理。

```java
class Node {
    Node next;
}

Node a = new Node();
Node b = new Node();
a.next = b;
b.next = a;
a = null;
b = null;
```

a 和 b 互相引用,引用计数不为 0,但从程序入口已经不可达。

#### 可达性分析

JVM 主流使用可达性分析。以 GC Roots 为起点,沿引用链搜索,能到达的对象是存活对象,不能到达的可回收。

```text
GC Roots
  ├─ 栈帧局部变量引用
  ├─ 静态字段引用
  ├─ JNI 引用
  ├─ 活跃线程对象
  └─ 同步锁持有对象
        ↓
      对象图
```

不可达对象才可能被回收。

### 常见 GC Roots

常见根对象包括:

- 虚拟机栈中局部变量引用的对象
- 方法区 / Metaspace 中类静态字段引用的对象
- 常量引用的对象
- Native 方法栈 JNI 引用的对象
- 活跃线程对象
- 被 synchronized 锁持有的对象

这解释了为什么 static Map 缓存不清理会泄漏:它从静态字段可达。

### 四种引用类型

Java 提供不同强度的引用:

| 类型   | 类                 | 回收行为         | 场景                    |
| ------ | ------------------ | ---------------- | ----------------------- |
| 强引用 | 普通引用           | 只要可达就不回收 | 普通对象                |
| 软引用 | `SoftReference`    | 内存不足前可回收 | 缓存,但现在较少推荐     |
| 弱引用 | `WeakReference`    | 下次 GC 即可回收 | WeakHashMap、关联元数据 |
| 虚引用 | `PhantomReference` | 不影响生命周期   | 资源释放跟踪            |

强引用:

```java
User user = new User();
```

弱引用:

```java
WeakReference&lt;User&gt; ref = new WeakReference<>(new User());
User user = ref.get();
```

### 分代假说

GC 优化基于两个经验:

1. 大多数对象朝生夕死
2. 熬过多次 GC 的对象更可能继续存活

所以传统堆分代:

```text
Java Heap
├─ Young Generation
│  ├─ Eden
│  ├─ Survivor S0
│  └─ Survivor S1
└─ Old Generation
```

新对象通常先进入 Eden。Minor GC 后还活着的对象进入 Survivor,年龄增加;达到阈值后晋升老年代。

### Minor GC / Major GC / Full GC

| 名称                | 回收范围              | 特点               |
| ------------------- | --------------------- | ------------------ |
| Minor GC / Young GC | 年轻代                | 频繁,通常较快      |
| Major GC / Old GC   | 老年代                | 不同收集器语义不同 |
| Full GC             | 整个堆 + 可能含方法区 | 通常暂停更重       |

注意:这些术语在不同 JVM / 收集器日志中含义可能略有差异,看具体 GC 日志为准。

### 常见回收算法

#### 标记-清除

```text
标记存活对象 → 清除未标记对象
```

优点:简单。
缺点:产生内存碎片。

#### 标记-整理

```text
标记存活对象 → 移动存活对象到一端 → 清理边界外空间
```

优点:减少碎片。
缺点:移动对象成本高。

#### 复制算法

```text
from 区存活对象复制到 to 区 → 清空 from
```

适合年轻代,因为大多数对象很快死亡,复制成本低。

### 常见收集器

| 收集器     | 特点              | 适合场景         |
| ---------- | ----------------- | ---------------- |
| Serial     | 单线程,简单       | 小应用 / Client  |
| Parallel   | 吞吐优先          | 批处理、后台任务 |
| G1         | 区域化,可预测暂停 | 默认通用选择     |
| ZGC        | 低延迟,超大堆     | 延迟敏感服务     |
| Shenandoah | 低暂停            | 延迟敏感服务     |

Java 21 中 G1 仍是通用服务端常见默认选择,ZGC 适合低延迟和大堆场景。

### STW:Stop-The-World

GC 某些阶段需要暂停所有用户线程,称为 STW。

```text
应用线程运行 → STW 暂停 → GC 工作 → 应用线程恢复
```

GC 优化通常是在权衡:

- 吞吐量:应用运行时间占比高
- 延迟:单次暂停尽量短
- 内存占用:GC 额外结构和空闲空间尽量少

三者不能同时最优。

### GC 日志基础

现代 JVM 可用统一日志:

```bash
java -Xlog:gc* -Xms512m -Xmx512m App
```

观察重点:

- GC 频率
- 单次暂停时间
- GC 前后堆占用
- 是否频繁 Full GC
- 老年代是否持续上涨
- Metaspace 是否持续上涨

## 代码示例

### static Map 导致对象长期可达

```java
import java.util.HashMap;
import java.util.Map;

class CacheLeakDemo {
    private static final Map<Long, byte[]> CACHE = new HashMap<>();

    static void put(long id) {
        CACHE.put(id, new byte[1024 * 1024]);
    }
}
```

只要 `CACHE` 不清理,里面的对象就从静态字段可达,GC 不会回收。

### WeakHashMap 示例

```java
import java.util.WeakHashMap;

class WeakMapDemo {
    public static void main(String[] args) {
        WeakHashMap<Object, String> map = new WeakHashMap<>();
        Object key = new Object();
        map.put(key, "value");

        key = null;
        System.gc();
    }
}
```

key 只有弱引用时,GC 后 entry 可能被清理。

### 打开 GC 日志

```bash
java -Xms512m -Xmx512m -Xlog:gc* MyApp
```

## 易错点 / 反例

### 1. 以为 Java 没有内存泄漏

Java 没有手动 free,但仍有内存泄漏。只要无用对象仍从 GC Roots 可达,GC 就不会回收。

### 2. 把 `System.gc()` 当解决方案

`System.gc()` 只是建议 JVM 进行 GC,不保证立即执行,也不应作为业务逻辑依赖。频繁调用还可能造成性能问题。

### 3. 认为软引用是可靠缓存方案

软引用回收策略和 GC 行为相关,可预测性差。现代服务端缓存通常使用 Caffeine / Guava 等带容量和过期策略的缓存。

### 4. 只看平均 GC 时间

平均值会掩盖长尾暂停。线上更应该关注 P95 / P99 暂停、Full GC 次数和最大暂停。

### 5. 以为换 ZGC 就一定更快

低延迟收集器减少暂停,但可能牺牲吞吐或增加内存开销。批处理任务可能 Parallel / G1 更合适。

### 6. 忽略对象分配速率

GC 压力不只取决于存活对象,也取决于分配速率。短时间创建大量临时对象会导致频繁 Young GC。

## 高频面试题(5 题)

- **Q1**: JVM 如何判断对象是否可以回收?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  主流 JVM 使用可达性分析。从 GC Roots 出发沿引用链遍历,能到达的对象是存活对象,不可达对象才可能被回收。GC Roots 包括栈中局部变量、静态字段、JNI 引用、活跃线程等。

  &lt;details&gt;

- **Q2**: 什么是分代收集?为什么有效?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  分代收集把堆按对象年龄分为年轻代和老年代。依据是大多数对象朝生夕死,少数长期存活。年轻代频繁用复制算法快速回收,老年代用适合长寿对象的算法,整体效率更高。

  &lt;details&gt;

- **Q3**: 强引用、软引用、弱引用、虚引用区别是什么?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  强引用只要可达就不回收;软引用在内存不足前可回收;弱引用下次 GC 即可回收;虚引用不影响对象生命周期,主要用于跟踪对象回收和资源释放。

  &lt;details&gt;

- **Q4**: Minor GC、Full GC 有什么区别?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  Minor GC / Young GC 通常回收年轻代,频繁且较快。Full GC 通常回收整个堆并可能涉及方法区 / Metaspace,暂停更重。具体术语含义要结合收集器和 GC 日志。

  &lt;details&gt;

- **Q5**: GC 调优主要看哪些指标?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  看 GC 频率、暂停时间、最大暂停 / P99 暂停、吞吐量、GC 前后堆占用、老年代增长趋势、Full GC 次数、对象分配速率和晋升速率。调优目标要先明确是吞吐优先还是延迟优先。

  &lt;details&gt;

## 延伸资源

- [Oracle GC Tuning: Introduction](https://docs.oracle.com/en/java/javase/21/gctuning/introduction-garbage-collection-tuning.html)
- [Oracle GC Tuning: Available Collectors](https://docs.oracle.com/en/java/javase/21/gctuning/available-collectors.html)
- [java.lang.ref 包文档](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/ref/package-summary.html)

## (留白) 我的理解

> 这一段不强制填。

---

## JVM GC 调优与日志分析基础

## TL;DR

> GC 调优不是背参数,而是先明确目标:**吞吐优先、延迟优先还是内存占用优先**。基本流程是打开 GC 日志 → 观察分配速率、暂停、Full GC、堆趋势 → 定位问题 → 小步调整参数或代码。

## 背景与动机

大多数线上 Java 服务不需要复杂 GC 调优,默认 G1 已经足够。但当出现这些现象时,就需要看 GC:

- 请求偶发超时
- P99 延迟尖刺
- CPU 被 GC 占满
- Full GC 频繁
- 堆持续上涨
- 容器内存被打爆
- 发布后内存曲线异常

GC 调优的第一原则:**先测量,再判断,最后调整。**

不要一上来就改 `-Xmx` 或换收集器。

## 核心机制

### 调优目标三角

```text
          低延迟
            ▲
            │
            │
吞吐量 ◀────┼────▶ 低内存占用
```

三者不能同时最优:

- 吞吐优先:允许较长暂停,换总处理量高
- 延迟优先:降低单次暂停,可能牺牲吞吐和内存
- 内存优先:堆更小,GC 更频繁

不同系统目标不同:

- 批处理:吞吐优先
- API 服务:延迟和吞吐平衡
- 交易 / 实时系统:P99 / P999 延迟优先
- 小容器:内存占用敏感

### 基础 JVM 参数

| 参数                              | 含义                    |
| --------------------------------- | ----------------------- |
| `-Xms`                            | 初始堆大小              |
| `-Xmx`                            | 最大堆大小              |
| `-Xss`                            | 每个线程栈大小          |
| `-XX:MaxMetaspaceSize`            | Metaspace 上限          |
| `-XX:MaxDirectMemorySize`         | 直接内存上限            |
| `-XX:+UseG1GC`                    | 使用 G1 GC              |
| `-XX:+UseZGC`                     | 使用 ZGC                |
| `-XX:MaxGCPauseMillis`            | 目标最大暂停时间,软目标 |
| `-XX:+HeapDumpOnOutOfMemoryError` | OOM 时 dump 堆          |
| `-XX:HeapDumpPath=...`            | heap dump 输出路径      |

常见服务会让 `-Xms` 和 `-Xmx` 相等,避免运行期堆动态扩缩带来的波动。

### 打开 GC 日志

JDK 9+ 使用统一日志:

```bash
java -Xlog:gc* -Xms2g -Xmx2g -jar app.jar
```

输出到文件并轮转:

```bash
java \
  -Xlog:gc*:file=/var/log/app/gc.log:time,uptime,level,tags:filecount=5,filesize=20m \
  -Xms2g -Xmx2g \
  -jar app.jar
```

观察重点:

- Young GC 频率和耗时
- Mixed GC / Full GC 是否出现
- GC 前后堆使用量
- 老年代是否持续上涨
- Humongous object 是否多
- Metaspace 是否增长异常
- 单次最大暂停和 P99 暂停

### GC 日志怎么看

典型关注方式:

```text
[info][gc] GC(12) Pause Young ... 128M->32M(512M) 8.2ms
```

含义直觉:

- `GC(12)`:第 12 次 GC
- `Pause Young`:年轻代暂停
- `128M->32M(512M)`:GC 前 128M,后 32M,堆容量 512M
- `8.2ms`:暂停时间

如果 GC 后内存下降很少,说明存活对象多或泄漏风险高。

### 常用诊断工具

| 工具                       | 用途                   |
| -------------------------- | ---------------------- |
| `jcmd`                     | JVM 诊断命令,推荐入口  |
| `jstat`                    | 查看 GC / 类加载等统计 |
| `jmap`                     | dump 堆、查看堆概要    |
| `jstack`                   | dump 线程栈            |
| JFR                        | 低开销生产诊断         |
| MAT / VisualVM / JProfiler | 分析 heap dump         |

常用命令:

```bash
jcmd &lt;pid&gt; VM.flags
jcmd &lt;pid&gt; GC.heap_info
jcmd &lt;pid&gt; GC.class_histogram
jcmd &lt;pid&gt; Thread.print
jcmd &lt;pid&gt; GC.heap_dump /tmp/heap.hprof
```

### 常见问题一:频繁 Young GC

可能原因:

- 分配速率太高
- 短生命周期对象太多
- 年轻代太小
- 大量临时集合 / 字符串 / JSON 对象

排查:

- 看 Young GC 频率
- 看对象分配热点(JFR / profiler)
- 看接口 QPS 和请求对象创建量

解决方向:

- 减少不必要对象创建
- 复用昂贵对象,但不要过度对象池化
- 调整堆 / 年轻代相关参数
- 优化序列化 / JSON / 日志拼接

### 常见问题二:频繁 Full GC

可能原因:

- 老年代空间不足
- 存活对象过多
- 内存泄漏
- Metaspace 增长
- System.gc 调用
- 大对象 / humongous object 压力

排查:

- GC 后老年代是否下降
- heap dump 看最大对象和引用链
- class histogram 看类型数量
- 检查缓存、静态集合、ThreadLocal、监听器

### 常见问题三:内存泄漏

判断趋势:

```text
每次 Full GC 后,堆底线仍持续上升 → 高度怀疑泄漏
```

典型泄漏源:

- 无上限缓存
- static Map
- ThreadLocal 未 remove
- 监听器未注销
- 线程池任务队列堆积
- ClassLoader 泄漏

### G1 调优直觉

G1 把堆分成多个 region,目标是在可控暂停内做增量回收。

常见参数:

```bash
-XX:+UseG1GC
-XX:MaxGCPauseMillis=200
-XX:InitiatingHeapOccupancyPercent=45
```

注意:

- `MaxGCPauseMillis` 是软目标,不是硬保证
- 目标设得太低可能导致 GC 更频繁,吞吐下降
- 大对象可能成为 humongous object,对 G1 不友好

### ZGC 使用直觉

ZGC 目标是低暂停,适合大堆和延迟敏感服务:

```bash
-XX:+UseZGC
```

优点:

- 暂停时间很短
- 支持大堆

代价:

- 可能需要更多 CPU / 内存余量
- 不一定适合吞吐优先任务

### 容器环境注意

现代 JVM 能感知容器限制,但仍需明确配置:

```bash
-XX:MaxRAMPercentage=75
-XX:InitialRAMPercentage=75
```

容器里只设 `-Xmx` 不够,还要考虑:

- Metaspace
- 线程栈
- 直接内存
- Code Cache
- Native 内存

否则进程 RSS 超过容器限制会被 OOMKilled。

## 代码 / 命令示例

### 推荐基础启动参数

```bash
java \
  -Xms2g -Xmx2g \
  -XX:+UseG1GC \
  -XX:+HeapDumpOnOutOfMemoryError \
  -XX:HeapDumpPath=/var/log/app/heap.hprof \
  -Xlog:gc*:file=/var/log/app/gc.log:time,uptime,level,tags:filecount=5,filesize=20m \
  -jar app.jar
```

### 查看堆信息

```bash
jcmd &lt;pid&gt; GC.heap_info
```

### 生成堆 dump

```bash
jcmd &lt;pid&gt; GC.heap_dump /tmp/app.hprof
```

### 查看类直方图

```bash
jcmd &lt;pid&gt; GC.class_histogram
```

## 易错点 / 反例

### 1. 不看日志直接调参数

没有 GC 日志和监控,调参就是猜。至少要有 GC 日志、堆使用曲线、暂停时间和流量背景。

### 2. 盲目增大堆

堆更大可能减少 GC 频率,但也可能让单次回收更重、问题暴露更晚。内存泄漏靠增大堆只能拖延。

### 3. `MaxGCPauseMillis` 设得极低

它是目标不是承诺。设得过低会让 GC 更激进,可能吞吐下降、CPU 升高。

### 4. 只看平均暂停

平均暂停不代表用户体验。线上更关注最大暂停、P95、P99、Full GC 时间点和业务超时是否重合。

### 5. 忽略代码层分配

很多 GC 问题本质是代码制造太多对象。只调 JVM 参数不改对象分配热点,效果有限。

### 6. 容器只配 `-Xmx` 不留非堆空间

容器限制 2G,`-Xmx2g` 很危险,因为非堆内存也会占用 RSS。应给 Metaspace、线程栈、直接内存等留空间。

## 高频面试题(5 题)

- **Q1**: GC 调优的基本流程是什么?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  先明确目标(吞吐、延迟、内存),打开 GC 日志和监控,观察 GC 频率、暂停、堆趋势、Full GC、分配速率,定位问题类型,再小步调整 JVM 参数或优化代码分配,最后压测验证。

  &lt;details&gt;

- **Q2**: GC 日志主要看哪些指标?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  看 Young / Full GC 频率、暂停时间、GC 前后堆占用、老年代变化、Metaspace、最大暂停和 P99 暂停、是否有 humongous object、GC 是否和业务超时重合。

  &lt;details&gt;

- **Q3**: 频繁 Full GC 通常有哪些原因?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  老年代不足、存活对象太多、内存泄漏、Metaspace 增长、大对象压力、显式 `System.gc()`、分配速率过高导致晋升失败等。需要结合 GC 日志和 heap dump 分析。

  &lt;details&gt;

- **Q4**: G1 的 `MaxGCPauseMillis` 是硬保证吗?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  不是,它是软目标。G1 会尝试在该目标内选择回收集合,但如果堆压力、对象存活率、分配速率不支持,实际暂停仍可能超过。设太低还可能降低吞吐。

  &lt;details&gt;

- **Q5**: 容器环境下 JVM 内存配置要注意什么?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  容器限制的是进程总内存 RSS,不只是 Java 堆。除了 `-Xmx`,还要给 Metaspace、线程栈、直接内存、Code Cache、Native 内存留空间,可用 `MaxRAMPercentage` 控制堆占比。

  &lt;details&gt;

## 延伸资源

- [Oracle GC Tuning Guide](https://docs.oracle.com/en/java/javase/21/gctuning/)
- [java 命令参数文档](https://docs.oracle.com/en/java/javase/21/docs/specs/man/java.html)
- [jcmd 工具文档](https://docs.oracle.com/en/java/javase/21/docs/specs/man/jcmd.html)

## (留白) 我的理解

> 这一段不强制填。

---

## JVM 内存结构与运行时数据区

## TL;DR

> JVM 运行时内存主要分为:**程序计数器、虚拟机栈、本地方法栈、Java 堆、方法区 / Metaspace**。线程私有区域随线程创建销毁,线程共享区域承载对象和类元数据,也是 GC 和 OOM 的核心战场。

## 背景与动机

Java 代码运行前会被编译成 `.class` 字节码,再由 JVM 加载和执行。执行过程中 JVM 需要管理:

- 当前线程执行到哪条字节码
- 每个方法调用的局部变量和返回位置
- new 出来的对象放在哪里
- 类信息、常量、方法元数据放在哪里
- Native 方法和直接内存怎么处理

理解 JVM 内存结构可以解释很多问题:

- `StackOverflowError` 为什么出现
- `OutOfMemoryError: Java heap space` 是什么
- 方法区 / Metaspace 和堆有什么区别
- 局部变量和对象到底在哪里
- 为什么大对象和缓存容易导致 OOM

## 核心机制

### 运行时数据区总览

```text
线程私有:
┌─────────────────────┐
│ 程序计数器 PC        │ 当前线程执行到哪条字节码
├─────────────────────┤
│ Java 虚拟机栈         │ Java 方法调用栈帧
├─────────────────────┤
│ 本地方法栈            │ Native 方法调用
└─────────────────────┘

线程共享:
┌─────────────────────┐
│ Java 堆              │ 对象实例、数组,GC 主区域
├─────────────────────┤
│ 方法区 / Metaspace    │ 类元数据、运行时常量池等
└─────────────────────┘

堆外:
┌─────────────────────┐
│ 直接内存 DirectMemory │ NIO ByteBuffer 等使用
└─────────────────────┘
```

### 程序计数器

程序计数器是一小块线程私有内存,记录当前线程正在执行的字节码指令地址。

特点:

- 每个线程一份
- 线程切换后能恢复执行位置
- 执行 Native 方法时值可能为空
- JVM 规范中唯一没有规定 OOM 的区域

直觉:它像“当前线程执行进度指针”。

### Java 虚拟机栈

每个线程有自己的 Java 虚拟机栈。每次方法调用都会创建一个栈帧。

栈帧包含:

- 局部变量表
- 操作数栈
- 动态链接
- 方法返回地址

```java
void a() {
    int x = 1;
    b(x);
}

void b(int n) {
    int y = n + 1;
}
```

调用过程:

```text
a() 入栈 → b() 入栈 → b() 返回出栈 → a() 返回出栈
```

常见错误:

```java
void recurse() {
    recurse();
}
```

无限递归会不断创建栈帧,最终 `StackOverflowError`。

### 本地方法栈

本地方法栈服务于 Native 方法,如 JVM 调用 C/C++ 实现的底层能力。

对普通 Java 开发者来说,理解为“Native 方法调用栈”即可。不同 JVM 实现可能把它和虚拟机栈合并处理。

### Java 堆

Java 堆是 JVM 管理的最大内存区域,几乎所有对象实例和数组都在堆上分配。

```java
User user = new User();
int[] nums = new int[10];
```

这里 `user` 这个局部变量在栈帧里,`new User()` 对象在堆里。

```text
栈帧局部变量表: user ─────▶ 堆: User 对象
```

堆是 GC 的主要区域。堆内存不足且 GC 后仍无法分配对象时,抛出:

```text
OutOfMemoryError: Java heap space
```

### 方法区 / Metaspace

方法区是 JVM 规范概念,用于存储类相关信息:

- 类元数据
- 字段和方法信息
- 运行时常量池
- JIT 编译后的代码缓存等实现相关数据

HotSpot 在 Java 8 后用 Metaspace 实现类元数据存储,使用本地内存而不是永久代。

常见错误:

```text
OutOfMemoryError: Metaspace
```

可能原因:

- 动态生成大量类
- 类加载器泄漏
- 热部署反复加载类但旧 ClassLoader 无法回收

### 运行时常量池

运行时常量池是方法区的一部分,来自 class 文件常量池,保存字面量和符号引用等信息。

字符串常量池在现代 HotSpot 中主要位于堆中,不要简单说“字符串常量池一定在方法区”。

### 直接内存

直接内存不是 JVM 运行时数据区的一部分,但常被 Java 程序使用,尤其是 NIO:

```java
ByteBuffer buffer = ByteBuffer.allocateDirect(1024 * 1024);
```

直接内存优点:

- 避免 Java 堆和 Native 堆之间重复拷贝
- 适合 IO 缓冲

风险:

- 不受 `-Xmx` 直接限制
- 过量使用可能 `OutOfMemoryError: Direct buffer memory`

### 线程私有 vs 线程共享

| 区域               | 线程私有 | 是否 GC 重点 |
| ------------------ | -------- | ------------ |
| 程序计数器         | ✅       | ❌           |
| Java 虚拟机栈      | ✅       | ❌           |
| 本地方法栈         | ✅       | ❌           |
| Java 堆            | ❌       | ✅           |
| 方法区 / Metaspace | ❌       | 部分         |
| 直接内存           | ❌       | JVM 外管理   |

线程私有区域生命周期和线程绑定。线程共享区域更容易出现内存泄漏和 OOM。

## 代码示例

### 堆 OOM 示例

```java
import java.util.ArrayList;
import java.util.List;

public class HeapOomDemo {
    public static void main(String[] args) {
        List<byte[]> list = new ArrayList<>();
        while (true) {
            list.add(new byte[1024 * 1024]);
        }
    }
}
```

运行参数示例:

```bash
java -Xmx64m HeapOomDemo
```

### 栈溢出示例

```java
public class StackOverflowDemo {
    static void recurse() {
        recurse();
    }

    public static void main(String[] args) {
        recurse();
    }
}
```

### 栈变量引用堆对象

```java
class User {
    String name;
}

public class MemoryDemo {
    public static void main(String[] args) {
        User user = new User();
        user.name = "Alice";
    }
}
```

`user` 引用在 main 方法栈帧里,`User` 对象在堆里。

## 易错点 / 反例

### 1. 说“对象都在栈上”

普通对象主要在堆上。JIT 可能通过逃逸分析做标量替换 / 栈上分配优化,但这是优化实现,不能作为基础语义理解。

### 2. 混淆栈溢出和堆溢出

无限递归通常是 `StackOverflowError`;大量对象无法回收通常是 `OutOfMemoryError: Java heap space`。

### 3. 以为 `-Xmx` 限制所有内存

`-Xmx` 主要限制 Java 堆。Metaspace、线程栈、直接内存、Code Cache 等也会占用进程内存。

### 4. 说 Java 8 还有永久代

HotSpot Java 8 移除了永久代,类元数据主要放在 Metaspace。历史项目和面试中要区分 Java 7 PermGen 与 Java 8+ Metaspace。

### 5. 忽略线程数量对内存的影响

每个线程都有栈。线程过多不仅有调度成本,也会消耗大量栈内存,可能导致无法创建新线程。

### 6. 把内存泄漏理解成“对象丢了”

Java 内存泄漏通常是对象仍被引用,GC 认为它还活着,但业务上已经不需要了。典型如静态 Map 缓存不清理、监听器未注销、ThreadLocal 未 remove。

## 高频面试题(5 题)

- **Q1**: JVM 运行时数据区有哪些?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  包括程序计数器、Java 虚拟机栈、本地方法栈、Java 堆、方法区。HotSpot Java 8+ 用 Metaspace 实现类元数据。直接内存不属于 JVM 规范的运行时数据区,但常被 Java 程序使用。

  &lt;details&gt;

- **Q2**: Java 堆和虚拟机栈有什么区别?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  堆是线程共享区域,主要存放对象实例和数组,是 GC 主要管理区域。虚拟机栈是线程私有区域,每个方法调用创建栈帧,保存局部变量表、操作数栈、返回地址等,方法返回后栈帧出栈。

  &lt;details&gt;

- **Q3**: `StackOverflowError` 和 `OutOfMemoryError` 有什么区别?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  `StackOverflowError` 通常是线程栈深度过深,如无限递归导致栈帧耗尽。`OutOfMemoryError` 是某块内存区域无法满足分配请求,如堆空间不足、Metaspace 不足、直接内存不足等。

  &lt;details&gt;

- **Q4**: Java 8 之后方法区和 Metaspace 是什么关系?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  方法区是 JVM 规范中的逻辑区域。HotSpot Java 8 移除永久代,改用 Metaspace 存储类元数据,Metaspace 使用本地内存。不能简单把方法区等同于永久代。

  &lt;details&gt;

- **Q5**: `-Xmx` 是否限制 JVM 进程的全部内存?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  不是。`-Xmx` 限制 Java 堆最大值,但 JVM 进程还会使用线程栈、Metaspace、直接内存、Code Cache、GC 结构等非堆内存。

  &lt;details&gt;

## 延伸资源

- [JVM Spec 2: The Structure of the Java Virtual Machine](https://docs.oracle.com/javase/specs/jvms/se21/html/jvms-2.html)
- [HotSpot VM Performance Enhancements](https://docs.oracle.com/en/java/javase/21/vm/java-hotspot-virtual-machine-performance-enhancements.html)
- [Oracle Troubleshooting: Memory Leaks](https://docs.oracle.com/en/java/javase/21/troubleshoot/troubleshoot-memory-leaks.html)

## (留白) 我的理解

> 这一段不强制填。

---

## Java IO 流体系（字节流 / 字符流 / 缓冲流）

## TL;DR

> Java IO 基于**流（Stream）**抽象，分为字节流（InputStream / OutputStream）和字符流（Reader / Writer）两条线。实际开发中几乎都要套缓冲流，并用 try-with-resources 保证关闭。

## 背景与动机

程序需要和外部交换数据：

- 读写文件
- 网络传输
- 控制台输入输出
- 进程间通信

Java IO 将所有数据源抽象为"流"，提供统一的读写 API。不管数据来自文件、网络还是内存，操作模式一致。

## 核心机制

### 流的分类

```text
按数据单位:
├── 字节流: InputStream / OutputStream（处理原始字节，适合二进制）
└── 字符流: Reader / Writer（处理文本，自动编解码）

按功能:
├── 节点流: 直接连接数据源（FileInputStream, FileReader）
└── 处理流: 包装节点流增强功能（BufferedReader, InputStreamReader）
```

### 字节流核心类

```text
InputStream（抽象）
├── FileInputStream        文件读取
├── ByteArrayInputStream   内存字节数组
├── BufferedInputStream    缓冲包装
├── DataInputStream        读基本类型
└── ObjectInputStream      反序列化

OutputStream（抽象）
├── FileOutputStream
├── ByteArrayOutputStream
├── BufferedOutputStream
├── DataOutputStream
└── ObjectOutputStream
```

基本用法：

```java
try (FileInputStream fis = new FileInputStream("data.bin");
     FileOutputStream fos = new FileOutputStream("copy.bin")) {
    byte[] buf = new byte[8192];
    int len;
    while ((len = fis.read(buf)) != -1) {
        fos.write(buf, 0, len);
    }
}
```

### 字符流核心类

```text
Reader（抽象）
├── FileReader             文件字符读取
├── InputStreamReader      字节→字符桥梁（指定编码）
├── BufferedReader         缓冲 + readLine
└── StringReader           内存字符串

Writer（抽象）
├── FileWriter
├── OutputStreamWriter     字符→字节桥梁
├── BufferedWriter         缓冲 + newLine
├── PrintWriter            格式化输出
└── StringWriter
```

读文本文件：

```java
try (BufferedReader br = new BufferedReader(new FileReader("data.txt"))) {
    String line;
    while ((line = br.readLine()) != null) {
        System.out.println(line);
    }
}
```

### 转换流（编码桥梁）

`InputStreamReader` / `OutputStreamWriter` 是字节流和字符流之间的桥梁，可以指定编码：

```java
try (BufferedReader br = new BufferedReader(
        new InputStreamReader(new FileInputStream("data.txt"), StandardCharsets.UTF_8))) {
    // 按 UTF-8 编码读取
}
```

`FileReader` 使用系统默认编码，需要指定编码时必须用 `InputStreamReader`。

### 缓冲流的重要性

无缓冲流每次 read/write 都可能触发系统调用，性能差。缓冲流在内存中维护缓冲区，减少实际 IO 次数：

```java
// ❌ 无缓冲，逐字节读，性能极差
new FileInputStream("data.bin").read();

// ✅ 带缓冲，批量读
new BufferedInputStream(new FileInputStream("data.bin")).read();
```

默认缓冲区 8KB，可自定义：

```java
new BufferedInputStream(fis, 32768); // 32KB 缓冲
```

### try-with-resources

IO 流必须关闭释放资源。try-with-resources 自动关闭实现了 `AutoCloseable` 的资源：

```java
try (InputStream is = new FileInputStream("a.txt");
     OutputStream os = new FileOutputStream("b.txt")) {
    is.transferTo(os); // JDK 9+
}
// 自动关闭，即使发生异常
```

### 序列化

`Serializable` 标记接口 + `ObjectOutputStream` / `ObjectInputStream`：

```java
class User implements Serializable {
    private static final long serialVersionUID = 1L;
    private String name;
    private transient String password; // transient 不序列化
}

// 序列化
try (ObjectOutputStream oos = new ObjectOutputStream(new FileOutputStream("user.dat"))) {
    oos.writeObject(new User("Alice", "secret"));
}

// 反序列化
try (ObjectInputStream ois = new ObjectInputStream(new FileInputStream("user.dat"))) {
    User user = (User) ois.readObject();
}
```

注意：Java 原生序列化存在安全问题和性能问题，实际项目多用 JSON（Jackson / Gson）或 Protobuf。

## 代码示例

### 复制文件（JDK 9+ 简洁写法）

```java
try (InputStream is = new FileInputStream(src);
     OutputStream os = new FileOutputStream(dst)) {
    is.transferTo(os);
}
```

### 按行读取并处理

```java
try (BufferedReader br = Files.newBufferedReader(Path.of("log.txt"))) {
    br.lines()
      .filter(line -> line.contains("ERROR"))
      .forEach(System.out::println);
}
```

### 写入文本

```java
try (PrintWriter pw = new PrintWriter(new BufferedWriter(
        new FileWriter("output.txt", StandardCharsets.UTF_8)))) {
    pw.println("第一行");
    pw.printf("用户: %s, 年龄: %d%n", "Alice", 25);
}
```

## 易错点 / 反例

### 1. 忘记关闭流

```java
FileInputStream fis = new FileInputStream("data.txt");
fis.read();
// ❌ 忘记 close，文件句柄泄漏
```

必须用 try-with-resources 或 finally 中关闭。

### 2. 用字节流读文本，乱码

```java
InputStream is = new FileInputStream("中文.txt");
byte[] buf = new byte[3]; // ❌ UTF-8 中文 3 字节，如果截断就乱码
```

文本文件应使用字符流（Reader），并指定正确编码。

### 3. FileReader 使用系统默认编码

```java
new FileReader("data.txt"); // ❌ 编码取决于系统，不可移植
```

用 `new InputStreamReader(fis, StandardCharsets.UTF_8)` 或 JDK 11+ `new FileReader(file, charset)`。

### 4. 不用缓冲流

逐字节/逐字符操作在无缓冲情况下性能极差。几乎所有场景都应包装 Buffered 流。

### 5. serialVersionUID 不声明

不声明 `serialVersionUID` 时，JVM 自动生成。类结构改变后反序列化旧数据会失败。

## 高频面试题（5 题）

- **Q1**: 字节流和字符流的区别？
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  字节流（InputStream/OutputStream）按字节操作，适合二进制数据。字符流（Reader/Writer）按字符操作，内部处理编解码，适合文本。字符流底层也是字节流 + 编码转换。

  &lt;details&gt;

- **Q2**: 什么是缓冲流，为什么要用？
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  缓冲流在内存中维护缓冲区（默认 8KB），减少实际系统 IO 调用次数。无缓冲时每次 read/write 可能触发系统调用，缓冲流批量读写，性能提升显著。BufferedReader 还提供 readLine 方便按行读取。

  &lt;details&gt;

- **Q3**: try-with-resources 的作用？
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  自动关闭实现了 AutoCloseable 接口的资源。try 块结束时（无论正常还是异常）自动调用 close()。多个资源按声明逆序关闭。替代了传统 try-finally 手动关闭的繁琐写法。

  &lt;details&gt;

- **Q4**: Java 序列化有什么问题？
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  安全风险：反序列化可执行任意代码（gadget chain 攻击）。性能差：序列化数据体积大，速度慢。兼容性：类结构变化后旧数据可能无法反序列化。实际项目多用 JSON 或 Protobuf。

  &lt;details&gt;

- **Q5**: InputStreamReader 的作用？
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  InputStreamReader 是字节流到字符流的桥梁，将 InputStream 的字节按指定编码转换为字符。配合 BufferedReader 使用是读取指定编码文本文件的标准方式。

  &lt;details&gt;

## 延伸资源

- [java.io 包概览](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/io/package-summary.html)
- [InputStream API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/io/InputStream.html)
- [BufferedReader API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/io/BufferedReader.html)

## (留白) 我的理解

> 这一段不强制填。

---

## Java NIO（Channel / Buffer / Selector）

## TL;DR

> Java NIO 是面向缓冲区、基于通道的 IO 模型。核心三组件：**Channel**（双向通道）、**Buffer**（数据缓冲区）、**Selector**（多路复用器）。NIO 支持非阻塞模式，一个线程可管理多个连接。

## 背景与动机

传统 BIO（Blocking IO）模型：

- 一个连接一个线程
- read / accept 阻塞等待
- 高并发连接时线程数爆炸

NIO 解决的问题：

- 非阻塞读写，线程不必等待数据就绪
- Selector 多路复用，一个线程管理成百上千个连接
- 面向 Buffer 操作，减少数据拷贝

实际开发中很少直接用 NIO API（太底层），而是使用 Netty。但理解 NIO 是理解 Netty 的基础。

## 核心机制

### BIO vs NIO 对比

|          | BIO                     | NIO               |
| -------- | ----------------------- | ----------------- |
| 模型     | 面向流                  | 面向缓冲区        |
| 方向     | 单向（Input 或 Output） | 双向（Channel）   |
| 阻塞     | 阻塞                    | 可非阻塞          |
| 线程模型 | 一连接一线程            | Selector 多路复用 |

### Buffer

Buffer 是 NIO 的数据容器，最常用 `ByteBuffer`：

```java
ByteBuffer buf = ByteBuffer.allocate(1024);
```

Buffer 有四个关键属性：

```text
0 ≤ position ≤ limit ≤ capacity

写模式: [已写数据 | position → | 剩余空间 | ← limit=capacity]
读模式: [可读数据 | position → | ← limit | 剩余空间 | ← capacity]
```

| 属性     | 含义                        |
| -------- | --------------------------- |
| capacity | 缓冲区总容量，不可变        |
| position | 当前读/写位置               |
| limit    | 可操作上限                  |
| mark     | 标记位置，reset 可回到 mark |

关键操作：

```java
ByteBuffer buf = ByteBuffer.allocate(1024);

// 写入数据
buf.put((byte) 65);
buf.put("Hello".getBytes());

// 切换到读模式
buf.flip(); // position→0, limit→原position

// 读取数据
byte b = buf.get();

// 清空准备下一轮写
buf.clear();   // position→0, limit→capacity（数据未擦除）
buf.compact(); // 将未读数据移到头部，position指向未读数据之后
```

Buffer 类型：

- `ByteBuffer`（最常用）
- `CharBuffer`、`IntBuffer`、`LongBuffer` 等
- `MappedByteBuffer`（内存映射文件）

堆内 vs 直接内存：

```java
ByteBuffer heap = ByteBuffer.allocate(1024);        // 堆内存
ByteBuffer direct = ByteBuffer.allocateDirect(1024); // 直接内存（堆外）
```

直接内存优势：减少一次数据从堆到内核的拷贝，适合大量 IO。劣势：分配释放成本高，不受 GC 直接管理。

### Channel

Channel 是双向的数据通道，类比 BIO 的 Stream 但可读可写：

常用 Channel：

| Channel               | 用途       |
| --------------------- | ---------- |
| `FileChannel`         | 文件读写   |
| `SocketChannel`       | TCP 客户端 |
| `ServerSocketChannel` | TCP 服务端 |
| `DatagramChannel`     | UDP        |

文件读写：

```java
try (FileChannel channel = FileChannel.open(Path.of("data.txt"),
        StandardOpenOption.READ)) {
    ByteBuffer buf = ByteBuffer.allocate(1024);
    while (channel.read(buf) != -1) {
        buf.flip();
        // 处理 buf 中的数据
        buf.clear();
    }
}
```

文件复制（零拷贝）：

```java
try (FileChannel src = FileChannel.open(Path.of("src.dat"), StandardOpenOption.READ);
     FileChannel dst = FileChannel.open(Path.of("dst.dat"),
             StandardOpenOption.CREATE, StandardOpenOption.WRITE)) {
    src.transferTo(0, src.size(), dst); // 操作系统级零拷贝
}
```

### Selector（多路复用）

Selector 允许一个线程管理多个 Channel：

```text
Thread ──> Selector
              ├── Channel A (OP_READ)
              ├── Channel B (OP_WRITE)
              └── Channel C (OP_ACCEPT)
```

事件类型：

| SelectionKey | 含义             |
| ------------ | ---------------- |
| `OP_ACCEPT`  | 服务端接受新连接 |
| `OP_CONNECT` | 客户端连接完成   |
| `OP_READ`    | 可读             |
| `OP_WRITE`   | 可写             |

NIO 服务端简化示例：

```java
Selector selector = Selector.open();
ServerSocketChannel ssc = ServerSocketChannel.open();
ssc.bind(new InetSocketAddress(8080));
ssc.configureBlocking(false);
ssc.register(selector, SelectionKey.OP_ACCEPT);

while (true) {
    selector.select(); // 阻塞直到有事件就绪
    Set&lt;SelectionKey&gt; keys = selector.selectedKeys();
    Iterator&lt;SelectionKey&gt; it = keys.iterator();
    while (it.hasNext()) {
        SelectionKey key = it.next();
        it.remove();
        if (key.isAcceptable()) {
            SocketChannel sc = ssc.accept();
            sc.configureBlocking(false);
            sc.register(selector, SelectionKey.OP_READ);
        } else if (key.isReadable()) {
            SocketChannel sc = (SocketChannel) key.channel();
            ByteBuffer buf = ByteBuffer.allocate(1024);
            int len = sc.read(buf);
            if (len > 0) {
                buf.flip();
                // 处理数据
            }
        }
    }
}
```

### 零拷贝

传统 IO 数据流转：

```text
磁盘 → 内核缓冲区 → 用户缓冲区 → Socket 缓冲区 → 网卡
```

零拷贝（transferTo / mmap）：

```text
磁盘 → 内核缓冲区 → 网卡（减少用户态拷贝）
```

Java 中的零拷贝方式：

- `FileChannel.transferTo()` / `transferFrom()`
- `MappedByteBuffer`（内存映射）

## 代码示例

### ByteBuffer 读写流程

```java
ByteBuffer buf = ByteBuffer.allocate(48);

buf.put("Hello NIO".getBytes(StandardCharsets.UTF_8));
buf.flip(); // 切换读模式

byte[] data = new byte[buf.remaining()];
buf.get(data);
System.out.println(new String(data)); // Hello NIO

buf.clear(); // 准备下一轮写入
```

### 内存映射文件（大文件处理）

```java
try (FileChannel channel = FileChannel.open(Path.of("big.dat"), StandardOpenOption.READ)) {
    MappedByteBuffer mbb = channel.map(FileChannel.MapMode.READ_ONLY, 0, channel.size());
    while (mbb.hasRemaining()) {
        byte b = mbb.get();
    }
}
```

## 易错点 / 反例

### 1. 忘记 flip

```java
buf.put(data);
buf.get(); // ❌ 还在写模式，position 指向数据末尾，读不到东西
```

写完必须 `flip()` 才能读。

### 2. 混淆 clear 和 compact

- `clear()`：丢弃所有数据，position→0, limit→capacity
- `compact()`：保留未读数据，移到头部，position 指向未读数据之后

如果还有未处理的数据，应该用 compact。

### 3. 直接内存泄漏

```java
while (true) {
    ByteBuffer.allocateDirect(1024 * 1024); // ❌ 直接内存不受 GC 直接管理
}
```

直接内存需要通过 Cleaner 或手动管理，频繁分配可能导致 OOM。

### 4. selectedKeys 不 remove

```java
for (SelectionKey key : selector.selectedKeys()) {
    // ❌ 不 remove，下次 select 还会返回已处理的 key
}
```

必须在处理后调用 `it.remove()` 或 `selectedKeys.clear()`。

### 5. 认为 NIO 一定比 BIO 快

NIO 优势在高并发连接数下的线程利用率，不是单次 IO 速度。低并发场景下 BIO 代码更简单，性能差异不大。

## 高频面试题（5 题）

- **Q1**: BIO、NIO、AIO 的区别？
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  BIO 同步阻塞，一连接一线程。NIO 同步非阻塞，面向 Buffer + Channel + Selector 多路复用。AIO 异步非阻塞，操作系统完成 IO 后回调通知（Linux 上 AIO 实现不成熟，实际较少使用）。

  &lt;details&gt;

- **Q2**: ByteBuffer 的 flip、clear、compact 分别做什么？
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  flip：写模式切读模式，limit=position, position=0。clear：重置为写模式，position=0, limit=capacity，数据未擦除。compact：保留未读数据移到头部，position 指向未读数据末尾，准备继续写入。

  &lt;details&gt;

- **Q3**: Selector 多路复用的原理？
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  Selector 底层依赖操作系统的 epoll（Linux）/ kqueue（macOS）/ IOCP（Windows）。一个线程调用 select() 监听多个 Channel 的事件，有事件就绪时返回对应的 SelectionKey 集合进行处理。

  &lt;details&gt;

- **Q4**: 直接内存和堆内存的区别？
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  堆内存在 JVM 堆上，受 GC 管理。直接内存在堆外，通过 Unsafe 或 ByteBuffer.allocateDirect 分配，IO 时减少一次用户态拷贝，但分配释放成本高，需手动管理或依赖 Cleaner。

  &lt;details&gt;

- **Q5**: 什么是零拷贝？Java 中如何实现？
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  零拷贝减少数据在用户态和内核态之间的拷贝次数。Java 中通过 FileChannel.transferTo()（底层 sendfile 系统调用）和 MappedByteBuffer（mmap 内存映射）实现。Netty 的 CompositeByteBuf 也是应用层零拷贝。

  &lt;details&gt;

## 延伸资源

- [java.nio 包概览](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/nio/package-summary.html)
- [java.nio.channels 包](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/nio/channels/package-summary.html)
- [ByteBuffer API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/nio/ByteBuffer.html)

## (留白) 我的理解

> 这一段不强制填。

---

## NIO.2 Files / Path API 与文件操作

## TL;DR

> JDK 7 引入的 `java.nio.file` 包（NIO.2）提供了现代化的文件操作 API。`Path` 替代 `File` 表示路径，`Files` 工具类提供一站式文件读写、复制、遍历等操作。日常文件操作应优先使用 NIO.2 而非老 `java.io.File`。

## 背景与动机

老 `java.io.File` 的问题：

- 方法失败只返回 false / null，不抛异常，无法知道失败原因
- 不支持符号链接
- 不支持文件属性（权限、所有者等）
- 性能和功能有限

NIO.2（`java.nio.file`）全面替代 File：

- `Path` 表示路径，不可变
- `Files` 提供丰富的静态方法
- 异常驱动（失败抛 IOException）
- 支持符号链接、文件属性、WatchService

## 核心机制

### Path

```java
Path path = Path.of("/Users/m/data/file.txt");
Path path2 = Path.of("data", "file.txt"); // 多段拼接

path.getFileName();      // file.txt
path.getParent();        // /Users/m/data
path.toAbsolutePath();   // 转绝对路径
path.resolve("sub");     // /Users/m/data/file.txt/sub
path.resolveSibling("b.txt"); // /Users/m/data/b.txt
path.relativize(other);  // 计算相对路径
```

Path 是不可变的，所有操作返回新 Path。

### Files 常用操作

读写：

```java
// 读取全部行
List&lt;String&gt; lines = Files.readAllLines(Path.of("data.txt"), StandardCharsets.UTF_8);

// 读取全部字节
byte[] bytes = Files.readAllBytes(Path.of("image.png"));

// 读取为字符串（JDK 11+）
String content = Files.readString(Path.of("data.txt"));

// 写入
Files.writeString(Path.of("out.txt"), "Hello", StandardCharsets.UTF_8);
Files.write(Path.of("out.txt"), lines);

// 追加
Files.writeString(Path.of("log.txt"), "append\n",
    StandardOpenOption.APPEND, StandardOpenOption.CREATE);
```

复制、移动、删除：

```java
Files.copy(src, dst, StandardCopyOption.REPLACE_EXISTING);
Files.move(src, dst, StandardCopyOption.ATOMIC_MOVE);
Files.delete(path);          // 不存在则抛异常
Files.deleteIfExists(path);  // 不存在返回 false
```

目录操作：

```java
Files.createDirectory(Path.of("newdir"));
Files.createDirectories(Path.of("a/b/c")); // 递归创建

// 判断
Files.exists(path);
Files.isDirectory(path);
Files.isRegularFile(path);
Files.size(path); // 文件大小（字节）
```

### 遍历目录

列出直接子项：

```java
try (DirectoryStream&lt;Path&gt; stream = Files.newDirectoryStream(dir, "*.txt")) {
    for (Path entry : stream) {
        System.out.println(entry);
    }
}
```

递���遍历（Stream）：

```java
try (Stream&lt;Path&gt; paths = Files.walk(Path.of("src"))) {
    paths.filter(Files::isRegularFile)
         .filter(p -> p.toString().endsWith(".java"))
         .forEach(System.out::println);
}
```

查找文件：

```java
try (Stream&lt;Path&gt; paths = Files.find(Path.of("src"), 10,
        (path, attrs) -> attrs.isRegularFile() && path.toString().endsWith(".java"))) {
    paths.forEach(System.out::println);
}
```

注意：`Files.walk` / `Files.find` / `Files.list` 返回的 Stream 必须关闭（try-with-resources），因为底层持有目录句柄。

### 临时文件

```java
Path tempFile = Files.createTempFile("prefix-", ".tmp");
Path tempDir = Files.createTempDirectory("myapp-");
```

### WatchService（文件监听）

监听目录变化：

```java
WatchService watcher = FileSystems.getDefault().newWatchService();
Path dir = Path.of("watched");
dir.register(watcher, StandardWatchEventKinds.ENTRY_CREATE,
    StandardWatchEventKinds.ENTRY_MODIFY);

while (true) {
    WatchKey key = watcher.take(); // 阻塞等待事件
    for (WatchEvent<?> event : key.pollEvents()) {
        Path changed = (Path) event.context();
        System.out.println(event.kind() + ": " + changed);
    }
    key.reset();
}
```

### File 和 Path 互转

```java
File file = path.toFile();
Path path = file.toPath();
```

遗留代码中可能还在用 File，互转方便渐进式迁移。

## 代码示例

### 按行处理大文件（不全部加载内存）

```java
try (Stream&lt;String&gt; lines = Files.lines(Path.of("huge.log"), StandardCharsets.UTF_8)) {
    long errorCount = lines.filter(l -> l.contains("ERROR")).count();
    System.out.println("错误行数: " + errorCount);
}
```

### 递归复制目录

```java
Path src = Path.of("source");
Path dst = Path.of("target");

try (Stream&lt;Path&gt; paths = Files.walk(src)) {
    paths.forEach(source -> {
        Path target = dst.resolve(src.relativize(source));
        try {
            if (Files.isDirectory(source)) {
                Files.createDirectories(target);
            } else {
                Files.copy(source, target, StandardCopyOption.REPLACE_EXISTING);
            }
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    });
}
```

### 读取文件属性

```java
BasicFileAttributes attrs = Files.readAttributes(path, BasicFileAttributes.class);
System.out.println("大小: " + attrs.size());
System.out.println("创建时间: " + attrs.creationTime());
System.out.println("最后修改: " + attrs.lastModifiedTime());
```

## 易错点 / 反例

### 1. readAllLines 读大文件

```java
Files.readAllLines(Path.of("10GB.log")); // ❌ 全部加载到内存，OOM
```

大文件用 `Files.lines()` 返回 Stream 逐行处理。

### 2. Files.walk 的 Stream 不关闭

```java
Files.walk(Path.of("src"))
    .filter(Files::isRegularFile)
    .forEach(System.out::println); // ❌ Stream 未关闭，目录句柄泄漏
```

必须用 try-with-resources 包裹。

### 3. 还在用 java.io.File 的新代码

新代码应使用 Path + Files。File 的 `list()` / `mkdir()` 等方法失败时返回 null/false，容易忽略错误。

### 4. Path.resolve 的语义误解

```java
Path base = Path.of("/Users/m");
base.resolve("/etc/hosts"); // 返回 /etc/hosts（绝对路径覆盖 base）
```

如果参数是绝对路径，resolve 直接返回参数。拼接子路径时确保参数是相对路径。

## 高频面试题（5 题）

- **Q1**: Path 和 File 的区别？
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  Path 是 NIO.2（JDK 7+）引入的不可变路径对象，配合 Files 工具类使用。File 是 java.io 的老 API，操作失败返回 false/null 不抛异常。新代码应优先使用 Path + Files，两者可通过 toFile()/toPath() 互转。

  &lt;details&gt;

- **Q2**: 如何高效读取大文件？
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  不能用 readAllLines / readAllBytes 全量加载。用 Files.lines() 返回 Stream 逐行惰性处理；或用 BufferedReader 按行读取；或用 FileChannel + ByteBuffer 按块读取。

  &lt;details&gt;

- **Q3**: Files.walk 和 Files.list 的区别？
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  Files.list 只列出当前目录的直接子项（不递归）。Files.walk 递归遍历整个目录树，可指定最大深度。两者都返回 Stream，必须用 try-with-resources 关闭。

  &lt;details&gt;

- **Q4**: WatchService 的作用？
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  WatchService 监听目录的文件变化事件（创建、修改、删除）。适合热加载配置文件、监控日志目录等场景。底层依赖操作系统的文件事件通知机制。

  &lt;details&gt;

- **Q5**: Files 常用操作有哪些？
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  读写：readString/writeString、readAllLines/write、lines。文件管理：copy/move/delete/exists/createDirectories。遍历：list/walk/find。属性：size/readAttributes/getLastModifiedTime。

  &lt;details&gt;

## 延伸资源

- [Files API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/nio/file/Files.html)
- [Path API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/nio/file/Path.html)
- [WatchService API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/nio/file/WatchService.html)

## (留白) 我的理解

> 这一段不强制填。

---

## JDBC 基础、连接池与事务

## TL;DR

> JDBC 是 Java 访问关系数据库的标准 API。核心流程：获取 Connection → 创建 PreparedStatement → 执行 SQL → 处理 ResultSet → 关闭资源。生产环境必须使用连接池（HikariCP / Druid），并通过参数化查询防止 SQL 注入。

## 背景与动机

Java 应用需要和数据库交互：

- 查询用户信息
- 写入订单数据
- 执行事务

JDBC（Java Database Connectivity）定义了统一接口，各数据库厂商提供驱动实现：

```text
Java 应用 → JDBC API → MySQL Driver → MySQL Server
                     → PostgreSQL Driver → PostgreSQL Server
```

上层代码面向 JDBC 接口编程，切换数据库只需替换驱动。

## 核心机制

### JDBC 核心流程

```java
// 1. 加载驱动（JDK 6+ 通过 SPI 自动加载，通常不需要手动写）
// Class.forName("com.mysql.cj.jdbc.Driver");

// 2. 获取连接
Connection conn = DriverManager.getConnection(
    "jdbc:mysql://localhost:3306/mydb?useSSL=false&serverTimezone=UTC",
    "root", "password"
);

// 3. 创建预编译语句
PreparedStatement ps = conn.prepareStatement(
    "SELECT id, name FROM users WHERE id = ?"
);
ps.setLong(1, userId);

// 4. 执行查询
ResultSet rs = ps.executeQuery();

// 5. 处理结果
while (rs.next()) {
    long id = rs.getLong("id");
    String name = rs.getString("name");
}

// 6. 关闭资源
rs.close();
ps.close();
conn.close();
```

实际代码用 try-with-resources：

```java
try (Connection conn = dataSource.getConnection();
     PreparedStatement ps = conn.prepareStatement("SELECT * FROM users WHERE id = ?")) {
    ps.setLong(1, userId);
    try (ResultSet rs = ps.executeQuery()) {
        if (rs.next()) {
            return new User(rs.getLong("id"), rs.getString("name"));
        }
    }
}
```

### Statement vs PreparedStatement

|          | Statement  | PreparedStatement |
| -------- | ---------- | ----------------- |
| SQL 编写 | 拼接字符串 | 参数化占位符 `?`  |
| SQL 注入 | 有风险     | 防止              |
| 性能     | 每次编译   | 预编译可复用      |
| 使用建议 | 几乎不用   | 始终使用          |

```java
// ❌ Statement 拼接 → SQL 注入风险
String sql = "SELECT * FROM users WHERE name = '" + userInput + "'";
// userInput = "'; DROP TABLE users; --"

// ✅ PreparedStatement 参数化
PreparedStatement ps = conn.prepareStatement("SELECT * FROM users WHERE name = ?");
ps.setString(1, userInput);
```

### 连接池

每次 DriverManager.getConnection() 都创建新的 TCP 连接，代价大。连接池预先创建一批连接复用：

```text
应用线程 → 从池中借连接 → 执行 SQL → 归还连接到池中
```

主流连接池：

| 连接池       | ��点                                 |
| ------------ | ------------------------------------ |
| **HikariCP** | Spring Boot 默认，性能最优，配置简洁 |
| **Druid**    | 阿里开源，监控功能强，国内常用       |
| **DBCP**     | Apache 老牌，现已较少使用            |

HikariCP 配置示例（Spring Boot）：

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/mydb
    username: root
    password: secret
    hikari:
      maximum-pool-size: 20
      minimum-idle: 5
      connection-timeout: 30000
      idle-timeout: 600000
      max-lifetime: 1800000
```

关键参数：

- `maximum-pool-size`：最大连接数（默认 10，按并发量调整）
- `minimum-idle`：最小空闲连接
- `connection-timeout`：获取连接超时时间
- `max-lifetime`：连接最大存活时间（应小于数据库 wait_timeout）

### JDBC 事务

JDBC 默认自动提交（每条 SQL 自动 commit）。手动事务：

```java
Connection conn = dataSource.getConnection();
try {
    conn.setAutoCommit(false); // 开启手动事务

    ps1.executeUpdate(); // 扣库存
    ps2.executeUpdate(); // 创建订单

    conn.commit(); // 提交
} catch (Exception e) {
    conn.rollback(); // 回滚
    throw e;
} finally {
    conn.setAutoCommit(true);
    conn.close();
}
```

事务隔离级别：

```java
conn.setTransactionIsolation(Connection.TRANSACTION_READ_COMMITTED);
```

| 隔离级别         | 脏读   | 不可重复读 | 幻读   |
| ---------------- | ------ | ---------- | ------ |
| READ_UNCOMMITTED | 可能   | 可能       | 可能   |
| READ_COMMITTED   | 不可能 | 可能       | 可能   |
| REPEATABLE_READ  | 不可能 | 不可能     | 可能   |
| SERIALIZABLE     | 不可能 | 不可能     | 不可能 |

MySQL 默认 REPEATABLE_READ，PostgreSQL 默认 READ_COMMITTED。

### 批量操作

```java
PreparedStatement ps = conn.prepareStatement("INSERT INTO users (name, age) VALUES (?, ?)");
for (User user : users) {
    ps.setString(1, user.getName());
    ps.setInt(2, user.getAge());
    ps.addBatch();
}
int[] results = ps.executeBatch();
```

批量操作需要在 JDBC URL 中加 `rewriteBatchedStatements=true`（MySQL）才能真正合并为一条 SQL。

## 代码示例

### 通用查询模式

```java
public Optional&lt;User&gt; findById(long id) throws SQLException {
    String sql = "SELECT id, name, email FROM users WHERE id = ?";
    try (Connection conn = dataSource.getConnection();
         PreparedStatement ps = conn.prepareStatement(sql)) {
        ps.setLong(1, id);
        try (ResultSet rs = ps.executeQuery()) {
            if (rs.next()) {
                return Optional.of(new User(
                    rs.getLong("id"),
                    rs.getString("name"),
                    rs.getString("email")
                ));
            }
            return Optional.empty();
        }
    }
}
```

### 插入并获取自增主键

```java
PreparedStatement ps = conn.prepareStatement(
    "INSERT INTO users (name) VALUES (?)",
    Statement.RETURN_GENERATED_KEYS
);
ps.setString(1, "Alice");
ps.executeUpdate();

try (ResultSet keys = ps.getGeneratedKeys()) {
    if (keys.next()) {
        long generatedId = keys.getLong(1);
    }
}
```

## 易错点 / 反例

### 1. 用 Statement 拼接 SQL

SQL 注入是 OWASP Top 10 安全漏洞。永远使用 PreparedStatement 参数化查询。

### 2. 不关闭连接

```java
Connection conn = dataSource.getConnection();
// 用完不关 → ❌ 连接泄漏，池耗尽后所有请求阻塞
```

必须 try-with-resources 或 finally 中关闭。

### 3. 连接池 maxPoolSize 设置过大

HikariCP 作者建议：`connections = (core_count * 2) + effective_spindle_count`。通常 10-20 就够，设太大反而因为上下文切换降低性能。

### 4. 事务中执行耗时操作

```java
conn.setAutoCommit(false);
ps.executeUpdate();
callExternalApi(); // ❌ 耗时操作占用连接和事���锁
conn.commit();
```

事务应尽快完成，不要在事务中做远程调用或复杂计算。

### 5. 忽略 max-lifetime 配置

如果连接存活时间超过数据库的 wait_timeout，数据库会主动断开，应用端拿到已断开的连接导致异常。max-lifetime 应小于数据库 wait_timeout。

## 高频面试题（5 题）

- **Q1**: PreparedStatement 和 Statement 的区别？
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  PreparedStatement 使用 `?` 占位符参数化查询，防止 SQL 注入，且 SQL 预编译可复用。Statement 拼接字符串，有注入风险，每次编译。生产环境应始终使用 PreparedStatement。

  &lt;details&gt;

- **Q2**: 为什么要用连接池？
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  数据库连接创建涉及 TCP 三次握手、认证等，代价大。连接池预先创建连接复用，减少创建销毁开销。还提供最大连接数限制、健康检查、超时控制等管理能力。主流选择 HikariCP。

  &lt;details&gt;

- **Q3**: JDBC 事务的隔离级别有哪些？
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  四个级别：READ_UNCOMMITTED（可能脏读）、READ_COMMITTED（防脏读）、REPEATABLE_READ（防不可重复读，MySQL 默认）、SERIALIZABLE（完全隔离但性能差）。级别越高并发性能越低。

  &lt;details&gt;

- **Q4**: 什么是 SQL 注入？如何防止？
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  SQL 注入是通过在用户输入中嵌入恶意 SQL 片段，改变原始查询语义。防止方法：使用 PreparedStatement 参数化查询，ORM 框架的参数绑定，输入校验。永远不要拼接用户输入到 SQL 中。

  &lt;details&gt;

- **Q5**: HikariCP 连接池关键参数有哪些？
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  maximumPoolSize（最大连接数，通常 10-20）、minimumIdle（最小空闲）、connectionTimeout（获取连接超时）、maxLifetime（连接最大存活时间，应小于数据库 wait_timeout）、idleTimeout（空闲连接超时）。

  &lt;details&gt;

## 延伸资源

- [java.sql 包概览](https://docs.oracle.com/en/java/javase/21/docs/api/java.sql/java/sql/package-summary.html)
- [PreparedStatement API](https://docs.oracle.com/en/java/javase/21/docs/api/java.sql/java/sql/PreparedStatement.html)
- [HikariCP GitHub](https://github.com/brettwooldridge/HikariCP)

## (留白) 我的理解

> 这一段不强制填。

---

## JPA / Hibernate 与 Spring Data JPA

## TL;DR

> JPA 是 Java 持久化规范，Hibernate 是最流行的实现。Spring Data JPA 在此之上提供 Repository 抽象，通过方法名自动生成查询，极大减少样板代码。适合标准 CRUD 场景，复杂查询场景建议结合 JPQL 或原生 SQL。

## 背景与动机

JDBC / MyBatis 需要手动写 SQL 和结果映射。对于标准 CRUD 操作，大量代码是重复的。

JPA（Jakarta Persistence API）的理念：

- 面向对象操作数据库，而非面向 SQL
- Entity 对象自动映射到表
- 对象关系自动处理（一对多、多对多）
- 屏蔽数据库方言差异

层次关系：

```text
Spring Data JPA（Repository 抽象，方法名查询）
    ↓
JPA 规范（@Entity, EntityManager, JPQL）
    ↓
Hibernate（JPA 最流行实现）
    ↓
JDBC
```

## 核心机制

### Entity 实体映射

```java
@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String name;

    @Column(unique = true)
    private String email;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Enumerated(EnumType.STRING)
    private UserStatus status;

    // getter/setter 或 Lombok @Data
}
```

常用注解：

| 注解              | 作用                             |
| ----------------- | -------------------------------- |
| `@Entity`         | 标记为 JPA 实体                  |
| `@Table`          | 指定表名                         |
| `@Id`             | 主键                             |
| `@GeneratedValue` | 主键生成策略                     |
| `@Column`         | 列属性（名称、长度、是否可空）   |
| `@Enumerated`     | 枚举映射方式（STRING / ORDINAL） |
| `@Temporal`       | 日期类型映射                     |
| `@Transient`      | 不持久化的字段                   |

### 关联映射

一对多：

```java
@Entity
public class User {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List&lt;Order&gt; orders = new ArrayList<>();
}

@Entity
public class Order {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;
}
```

多对多：

```java
@Entity
public class Student {
    @ManyToMany
    @JoinTable(
        name = "student_course",
        joinColumns = @JoinColumn(name = "student_id"),
        inverseJoinColumns = @JoinColumn(name = "course_id")
    )
    private Set&lt;Course&gt; courses = new HashSet<>();
}
```

### Spring Data JPA Repository

```java
public interface UserRepository extends JpaRepository<User, Long> {

    // 方法名自动生成查询
    Optional&lt;User&gt; findByEmail(String email);
    List&lt;User&gt; findByNameContainingAndStatus(String name, UserStatus status);
    List&lt;User&gt; findByCreatedAtAfterOrderByCreatedAtDesc(LocalDateTime time);

    // 统计
    long countByStatus(UserStatus status);
    boolean existsByEmail(String email);

    // JPQL 自定义查询
    @Query("SELECT u FROM User u WHERE u.status = :status AND u.createdAt > :since")
    List&lt;User&gt; findActiveUsersSince(@Param("status") UserStatus status,
                                    @Param("since") LocalDateTime since);

    // 原生 SQL
    @Query(value = "SELECT * FROM users WHERE email LIKE %:domain", nativeQuery = true)
    List&lt;User&gt; findByEmailDomain(@Param("domain") String domain);

    // 更新
    @Modifying
    @Query("UPDATE User u SET u.status = :status WHERE u.id = :id")
    int updateStatus(@Param("id") Long id, @Param("status") UserStatus status);
}
```

方法名关键词：

| 关键词                 | 含义     |
| ---------------------- | -------- |
| `findBy`               | 查询     |
| `countBy`              | 计数     |
| `existsBy`             | 是否存在 |
| `deleteBy`             | 删除     |
| `And` / `Or`           | 多条件   |
| `OrderBy`              | 排序     |
| `Containing`           | LIKE %x% |
| `Between`              | 范围     |
| `In`                   | IN 查询  |
| `IsNull` / `IsNotNull` | 空值判断 |

### JPQL vs 原生 SQL

JPQL（Java Persistence Query Language）面向实体对象查询：

```java
// JPQL — 用实体名和属性名，不是表名和列名
@Query("SELECT u FROM User u JOIN FETCH u.orders WHERE u.id = :id")
User findWithOrders(@Param("id") Long id);
```

原生 SQL 适合复杂查询、数据库特有函数：

```java
@Query(value = "SELECT * FROM users WHERE JSON_CONTAINS(tags, ?1)", nativeQuery = true)
List&lt;User&gt; findByTag(String tag);
```

### 分页与排序

```java
// Repository 方法
Page&lt;User&gt; findByStatus(UserStatus status, Pageable pageable);

// 调用
Pageable pageable = PageRequest.of(0, 20, Sort.by("createdAt").descending());
Page&lt;User&gt; page = userRepository.findByStatus(UserStatus.ACTIVE, pageable);

page.getContent();       // 当前页数据
page.getTotalElements(); // 总记录数
page.getTotalPages();    // 总页数
```

### 懒加载与 N+1 问题

`FetchType.LAZY`（默认）：关联数据在访问时才查询
`FetchType.EAGER`：立即加载关联数据

N+1 问题：

```java
List&lt;User&gt; users = userRepository.findAll(); // 1 次查询
for (User user : users) {
    user.getOrders().size(); // 每个 user 触发 1 次查询 → N 次
}
// 共 N+1 次查询
```

解决方案：

```java
// JOIN FETCH 一次查询加载
@Query("SELECT u FROM User u JOIN FETCH u.orders")
List&lt;User&gt; findAllWithOrders();

// EntityGraph
@EntityGraph(attributePaths = {"orders"})
List&lt;User&gt; findAll();
```

### 审计字段

```java
@Entity
@EntityListeners(AuditingEntityListener.class)
public class User {
    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    @CreatedBy
    private String createdBy;
}
```

需要启用 `@EnableJpaAuditing`。

## 代码示例

### Service 层使用

```java
@Service
@Transactional(readOnly = true)
public class UserService {
    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public UserDto getUser(Long id) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("User not found: " + id));
        return UserDto.from(user);
    }

    @Transactional
    public UserDto createUser(CreateUserRequest req) {
        User user = new User();
        user.setName(req.name());
        user.setEmail(req.email());
        return UserDto.from(userRepository.save(user));
    }
}
```

## 易错点 / 反例

### 1. N+1 查询不自知

默认 LAZY 加载 + 循环访问关联属性 → N+1 查询。开发时应开启 SQL 日志，关注实际执行的查询数量。

### 2. 在事务外访问懒加载属性

```java
User user = userRepository.findById(1L).get();
// 事务已结束
user.getOrders(); // ❌ LazyInitializationException
```

懒加载属性必须在事务范围内访问，或使用 JOIN FETCH / EntityGraph 预加载。

### 3. 双向关联只设一侧

```java
user.getOrders().add(order);
// ❌ 忘了设置 order.setUser(user) → 外键可能为 null
```

双向关联需要维护两侧引用一致性。

### 4. Enumerated 用 ORDINAL

```java
@Enumerated(EnumType.ORDINAL) // ❌ 枚举顺序变化导致数据错乱
```

应使用 `EnumType.STRING`，存字符串更安全。

### 5. 用 JPA 做复杂报表查询

JPA 适合标准 CRUD 和简单查询。复杂统计、多表聚合、特定数据库函数场景下，原生 SQL 或 MyBatis 更合适。

## 高频面试题（5 题）

- **Q1**: JPA、Hibernate、Spring Data JPA 的关系？
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  JPA 是 Java 持久化规范（接口定义）。Hibernate 是 JPA 最流行的实现。Spring Data JPA 在 JPA 之上提供 Repository 抽象层，通过方法名自动生成查询，简化开发。三者是规范→实现→增强的关系。

  &lt;details&gt;

- **Q2**: 什么是 N+1 查询问题？如何解决？
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  查询 N 个对象后，访问每个对象的懒加载关联属性各触发 1 次查询，共 N+1 次。解决：使用 JOIN FETCH 一次查询加载、@EntityGraph 指定预加载属性、或 @BatchSize 批量加载。

  &lt;details&gt;

- **Q3**: LAZY 和 EAGER 加载的区别？
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  LAZY 延迟加载，访问关联属性时才查询，节省资源但可能 N+1。EAGER 立即加载，获取实体时同时查询关联数据。@ManyToOne 默认 EAGER，@OneToMany 默认 LAZY。推荐默认 LAZY，需要时用 JOIN FETCH 显式加载。

  &lt;details&gt;

- **Q4**: Spring Data JPA 方法名查询原理？
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  Spring Data 解析方法名中的关键词（findBy、And、OrderBy、Containing 等），自动构建 JPQL 查询。不需要写 SQL，方法签名即查询定义。复杂查询可用 @Query 注解手写 JPQL 或原生 SQL。

  &lt;details&gt;

- **Q5**: JPA 和 MyBatis 怎么选？
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  JPA 适合标准 CRUD 多、模型关系明确的场景，开发效率高。MyBatis 适合 SQL 复杂、需要精细优化的场景，对 SQL 完全可控。国内偏好 MyBatis（DBA 可直接审 SQL），海外偏好 JPA/Hibernate。两者可混用。

  &lt;details&gt;

## 延伸资源

- [Jakarta Persistence 规范](https://jakarta.ee/specifications/persistence/3.1/)
- [Spring Data JPA 文档](https://docs.spring.io/spring-data/jpa/reference/jpa.html)
- [Hibernate 用户指南](https://docs.jboss.org/hibernate/orm/6.4/userguide/html_single/Hibernate_User_Guide.html)

## (留白) 我的理解

> 这一段不强制填。

---

## MyBatis 核心机制与动态 SQL

## TL;DR

> MyBatis 是半自动 ORM 框架，SQL 由开发者编写（XML 或注解），MyBatis 负责参数绑定、结果映射和资源管理。核心优势是**对 SQL 完全可控**，配合动态 SQL 能力处理复杂查询场景。

## 背景与动机

纯 JDBC 的问题：

- 大量重复代码（获取连接、关闭资源、结果集映射）
- SQL 散落在 Java 代码中，维护困难
- 结果集到对象的映射繁琐

MyBatis 的定位：

- 不像 Hibernate 完全屏蔽 SQL，而是让开发者写 SQL
- 自动处理参数绑定和结果映射
- 提供动态 SQL 能力处理条件查询
- 和 Spring 深度集成（MyBatis-Spring）

国内 Java 后端项目中 MyBatis 使用率极高。

## 核心机制

### 架构概览

```text
Mapper 接口（Java 方法定义）
    ↓
XML / 注解（SQL 语句定义）
    ↓
SqlSession → Executor → StatementHandler → JDBC
    ↓
ResultSetHandler → 结果映射为 Java 对象
```

### Mapper 接口 + XML

定义 Mapper 接口：

```java
public interface UserMapper {
    User selectById(Long id);
    List&lt;User&gt; selectByName(String name);
    int insert(User user);
    int update(User user);
    int deleteById(Long id);
}
```

对应 XML：

```xml
<mapper namespace="com.example.mapper.UserMapper">

    <select id="selectById" resultType="com.example.entity.User">
        SELECT id, name, email, created_at
        FROM users
        WHERE id = #{id}
    &lt;select&gt;

    <insert id="insert" useGeneratedKeys="true" keyProperty="id">
        INSERT INTO users (name, email)
        VALUES (#{name}, #{email})
    &lt;insert&gt;

    <update id="update">
        UPDATE users SET name = #{name}, email = #{email}
        WHERE id = #{id}
    &lt;update&gt;

    <delete id="deleteById">
        DELETE FROM users WHERE id = #{id}
    &lt;delete&gt;

&lt;mapper&gt;
```

### #{} 和 ${} 的区别

```xml
<!-- #{} — 预编译参数，防 SQL 注入（推荐） -->
SELECT * FROM users WHERE name = #{name}
<!-- 编译为: SELECT * FROM users WHERE name = ? -->

<!-- ${} — 字符串替换，有 SQL 注入风险 -->
SELECT * FROM users ORDER BY ${columnName}
<!-- 直接拼接: SELECT * FROM users ORDER BY create_time -->
```

|      | `#{}`                  | `${}`                          |
| ---- | ---------------------- | ------------------------------ |
| 方式 | PreparedStatement 参数 | 字符串直接替换                 |
| 安全 | 防 SQL 注入            | 有注入风险                     |
| 适用 | 值参数                 | 表名、列名、ORDER BY（需校验） |

`${}` 仅在无法用 `#{}` 的场景使用（如动态表名、列名），且必须自行校验输入。

### 动态 SQL

MyBatis 动态 SQL 是其核心优势：

```xml
<select id="search" resultType="User">
    SELECT * FROM users
    &lt;where&gt;
        <if test="name != null and name != ''">
            AND name LIKE CONCAT('%', #{name}, '%')
        &lt;if&gt;
        <if test="email != null">
            AND email = #{email}
        &lt;if&gt;
        <if test="status != null">
            AND status = #{status}
        &lt;if&gt;
    &lt;where&gt;
    ORDER BY created_at DESC
    LIMIT #{offset}, #{limit}
&lt;select&gt;
```

常用动态标签：

| 标签                                            | 作用                           |
| ----------------------------------------------- | ------------------------------ |
| `&lt;if&gt;`                                    | 条件判断                       |
| `&lt;where&gt;`                                 | 自动处理 WHERE 和多余的 AND/OR |
| `&lt;set&gt;`                                   | UPDATE 时自动处理逗号          |
| `&lt;choose&gt;/&lt;when&gt;/&lt;otherwise&gt;` | 类似 switch-case               |
| `&lt;foreach&gt;`                               | 遍历集合（IN 查询、批量插入）  |
| `&lt;trim&gt;`                                  | 自定义前后缀处理               |

foreach 示例（IN 查询）：

```xml
<select id="selectByIds" resultType="User">
    SELECT * FROM users WHERE id IN
    <foreach collection="ids" item="id" open="(" separator="," close=")">
        #{id}
    &lt;foreach&gt;
&lt;select&gt;
```

动态 UPDATE：

```xml
<update id="updateSelective">
    UPDATE users
    &lt;set&gt;
        <if test="name != null">name = #{name},&lt;if&gt;
        <if test="email != null">email = #{email},&lt;if&gt;
    &lt;set&gt;
    WHERE id = #{id}
&lt;update&gt;
```

### resultMap（结果映射）

简单映射用 `resultType`，复杂映射用 `resultMap`：

```xml
<resultMap id="userMap" type="User">
    <id property="id" column="id"/>
    <result property="userName" column="user_name"/>
    <result property="createTime" column="created_at"/>
&lt;resultMap&gt;

<!-- 一对一关联 -->
<resultMap id="orderWithUser" type="Order">
    <id property="id" column="order_id"/>
    <result property="amount" column="amount"/>
    <association property="user" javaType="User">
        <id property="id" column="user_id"/>
        <result property="name" column="user_name"/>
    &lt;association&gt;
&lt;resultMap&gt;

<!-- 一对多关联 -->
<resultMap id="userWithOrders" type="User">
    <id property="id" column="id"/>
    <result property="name" column="name"/>
    <collection property="orders" ofType="Order">
        <id property="id" column="order_id"/>
        <result property="amount" column="amount"/>
    &lt;collection&gt;
&lt;resultMap&gt;
```

### 缓存机制

一级缓存（SqlSession 级别）：

- 默认开启
- 同一 SqlSession 内相同查询直接返回缓存
- SqlSession 关闭或执行 update/insert/delete 后失效
- Spring 集成下每次请求通常新建 SqlSession，一级缓存实际作用有限

二级缓存（Mapper 级别）：

```xml
<mapper namespace="com.example.mapper.UserMapper">
    <cache eviction="LRU" flushInterval="600000" size="512" readOnly="true"/>
&lt;mapper&gt;
```

- 跨 SqlSession 共享
- 默认关闭，需要手动开启
- 分布式环境下可能数据不一致，通常不建议使用 MyBatis 二级缓存，用 Redis 等外部缓存

### MyBatis-Plus

MyBatis-Plus 是 MyBatis 的增强工具，提供通用 CRUD、条件构造器、代码生成等：

```java
// 无需写 XML
public interface UserMapper extends BaseMapper&lt;User&gt; {}

// 条件查询
List&lt;User&gt; users = userMapper.selectList(
    new LambdaQueryWrapper&lt;User&gt;()
        .eq(User::getStatus, 1)
        .like(StringUtils.isNotBlank(name), User::getName, name)
        .orderByDesc(User::getCreatedAt)
);
```

## 代码示例

### Spring Boot 集成配置

```yaml
mybatis:
  mapper-locations: classpath:mapper/*.xml
  type-aliases-package: com.example.entity
  configuration:
    map-underscore-to-camel-case: true # 下划线自动转驼峰
    log-impl: org.apache.ibatis.logging.stdout.StdOutImpl # 开发环境打印 SQL
```

### 注解方式（简单 SQL）

```java
@Select("SELECT * FROM users WHERE id = #{id}")
User selectById(Long id);

@Insert("INSERT INTO users (name, email) VALUES (#{name}, #{email})")
@Options(useGeneratedKeys = true, keyProperty = "id")
int insert(User user);
```

## 易错点 / 反例

### 1. 所有参数都用 ${}

`${}` 会导致 SQL 注入。只有表名、列名等无法参数化的场景才用 `${}`，且必须校验白名单。

### 2. 一级缓存导致脏数据

在同一 SqlSession 中先查询再通过其他途径修改了数据，再次查询拿到的是缓存旧数据。Spring 集成下影响较小，但需了解机制。

### 3. N+1 查询问题

```xml
<!-- 对每个 user 单独查 orders → N+1 次查询 -->
<collection property="orders" select="selectOrdersByUserId" column="id"/>
```

应使用 JOIN 查询 + 嵌套 resultMap，避免 N+1。

### 4. foreach 拼接过长 IN 列表

```xml
<foreach collection="ids" ...>  <!-- ids 有 10000 个 → SQL 太长 -->
```

大批量 IN 应分批处理，或改用临时表 / JOIN。

### 5. 二级缓存在多表关联时失效

A Mapper 修改了 B 表数据，但 B Mapper 的二级缓存不会失效，导致数据不一致。生产环境慎用二级缓存。

## 高频面试题（5 题）

- **Q1**: MyBatis 中 #{} 和 ${} 的区别？
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  `#{}` 是预编译参数，编译为 `?` 占位符，防止 SQL 注入。`${}` 是字符串直接替换，有注入风险。`#{}` 用于值参数，`${}` 仅用于无法参数化的场景（表名、列名），且必须校验输入。

  &lt;details&gt;

- **Q2**: MyBatis 的一级缓存和二级缓存？
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  一级缓存是 SqlSession 级别，默认开启，同一 Session 内相同查询走缓存。二级缓存是 Mapper 级别，跨 Session 共享，默认关闭需手动配置。二级缓存在多表关联场景可能数据不一致，生产环境通常用 Redis 替代。

  &lt;details&gt;

- **Q3**: MyBatis 动态 SQL 有哪些标签？
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  if（条件判断）、where（自动处理 WHERE/AND）、set（UPDATE 逗号处理）、choose/when/otherwise（多分支）、foreach（遍历集合）、trim（自定义前后缀）。动态 SQL 是 MyBatis 处理复杂条件查询的核心能力。

  &lt;details&gt;

- **Q4**: MyBatis 如何防止 SQL 注入？
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  使用 `#{}` 参数占位符，MyBatis 底层通过 PreparedStatement 参数化查询。避免使用 `${}`，必须用时对输入做白名单校验。

  &lt;details&gt;

- **Q5**: MyBatis 和 Hibernate 的区别？
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  MyBatis 是半自动 ORM，SQL 由开发者编写，对 SQL 完全可控，适合复杂查询和性能优化。Hibernate 是全自动 ORM，通过映射自动生成 SQL，开发效率高但复杂查询调优不便。国内偏好 MyBatis，海外偏好 Hibernate/JPA。

  &lt;details&gt;

## 延伸资源

- [MyBatis 官方文档（中文）](https://mybatis.org/mybatis-3/zh_CN/index.html)
- [MyBatis 动态 SQL](https://mybatis.org/mybatis-3/zh_CN/dynamic-sql.html)
- [MyBatis XML 映射](https://mybatis.org/mybatis-3/zh_CN/sqlmap-xml.html)

## (留白) 我的理解

> 这一段不强制填。

<!-- KNOWLEDGE-IMPORT:END -->
