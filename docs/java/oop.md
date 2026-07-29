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

<!-- KNOWLEDGE-IMPORT:START -->

## Spring Boot 自动配置与核心特性

## TL;DR

> Spring Boot 通过**自动配置（Auto-configuration）** 和 **Starter 依赖**大幅简化 Spring 应用搭建。约定优于配置，引入 Starter 即自动配置对应功能，开发者只需关注业务代码和少量自定义配置。

## 背景与动机

传统 Spring 项目的痛点：

- 大量 XML 或 Java Config 配置
- 手动管理依赖版本
- Tomcat 部署繁琐
- 各组件（数据源、MVC、安全等）需要独立配置

Spring Boot 的解决方案：

- 自动配置：基于 classpath 和条件自动创建 Bean
- Starter：一个依赖打包所有需要的库和配置
- 内嵌服务器：java -jar 直接运行
- 约定优于配置：零配置也能跑起来

## 核心机制

### @SpringBootApplication

```java
@SpringBootApplication // 组合注解
public class MyApplication {
    public static void main(String[] args) {
        SpringApplication.run(MyApplication.class, args);
    }
}
```

`@SpringBootApplication` = 三个注解的组合：

| 注解                       | 作用                                |
| -------------------------- | ----------------------------------- |
| `@SpringBootConfiguration` | 标记为配置类（等同 @Configuration） |
| `@EnableAutoConfiguration` | 开启自动配置                        |
| `@ComponentScan`           | 扫描当前包及子包的组件              |

### 自动配置原理

```text
@EnableAutoConfiguration
    ↓
META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports
    ↓
列出所有自动配置类（如 DataSourceAutoConfiguration）
    ↓
每个配置类上有 @Conditional 条件注解
    ↓
条件满足 → 自动创建 Bean
条件不满足 → 跳过
```

常用条件注解：

| 注解                        | 含义                       |
| --------------------------- | -------------------------- |
| `@ConditionalOnClass`       | classpath 有指定类时生效   |
| `@ConditionalOnMissingBean` | 容器中没有指定 Bean 时生效 |
| `@ConditionalOnProperty`    | 配置属性满足条件时生效     |
| `@ConditionalOnBean`        | 容器中有指定 Bean 时生效   |

示例：DataSource 自动配置

```text
classpath 有 DataSource 类？ → 是
classpath 有 HikariCP？ → 是
用户没有自定义 DataSource Bean？ → 是
→ 自动创建 HikariDataSource
```

如果用户自己定义了 DataSource Bean，自动配置不生效（`@ConditionalOnMissingBean`）。

### Starter 机制

Starter 是预定义的依赖集合，命名规则：

- 官方：`spring-boot-starter-*`（如 `spring-boot-starter-web`）
- 第三方：`*-spring-boot-starter`（如 `mybatis-spring-boot-starter`）

```xml
&lt;dependency&gt;
    &lt;groupId&gt;org.springframework.boot&lt;groupId&gt;
    &lt;artifactId&gt;spring-boot-starter-web&lt;artifactId&gt;
&lt;dependency&gt;
```

`spring-boot-starter-web` 包含：

- spring-webmvc
- spring-boot-starter-tomcat（内嵌 Tomcat）
- jackson（JSON 序列化）
- 相关自动配置

### 外部化配置

配置文件优先级（从高到低）：

1. 命令行参数
2. `application-{profile}.yml`
3. `application.yml`
4. 默认值

```yaml
# application.yml
server:
  port: 8080
  servlet:
    context-path: /api

spring:
  datasource:
    url: jdbc:mysql://localhost:3306/mydb
    username: root
    password: ${DB_PASSWORD} # 环境变量引用

  profiles:
    active: dev # 激活 application-dev.yml
```

Profile 管理：

```yaml
# application-dev.yml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/dev_db

# application-prod.yml
spring:
  datasource:
    url: jdbc:mysql://prod-server:3306/prod_db
```

### @ConfigurationProperties

类型安全的配置绑定：

```java
@ConfigurationProperties(prefix = "app.upload")
public record UploadProperties(
    String path,
    long maxSize,
    List&lt;String&gt; allowedTypes
) {}
```

```yaml
app:
  upload:
    path: /data/uploads
    max-size: 10485760
    allowed-types:
      - image/png
      - image/jpeg
```

启用：在配置类或启动类上加 `@EnableConfigurationProperties(UploadProperties.class)`，或直接在 Properties 类上加 `@Component`。

### 内嵌服务器

Spring Boot 内嵌 Tomcat / Jetty / Undertow，直接 `java -jar app.jar` 运行：

```yaml
server:
  port: 8080
  tomcat:
    max-threads: 200
    max-connections: 10000
    accept-count: 100
```

### Actuator 监控

```xml
&lt;dependency&gt;
    &lt;groupId&gt;org.springframework.boot&lt;groupId&gt;
    &lt;artifactId&gt;spring-boot-starter-actuator&lt;artifactId&gt;
&lt;dependency&gt;
```

```yaml
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,env
  endpoint:
    health:
      show-details: always
```

常用端点：

| 端点                   | 作用                 |
| ---------------------- | -------------------- |
| `/actuator/health`     | 健康检查             |
| `/actuator/info`       | 应用信息             |
| `/actuator/metrics`    | 性能指标             |
| `/actuator/env`        | 环境配置             |
| `/actuator/beans`      | 所有 Bean 列表       |
| `/actuator/conditions` | 自动配置条件评估报告 |

### 启动流程简化

```text
main() → SpringApplication.run()
  → 创建 ApplicationContext
  → 加载自动配置
  → 扫描 @Component
  → 创建 Bean（依赖注入）
  → 启动内嵌服务器
  → 发布 ApplicationReadyEvent
```

## 代码示例

### 查看自动配置生效情况

```bash
# 启动时加 --debug 查看配置报告
java -jar app.jar --debug

# 或配置
debug: true  # application.yml
```

输出 Positive matches（生效的配置）和 Negative matches（未生效的）。

### 自定义 Starter 结构

```text
my-spring-boot-starter/
├── src/main/java/
│   └── com/example/autoconfigure/
│       ├── MyAutoConfiguration.java
│       └── MyProperties.java
└── src/main/resources/
    └── META-INF/
        └── spring/
            └── org.springframework.boot.autoconfigure.AutoConfiguration.imports
```

## 易错点 / 反例

### 1. @SpringBootApplication 放错包层级

```text
com.example
├── MyApplication.java   ← @SpringBootApplication 在这里
├── controller/          ✅ 会被扫描
└── service/             ✅ 会被扫描

com.other/               ❌ 不会被扫描
```

@ComponentScan 默认扫描启动类所在包及子包。启动类应放在最顶层包。

### 2. application.yml 缩进错误

YAML 靠缩进表示层级，Tab 和空格混用会解析失败。始终使用空格缩进。

### 3. 自定义 Bean 覆盖自动配置但签名不对

自动配置用 `@ConditionalOnMissingBean` 检查，但检查的是类型。如果自定义 Bean 的返回类型不匹配，自动配置仍然生效，导致冲突。

### 4. 生产环境暴露 Actuator 全部端点

```yaml
management.endpoints.web.exposure.include: '*' # ❌ 暴露敏感信息
```

生产环境只暴露 health 和 info，敏感端点需要认证保护。

### 5. 配置属性名拼写错误无提示

Spring Boot 对未知配置属性不报错，拼错了静默忽略。使用 `@ConfigurationProperties` + IDE 插件可以获得提示。

## 高频面试题（5 题）

- **Q1**: Spring Boot 自动配置原理？
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  @EnableAutoConfiguration 加载 META-INF 下注册的自动配置类，每个配置类通过 @Conditional 注解判断条件（classpath 有某个类、没有用户自定义 Bean 等），条件满足则自动创建 Bean。用户自定义 Bean 优先（@ConditionalOnMissingBean）。

  &lt;details&gt;

- **Q2**: Spring Boot Starter 的作用？
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  Starter 是预定义的依赖集合 + 自动配置。引入一个 Starter 就自动包含所有需要的库和默认配置。如 spring-boot-starter-web 包含 Spring MVC、内嵌 Tomcat、Jackson 等，开箱即用。

  &lt;details&gt;

- **Q3**: Spring Boot 配置文件优先级？
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  从高到低：命令行参数 → application-{profile}.yml → application.yml → 默认值。同级下 properties 优先于 yml。外部配置覆盖内部配置。@ConfigurationProperties 提供类型安全绑定。

  &lt;details&gt;

- **Q4**: @SpringBootApplication 包含哪些注解？
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  @SpringBootConfiguration（标记配置类）、@EnableAutoConfiguration（开启自动配置）、@ComponentScan（扫描当前包及子包）。三者组合实现零配置启动。

  &lt;details&gt;

- **Q5**: Spring Boot 如何实现热部署？
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  引入 spring-boot-devtools，代码修改后自动重启应用（使用两个 ClassLoader，只重新加载变化的类）。IDE 需开启自动编译。生产环境不应使用 devtools。另外可用 JRebel 实现热替换。

  &lt;details&gt;

## 延伸资源

