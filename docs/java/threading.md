---
title: '多线程 / JVM'
order: 6
---

# 多线程与并发

> Java 并发编程的核心：线程安全、锁机制、线程池、异步编排。正确使用并发工具是高性能应用的基础。

---

## 创建线程方式对比

| 方式                         | 优点               | 缺点                 |   推荐度   |
| ---------------------------- | ------------------ | -------------------- | :--------: |
| 继承 `Thread`                | 简单直接           | 单继承限制，无返回值 |     ⭐     |
| 实现 `Runnable`              | 无继承限制，可复用 | 无返回值             |    ⭐⭐    |
| 实现 `Callable` + `Future`   | 有返回值，可抛异常 | API 较笨重           |   ⭐⭐⭐   |
| `CompletableFuture`          | 异步编排，链式调用 | 学习曲线             |  ⭐⭐⭐⭐  |
| **线程池 `ExecutorService`** | 资源复用，统一管理 | 需要合理配置参数     | ⭐⭐⭐⭐⭐ |

```java
// ❌ 直接 new Thread（线程创建销毁开销大，无法管理）
new Thread(() -> doWork()).start();

// ✅ 使用线程池
ExecutorService executor = Executors.newFixedThreadPool(4);
executor.submit(() -> doWork());
executor.shutdown();
```

---

## ThreadPoolExecutor 七大参数

```java
// 线程池的完整构造方法
ThreadPoolExecutor executor = new ThreadPoolExecutor(
    4,                    // corePoolSize：核心线程数（常驻）
    8,                    // maximumPoolSize：最大线程数
    60L,                  // keepAliveTime：非核心线程空闲存活时间
    TimeUnit.SECONDS,     // unit：时间单位
    new LinkedBlockingQueue<>(100),  // workQueue：任务队列
    Executors.defaultThreadFactory(),  // threadFactory：线程工厂
    new ThreadPoolExecutor.CallerRunsPolicy()  // handler：拒绝策略
);
```

**任务执行流程：**

1. 线程数 < corePoolSize → 创建核心线程执行
2. 核心线程满 → 放入 workQueue 排队
3. 队列满 → 创建非核心线程（直到 maximumPoolSize）
4. 线程和队列都满 → 执行拒绝策略

| 拒绝策略              | 行为                                  |
| --------------------- | ------------------------------------- |
| `AbortPolicy`         | 抛 RejectedExecutionException（默认） |
| `CallerRunsPolicy`    | 调用者线程执行（降速不丢弃）          |
| `DiscardPolicy`       | 静默丢弃                              |
| `DiscardOldestPolicy` | 丢弃队列中最老的任务                  |

```java
// ❌ 用 Executors 快捷方法（隐藏的 OOM 风险）
Executors.newFixedThreadPool(n);    // 队列无界 → OOM
Executors.newCachedThreadPool();    // 线程数无上限 → OOM

// ✅ 手动创建 ThreadPoolExecutor，明确参数
```

---

## synchronized vs ReentrantLock

| 特性     | `synchronized`     | `ReentrantLock`         |
| -------- | ------------------ | ----------------------- |
| 使用方式 | 关键字（JVM 内置） | API（手动 lock/unlock） |
| 可中断   | 不可中断           | `lockInterruptibly()`   |
| 超时等待 | 不支持             | `tryLock(timeout)`      |
| 公平锁   | 非公平             | 可选公平 / 非公平       |
| 条件变量 | 单一 wait/notify   | 多个 `Condition`        |
| 性能     | JDK 6+ 优化后相当  | 相当                    |
| 推荐     | 简单场景优先用     | 需要高级特性时用        |

```java
// synchronized 用法
public synchronized void method() { /* 整个方法加锁 */ }

public void method() {
    synchronized (this) { /* 代码块加锁，粒度更细 */ }
}

// ReentrantLock 用法
private final ReentrantLock lock = new ReentrantLock();

public void method() {
    lock.lock();
    try {
        // 临界区代码
    } finally {
        lock.unlock();  // 必须在 finally 中释放
    }
}
```

---

## volatile 语义

```java
// volatile 保证两件事：
// 1. 可见性：一个线程修改后，其他线程立即可见
// 2. 有序性：禁止指令重排序
// ⚠️ 不保证原子性！（i++ 不是原子操作）

// 典型使用：状态标志
private volatile boolean running = true;

public void stop() { running = false; }

public void run() {
    while (running) {  // 能及时看到 running 的变化
        doWork();
    }
}

// 原子操作用 Atomic 类
private final AtomicInteger count = new AtomicInteger(0);
count.incrementAndGet();   // 线程安全的 i++
count.compareAndSet(0, 1); // CAS 操作
```

---

## CompletableFuture 异步编排

