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