- [Spring Boot Auto-configuration](https://docs.spring.io/spring-boot/reference/using/auto-configuration.html)
- [外部化配置](https://docs.spring.io/spring-boot/reference/features/external-config.html)
- [Actuator](https://docs.spring.io/spring-boot/reference/actuator/index.html)

## (留白) 我的理解

> 这一段不强制填。

---

## Spring IoC 容器与 AOP

## TL;DR

> Spring 的核心是 **IoC（控制反转）容器**，通过依赖注入（DI）管理对象的创建和依赖关系。**AOP（面向切面编程）** 通过动态代理在不修改业务代码的情况下增加横切关注点（日志、事务、安全等）。

## 背景与动机

传统开发中，对象自己创建依赖：

```java
class OrderService {
    private UserDao userDao = new UserDaoImpl(); // 硬编码依赖
}
```

问题：

- 强耦合：OrderService 依赖具体实现
- 难测试：无法替换为 Mock
- 难扩展：换实现要改代码

IoC 的思路：**对象不自己创建依赖，由外部容器注入**。

AOP 解决的问题：日志、事务、权限等逻辑散布在各个业务方法中，代码重复且耦合。AOP 将这些横切关注点抽取到独立模块。

## 核心机制

### IoC 与 DI

IoC（Inversion of Control）：控制权从应用代码转移到框架/容器。
DI（Dependency Injection）：IoC 的具体实现方式，容器在创建对象时自动注入其依赖。

```java
@Service
public class OrderService {
    private final UserRepository userRepository; // 面向接口

    public OrderService(UserRepository userRepository) { // 构造器注入
        this.userRepository = userRepository;
    }
}
```

Spring 容器负责创建 OrderService 时自动注入 UserRepository 的实现。

### 注入方式

构造器注入（推荐）：

```java
@Service
public class OrderService {
    private final UserRepository userRepository;

    public OrderService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }
}
```

Setter 注入：

```java
@Service
public class OrderService {
    private UserRepository userRepository;

    @Autowired
    public void setUserRepository(UserRepository userRepository) {
        this.userRepository = userRepository;
    }
}
```

字段注入（不推荐）：

```java
@Service
public class OrderService {
    @Autowired
    private UserRepository userRepository; // 难以测试，隐藏依赖
}
```

推荐构造器注入的原因：

- 依赖显式声明，一目了然
- 可以声明 final，保证不可变
- 便于单元测试（直接 new + 传参）
- Spring 4.3+ 单构造器可省略 @Autowired

### Bean 定义方式

注解方式（主流）：

```java
@Component      // 通用组件
@Service        // 业务层
@Repository     // 数据层
@Controller     // Web 层
@Configuration  // 配置类
```

Java Config：

```java
@Configuration
public class AppConfig {
    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}
```

### Bean 作用域

| 作用域      | 含义                       |
| ----------- | -------------------------- |
| `singleton` | 默认，容器中只有一个实例   |
| `prototype` | 每次获取创建新实例         |
| `request`   | 每个 HTTP 请求一个实例     |
| `session`   | 每个 HTTP Session 一个实例 |

```java
@Component
@Scope("prototype")
public class TaskRunner { }
```

### Bean 生命周期

```text
实例化 → 属性注入 → BeanNameAware → BeanFactoryAware → ApplicationContextAware
→ BeanPostProcessor.before → @PostConstruct → InitializingBean.afterPropertiesSet
→ init-method → BeanPostProcessor.after → 使用
→ @PreDestroy → DisposableBean.destroy → destroy-method
```

实际常用的生命周期回调：

```java
@Component
public class CacheManager {
    @PostConstruct
    public void init() {
        // 初始化缓存
    }

    @PreDestroy
    public void cleanup() {
        // 清理资源
    }
}
```

### BeanFactory vs ApplicationContext

|        | BeanFactory        | ApplicationContext    |
| ------ | ------------------ | --------------------- |
| 特点   | 延迟加载，最小功能 | 预加载，功能丰富      |
| 事件   | 不支持             | 支持 ApplicationEvent |
| 国际化 | 不支持             | 支持 MessageSource    |
| 使用   | 几乎不直接用       | 实际使用的容器        |

### 循环依赖

```java
@Service
class A {
    @Autowired B b;
}

@Service
class B {
    @Autowired A a;
}
```

Spring 通过三级缓存解决 singleton 的字段注入循环依赖：

1. 一级缓存：完整 Bean
2. 二级缓存：提前暴露的半成品 Bean
3. 三级缓存：Bean 的工厂方法（用于 AOP 代理）

注意：构造器注入的循环依赖无法解决（会报错）。Spring Boot 2.6+ 默认禁止循环依赖。

### AOP 核心概念

| 概念                 | 含义                                        |
| -------------------- | ------------------------------------------- |
| Aspect（切面）       | 横切关注点的模块化（如日志切面）            |
| Join Point（连接点） | 程序执行的某个点（Spring AOP 中是方法执行） |
| Advice（通知）       | 在连接点执行的动作                          |
| Pointcut（切入点）   | 匹配连接点的表达式                          |
| Target（目标对象）   | 被代理的原始对象                            |
| Proxy（代理）        | AOP 创建的代理对象                          |

通知类型：

| 通知              | 时机                       |
| ----------------- | -------------------------- |
| `@Before`         | 方法执行前                 |
| `@After`          | 方法执行后（无论是否异常） |
| `@AfterReturning` | 方法正常返回后             |
| `@AfterThrowing`  | 方法抛异常后               |
| `@Around`         | 包围方法执行（最强大）     |

### AOP 示例

```java
@Aspect
@Component
public class LogAspect {

    @Around("@annotation(com.example.annotation.LogExecution)")
    public Object logExecution(ProceedingJoinPoint pjp) throws Throwable {
        String method = pjp.getSignature().toShortString();
        long start = System.currentTimeMillis();
        try {
            Object result = pjp.proceed();
            log.info("{} 耗时 {}ms", method, System.currentTimeMillis() - start);
            return result;
        } catch (Throwable e) {
            log.error("{} 异常: {}", method, e.getMessage());
            throw e;
        }
    }
}
```

切入点表达式：

```java
// 匹配 service 包下所有方法
@Pointcut("execution(* com.example.service.*.*(..))")

// 匹配标注了特定注解的方法
@Pointcut("@annotation(com.example.annotation.LogExecution)")

// 匹配标注了特定注解的类的所有方法
@Pointcut("@within(org.springframework.stereotype.Service)")
```

### AOP 实现原理

Spring AOP 基于动态代理：

- 目标类实现了接口 → JDK 动态代理（Proxy + InvocationHandler）
- 目标类没有接口 → CGLIB 代理（生成子类）

Spring Boot 2.0+ 默认使用 CGLIB 代理（`spring.aop.proxy-target-class=true`）。

## 代码示例

### 自定义注解 + AOP 实现方法耗时统计

```java
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface Timed {}

@Aspect
@Component
public class TimedAspect {
    @Around("@annotation(Timed)")
    public Object timed(ProceedingJoinPoint pjp) throws Throwable {
        long start = System.nanoTime();
        Object result = pjp.proceed();
        long elapsed = (System.nanoTime() - start) / 1_000_000;
        log.info("{} took {}ms", pjp.getSignature().toShortString(), elapsed);
        return result;
    }
}
```

## 易错点 / 反例

### 1. 同类方法调用 AOP 不生效

```java
@Service
public class UserService {
    public void createUser() {
        this.validate(); // ❌ this 调用不走代理，AOP 不生效
    }

    @Timed
    public void validate() { }
}
```

AOP 基于代理，`this` 调用绕过代理。解决：注入自身、使用 `AopContext.currentProxy()`、或拆分到不同类。

### 2. 字段注入导致 NPE（测试中）

```java
@Autowired
private UserRepository repo; // 单元测试中 new UserService() → repo 为 null
```

构造器注入可直接传参测试。

### 3. prototype Bean 注入 singleton

singleton 只初始化一次，注入的 prototype Bean 也只创建一次，后续每次获取都是同一个实例。需要每次获取新实例时用 `ObjectProvider` 或 `@Lookup`。

### 4. @Transactional 加在 private 方法上

Spring AOP 代理无法拦截 private 方法。`@Transactional` 必须加在 public 方法上。

### 5. 循环依赖依赖三级缓存

循环依赖本身是设计问题。Spring Boot 2.6+ 默认禁止，应通过重构消除循环依赖。

## 高频面试题（5 题）

- **Q1**: 什么是 IoC 和 DI？
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  IoC 是控制反转，对象的创建和依赖管理由容器负责而非对象自身。DI 是 IoC 的实现方式，容器在创建对象时自动注入其依赖。好处：解耦、可测试、可替换实现。

  &lt;details&gt;

- **Q2**: Spring Bean 的生命周期？
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  实例化 → 属性注入 → Aware 接口回调 → BeanPostProcessor.before → @PostConstruct → InitializingBean → init-method → BeanPostProcessor.after → 就绪使用 → @PreDestroy → DisposableBean → destroy-method。

  &lt;details&gt;

- **Q3**: Spring AOP 的实现原理？
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  基于动态代理。目标类有接口用 JDK 动态代理（Proxy），无接口用 CGLIB（生成子类）。Spring Boot 默认使用 CGLIB。AOP 代理拦截方法调用，在前后插入切面逻辑。

  &lt;details&gt;

- **Q4**: 构造器注入和字段注入的区别？
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  构造器注入：依赖显式声明、可 final 不可变、便于测试、能发现循环依赖。字段注入：代码简洁但隐藏依赖、无法 final、测试需反射或容器。Spring 官方推荐构造器注入。

  &lt;details&gt;

- **Q5**: Spring 如何解决循环依赖？
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  通过三级缓存解决 singleton 字段注入的循环依赖：一级放完整 Bean，二级放半成品，三级放 Bean 工厂（处理 AOP 代理）。构造器注入的循环依赖无法解决。Spring Boot 2.6+ 默认禁止循环依赖。

  &lt;details&gt;

## 延伸资源

- [Spring IoC Container](https://docs.spring.io/spring-framework/reference/core/beans.html)
- [Spring AOP](https://docs.spring.io/spring-framework/reference/core/aop.html)
- [Bean Scopes](https://docs.spring.io/spring-framework/reference/core/beans/factory-scopes.html)

## (留白) 我的理解

> 这一段不强制填。

---

## Spring MVC 请求处理与 RESTful API

## TL;DR

> Spring MVC 基于 **DispatcherServlet** 统一分发请求，通过 `@Controller` / `@RestController` 处理 HTTP 请求并返回响应。核心流程：请求 → DispatcherServlet → HandlerMapping → Controller → ViewResolver / JSON 序列化 → 响应。

## 背景与动机

Web 应用需要处理 HTTP 请求、路由分发、参数绑定、响应序列化等。Spring MVC 提供：

- 统一的请求分发机制
- 灵活的参数绑定和数据校验
- JSON / XML 自动序列化
- 拦截器链
- 全局异常处理

在 Spring Boot 中，引入 `spring-boot-starter-web` 即自动配置 Spring MVC + 内嵌 Tomcat。

## 核心机制

### 请求处理流程

```text
HTTP 请求
    ↓
DispatcherServlet（前端控制器）
    ↓
HandlerMapping（路由匹配）
    ↓
HandlerInterceptor.preHandle（拦截器前置）
    ↓
Controller 方法执行
    ↓
HandlerInterceptor.postHandle（拦截器后置）
    ↓
HttpMessageConverter / ViewResolver（结果转换）
    ↓
HandlerInterceptor.afterCompletion
    ↓
HTTP 响应
```

### Controller 与路由

```java
@RestController
@RequestMapping("/api/users")
public class UserController {

    @GetMapping
    public List&lt;UserDto&gt; list(@RequestParam(defaultValue = "1") int page,
                              @RequestParam(defaultValue = "20") int size) {
        return userService.list(page, size);
    }

    @GetMapping("/{id}")
    public UserDto getById(@PathVariable Long id) {
        return userService.getById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public UserDto create(@Valid @RequestBody CreateUserRequest request) {
        return userService.create(request);
    }

    @PutMapping("/{id}")
    public UserDto update(@PathVariable Long id,
                          @Valid @RequestBody UpdateUserRequest request) {
        return userService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        userService.delete(id);
    }
}
```

`@RestController` = `@Controller` + `@ResponseBody`，方法返回值自动序列化为 JSON。

### 参数绑定

| 注解              | 来源           | 示例            |
| ----------------- | -------------- | --------------- |
| `@PathVariable`   | URL 路径       | `/users/{id}`   |
| `@RequestParam`   | 查询参数       | `?name=alice`   |
| `@RequestBody`    | 请求体（JSON） | POST/PUT body   |
| `@RequestHeader`  | 请求头         | `Authorization` |
| `@CookieValue`    | Cookie         | `session_id`    |
| `@ModelAttribute` | 表单参数       | form data       |

### 参数校验

使用 JSR 380（Jakarta Validation）：

```java
public record CreateUserRequest(
    @NotBlank(message = "名称不能为空")
    @Size(max = 50)
    String name,

    @Email(message = "邮箱格式不正确")
    @NotBlank
    String email,

    @Min(0) @Max(150)
    Integer age
) {}
```

Controller 中加 `@Valid`：

```java
@PostMapping
public UserDto create(@Valid @RequestBody CreateUserRequest request) {
    // request 已通过校验
}
```

校验失败会抛出 `MethodArgumentNotValidException`，在全局异常处理中统一处理。

### 统一响应格式

```java
public record ApiResponse&lt;T&gt;(
    int code,
    String message,
    T data
) {
    public static &lt;T&gt; ApiResponse&lt;T&gt; ok(T data) {
        return new ApiResponse<>(200, "success", data);
    }

    public static ApiResponse<?> error(int code, String message) {
        return new ApiResponse<>(code, message, null);
    }
}
```

### 全局异常处理

```java
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(NotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ApiResponse<?> handleNotFound(NotFoundException e) {
        return ApiResponse.error(404, e.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ApiResponse<?> handleValidation(MethodArgumentNotValidException e) {
        String message = e.getBindingResult().getFieldErrors().stream()
            .map(f -> f.getField() + ": " + f.getDefaultMessage())
            .collect(Collectors.joining(", "));
        return ApiResponse.error(400, message);
    }

    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ApiResponse<?> handleException(Exception e) {
        log.error("未处理异常", e);
        return ApiResponse.error(500, "服务器内部错误");
    }
}
```

### 拦截器

```java
@Component
public class AuthInterceptor implements HandlerInterceptor {

    @Override
    public boolean preHandle(HttpServletRequest request,
                             HttpServletResponse response,
                             Object handler) {
        String token = request.getHeader("Authorization");
        if (token == null || !tokenService.validate(token)) {
            response.setStatus(401);
            return false; // 中断请求
        }
        return true; // 继续执行
    }

    @Override
    public void afterCompletion(HttpServletRequest request,
                                HttpServletResponse response,
                                Object handler, Exception ex) {
        // 清理资源
    }
}

@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(new AuthInterceptor())
            .addPathPatterns("/api/**")
            .excludePathPatterns("/api/auth/login");
    }
}
```

### 拦截器 vs Filter vs AOP

|                  | Filter                     | Interceptor       | AOP              |
| ---------------- | -------------------------- | ----------------- | ---------------- |
| 层级             | Servlet 层                 | Spring MVC 层     | Spring Bean 层   |
| 能力             | 请求/响应原始操作          | 访问 Handler 信息 | 方法级拦截       |
| 典型用途         | 编码、CORS、日志           | 鉴权、日志        | 事务、日志、缓存 |
| 注入 Spring Bean | Filter 可以（Spring Boot） | 可以              | 可以             |

### HttpMessageConverter

Spring MVC 自动选择 Converter 序列化/反序列化：

- `MappingJackson2HttpMessageConverter`：Java 对象 ↔ JSON
- `StringHttpMessageConverter`：字符串
- `ByteArrayHttpMessageConverter`：字节数组

Jackson 常用配置：

```yaml
spring:
  jackson:
    date-format: yyyy-MM-dd HH:mm:ss
    time-zone: Asia/Shanghai
    default-property-inclusion: non_null # null 字段不序列化
    serialization:
      write-dates-as-timestamps: false
```

### CORS 跨域配置

```java
@Configuration
public class CorsConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
            .allowedOrigins("https://example.com")
            .allowedMethods("GET", "POST", "PUT", "DELETE")
            .allowedHeaders("*")
            .allowCredentials(true)
            .maxAge(3600);
    }
}
```

## 代码示例

### 文件上传

```java
@PostMapping("/upload")
public ApiResponse&lt;String&gt; upload(@RequestParam("file") MultipartFile file) {
    if (file.isEmpty()) {
        return ApiResponse.error(400, "文件为空");
    }
    String filename = UUID.randomUUID() + "_" + file.getOriginalFilename();
    Path path = Path.of(uploadDir, filename);
    Files.copy(file.getInputStream(), path);
    return ApiResponse.ok(filename);
}
```

### 分页查询

```java
@GetMapping
public ApiResponse<Page&lt;UserDto&gt;> list(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size,
        @RequestParam(required = false) String keyword) {
    Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
    return ApiResponse.ok(userService.search(keyword, pageable));
}
```

## 易错点 / 反例

### 1. @Controller 返回 JSON 忘记 @ResponseBody

```java
@Controller
public class UserController {
    @GetMapping("/users")
    public List&lt;User&gt; list() { } // ❌ 会找视图模板，不是返回 JSON
}
```

返回 JSON 用 `@RestController` 或方法加 `@ResponseBody`。

### 2. @RequestBody 用 GET 请求

GET 请求没有 body，@RequestBody 无法绑定。GET 请求的参数用 @RequestParam 或 @ModelAttribute。

### 3. @Valid 漏写导致校验不生效

```java
@PostMapping
public UserDto create(@RequestBody CreateUserRequest request) { // ❌ 没有 @Valid
```

没有 @Valid，Jakarta Validation 注解不会触发校验。

### 4. 异常处理返回的 HTTP 状态码不对

所有异常都返回 200 + 自定义 code：

```java
return ResponseEntity.ok(ApiResponse.error(404, "not found")); // ❌ HTTP 200 但业务 404
```

应同时设置正确的 HTTP 状态码，便于网关、监控正确识别。

### 5. 拦截器顺序不确定

多个拦截器按注册顺序执行。鉴权拦截器应在日志拦截器之后、业务拦截器之前，通过 `order()` 控制。

## 高频面试题（5 题）

- **Q1**: Spring MVC 的请求处理流程？
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  请求 → DispatcherServlet → HandlerMapping 找到对应 Controller 方法 → HandlerAdapter 执行 → 返回 ModelAndView 或直接写入 Response → ViewResolver 解析视图（JSON 场景用 HttpMessageConverter）→ 响应。

  &lt;details&gt;

- **Q2**: @Controller 和 @RestController 的区别？
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  @RestController = @Controller + @ResponseBody。@Controller 方法返回值默认是视图名，需要 @ResponseBody 才返回 JSON。@RestController 所有方法返回值自动序列化为 JSON。

  &lt;details&gt;

- **Q3**: Spring MVC 如何做参数校验？
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  使用 Jakarta Validation 注解（@NotBlank、@Email、@Size 等）标注 DTO 字段，Controller 参数加 @Valid 触发校验。校验失败抛 MethodArgumentNotValidException，在 @RestControllerAdvice 中全局处理。

  &lt;details&gt;

- **Q4**: 拦截器和过滤器的区别？
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  Filter 是 Servlet 规范，在 DispatcherServlet 之前执行，操作原始请求/响应。Interceptor 是 Spring MVC 层，在 Handler 执行前后调用，可访问 Handler 信息和 Spring Bean。Filter 更底层，Interceptor 更贴近业务。

  &lt;details&gt;

- **Q5**: 如何做统一异常处理？
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  使用 @RestControllerAdvice + @ExceptionHandler 定义全局异常处理器。按异常类型分别处理（业务异常、校验异常、未知异常），返回统一响应格式，设置正确 HTTP 状态码。

  &lt;details&gt;

## 延伸资源

- [Spring MVC 文档](https://docs.spring.io/spring-framework/reference/web/webmvc.html)
- [MVC Controller](https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller.html)
- [DispatcherServlet](https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-servlet.html)

## (留白) 我的理解

> 这一段不强制填。

---

## Elasticsearch 基础与全文检索

## TL;DR

> Elasticsearch 是基于 Lucene 的分布式搜索和分析引擎。核心能力是**全文检索**（倒排索引）和**聚合分析**。Java 后端常用于商品搜索、日志分析（ELK）、自动补全等场景。

## 背景与动机

数据库的 LIKE 查询无法满足复杂搜索需求：

- `LIKE '%关键词%'` 无法利用索引，全表扫描
- 不支持分词、同义词、相关性排序
- 大数据量下性能极差

Elasticsearch 解决：

- 倒排索引支持高效全文检索
- 分词器处理中文、英文等多语言
- 相关性评分排序
- 分布式架构支持海量数据
- 近实时搜索（写入后 1 秒可查）

## 核心机制

### 核心概念对比

| MySQL    | Elasticsearch                               |
| -------- | ------------------------------------------- |
| Database | Index                                       |
| Table    | Type（7.x+ 废弃，每个 Index 只有一个 Type） |
| Row      | Document（JSON）                            |
| Column   | Field                                       |
| Schema   | Mapping                                     |
| SQL      | Query DSL                                   |

### 倒排索引

正排索引（数据库）：

```text
doc1 → "Java 是一门编程语言"
doc2 → "Python 也是编程语言"
```

倒排索引（ES）：

```text
"Java"   → [doc1]
"Python" → [doc2]
"编程"   → [doc1, doc2]
"语言"   → [doc1, doc2]
```

搜索"编程语言"→ 分词为"编程"+"语言"→ 查倒排索引 → 返回 doc1, doc2。

### Mapping（映射）

定义字段类型和分析方式：

```json
PUT /products
{
  "mappings": {
    "properties": {
      "title": {
        "type": "text",
        "analyzer": "ik_max_word",
        "search_analyzer": "ik_smart"
      },
      "price": { "type": "double" },
      "category": { "type": "keyword" },
      "createTime": { "type": "date", "format": "yyyy-MM-dd HH:mm:ss" },
      "tags": { "type": "keyword" },
      "description": { "type": "text", "analyzer": "ik_max_word" }
    }
  }
}
```

字段类型：

| 类型            | 用途                         |
| --------------- | ---------------------------- |
| `text`          | 全文检索，会分词             |
| `keyword`       | 精确匹配、聚合、排序，不分词 |
| `long/double`   | 数值                         |
| `date`          | 日期                         |
| `boolean`       | 布尔                         |
| `object/nested` | 嵌套对象                     |

### 分词器

中文分词常用 IK 分词器：

- `ik_max_word`：最细粒度分词（索引时用）
- `ik_smart`：最粗粒度分词（搜索时用）

```text
"中华人民共和国"
ik_max_word → [中华人民共和国, 中华人民, 中华, 华人, 人民共和国, 人民, 共和国, 共和, 国]
ik_smart    → [中华人民共和国]
```

### Query DSL

全文检索：

```json
GET /products/_search
{
  "query": {
    "match": {
      "title": "Java 编程"
    }
  }
}
```

布尔组合查询：

```json
{
  "query": {
    "bool": {
      "must": [{ "match": { "title": "Java" } }],
      "filter": [{ "range": { "price": { "gte": 50, "lte": 200 } } }, { "term": { "category": "book" } }],
      "should": [{ "match": { "description": "入门" } }]
    }
  },
  "sort": [{ "price": "asc" }],
  "from": 0,
  "size": 20
}
```

| 子句     | 含义                 | 影响评分       |
| -------- | -------------------- | -------------- |
| must     | 必须匹配             | 是             |
| filter   | 必须匹配             | 否（性能更好） |
| should   | 可选匹配（提升评分） | 是             |
| must_not | 排除                 | 否             |

filter 不参与评分计算且可缓存，精确过滤条件（范围、term）应放在 filter 中。

### 聚合（Aggregation）

类似 SQL 的 GROUP BY + 聚合函数：

```json
{
  "size": 0,
  "aggs": {
    "category_count": {
      "terms": { "field": "category", "size": 10 }
    },
    "avg_price": {
      "avg": { "field": "price" }
    },
    "price_range": {
      "range": {
        "field": "price",
        "ranges": [{ "to": 50 }, { "from": 50, "to": 200 }, { "from": 200 }]
      }
    }
  }
}
```

### Java 客户端

Spring Data Elasticsearch：

```java
@Document(indexName = "products")
public class Product {
    @Id
    private String id;

    @Field(type = FieldType.Text, analyzer = "ik_max_word", searchAnalyzer = "ik_smart")
    private String title;

    @Field(type = FieldType.Keyword)
    private String category;

    @Field(type = FieldType.Double)
    private Double price;
}

public interface ProductRepository extends ElasticsearchRepository<Product, String> {
    List&lt;Product&gt; findByTitle(String title);
    List&lt;Product&gt; findByPriceBetween(double min, double max);
}
```

复杂查询用 ElasticsearchClient（官方 Java 客户端 8.x）：

```java
SearchResponse&lt;Product&gt; response = client.search(s -> s
    .index("products")
    .query(q -> q
        .bool(b -> b
            .must(m -> m.match(t -> t.field("title").query("Java")))
            .filter(f -> f.range(r -> r.field("price").gte(JsonData.of(50))))
        )
    )
    .from(0)
    .size(20),
    Product.class
);
```

### 数据同步（MySQL → ES）

| 方式           | 实时性 | 复杂度     |
| -------------- | ------ | ---------- |
| 同步双写       | 实时   | 简单但耦合 |
| MQ 异步        | 近实时 | 解耦       |
| Canal + Binlog | 近实时 | 无侵入     |
| 定时全量/增量  | 延迟高 | 简单       |

生产环境推荐 **Canal 监听 Binlog → MQ → ES 同步服务**。

### ELK 日志栈

```text
应用日志 → Filebeat（采集）→ Logstash（清洗）→ Elasticsearch（存储/索引）→ Kibana（可视化）
```

## 代码示例

### 搜索 + 高亮

```json
{
  "query": {
    "match": { "title": "Java 编程" }
  },
  "highlight": {
    "fields": {
      "title": {
        "pre_tags": ["&lt;em&gt;"],
        "post_tags": ["&lt;em&gt;"]
      }
    }
  }
}
```

### 自动补全（Completion Suggester）

```json
PUT /products
{
  "mappings": {
    "properties": {
      "suggest": {
        "type": "completion",
        "analyzer": "ik_max_word"
      }
    }
  }
}
```

## 易错点 / 反例

### 1. text 字段做精确匹配

```json
{ "term": { "title": "Java编程" } }
 // ❌ text 字段已分词，term 匹配不上
```

精确匹配用 keyword 类型字段或 `.keyword` 子字段。

### 2. 所有过滤条件都放 must

```json
{ "must": [{ "range": { "price": { "gte": 50 } } }] }
 // ❌ 不需要评分的条件浪费计算
```

不需要评分的条件放 filter，性能更好。

### 3. Mapping 定义后随意修改

ES 的 Mapping 一旦创建，字段类型不可修改。需要修改时只能新建索引 + 迁移数据（reindex）。

### 4. 深分页问题

```json
{ "from": 10000, "size": 20 }
 // ❌ 深分页性能极差
```

ES 深分页代价高。解决：使用 search_after（游标翻页）或 scroll API（大批量导出）。

### 5. 不考虑数据同步延迟

ES 写入后约 1 秒才可搜索（近实时）。如果业务需要写后立即查到，需要手动 refresh 或调整架构。

## 高频面试题（5 题）

- **Q1**: Elasticsearch 的倒排索引原理？
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  倒排索引将文档内容分词后，建立"词项→文档列表"的映射。搜索时通过词项快速定位包含该词的文档，再合并结果集。与数据库正排索引（ID→数据）方向相反。

  &lt;details&gt;

- **Q2**: text 和 keyword 类型的区别？
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  text 类型会被分词器分词，适合全文检索（match 查询）。keyword 不分词，存储原始值，适合精确匹配（term）、聚合、排序。一个字段可同时有 text 和 keyword 子字段。

  &lt;details&gt;

- **Q3**: bool 查询中 must 和 filter 的区别？
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  must 参与相关性评分计算，filter 不参与评分且结果可缓存。精确过滤条件（范围、term、exists）应放在 filter 中，全文检索条件放在 must 中。filter 性能更好。

  &lt;details&gt;

- **Q4**: MySQL 数据如何同步到 ES？
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  同步双写（简单但耦合）、MQ 异步同步（解耦）、Canal 监听 MySQL Binlog（无侵入，推荐）、定时全量/增量同步（简单但延迟高）。生产推荐 Canal + MQ 方案。

  &lt;details&gt;

- **Q5**: ES 深分页问题怎么解决？
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  from + size 深分页性能差（需要在所有分片上排序 from+size 条数据）。解决：search_after（适合翻页浏览）、scroll API（适合大批量导出）、或业务上限制最大翻页深度。

  &lt;details&gt;

## 延伸资源

- [Elasticsearch 官方文档](https://www.elastic.co/guide/en/elasticsearch/reference/current/index.html)
- [Query DSL](https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl.html)
- [Spring Data Elasticsearch](https://docs.spring.io/spring-data/elasticsearch/reference/)

## (留白) 我的理解

> 这一段不强制填。

---

## 消息队列核心概念（Kafka / RocketMQ）

## TL;DR

> 消息队列（MQ）实现系统间**异步通信、解耦和削峰**。生产者发送消息到 Topic，消费者从 Topic 拉取消息处理。核心挑战是**消息不丢失、不重复消费、顺序保证**。国内常用 Kafka（日志/大数据）和 RocketMQ（业务消息）。

## 背景与动机

同步调用的问题：

```text
用户下单 → 扣库存 → 生成物流 → 发短信 → 发邮件 → 返回
总耗时 = 各步骤之和，且任一步骤失败整个流程失败
```

引入 MQ 后：

```text
用户下单 → 扣库存 → 发消息到 MQ → 立即返回
                         ↓
               物流服务消费 → 处理物流
               通知服务消费 → 发短信/邮件
```

MQ 的三大价值：

- **异步**：主流程快速返回，非关键步骤异步处理
- **解耦**：上下游服务不直接依赖，通过消息通信
- **削峰**：突发流量先写入 MQ，消费端按能力消费

## 核心机制

### MQ 基本模型

```text
Producer → Topic（消息主题）→ Consumer Group → Consumer
              ↓
         Partition/Queue（分区）
```

| 概念     | Kafka 术语     | RocketMQ 术语  |
| -------- | -------------- | -------------- |
| 消息主题 | Topic          | Topic          |
| 分区     | Partition      | MessageQueue   |
| 消费者组 | Consumer Group | Consumer Group |
| 消息偏移 | Offset         | Offset         |
| 消息代理 | Broker         | Broker         |

### Kafka 核心架构

```text
Producer
    ↓ (按 key hash 到 partition)
Topic: order-events
├── Partition 0: [msg1, msg4, msg7 ...]
├── Partition 1: [msg2, msg5, msg8 ...]
└── Partition 2: [msg3, msg6, msg9 ...]
    ↓
Consumer Group A
├── Consumer 1 ← Partition 0
├── Consumer 2 ← Partition 1
└── Consumer 3 ← Partition 2
```

关键特性：

- 分区内消息有序，跨分区不保证顺序
- 同一 Consumer Group 内每个 Partition 只被一个 Consumer 消费
- 消息持久化到磁盘，通过 Offset 管理消费进度
- 高吞吐：顺序写磁盘 + 零拷贝 + 批量发送

### RocketMQ 核心架构

```text
Producer → NameServer（注册中心）→ Broker（消息存储）→ Consumer
```

RocketMQ 特有功能：

- **延迟消息**：指定延迟级别后消费
- **事务消息**：半消息 + 本地事务 + 确认
- **消息过滤**：Tag 和 SQL 过滤
- **消息轨迹**：全链路追踪

### Spring Kafka 使用

生产者：

```java
@Service
public class OrderEventProducer {
    private final KafkaTemplate<String, String> kafkaTemplate;

    public void sendOrderCreated(Order order) {
        String message = JSON.toJSONString(new OrderEvent("CREATED", order));
        kafkaTemplate.send("order-events", order.getId().toString(), message);
    }
}
```

消费者：

```java
@Component
public class OrderEventConsumer {

    @KafkaListener(topics = "order-events", groupId = "notification-service")
    public void handleOrderEvent(ConsumerRecord<String, String> record) {
        OrderEvent event = JSON.parseObject(record.value(), OrderEvent.class);
        if ("CREATED".equals(event.type())) {
            sendNotification(event.order());
        }
    }
}
```

配置：

```yaml
spring:
  kafka:
    bootstrap-servers: localhost:9092
    producer:
      key-serializer: org.apache.kafka.common.serialization.StringSerializer
      value-serializer: org.apache.kafka.common.serialization.StringSerializer
      acks: all # 所有副本确认
    consumer:
      group-id: my-service
      auto-offset-reset: earliest
      enable-auto-commit: false # 手动提交 offset
```

### 消息可靠性（不丢失）

消息丢失可能发生在三个环节：

**生产端丢失**：

```text
解决: 同步发送 + 重试 + acks=all（Kafka）/ 同步刷盘（RocketMQ）
```

**Broker 丢失**：

```text
解决: 多副本 + ISR 机制（Kafka）/ 主从同步（RocketMQ）
```

**消费端丢失**：

```text
解决: 手动提交 Offset（处理完再提交，不要自动提交）
```

### 重复消费（幂等性）

消息至少投递一次（at least once），消费端必须处理重复消息：

```java
@KafkaListener(topics = "order-events")
public void handle(ConsumerRecord<String, String> record) {
    String msgId = record.key();

    // 幂等检查
    if (processedRepository.existsByMsgId(msgId)) {
        return; // 已处理，跳过
    }

    // 业务处理
    processOrder(record.value());

    // 标记已处理
    processedRepository.save(new ProcessedMessage(msgId));
}
```

幂等策略：

- 唯一 ID + 数据库去重表
- Redis SET NX 去重
- 数据库唯一索引（INSERT IGNORE / ON DUPLICATE）
- 业务本身幂等（如状态机，已完成的订单不再处理）

### 顺序消息

全局有序：单 Partition（性能差，很少需要）。

局部有序（常用）：相同业务 key 的消息发到同一个 Partition：

```java
// 同一订单的消息发到同一个 Partition
kafkaTemplate.send("order-events", orderId.toString(), message);
```

### 消息积压处理

消费速度跟不上生产速度：

- 增加 Partition 和 Consumer 数量（水平扩展）
- 优化消费逻辑（批量处理、异步处理）
- 临时扩容消费者
- 跳过非关键消息

### Kafka vs RocketMQ 选型

|        | Kafka                 | RocketMQ                 |
| ------ | --------------------- | ------------------------ |
| 定位   | 大数据/日志流处理     | 业务消息                 |
| 吞吐量 | 极高（百万级 TPS）    | 高（十万级 TPS）         |
| 延迟   | 毫秒级                | 毫秒级                   |
| 功能   | 简洁                  | 丰富（延迟、事务、过滤） |
| 运维   | 依赖 ZooKeeper/KRaft  | NameServer 轻量          |
| 适用   | 日志采集、流计算、CDC | 订单、支付等业务场景     |

## 代码示例

### RocketMQ 延迟消息

```java
Message&lt;String&gt; msg = MessageBuilder.withPayload("delay task")
    .setHeader(RocketMQHeaders.KEYS, taskId)
    .build();
rocketMQTemplate.syncSend("delay-topic", msg, 3000, 3); // 延迟级别 3 = 10 秒
```

## 易错点 / 反例

### 1. 自动提交 Offset

```yaml
enable-auto-commit: true # ❌ 消费未完成就提交，崩溃后消息丢失
```

应手动提交，确保业务处理成功后再提交。

### 2. 不处理消费异常

```java
@KafkaListener(topics = "events")
public void handle(String msg) {
    process(msg); // ❌ 异常未捕获，消息可能反复重试或丢失
}
```

应 catch 异常，记录日志，必要时发到死信队列。

### 3. Consumer 数量超过 Partition 数量

```text
Partition: 3 个
Consumer: 5 个 → 2 个 Consumer 空闲，浪费资源
```

Consumer 数量不应超过 Partition 数量。

### 4. ���消息阻塞

单条消息过大（如 10MB）会影响网络和消费速度。大数据应存到 OSS/S3，消息中只传引用。

### 5. 忽略消息顺序

```java
kafkaTemplate.send("order", message); // ❌ 没有指定 key，消息随机分散到各 Partition
```

需要顺序保证的场景必须指定 key，保证同一 key 发到同一 Partition。

## 高频面试题（5 题）

- **Q1**: 消息队列的作用？
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  异步（非关键步骤异步处理，减少响应时间）、解耦（上下游通过消息通信，不直接依赖）、削峰（突发流量缓冲在 MQ 中，消费端按能力消费）。

  &lt;details&gt;

- **Q2**: 如何保证消息不丢失？
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  三个环节：生产端用同步发送+重试+acks=all，Broker 端多副本+同步刷盘，消费端手动提交 Offset 确保处理完成后再确认。

  &lt;details&gt;

- **Q3**: 如何处理重复消费？
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  MQ 保证 at least once，消费端必须做幂等处理。方案：唯一消息 ID + 去重表、Redis SET NX、数据库唯一索引、业务状态机幂等。

  &lt;details&gt;

- **Q4**: 如何保证消息顺序？
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  全局有序：单 Partition（性能差）。局部有序（常用）：相同业务 key 的消息发到同一 Partition，消费端单线程消费该 Partition。Kafka 保证 Partition 内有序。

  &lt;details&gt;

- **Q5**: Kafka 和 RocketMQ 怎么选？
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  Kafka 适合大数据/日志/流处理场景，吞吐极高。RocketMQ 适合业务消息（订单、支付），功能更丰富（延迟消息、事务消息、消息过滤）。可混用。

  &lt;details&gt;

## 延伸资源

- [Kafka 官方文档](https://kafka.apache.org/documentation/)
- [RocketMQ 简介](https://rocketmq.apache.org/docs/introduction/02whatis)
- [Spring Kafka](https://docs.spring.io/spring-kafka/reference/)

## (留白) 我的理解

> 这一段不强制填。

---

## Redis 数据结构、缓存策略与分布式锁

## TL;DR

> Redis 是基于内存的键值数据库，支持 String / Hash / List / Set / ZSet 五种核心数据结构。Java 后端最常用场景：**缓存**（提升查询性能）、**分布式锁**（跨进程互斥）、**计数/排行**（原子操作）。

## 背景与动机

数据库查询是后端性能瓶颈之一。Redis 作为缓存层：

- 读性能：10 万+ QPS（内存操作）
- 减少数据库压力
- 支持丰富数据结构
- 支持过期、发布订阅、Lua 脚本等

Java 生态中通过 Spring Data Redis（Lettuce/Jedis）或 Redisson 使用 Redis。

## 核心机制

### 五种核心数据结构

| 类型       | 底层                              | 典型场景                 |
| ---------- | --------------------------------- | ------------------------ |
| **String** | SDS（Simple Dynamic String）      | 缓存、计数器、分布式锁   |
| **Hash**   | ziplist / hashtable               | 对象属性存储（用户信息） |
| **List**   | quicklist（ziplist + linkedlist） | 消息队列、最新列表       |
| **Set**    | intset / hashtable                | 标签、去重、交并差集     |
| **ZSet**   | ziplist / skiplist + hashtable    | 排行榜、延迟队列         |

常用命令：

```bash
# String
SET user:1:name "Alice"
GET user:1:name
INCR counter          # 原子自增
SETEX token 3600 "abc" # 设置并过期

# Hash
HSET user:1 name "Alice" age 25
HGET user:1 name
HGETALL user:1

# List
LPUSH queue task1 task2
RPOP queue

# Set
SADD tags:article:1 "java" "redis"
SMEMBERS tags:article:1
SINTER tags:article:1 tags:article:2  # 交集

# ZSet
ZADD leaderboard 100 "Alice" 90 "Bob"
ZREVRANGE leaderboard 0 9 WITHSCORES  # Top 10
```

### Spring Data Redis 使用

配置：

```yaml
spring:
  data:
    redis:
      host: localhost
      port: 6379
      lettuce:
        pool:
          max-active: 20
          max-idle: 10
```

操作：

```java
@Service
public class UserCacheService {
    private final StringRedisTemplate redisTemplate;

    public void cacheUser(Long id, String json) {
        redisTemplate.opsForValue().set(
            "user:" + id, json, Duration.ofMinutes(30)
        );
    }

    public String getUser(Long id) {
        return redisTemplate.opsForValue().get("user:" + id);
    }

    public void deleteUser(Long id) {
        redisTemplate.delete("user:" + id);
    }
}
```

### 缓存模式

**Cache Aside（旁路缓存）**——最常用：

```text
读:
  缓存命中 → 返回
  缓存未命中 → 查数据库 → 写入缓存 → 返回

写:
  更新数据库 → 删除缓存（不是更新缓存）
```

```java
public User getUser(Long id) {
    String key = "user:" + id;
    String cached = redisTemplate.opsForValue().get(key);
    if (cached != null) {
        return JSON.parseObject(cached, User.class);
    }
    User user = userMapper.selectById(id);
    if (user != null) {
        redisTemplate.opsForValue().set(key, JSON.toJSONString(user), Duration.ofMinutes(30));
    }
    return user;
}

public void updateUser(User user) {
    userMapper.updateById(user);
    redisTemplate.delete("user:" + user.getId()); // 先更新 DB，再删缓存
}
```

为什么删缓存而不是更新缓存？

- 更新缓存可能计算代价大
- 并发写时可能覆盖为旧值
- 删除更简单，下次读自动重建

### 缓存三大问题

**缓存穿透**：查询不存在的数据，每次都打到数据库。

```text
解决:
1. 缓存空值（短过期）
2. 布隆过滤器拦截不存在的 key
```

```java
User user = userMapper.selectById(id);
if (user == null) {
    redisTemplate.opsForValue().set(key, "NULL", Duration.ofMinutes(5)); // 缓存空值
    return null;
}
```

**缓存雪崩**：大量 key 同时过期，请求全打到数据库。

```text
解决:
1. 过期时间加随机偏移
2. 热点数据永不过期 + 异步刷新
3. 多级缓存（本地缓存 + Redis）
```

**缓存击穿**：热点 key 过期瞬间，大量并发请求打到数据库。

```text
解决:
1. 互斥锁（只让一个线程重建缓存）
2. 逻辑过期（不设 TTL，由后台线程刷新）
```

### 分布式锁

单机锁（synchronized / ReentrantLock）只能在一个 JVM 内互斥。分布式环境需要跨进程锁。

Redis 实现分布式锁的基本思路：

```bash
# 加锁（原子操作）
SET lock:order:123 "requestId" NX EX 30
# NX: 不存在才设置   EX: 过期时间防死锁

# 释放锁（Lua 脚本保证原子性）
if redis.call('get', KEYS[1]) == ARGV[1] then
    return redis.call('del', KEYS[1])
end
return 0
```

生产环境推荐使用 **Redisson**：

```java
RLock lock = redissonClient.getLock("lock:order:" + orderId);
try {
    if (lock.tryLock(5, 30, TimeUnit.SECONDS)) {
        // 获取锁成功，执行业务
        processOrder(orderId);
    }
} finally {
    if (lock.isHeldByCurrentThread()) {
        lock.unlock();
    }
}
```

Redisson 优势：

- 自动续期（看门狗机制）
- 可重入
- 支持公平锁、读写锁、联锁
- Red Lock 算法支持

### 过期策略与淘汰策略

过期策略：

- 惰性删除：访问时检查是否过期
- 定期删除：周期性随机检查一批 key

内存淘汰策略（maxmemory-policy）：

| 策略           | 含义                         |
| -------------- | ---------------------------- |
| noeviction     | 不淘汰，内存满时报错         |
| allkeys-lru    | 所有 key 中 LRU 淘汰         |
| volatile-lru   | 有过期时间的 key 中 LRU 淘汰 |
| allkeys-random | 随机淘汰                     |
| volatile-ttl   | 淘汰 TTL 最短的              |
| allkeys-lfu    | LFU（最不常用）淘汰          |

缓存场景推荐 `allkeys-lru`。

### 持久化

| 方式 | 原理             | 优缺点                             |
| ---- | ---------------- | ---------------------------------- |
| RDB  | 定时生成内存快照 | 恢复快，可能丢最后一次快照后的数据 |
| AOF  | 记录每条写命令   | 数据安全，文件大，恢复慢           |
| 混合 | RDB + AOF        | 兼顾两者优点（Redis 4.0+）         |

## 代码示例

### 排行榜

```java
// 添加分数
redisTemplate.opsForZSet().add("leaderboard", userId, score);

// Top 10
Set<ZSetOperations.TypedTuple&lt;String&gt;> top10 =
    redisTemplate.opsForZSet().reverseRangeWithScores("leaderboard", 0, 9);
```

### 接口限流

```java
public boolean isAllowed(String userId, int maxRequests, int windowSeconds) {
    String key = "rate:" + userId;
    Long count = redisTemplate.opsForValue().increment(key);
    if (count == 1) {
        redisTemplate.expire(key, Duration.ofSeconds(windowSeconds));
    }
    return count <= maxRequests;
}
```

## 易错点 / 反例

### 1. 先删缓存再更新数据库

```java
redisTemplate.delete(key); // ❌ 先删缓存
userMapper.updateById(user); // 这期间其他线程可能读到旧值并写回缓存
```

应先更新数据库再删缓存。

### 2. 分布式锁不设过期时间

```bash
SET lock:key value NX  # ❌ 没有 EX，进程崩溃后锁永远不释放
```

必须设置过期时间防止死锁。

### 3. 释放锁不验证持有者

```java
redisTemplate.delete(lockKey); // ❌ 可能释放别人的锁
```

释放前必须验证 value 是否是自己的 requestId。

### 4. 缓存和数据库双写不一致

并发场景下任何方案都不能保证强一致。Cache Aside + 延迟双删可以降低不一致窗口。对一致性要求极高的场景，考虑加锁或用 Canal 等组件同步。

### 5. 大 key 问题

```java
redisTemplate.opsForValue().set("big", hugeJsonString); // ❌ value 过大
```

大 key 会导致网络阻塞、慢查询。String 建议不超过 10KB，集合不超过 5000 元素。

## 高频面试题（5 题）

- **Q1**: Redis 有哪些数据结构？分别适用什么场景？
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  String（缓存、计数器）、Hash（对象属性）、List（队列、最新列表）、Set（标签、去重、集合运算）、ZSet（排行榜、延迟队列）。还有 Bitmap、HyperLogLog、Stream 等扩展类型。

  &lt;details&gt;

- **Q2**: 缓存穿透、缓存雪崩、缓存击穿的区别和解决方案？
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  穿透：查不存在的数据→缓存空值/布隆过滤器。雪崩：大量 key 同时过期→过期时间加随机偏移。击穿：热点 key 过期→互斥锁重建/逻辑过期。

  &lt;details&gt;

- **Q3**: Redis 分布式锁如何实现？
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  SET key value NX EX 原子加锁，Lua 脚本验证持有者后释放。要点：必须设过期时间防死锁，释放前验证 requestId，生产用 Redisson（自动续期、可重入）。

  &lt;details&gt;

- **Q4**: Redis 持久化方式？
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  RDB 定时快照（恢复快但可能丢数据）、AOF 记录写命令（数据安全但文件大）、混合模式（Redis 4.0+，兼顾两者）。缓存场景可不持久化，数据场景用混合模式。

  &lt;details&gt;

- **Q5**: 如何保证缓存和数据库一致性？
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  Cache Aside 模式：读未命中查库回写缓存，写先更新库再删缓存。不能保证强一致，只能降低不一致窗口。可用延迟双删、订阅 binlog（Canal）等方式增强。

  &lt;details&gt;

## 延伸资源

- [Redis 数据类型](https://redis.io/docs/data-types/)
- [Redis 分布式锁](https://redis.io/docs/manual/patterns/distributed-locks/)
- [Spring Data Redis](https://docs.spring.io/spring-data/redis/reference/redis.html)

## (留白) 我的理解

> 这一段不强制填。

---

## 微服务架构基础与 Spring Cloud 概览

## TL;DR

> 微服务将单体应用拆分为多个独立部署的小服务，每个服务聚焦一个业务能力。Spring Cloud 提供注册发现、配置管理、网关、熔断等微服务基础设施。国内主流方案是 **Spring Cloud Alibaba**（Nacos + Sentinel + Seata）。

## 背景与动机

单体应用的问题（随业务增长）：

- 代码耦合，改一处影响全局
- 部署周期长，一个模块改了整个应用重新部署
- 技术栈绑定，无法按模块选择最优方案
- 扩展受限，无法按热点模块独立扩容

微服务的目标：

- 服务独立开发、测试、部署
- 按业务能力拆分，团队自治
- 独立扩缩容
- 技术异构

但微服务也引入新的复杂度：

- 服务发现与注册
- 服务间通信（RPC / HTTP）
- 分布式事务
- 配置管理
- 熔断限流
- 链路追踪
- 数据一致性

## 核心机制

### 单体 vs 微服务

|        | 单体        | 微服务              |
| ------ | ----------- | ------------------- |
| 部署   | 整体部署    | 独立部署            |
| 扩展   | 整体扩展    | 按服务扩展          |
| 技术栈 | 统一        | 可异构              |
| 复杂度 | 代码复杂    | 运维复杂            |
| 数据   | 共享数据库  | 每个服务独立数据库  |
| 适用   | 初期/小团队 | 中大型团队/复杂业务 |

不要为了微服务而微服务。小团队 + 简单业务用单体更高效。

### Spring Cloud 组件全景

```text
客户端请求
    ↓
API Gateway（Spring Cloud Gateway / Nginx）
    ↓
服务发现（Nacos / Eureka / Consul）
    ↓
服务调用（OpenFeign / RestTemplate）
    ↓
负载均衡（Spring Cloud LoadBalancer）
    ↓
熔断限流（Sentinel / Resilience4j）
    ↓
配置中心（Nacos Config / Spring Cloud Config）
    ↓
分布式事务（Seata）
    ↓
链路追踪（Micrometer Tracing / SkyWalking）
```

### Spring Cloud vs Spring Cloud Alibaba

| 能力       | Spring Cloud              | Spring Cloud Alibaba      |
| ---------- | ------------------------- | ------------------------- |
| 注册中心   | Eureka（已停更）          | **Nacos**                 |
| 配置中心   | Spring Cloud Config       | **Nacos Config**          |
| 网关       | Spring Cloud Gateway      | Spring Cloud Gateway      |
| 熔断限流   | Resilience4j              | **Sentinel**              |
| 分布式事务 | —                         | **Seata**                 |
| 负载均衡   | Spring Cloud LoadBalancer | Spring Cloud LoadBalancer |
| 服务调用   | OpenFeign                 | OpenFeign                 |

国内生产环境主流：**Spring Cloud Alibaba** 全家桶。

### 服务间通信

**HTTP / REST**（Spring Cloud 主流）：

```java
// OpenFeign 声明式调用
@FeignClient(name = "user-service")
public interface UserClient {

    @GetMapping("/api/users/{id}")
    UserDto getUser(@PathVariable("id") Long id);

    @PostMapping("/api/users")
    UserDto createUser(@RequestBody CreateUserRequest request);
}

// 使用
@Service
public class OrderService {
    private final UserClient userClient;

    public OrderDto createOrder(CreateOrderRequest req) {
        UserDto user = userClient.getUser(req.userId()); // 像调本地方法
        // ...
    }
}
```

**RPC**（Dubbo，性能更高）：

```java
// Dubbo 接口定义
public interface UserService {
    UserDto getUser(Long id);
}

// 消费方
@DubboReference
private UserService userService;
```

HTTP vs RPC：

|        | HTTP/REST        | RPC（Dubbo）         |
| ------ | ---------------- | -------------------- |
| 协议   | HTTP + JSON      | TCP + 二进制序列化   |
| 性能   | 较低             | 高                   |
| 跨语言 | 天然支持         | 需适配               |
| 生态   | Spring Cloud     | Dubbo 生态           |
| 适用   | 对外 API、跨团队 | 内部服务间高性能调用 |

### CAP 定理

分布式系统最多同时满足两项：

|                           | 含义                         |
| ------------------------- | ---------------------------- |
| **C** Consistency         | 所有节点同一时刻看到相同数据 |
| **A** Availability        | 每个请求都能得到响应         |
| **P** Partition tolerance | 网络分区时系统仍能运行       |

网络分区不可避免，所以实际是 **CP vs AP** 的选择：

- CP：ZooKeeper（注册中心保证一致性）
- AP：Nacos（默认模式，保证可用性）

### BASE 理论

对 CAP 的补充，适用于大多数业务系统：

- **BA**sically Available：基本可用
- **S**oft state：允许中间状态
- **E**ventually consistent：最终一致性

例：下单后库存不立即扣减（软状态），通过 MQ 异步最终同步（最终一致）。

### 服务拆分原则

- 按业务能力拆分（用户、订单、商品、支付）
- 单一职责：一个服务只做一件事
- 高内聚低耦合
- 独立数据库（Database per Service）
- 避免过度拆分：3-5 人团队维护一个服务
- 先单体，再按痛点逐步拆分

### 分布式事务

微服务拆分后，一个业务操作可能跨多个服务和数据库：

```text
下单 = 订单服务（创建订单）+ 库存服务（扣库存）+ 积分服务（加积分）
```

解决方案：

| 方案            | 原理                 | 一致性   | 适用       |
| --------------- | -------------------- | -------- | ---------- |
| Seata AT        | 自动补偿（undo log） | 强一致   | 常规业务   |
| Seata TCC       | Try-Confirm-Cancel   | 强一致   | 高性能场景 |
| 本地消息表 + MQ | 消息最终一致         | 最终一致 | 跨系统     |
| Saga            | 正向操作 + 补偿操作  | 最终一致 | 长流程     |

大部分业务场景优先用 **最终一致性**（MQ + 幂等消费），只有强一致需求才用 Seata。

## 代码示例

### OpenFeign + 降级

```java
@FeignClient(name = "user-service", fallbackFactory = UserClientFallback.class)
public interface UserClient {
    @GetMapping("/api/users/{id}")
    UserDto getUser(@PathVariable("id") Long id);
}

@Component
public class UserClientFallback implements FallbackFactory&lt;UserClient&gt; {
    @Override
    public UserClient create(Throwable cause) {
        return id -> {
            log.error("调用 user-service 失败", cause);
            return UserDto.unknown(id); // 降级响应
        };
    }
}
```

### Nacos 配置

```yaml
spring:
  application:
    name: order-service
  cloud:
    nacos:
      discovery:
        server-addr: localhost:8848
      config:
        server-addr: localhost:8848
        file-extension: yml
```

## 易错点 / 反例

### 1. 过早微服务化

小团队/初创项目直接上微服务 → 运维复杂度远超业务复杂度。应先用单体验证业务，有明确痛点再拆。

### 2. 服务间共享数据库

```text
订单服务 → 用户表（直连）  ❌ 耦合，改表结构影响多个服务
```

每个服务独立数据库，跨服务数据通过 API 获取。

### 3. 同步调用链过长

```text
A → B → C → D → E  ❌ 链路长，延迟累加，任一节点故障全链路失败
```

长链路应考虑异步化（MQ）或合并服务。

### 4. 分布式事务滥用

不是所有跨服务操作都需要强一致事��。大多数场景最终一致性就够了（MQ + 幂等）。Seata 引入额外性能开销。

### 5. 忽略服务治理

没有熔断 → 一个慢服务拖垮整个系统。
没有限流 → 突发流量打垮服务。
没有链路追踪 → 排查问题靠猜。

## 高频面试题（5 题）

- **Q1**: 微服务和单体的区别？什么时候用微服务？
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  单体代码集中部署，微服务按业务拆分独立部署。微服务适合中大型团队、复杂业务、需要独立扩缩容的场景。小团队/初创项目单体更高效，有明确痛点再拆。

  &lt;details&gt;

- **Q2**: Spring Cloud 有哪些核心组件？
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  注册发现（Nacos/Eureka）、配置管理（Nacos Config）、网关（Spring Cloud Gateway）、服务调用（OpenFeign）、负载均衡（LoadBalancer）、熔断限流（Sentinel/Resilience4j）、分布式事务（Seata）、链路追踪（Micrometer Tracing）。

  &lt;details&gt;

- **Q3**: CAP 定理是什么？
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  分布式系统最多同时满足一致性（C）、可用性（A）、分区容错性（P）中的两项。网络分区不可避免，实际是 CP vs AP 的选择。Nacos 默认 AP（保可用），ZooKeeper 是 CP（保一致）。

  &lt;details&gt;

- **Q4**: 分布式事务怎么解决？
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  强一致：Seata AT（自动补偿）、TCC（Try-Confirm-Cancel）。最终一致：本地消息表+MQ、Saga 模式。大部分业务用最终一致性（MQ+幂等消费）即可，强一致场景才用 Seata。

  &lt;details&gt;

- **Q5**: OpenFeign 的作用和原理？
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  OpenFeign 是声明式 HTTP 客户端，通过接口 + 注解定义远程调用，像调用本地方法一样调用其他服务。底层基于动态代理，整合负载均衡和熔断。支持 fallback 降级。

  &lt;details&gt;

## 延伸资源

- [Spring Cloud 官网](https://spring.io/projects/spring-cloud)
- [Spring Cloud Alibaba](https://sca.aliyun.com/docs/2023/overview/what-is-sca/)
- [OpenFeign 文档](https://docs.spring.io/spring-cloud-openfeign/reference/)

## (留白) 我的理解

> 这一段不强制填。

---

## 注册中心（Nacos）与 API 网关（Spring Cloud Gateway）

## TL;DR

> **注册中心**管理服务实例的注册与发现，消费者通过注册中心找到可用的服务实例。**API 网关**是所有外部请求的统一入口，负责路由转发、鉴权、限流等。国内主流：注册中心用 Nacos，网关用 Spring Cloud Gateway。

## 背景与动机

微服务架构下：

- 服务实例动态变化（扩缩容、上下线）→ 需要注册中心自动管理
- 客户端不应直接调用各个服务 → 需要网关统一入口
- 配置散落在各服务 → 需要配置中心集中管理

## 核心机制

### 注册中心的作用

```text
服务启动 → 注册到注册中心（IP + Port + 元数据）
                    ↓
            注册中心维护服务列表
                    ↓
消费者 → 从注册中心拉取服务列表 → 负载均衡选择一个实例 → 发起调用
                    ↓
            注册中心健康检查 → 剔除不健康实例
```

### Nacos

Nacos = 注册中心 + 配置中心，一站式解决。

注册发现：

```yaml
spring:
  application:
    name: order-service
  cloud:
    nacos:
      discovery:
        server-addr: localhost:8848
        namespace: dev # 命名空间隔离
        group: DEFAULT_GROUP
```

服务注册后在 Nacos 控制台可见：

```text
服务列表:
├── order-service (3 instances)
│   ├── 192.168.1.10:8081 ✅
│   ├── 192.168.1.11:8081 ✅
│   └── 192.168.1.12:8081 ❌ (unhealthy)
├── user-service (2 instances)
└── product-service (2 instances)
```

Nacos 配置中心：

```yaml
spring:
  cloud:
    nacos:
      config:
        server-addr: localhost:8848
        file-extension: yml
        shared-configs:
          - data-id: common.yml
            group: DEFAULT_GROUP
            refresh: true
```

配置热更新：

```java
@RefreshScope
@RestController
public class ConfigController {
    @Value("${app.feature.enabled:false}")
    private boolean featureEnabled;
}
// Nacos 控制台修改配置后自动刷新，无需重启
```

### Nacos vs Eureka vs Consul

|            | Nacos          | Eureka     | Consul            |
| ---------- | -------------- | ---------- | ----------------- |
| 注册中心   | ✅             | ✅         | ✅                |
| 配置中心   | ✅             | ❌         | ✅                |
| 一致性模型 | AP/CP 可切换   | AP         | CP                |
| 健康检查   | TCP/HTTP/MySQL | 客户端心跳 | 多种              |
| 控制台     | ✅ 功能丰富    | 简单       | ✅                |
| 维护状态   | 活跃（阿里）   | 停更       | 活跃（HashiCorp） |
| 国内使用   | 主流           | 老项目     | 较少              |

### Spring Cloud Gateway

Spring Cloud Gateway 是 Spring 官方的 API 网关，基于 WebFlux（非阻塞）：

```text
客户端 → Gateway → 路由匹配 → Filter 链 → 转发到后端服务
```

路由配置：

```yaml
spring:
  cloud:
    gateway:
      routes:
        - id: user-service
          uri: lb://user-service # lb:// 表示从注册中心负载均衡
          predicates:
            - Path=/api/users/** # 路径匹配
          filters:
            - StripPrefix=1 # 去掉前缀 /api

        - id: order-service
          uri: lb://order-service
          predicates:
            - Path=/api/orders/**
            - Method=GET,POST
          filters:
            - StripPrefix=1
            - AddRequestHeader=X-Gateway, true
```

### 路由谓词（Predicates）

| 谓词         | 示例            | 含义      |
| ------------ | --------------- | --------- |
| Path         | `/api/users/**` | 路径匹配  |
| Method       | `GET,POST`      | HTTP 方法 |
| Header       | `X-Token, \d+`  | 请求头    |
| Query        | `name, abc`     | 查询参数  |
| Before/After | 时间            | 时间范围  |
| Weight       | `group1, 8`     | 权重路由  |

### 过滤器（Filters）

内置过滤器：

| 过滤器               | 作用         |
| -------------------- | ------------ |
| `StripPrefix`        | 去掉路径前缀 |
| `AddRequestHeader`   | 添加请求头   |
| `RewritePath`        | 路径重写     |
| `Retry`              | 重试         |
| `CircuitBreaker`     | 熔断         |
| `RequestRateLimiter` | 限流         |

自定义全局过滤器（鉴权）：

```java
@Component
public class AuthGlobalFilter implements GlobalFilter, Ordered {

    @Override
    public Mono&lt;Void&gt; filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String token = exchange.getRequest().getHeaders().getFirst("Authorization");

        if (token == null || !tokenService.validate(token)) {
            exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
            return exchange.getResponse().setComplete();
        }

        // 解析用户信息传递给下游
        Long userId = tokenService.getUserId(token);
        ServerHttpRequest request = exchange.getRequest().mutate()
            .header("X-User-Id", userId.toString())
            .build();

        return chain.filter(exchange.mutate().request(request).build());
    }

    @Override
    public int getOrder() {
        return -1; // 优先级高
    }
}
```

### 负载均衡

Spring Cloud LoadBalancer（替代已废弃的 Ribbon）：

```text
Gateway / Feign → LoadBalancer → 从注册中心获取实例列表 → 选择策略 → 调用
```

默认轮询策略，可自定义：

```java
@Bean
public ReactorLoadBalancer&lt;ServiceInstance&gt; randomLoadBalancer(
        Environment env, LoadBalancerClientFactory factory) {
    String name = env.getProperty(LoadBalancerClientFactory.PROPERTY_NAME);
    return new RandomLoadBalancer(
        factory.getLazyProvider(name, ServiceInstanceListSupplier.class), name
    );
}
```

### 网关的职责

| 职责      | 说明                                   |
| --------- | -------------------------------------- |
| 路由转发  | 根据路径/头/参数转发到对应服务         |
| 负载均衡  | 从注册中心获取实例，轮询/随机选择      |
| 统一鉴权  | 在网关层验证 Token，下游服务不重复鉴权 |
| 限流      | 保护后端服务不被突发流量压垮           |
| 日志/监控 | 统一记录请求日志和指标                 |
| 跨域处理  | 集中配置 CORS                          |
| 灰度发布  | 按规则将部分流量路由到新版本           |

## 代码示例

### Gateway CORS 配置

```yaml
spring:
  cloud:
    gateway:
      globalcors:
        cors-configurations:
          '[/**]':
            allowed-origins: 'https://example.com'
            allowed-methods: '*'
            allowed-headers: '*'
            allow-credentials: true
            max-age: 3600
```

### Gateway 限流（Redis）

```yaml
filters:
  - name: RequestRateLimiter
    args:
      redis-rate-limiter.replenishRate: 10 # 每秒 10 个请求
      redis-rate-limiter.burstCapacity: 20 # 突发容量
      key-resolver: '#{@userKeyResolver}'
```

```java
@Bean
public KeyResolver userKeyResolver() {
    return exchange -> Mono.just(
        exchange.getRequest().getHeaders().getFirst("X-User-Id")
    );
}
```

## 易错点 / 反例

### 1. 注册中心单点部署

生产环境注册中心必须集群部署（Nacos 至少 3 节点），单点故障会导致所有服务发现失效。

### 2. 网关做太多业务逻辑

网关应只做通用逻辑（鉴权、限流、路由）。业务逻辑放在各服务中，否则网关成为瓶颈。

### 3. 配置不分环境

```yaml
spring.cloud.nacos.config.namespace: # ❌ 没设置，开发和生产用同一份配置
```

用 Nacos 的 namespace 隔离 dev/test/prod 环境。

### 4. 忽略健康检查配置

服务下线后注册中心需要时间感知（心跳超时）。应配置合理的心跳间隔和摘除时间，避免请求打到已下线实例。

### 5. Gateway 和 Spring MVC 混用

Spring Cloud Gateway 基于 WebFlux（非阻塞），不能和 spring-boot-starter-web（Spring MVC）共存。网关服务不应引入 starter-web。

## 高频面试题（5 题）

- **Q1**: 注册中心的作用是什么？
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  管理服务实例的注册与发现。服务启动时注册（IP、端口、元数据），消费者从注册中心获取可用实例列表进行调用。注册中心通过健康检查自动剔除不健康实例。

  &lt;details&gt;

- **Q2**: Nacos 和 Eureka 的区别？
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  Nacos 同时支持注册中心和配置中心，支持 AP/CP 切换，功能丰富，持续维护。Eureka 只是注册中心，AP 模式，已停更。Nacos 还支持配置热更新、命名空间隔离。国内主流选 Nacos。

  &lt;details&gt;

- **Q3**: API 网关的作用？
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  统一入口：路由转发、负载均衡。横切关注点：统一鉴权、限流、日志、CORS、灰度发布。保护后端服务不直接暴露给客户端。Spring Cloud Gateway 基于 WebFlux 非阻塞模型。

  &lt;details&gt;

- **Q4**: Spring Cloud Gateway 的核心概念？
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  Route（路由）：URI + Predicates + Filters。Predicate（谓词）：匹配条件（路径、方法、头等）。Filter（过滤器）：请求/响应处理（鉴权、限流、重写等）。支持全局过滤器和路由级过滤器。

  &lt;details&gt;

- **Q5**: 配置中心的作用和热更新原理？
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  集中管理配置，支持多环境隔离，修改后无需重启。Nacos 通过长轮询（Long Polling）感知配置变化，配合 @RefreshScope 或 @ConfigurationProperties 实现 Bean 属性自动刷新。

  &lt;details&gt;

## 延伸资源

- [Nacos 文档](https://nacos.io/docs/v2/guide/user/open-api/)
- [Spring Cloud Gateway 文档](https://docs.spring.io/spring-cloud-gateway/reference/)
- [Spring Cloud Alibaba](https://sca.aliyun.com/docs/2023/user-guide/nacos/overview/)

## (留白) 我的理解

> 这一段不强制填。

---

## 熔断限流（Sentinel）与链路追踪

## TL;DR

> **熔断**在下游服务不健康时快速失败，防止雪崩。**限流**控制请求速率保护系统。**降级**在异常时返回兜底结果保证可用性。**链路追踪**串联跨服务调用链，快速定位性能瓶颈和故障点。Sentinel 是国内主流的流量治理组件。

## 背景与动机

微服务的级联故障（雪崩效应）：

```text
服务 A → 服务 B → 服务 C（响应慢/宕机）
         ↓
    B 的线程被 C 的请求占满
         ↓
    A 调 B 也超时
         ↓
    整个系统不可用
```

需要防御机制：

- **熔断**：C 故障时 B 停止调用 C，快速返回错误
- **限流**：控制入口流量，防止超载
- **降级**：异常时返回默认值/缓存值，保证核心流程可用

同时，微服务调用链长，出问题时需要 **链路追踪** 定位是哪个服务、哪个方法慢或出错。

## 核心机制

### 熔断器模式

```text
          请求成功率高
  ┌────────────────────┐
  │                    │
  ▼                    │
CLOSED ──失败率超阈值──> OPEN ──超时后──> HALF_OPEN
  ▲                                      │
  │              部分请求试探              │
  └────── 试探成功 ◄──────────────────────┘
                       │
            试探失败 → 回到 OPEN
```

| 状态      | 行为                                         |
| --------- | -------------------------------------------- |
| CLOSED    | 正常放行，统计失败率                         |
| OPEN      | 所有请求直接拒绝/降级，不调下游              |
| HALF_OPEN | 放行少量请求试探，成功则恢复，失败则重新熔断 |

### Sentinel 核心功能

| 功能     | 说明                             |
| -------- | -------------------------------- |
| 流量控制 | QPS/线程数限流，匀速排队         |
| 熔断降级 | 慢调用比例、异常比例、异常数触发 |
| 系统保护 | CPU/Load/线程数等系统级保护      |
| 热点参数 | 对热点参数单独限流               |
| 控制台   | 实时监控 + 动态规则配置          |

### Sentinel 使用

依赖：

```xml
&lt;dependency&gt;
    &lt;groupId&gt;com.alibaba.cloud&lt;groupId&gt;
    &lt;artifactId&gt;spring-cloud-starter-alibaba-sentinel&lt;artifactId&gt;
&lt;dependency&gt;
```

配置：

```yaml
spring:
  cloud:
    sentinel:
      transport:
        dashboard: localhost:8080 # Sentinel 控制台地址
```

注解方式：

```java
@SentinelResource(value = "getUser",
    blockHandler = "getUserBlock",
    fallback = "getUserFallback")
public User getUser(Long id) {
    return userClient.getUser(id);
}

// 限流/熔断时调用（BlockException）
public User getUserBlock(Long id, BlockException ex) {
    return User.defaultUser();
}

// 业务异常时调用
public User getUserFallback(Long id, Throwable ex) {
    log.error("获取用户失败", ex);
    return User.defaultUser();
}
```

### 限流规则

```java
// 代码配置（通常在控制台动态配置）
FlowRule rule = new FlowRule();
rule.setResource("getUser");
rule.setGrade(RuleConstant.FLOW_GRADE_QPS); // QPS 模式
rule.setCount(100); // 阈值 100 QPS
rule.setControlBehavior(RuleConstant.CONTROL_BEHAVIOR_WARM_UP); // 预热
FlowRuleManager.loadRules(Collections.singletonList(rule));
```

限流策略：

| 策略            | 含义                         |
| --------------- | ---------------------------- |
| 直接拒绝        | 超过阈值直接拒绝             |
| Warm Up（预热） | 冷启动，阈值从低到高逐步增长 |
| 匀速排队        | 请求匀速通过，漏桶算法       |

### 熔断规则

```java
DegradeRule rule = new DegradeRule();
rule.setResource("getUser");
rule.setGrade(CircuitBreakerStrategy.SLOW_REQUEST_RATIO.getType());
rule.setCount(0.5);           // 慢调用比例阈值 50%
rule.setSlowRatioThreshold(1000); // 慢调用 RT 阈值 1000ms
rule.setMinRequestAmount(5);  // 最小请求数
rule.setTimeWindow(30);       // 熔断恢复时间 30 秒
rule.setStatIntervalMs(10000); // 统计窗口 10 秒
```

触发条件：

- **慢调用比例**：RT 超过阈值的请求比例过高
- **异常比例**：异常请求占比过高
- **异常数**：异常请求绝对数量过多

### Feign 集成 Sentinel

```yaml
feign:
  sentinel:
    enabled: true
```

```java
@FeignClient(name = "user-service", fallbackFactory = UserClientFallback.class)
public interface UserClient {
    @GetMapping("/api/users/{id}")
    UserDto getUser(@PathVariable("id") Long id);
}
```

Feign 调用自动被 Sentinel 保护，限流/熔断时走 fallback。

### Gateway 集成 Sentinel

```yaml
spring:
  cloud:
    sentinel:
      filter:
        enabled: false # 关闭 servlet filter（Gateway 用 WebFlux）
```

在 Sentinel 控制台配置网关流控规则，可按路由 ID、API 分组限流。

### 链路追踪

分布式追踪的核心概念：

```text
Trace（追踪）= 一次完整的请求链路
  ├── Span A（Gateway, 50ms）
  │   └── Span B（Order Service, 30ms）
  │       ├── Span C（User Service, 10ms）
  │       └── Span D（MySQL Query, 5ms)
  └── TraceId: abc123（全链路唯一 ID）
```

| 概念         | 含义                               |
| ------------ | ---------------------------------- |
| Trace        | 一次完整请求的全链路               |
| Span         | 一个操作单元（一次 RPC、一次 SQL） |
| TraceId      | 全链路唯一标识                     |
| SpanId       | 当前 Span 标识                     |
| ParentSpanId | 父 Span 标识                       |

### 追踪方案对比

| 方案                   | 特点                                     |
| ---------------------- | ---------------------------------------- |
| **SkyWalking**         | 国产，Java Agent 无侵入，功能丰富，UI 好 |
| **Zipkin**             | Twitter 开源，轻量                       |
| **Jaeger**             | Uber 开源，CNCF 项目                     |
| **Micrometer Tracing** | Spring Boot 3 官方支持，抽象层           |

国内生产环境推荐 **SkyWalking**（Java Agent 方式，无需改代码）。

### SkyWalking 接入

```bash
# 启动时加 Java Agent
java -javaagent:/path/to/skywalking-agent.jar \
     -Dskywalking.agent.service_name=order-service \
     -Dskywalking.collector.backend_service=localhost:11800 \
     -jar app.jar
```

零代码侵入，自动追踪：

- HTTP 请求（Spring MVC / Gateway）
- RPC 调用（Feign / Dubbo）
- 数据库访问（MySQL / Redis）
- MQ 生产消费（Kafka / RocketMQ）

### 可观测性三大支柱

| 支柱                | 工具                 | 用途              |
| ------------------- | -------------------- | ----------------- |
| **日志（Logs）**    | ELK / Loki           | 详细事件记录      |
| **指标（Metrics）** | Prometheus + Grafana | 系统/业务指标监控 |
| **追踪（Traces）**  | SkyWalking / Zipkin  | 请求链路分析      |

三者结合才能实现完整的可观测性。

## 代码示例

### Sentinel 自定义限流响应

```java
@Component
public class SentinelBlockHandler implements BlockExceptionHandler {
    @Override
    public void handle(HttpServletRequest request, HttpServletResponse response,
                       BlockException e) throws Exception {
        response.setContentType("application/json;charset=UTF-8");
        response.setStatus(429);
        response.getWriter().write(
            "{\"code\":429,\"message\":\"请求过于频繁，请稍后重试\"}"
        );
    }
}
```

### 日志中传递 TraceId

```java
// 在日志中自动包含 TraceId（配合 MDC）
// logback 配置
// &lt;pattern&gt;%d [%X{traceId}] [%thread] %-5level %logger - %msg%n&lt;pattern&gt;
```

## 易错点 / 反例

### 1. 没有降级策略

```java
@SentinelResource("getUser") // ❌ 没有 fallback，限流/熔断时直接报错
```

必须配置 blockHandler 和 fallback，保证用户体验。

### 2. 限流阈值拍脑袋

不经过压测就设限流值 → 设太低影响正常业务，设太高起不到保护作用。应通过压测确定系统容量，设合理阈值。

### 3. 熔断恢复时间太短

```java
rule.setTimeWindow(5); // ❌ 5 秒就恢复，下游还没恢复又打过去
```

应根据下游服务恢复时间设置合理的熔断窗口。

### 4. 不传递 TraceId

服务间调用如果不传递 TraceId，链路追踪会断裂。SkyWalking Agent 自动处理，但自定义 HTTP 调用需要注意透传。

### 5. 只监控不告警

有了追踪系统但没配告警 → 问题发生后才发现。应配置关键指标的告警规则（P99 延迟、错误率、QPS 异常等）。

## 高频面试题（5 题）

- **Q1**: 什么是熔断？和降级有什么区别？
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  熔断是发现下游异常后主动切断调用，防止级联故障（断路器模式：CLOSED→OPEN→HALF_OPEN）。降级是在异常时返回兜底结果，保证核心功能可用。熔断是触发条件，降级是处理策略，常配合使用。

  &lt;details&gt;

- **Q2**: Sentinel 的限流算法？
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  基于滑动窗口统计。支持三种控制行为：直接拒绝（超阈值立即拒绝）、Warm Up（冷启动预热）、匀速排队（漏桶算法，请求均匀通过）。可按 QPS 或并发线程数限流。

  &lt;details&gt;

- **Q3**: 分布式链路追踪的原理？
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  每个请求生成全局唯一的 TraceId，每个操作单元生成 SpanId，通过 ParentSpanId 建立父子关系。TraceId 在服务间通过 HTTP Header 传递。收集端将所有 Span 按 TraceId 聚合还原完整调用链。

  &lt;details&gt;

- **Q4**: Sentinel 和 Hystrix 的区别？
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  Hystrix 已停更。Sentinel 持续维护，功能更丰富：支持 QPS 限流（Hystrix 只有线程池/信号量隔离）、滑动窗口更精确、有控制台实时监控和动态规则配置、支持热点参数限流。

  &lt;details&gt;

- **Q5**: 如何实现灰度发布？
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  在网关层根据请求头/Cookie/用户 ID 等路由到新版本服务实例。Nacos 元数据标记版本，Gateway 自定义 Filter 或 LoadBalancer 策略实现流量分发。逐步扩大灰度比例，验证无误后全量发布。

  &lt;details&gt;

## 延伸资源

- [Sentinel 官方文档](https://sentinelguard.io/zh-cn/docs/introduction.html)
- [SkyWalking 文档](https://skywalking.apache.org/docs/)
- [Spring Boot Tracing](https://docs.spring.io/spring-boot/reference/actuator/tracing.html)

## (留白) 我的理解

> 这一段不强制填。

<!-- KNOWLEDGE-IMPORT:END -->