```java
// 异步执行
CompletableFuture<User> userFuture =
    CompletableFuture.supplyAsync(() -> fetchUser(id));

// 链式处理
userFuture
    .thenApply(user -> enrichData(user))      // 同步转换
    .thenApplyAsync(data -> process(data))    // 异步转换
    .thenAccept(result -> save(result))       // 消费结果
    .exceptionally(e -> {                     // 异常处理
        log.error("处理失败", e);
        return null;
    });

// 组合多个异步任务
CompletableFuture.allOf(future1, future2, future3).join();   // 等待所有完成
CompletableFuture.anyOf(future1, future2);                   // 任意一个完成
```

---

## 常见陷阱

```java
// ❌ 双重检查锁缺少 volatile（指令重排导致获取未初始化对象）
private static Singleton instance;
public static Singleton getInstance() {
    if (instance == null) {
        synchronized (Singleton.class) {
            if (instance == null) {
                instance = new Singleton();  // 可能重排序
            }
        }
    }
    return instance;
}

// ✅ 加 volatile 禁止重排序
private static volatile Singleton instance;
```

```java
// ❌ 线程池用无界队列 → OOM
Executors.newFixedThreadPool(2);   // 内部 LinkedBlockingQueue 无容量限制

// ✅ 有界队列 + 拒绝策略
new ThreadPoolExecutor(
    2, 4, 60, TimeUnit.SECONDS,
    new LinkedBlockingQueue<>(1000),       // 有界队列
    new ThreadPoolExecutor.CallerRunsPolicy()  // 拒绝策略
);
```

```java
// ❌ synchronized 锁错对象
private final List<String> list = new ArrayList<>();
public void add(String s) {
    synchronized (new Object()) {  // 每次都是新对象，锁无效！
        list.add(s);
    }
}

// ✅ 锁同一个对象
private final Object lock = new Object();
public void add(String s) {
    synchronized (lock) {
        list.add(s);
    }
}
```

<!-- KNOWLEDGE-IMPORT:START -->

## JUC 锁与并发工具（ReentrantLock / CountDownLatch / Semaphore）

## TL;DR

> `java.util.concurrent` 提供比 synchronized 更灵活的锁和并发协调工具。`ReentrantLock` 支持可中断、超时、公平锁；`CountDownLatch` / `CyclicBarrier` / `Semaphore` 解决线程协调问题。底层核心是 AQS。

## 背景与动机

synchronized 足以解决基本互斥，但在以下场景力不从心：

- 需要尝试获取锁，获取不到不阻塞（tryLock）
- 需要可中断的锁等待
- 需要公平排队
- 需要读写分离锁（多读少写场景）
- 需要多条件队列（Condition）

JDK 5 引入 `java.util.concurrent.locks` 包，提供更丰富的锁实现。

同时，多线程协调场景也需要专门工具：

- 等待 N 个线程全部完成（CountDownLatch）
- N 个线程到齐后同时开始（CyclicBarrier）
- 控制并发访问数量（Semaphore）

## 核心机制

### ReentrantLock

```java
ReentrantLock lock = new ReentrantLock();

lock.lock();
try {
    // 临界区
} finally {
    lock.unlock(); // 必须在 finally 中释放
}
```

与 synchronized 对比：

| 特性     | synchronized            | ReentrantLock             |
| -------- | ----------------------- | ------------------------- |
| 加锁方式 | 隐式（进入退出块）      | 显式 lock / unlock        |
| 可中断   | 不可                    | `lockInterruptibly()`     |
| 超时     | 不可                    | `tryLock(timeout)`        |
| 公平锁   | 不支持                  | `new ReentrantLock(true)` |
| 条件队列 | 只有一个（wait/notify） | 多个 `Condition`          |
| 释放     | 自动                    | 必须手动 finally          |

tryLock 避免死锁：

```java
if (lock.tryLock(1, TimeUnit.SECONDS)) {
    try {
        // 获取成功
    } finally {
        lock.unlock();
    }
} else {
    // 获取失败，做其他处理
}
```

### Condition

Condition 是 wait/notify 的增强版，可以精确唤醒特定条件的线程：

```java
ReentrantLock lock = new ReentrantLock();
Condition notEmpty = lock.newCondition();
Condition notFull = lock.newCondition();

// 生产者
lock.lock();
try {
    while (queue.size() == capacity) {
        notFull.await(); // 队列满，等待 notFull
    }
    queue.add(item);
    notEmpty.signal(); // 通知消费者
} finally {
    lock.unlock();
}

// 消费者
lock.lock();
try {
    while (queue.isEmpty()) {
        notEmpty.await(); // 队列空，等待 notEmpty
    }
    T item = queue.poll();
    notFull.signal(); // 通知生产者
} finally {
    lock.unlock();
}
```

### ReadWriteLock

读多写少场景，读读不互斥，读写 / 写写互斥：

```java
ReadWriteLock rwLock = new ReentrantReadWriteLock();

// 读操作 — 多线程可同时持有读锁
rwLock.readLock().lock();
try {
    return cache.get(key);
} finally {
    rwLock.readLock().unlock();
}

// 写操作 — 独占
rwLock.writeLock().lock();
try {
    cache.put(key, value);
} finally {
    rwLock.writeLock().unlock();
}
```

注意：读锁不能升级为写锁（会死锁），写锁可以降级为读锁。

### CountDownLatch

等待 N 个任务完成后继续：

```java
int taskCount = 5;
CountDownLatch latch = new CountDownLatch(taskCount);

for (int i = 0; i < taskCount; i++) {
    executor.submit(() -> {
        try {
            doWork();
        } finally {
            latch.countDown(); // 完成一个，计数减 1
        }
    });
}

latch.await(); // 阻塞直到计数归零
System.out.println("所有任务完成");
```

CountDownLatch 是一次性的，计数归零后不能重置。

### CyclicBarrier

N 个线程到齐后同时继续（可重用）：

```java
int parties = 3;
CyclicBarrier barrier = new CyclicBarrier(parties, () -> {
    System.out.println("所有线程到齐，开始下一阶段");
});

for (int i = 0; i < parties; i++) {
    executor.submit(() -> {
        prepareData();
        barrier.await(); // 等其他线程到齐
        processData();   // 所有线程同时开始
    });
}
```

CountDownLatch vs CyclicBarrier：

|          | CountDownLatch          | CyclicBarrier        |
| -------- | ----------------------- | -------------------- |
| 典型用法 | 一个线程等 N 个线程完成 | N 个线程互相等待到齐 |
| 可重用   | 否                      | 是（自动重置）       |
| 回调     | 无                      | 支持 barrierAction   |

### Semaphore

控制同时访问的线程数量：

```java
Semaphore semaphore = new Semaphore(3); // 最多 3 个线程同时访问

void accessResource() throws InterruptedException {
    semaphore.acquire(); // 获取许可，无许可则阻塞
    try {
        // 访问受限资源
    } finally {
        semaphore.release(); // 释放许可
    }
}
```

典型场景：数据库连接池限流、接口并发控制。

### AQS（AbstractQueuedSynchronizer）

AQS 是 JUC 锁和同步器的底层框架：

```text
ReentrantLock      → AQS（独占模式）
ReadWriteLock      → AQS（共享 + 独占）
CountDownLatch     → AQS（共享模式）
Semaphore          → AQS（共享模式）
```

核心思想：

- 用 `volatile int state` 表示同步状态
- 用 CLH 队列管理等待线程
- 子类实现 `tryAcquire` / `tryRelease`（独占）或 `tryAcquireShared` / `tryReleaseShared`（共享）

面试中了解 AQS 的角色和核心机制即可，不需要逐行背源码。

## 代码示例

### 限时获取锁

```java
ReentrantLock lock = new ReentrantLock();

boolean acquired = lock.tryLock(500, TimeUnit.MILLISECONDS);
if (acquired) {
    try {
        doWork();
    } finally {
        lock.unlock();
    }
} else {
    log.warn("获取锁超时，跳过");
}
```

### 并行加载 + 汇总

```java
CountDownLatch latch = new CountDownLatch(3);
Map<String, Object> results = new ConcurrentHashMap<>();

executor.submit(() -> { results.put("user", loadUser()); latch.countDown(); });
executor.submit(() -> { results.put("order", loadOrders()); latch.countDown(); });
executor.submit(() -> { results.put("stock", loadStock()); latch.countDown(); });

latch.await(5, TimeUnit.SECONDS);
return buildResponse(results);
```

## 易错点 / 反例

### 1. unlock 不放在 finally

```java
lock.lock();
doWork(); // ❌ 如果抛异常，锁永远不释放
lock.unlock();
```

必须 `try-finally`，unlock 在 finally 里。

### 2. lock 写在 try 内部

```java
try {
    lock.lock(); // ❌ 如果 lock() 抛异常，finally 会 unlock 一个没获取的锁
    doWork();
} finally {
    lock.unlock();
}
```

`lock()` 应写在 `try` 之前。

### 3. CountDownLatch 忘记 countDown

```java
executor.submit(() -> {
    doWork(); // 如果抛异常，countDown 不会执行
    latch.countDown(); // ❌ 应放在 finally
});
```

countDown 应在 finally 中，否则异常导致主线程永远等待。

### 4. 读锁升级为写锁

```java
rwLock.readLock().lock();
// ...
rwLock.writeLock().lock(); // ❌ 死锁：写锁等读锁释放，但读锁在等写锁完成
```

需要先释放读锁再获取写锁。

### 5. 用 ReentrantLock 替代所有 synchronized

synchronized 足够简单且 JVM 持续优化（偏向锁、轻量级锁、锁消除）。只在需要 tryLock / Condition / 公平锁等高级特性时才用 ReentrantLock。

## 高频面试题（5 题）

- **Q1**: ReentrantLock 和 synchronized 有什么区别？
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  ReentrantLock 支持可中断获取（lockInterruptibly）、超时获取（tryLock）、公平锁、多 Condition 条件队列。synchronized 是关键字级别，JVM 自动释放锁，更简洁。两者都可重入。

  &lt;details&gt;

- **Q2**: 什么是 AQS？
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  AQS 是 JUC 锁和同步器的抽象基类。用 volatile state 表示同步状态，CLH 队列管理等待线程。ReentrantLock、CountDownLatch、Semaphore 等都基于 AQS。子类实现 tryAcquire/tryRelease 定义获取释放语义。

  &lt;details&gt;

- **Q3**: CountDownLatch 和 CyclicBarrier 的区别？
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  CountDownLatch 是一个线程等待 N 个线程完成，一次性不可重用。CyclicBarrier 是 N 个线程互相等待到齐后同时继续，可重用，支持到齐后的回调动作。

  &lt;details&gt;

- **Q4**: Semaphore 的作用和使用场景？
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  Semaphore 控制同时访问某个资源的线程数量。acquire 获取许可，release 释放许可。典型场景：连接池限流、接口并发控制、资源访问限制。

  &lt;details&gt;

- **Q5**: 公平锁和非公平锁的区别？
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  公平锁按等待顺序获取锁（FIFO），保证不会饥饿但吞吐量较低。非公平锁允许插队，吞吐量高但可能饥饿。ReentrantLock 默认非公平，构造参数 true 为公平。synchronized 是非公平的。

  &lt;details&gt;

## 延伸资源

- [ReentrantLock API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/locks/ReentrantLock.html)
- [CountDownLatch API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/CountDownLatch.html)
- [Semaphore API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/Semaphore.html)
- [AQS API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/locks/AbstractQueuedSynchronizer.html)

## (留白) 我的理解

> 这一段不强制填。

---

## Java 线程基础、synchronized 与锁机制

## TL;DR

> Java 通过 `Thread` / `Runnable` 创建线程，用 `synchronized` 实现互斥同步，用 `wait` / `notify` 实现线程协作。理解线程状态转换和锁机制是并发编程的基础。

## 背景与动机

单线程程序一次只做一件事。现实业务需要：

- Web 服务器同时处理多个请求
- 耗时 IO 不阻塞主流程
- 利用多核 CPU 并行计算

但多线程引入新问题：

- 共享数据竞争
- 执行顺序不确定
- 死锁
- 可见性和有序性

Java 从语言层面提供了 `synchronized`、`volatile`、`wait` / `notify` 等原语解决这些问题。

## 核心机制

### 创建线程的方式

继承 Thread：

```java
class MyThread extends Thread {
    @Override
    public void run() {
        System.out.println(Thread.currentThread().getName());
    }
}
new MyThread().start();
```

实现 Runnable（推荐）：

```java
new Thread(() -> {
    System.out.println(Thread.currentThread().getName());
}).start();
```

实现 Callable + FutureTask（需要返回值）：

```java
FutureTask&lt;Integer&gt; task = new FutureTask<>(() -> 42);
new Thread(task).start();
int result = task.get(); // 阻塞等待结果
```

实际开发中不直接 new Thread，而是使用线程池。

### 线程状态

Java 线程有 6 种状态（`Thread.State`）：

```text
NEW ──start()──> RUNNABLE ──完成/异常──> TERMINATED
                    ↕
              synchronized 竞争失败
                    ↓
                 BLOCKED ──获得锁──> RUNNABLE

RUNNABLE ──wait()/join()/park()──> WAITING
WAITING ──notify()/unpark()──> RUNNABLE

RUNNABLE ──sleep(t)/wait(t)/join(t)──> TIMED_WAITING
TIMED_WAITING ──超时/唤醒──> RUNNABLE
```

| 状态          | 含义                             |
| ------------- | -------------------------------- |
| NEW           | 创建未 start                     |
| RUNNABLE      | 就绪或运行中（Java 不区分）      |
| BLOCKED       | 等待获取 synchronized 锁         |
| WAITING       | 无限期等待（wait / join / park） |
| TIMED_WAITING | 有超时的等待                     |
| TERMINATED    | 运行结束                         |

### synchronized 关键字

synchronized 基于 Java 对象的 Monitor 机制实现互斥：

```java
// 同步方法 — 锁 this
public synchronized void add() {
    count++;
}

// 同步静态方法 — 锁 Class 对象
public static synchronized void addGlobal() {
    globalCount++;
}

// 同步代码块 — 锁指定对象
public void add() {
    synchronized (lock) {
        count++;
    }
}
```

关键点：

- 每个 Java 对象都关联一个 Monitor
- synchronized 进入时获取 Monitor，退出时释放
- 同一个 Monitor 同一时刻只有一个线程持有
- 可重入：同一线程可重复获取同一把锁

### 对象锁 vs 类锁

```java
class Demo {
    // 锁 this 对象
    synchronized void a() {}

    // 也锁 this 对象 — a 和 b 互斥
    synchronized void b() {}

    // 锁 Demo.class — 和 a/b 不互斥
    static synchronized void c() {}
}
```

不同实例的对象锁互不影响：

```java
Demo d1 = new Demo();
Demo d2 = new Demo();
// d1.a() 和 d2.a() 可以并行，因为锁的是不同对象
```

### wait / notify / notifyAll

这三个方法定义在 `Object` 类上，必须在 synchronized 块内调用：

```java
synchronized (lock) {
    while (!condition) {
        lock.wait(); // 释放锁并等待
    }
    // 条件满足，继续执行
}

synchronized (lock) {
    condition = true;
    lock.notifyAll(); // 唤醒所有等待线程
}
```

关键规则：

- `wait()` 释放当前持有的锁，线程进入 WAITING
- `notify()` 唤醒一个等待线程（不确定哪个）
- `notifyAll()` 唤醒所有等待线程（推荐）
- 被唤醒后需要重新竞争锁
- wait 条件检查必须用 `while` 而非 `if`（防止虚假唤醒）

### 生产者-消费者模型

```java
class BoundedQueue&lt;T&gt; {
    private final Queue&lt;T&gt; queue = new LinkedList<>();
    private final int capacity;
    private final Object lock = new Object();

    BoundedQueue(int capacity) { this.capacity = capacity; }

    void put(T item) throws InterruptedException {
        synchronized (lock) {
            while (queue.size() == capacity) {
                lock.wait();
            }
            queue.add(item);
            lock.notifyAll();
        }
    }

    T take() throws InterruptedException {
        synchronized (lock) {
            while (queue.isEmpty()) {
                lock.wait();
            }
            T item = queue.poll();
            lock.notifyAll();
            return item;
        }
    }
}
```

### 死锁

死锁的四个必要条件：

1. 互斥：资源同一时刻只能被一个线程持有
2. 持有并等待：线程持有一个锁的同时等待另一个锁
3. 不可剥夺：锁只能由持有者释放
4. 循环等待：线程之间形成环形锁依赖

经典死锁：

```java
Object lockA = new Object();
Object lockB = new Object();

// 线程 1
synchronized (lockA) {
    Thread.sleep(100);
    synchronized (lockB) { /* ... */ }
}

// 线程 2
synchronized (lockB) {
    Thread.sleep(100);
    synchronized (lockA) { /* ... */ }
}
```

避免死锁：

- 固定加锁顺序
- 使用 `tryLock` 超时机制（ReentrantLock）
- 减小锁粒度和持有时间

排查死锁：

```bash
jstack &lt;pid&gt;     # 输出线程堆栈，包含死锁检测
jcmd &lt;pid&gt; Thread.print
```

### Thread 常用方法

| 方法                     | 说明                   |
| ------------------------ | ---------------------- |
| `start()`                | 启动线程               |
| `sleep(ms)`              | 当前线程休眠，不释放锁 |
| `join()`                 | 等待目标线程结束       |
| `interrupt()`            | 设置中断标志           |
| `isInterrupted()`        | 检查中断标志           |
| `Thread.currentThread()` | 获取当前线程           |
| `setDaemon(true)`        | 设为守护线程           |

中断机制：

```java
Thread t = new Thread(() -> {
    while (!Thread.currentThread().isInterrupted()) {
        try {
            Thread.sleep(1000);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt(); // 恢复中断标志
            break;
        }
    }
});
```

## 代码示例

### 安全计数器

```java
class SafeCounter {
    private int count;

    public synchronized void increment() {
        count++;
    }

    public synchronized int getCount() {
        return count;
    }
}
```

### join 等待多线程完成

```java
List&lt;Thread&gt; threads = new ArrayList<>();
for (int i = 0; i < 5; i++) {
    Thread t = new Thread(() -> doWork());
    threads.add(t);
    t.start();
}
for (Thread t : threads) {
    t.join();
}
```

## 易错点 / 反例

### 1. start 和 run 混淆

```java
new Thread(() -> doWork()).run();  // ❌ 在当前线程执行，没有启动新线程
new Thread(() -> doWork()).start(); // ✅ 启动新线程
```

### 2. sleep 不释放锁

```java
synchronized (lock) {
    Thread.sleep(5000); // 持有锁 5 秒，其他线程全部阻塞
}
```

sleep 不释放锁，wait 才释放。

### 3. wait 条件用 if 而不是 while

```java
synchronized (lock) {
    if (queue.isEmpty()) { // ❌ 被唤醒后不会再检查条件
        lock.wait();
    }
}
```

虚假唤醒或多消费者场景下条件可能已被其他线程消费。必须用 while。

### 4. 在非同步块中调用 wait/notify

```java
lock.wait(); // ❌ IllegalMonitorStateException
```

必须先 `synchronized(lock)` 再调用。

### 5. 用 stop() 停止线程

`Thread.stop()` 已废弃，会导致锁突然释放、数据不一致。应使用中断机制或标志位优雅退出。

### 6. 对 String 常量加锁

```java
synchronized ("lock") { } // ❌ 字符串常量池共享，不同代码可能锁同一个对象
```

应使用 `private final Object lock = new Object()`。

## 高频面试题（5 题）

- **Q1**: Java 创建线程有几种方式？
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  本质只有一种：new Thread。但提供任务的方式有多种：继承 Thread 重写 run、实现 Runnable、实现 Callable + FutureTask、线程池提交。推荐 Runnable / Callable + 线程池，避免直接 new Thread。

  &lt;details&gt;

- **Q2**: sleep 和 wait 有什么区别？
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  sleep 是 Thread 的静态方法，不释放锁，指定时间后自动恢复。wait 是 Object 的方法，必须在 synchronized 块内调用，释放锁，需要 notify/notifyAll 唤醒。

  &lt;details&gt;

- **Q3**: synchronized 锁的是什么？
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  synchronized 锁的是对象的 Monitor。普通方法锁 this，静态方法锁 Class 对象，同步块锁指定对象。同一个 Monitor 同一时刻只有一个线程持有，支持可重入。

  &lt;details&gt;

- **Q4**: 什么是死锁？如何避免？
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  死锁是多个线程互相等待对方持有的锁，四个必要条件：互斥、持有并等待、不可剥夺、循环等待。避免方法：固定加锁顺序、使用 tryLock 超时、减小锁粒度。用 jstack 排查。

  &lt;details&gt;

- **Q5**: 为什么 wait 要在 while 循环里？
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  因为存在虚假唤醒（spurious wakeup），线程可能在条件不满足时被唤醒。多消费者场景下也可能被其他线程先消费。while 循环保证唤醒后再次检查条件，if 只检查一次不安全。

  &lt;details&gt;

## 延伸资源

- [Thread API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Thread.html)
- [Object.wait API](<https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Object.html#wait()>)
- [JLS Chapter 17: Threads and Locks](https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html)

## (留白) 我的理解

> 这一段不强制填。

---

## 线程池原理与 CompletableFuture

## TL;DR

> `ThreadPoolExecutor` 通过线程复用避免频繁创建销毁开销，核心参数包括核心线程数、最大线程数、队列和拒绝策略。`CompletableFuture` 提供链式异步编排能力，是现代 Java 异步编程的首选。

## 背景与动机

每次 new Thread 的问题：

- 线程创建销毁有操作系统开销
- 无限创建线程可能导致 OOM
- 没有统一管理和监控
- 无法复用线程

线程池解决这些问题：预先创建一组线程，任务提交后复用线程执行。

同时，多个异步任务的编排（A 完成后执行 B、A 和 B 都完成后合并结果）用 Future.get() 很笨拙，CompletableFuture 提供了流式 API。

## 核心机制

### ThreadPoolExecutor 核心参数

```java
ThreadPoolExecutor executor = new ThreadPoolExecutor(
    corePoolSize,      // 核心线程数（常驻）
    maximumPoolSize,   // 最大线程数
    keepAliveTime,     // 非核心线程空闲存活时间
    TimeUnit.SECONDS,
    workQueue,         // 任务队列
    threadFactory,     // 线程工厂
    rejectedHandler    // 拒绝策略
);
```

### 任务提交流程

```text
提交任务
  │
  ├─ 当前线程数 < corePoolSize → 创建核心线程执行
  │
  ├─ 核心线程满 → 放入 workQueue
  │
  ├─ 队列满 + 当前线程数 < maximumPoolSize → 创建非核心线程执行
  │
  └─ 队列满 + 线程数 = maximumPoolSize → 执行拒绝策略
```

注意：先入队再扩线程，不是先扩线程再入队。

### 常用队列

| 队列                  | 特点                                                         |
| --------------------- | ------------------------------------------------------------ |
| `LinkedBlockingQueue` | 无界（默认 Integer.MAX），核心线程满后全入队，最大线程数失效 |
| `ArrayBlockingQueue`  | 有界，满了才创建非核心线程                                   |
| `SynchronousQueue`    | 不存储任务，直接交给线程，没有空闲线程就创建新的             |

### 拒绝策略

| 策略                  | 行为                                  |
| --------------------- | ------------------------------------- |
| `AbortPolicy`         | 抛 RejectedExecutionException（默认） |
| `CallerRunsPolicy`    | 提交线程自己执行（有背压效果）        |
| `DiscardPolicy`       | 静默丢弃                              |
| `DiscardOldestPolicy` | 丢弃队列头部最旧任务                  |

### 为什么不用 Executors

Executors 提供的快捷方法有坑：

```java
// ❌ 无界队列，任务堆积可能 OOM
Executors.newFixedThreadPool(10);    // LinkedBlockingQueue(Integer.MAX)

// ❌ 最大线程数 Integer.MAX，可能创建过多线程
Executors.newCachedThreadPool();     // SynchronousQueue + maxPool=Integer.MAX

// ❌ 单线程 + 无界队列
Executors.newSingleThreadExecutor();
```

阿里巴巴开发规范推荐手动创建 ThreadPoolExecutor，明确每个参数。

### 线程池大小估算

经验公式：

- **CPU 密集型**：线程数 ≈ CPU 核��� + 1
- **IO 密集型**：线程数 ≈ CPU 核数 × 2（或更多，取决于 IO 等待比例）

实际需要压测调优，公式只是起点。

### 线程池关闭

```java
executor.shutdown();        // 不接受新任务，等待已提交任务完成
executor.shutdownNow();     // 尝试中断正在执行的任务，返回未执行的任务

// 优雅关闭模式
executor.shutdown();
if (!executor.awaitTermination(60, TimeUnit.SECONDS)) {
    executor.shutdownNow();
}
```

### CompletableFuture 基础

创建异步任务：

```java
// 无返回值
CompletableFuture&lt;Void&gt; cf = CompletableFuture.runAsync(() -> doWork());

// 有返回值
CompletableFuture&lt;User&gt; cf = CompletableFuture.supplyAsync(() -> loadUser(id));

// 指定线程池（推荐）
CompletableFuture&lt;User&gt; cf = CompletableFuture.supplyAsync(
    () -> loadUser(id), executor
);
```

### 链式编排

```java
CompletableFuture.supplyAsync(() -> loadUser(id))
    .thenApply(user -> user.getName())          // 同步转换
    .thenApplyAsync(name -> enrich(name))       // 异步转换
    .thenAccept(result -> save(result))         // 消费结果
    .exceptionally(ex -> {                      // 异常处理
        log.error("失败", ex);
        return null;
    });
```

常用方法：

| 方法             | 作用                   |
| ---------------- | ---------------------- |
| `thenApply`      | 同步转换结果           |
| `thenApplyAsync` | 异步转换结果           |
| `thenAccept`     | 消费结果，无返回       |
| `thenCompose`    | 扁平化（类似 flatMap） |
| `thenCombine`    | 合并两个独立结果       |
| `exceptionally`  | 异常回退               |
| `handle`         | 无论成功失败都处理     |
| `whenComplete`   | 完成时回调             |

### 多任务组合

等待全部完成：

```java
CompletableFuture&lt;User&gt; userCf = CompletableFuture.supplyAsync(() -> loadUser(id));
CompletableFuture<List&lt;Order&gt;> orderCf = CompletableFuture.supplyAsync(() -> loadOrders(id));
CompletableFuture&lt;Integer&gt; scoreCf = CompletableFuture.supplyAsync(() -> loadScore(id));

CompletableFuture.allOf(userCf, orderCf, scoreCf).join();

User user = userCf.join();
List&lt;Order&gt; orders = orderCf.join();
```

任一完成：

```java
CompletableFuture&lt;Object&gt; any = CompletableFuture.anyOf(cf1, cf2, cf3);
```

合并两个结果：

```java
userCf.thenCombine(orderCf, (user, orders) -> {
    return new UserProfile(user, orders);
});
```

### ForkJoinPool

CompletableFuture 默认使用 `ForkJoinPool.commonPool()`：

- 线程数默认 = CPU 核数 - 1
- 所有未指定线程池的 CompletableFuture 共享
- IO 密集任务可能阻塞公共池

建议：IO 任务显式传自定义线程池，不要依赖 commonPool。

## 代码示例

### 手动创建线程池

```java
ThreadPoolExecutor executor = new ThreadPoolExecutor(
    4,                                    // 核心线程
    8,                                    // 最大线程
    60, TimeUnit.SECONDS,                 // 空闲存活
    new ArrayBlockingQueue<>(100),        // 有界队列
    new ThreadPoolExecutor.CallerRunsPolicy() // 拒绝策略
);
```

### 异步编排：加载用户主页

```java
CompletableFuture&lt;UserProfile&gt; profileCf = CompletableFuture
    .supplyAsync(() -> userService.getUser(id), executor)
    .thenCombine(
        CompletableFuture.supplyAsync(() -> orderService.getOrders(id), executor),
        (user, orders) -> new UserProfile(user, orders)
    )
    .exceptionally(ex -> {
        log.error("加载用户主页失败", ex);
        return UserProfile.empty();
    });
```

### 超时控制

```java
CompletableFuture&lt;String&gt; cf = CompletableFuture
    .supplyAsync(() -> slowService.call())
    .orTimeout(3, TimeUnit.SECONDS)           // JDK 9+
    .exceptionally(ex -> "fallback");
```

## 易错点 / 反例

### 1. 使用 Executors 快捷方法

```java
ExecutorService pool = Executors.newFixedThreadPool(10); // ❌ 无界队列
```

任务堆积导致内存溢出。手动创建 ThreadPoolExecutor 并指定有界队列。

### 2. 不指定线程池给 CompletableFuture

```java
CompletableFuture.supplyAsync(() -> blockingIO()); // ❌ 用 commonPool，可能阻塞其他任务
```

IO 密集任务应传自定义线程池。

### 3. 忘记处理 CompletableFuture 异常

```java
CompletableFuture.supplyAsync(() -> riskyCall())
    .thenApply(r -> process(r)); // ❌ 异常被吞掉
```

必须加 `exceptionally` 或 `handle`，否则异常被静默吞掉。

### 4. 混淆 thenApply 和 thenCompose

```java
// thenApply: T -> U
cf.thenApply(user -> user.getName()); // CompletableFuture&lt;String&gt;

// thenCompose: T -> CompletableFuture&lt;U&gt;（扁平化）
cf.thenCompose(user -> loadOrders(user.getId())); // CompletableFuture<List&lt;Order&gt;>
```

如果 mapping 函数返回 CompletableFuture，用 thenCompose 避免嵌套。

### 5. shutdown 后继续提交任务

```java
executor.shutdown();
executor.submit(() -> doWork()); // ❌ RejectedExecutionException
```

### 6. 核心线程数设置过大

核心线程常驻不销毁。设置 100 个核心线程但任务量少，浪费资源。核心线程数应基于实际并发量和任务类型设置。

## 高频面试题（5 题）

- **Q1**: 线程池的核心参数和工作流程？
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  核心参数：corePoolSize、maximumPoolSize、keepAliveTime、workQueue、rejectedHandler。流程：任务提交 → 核心线程未满则创建核心线程 → 满则入队 → 队列满则创建非核心线程 → 最大线程数也满则执行拒绝策略。

  &lt;details&gt;

- **Q2**: 为什么不推荐使用 Executors？
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  newFixedThreadPool 和 newSingleThreadExecutor 使用无界 LinkedBlockingQueue，任务堆积可能 OOM。newCachedThreadPool 最大线程数为 Integer.MAX，可能创建过多线程。推荐手动创建 ThreadPoolExecutor 明确参数。

  &lt;details&gt;

- **Q3**: 线程池的拒绝策略有哪些？
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  AbortPolicy 抛异常（默认）、CallerRunsPolicy 调用者线程执行（有背压效果）、DiscardPolicy 静默丢弃、DiscardOldestPolicy 丢弃队列最旧任务。也可以自定义 RejectedExecutionHandler。

  &lt;details&gt;

- **Q4**: CompletableFuture 和 Future 的区别？
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  Future 只能 get() 阻塞等待结果，无法链式编排。CompletableFuture 支持 thenApply/thenCompose/thenCombine 链式异步编排，支持异常处理（exceptionally/handle），支持多任务组合（allOf/anyOf），支持超时（orTimeout）。

  &lt;details&gt;

- **Q5**: CompletableFuture 默认用什么线程池？有什么问题？
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  默认使用 ForkJoinPool.commonPool()，线程数 = CPU 核数 - 1。问题：所有未指定线程池的 CompletableFuture 共享这个池，IO 密集任务会阻塞公共池影响其他任务。建议 IO 任务显式传自定义线程池。

  &lt;details&gt;

## 延伸资源

- [ThreadPoolExecutor API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/ThreadPoolExecutor.html)
- [CompletableFuture API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/CompletableFuture.html)
- [Executors API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/Executors.html)

## (留白) 我的理解

> 这一段不强制填。

<!-- KNOWLEDGE-IMPORT:END -->
