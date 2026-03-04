# 多线程 / JVM

## 多线程基础

```java
// Thread / Runnable
Thread t = new Thread(() -> System.out.println("Hello from thread"));
t.start();

// synchronized（内置锁）
class Counter {
    private int count = 0;

    public synchronized void increment() { count++; } // 方法锁
    public void decrement() {
        synchronized (this) { count--; }              // 代码块锁
    }
}

// volatile（保证可见性，禁止指令重排，不保证原子性）
private volatile boolean running = true;

// ThreadLocal（线程私有变量）
private static final ThreadLocal<SimpleDateFormat> SDF =
    ThreadLocal.withInitial(() -> new SimpleDateFormat("yyyy-MM-dd"));
// ⚠️ 线程池环境必须 remove()，否则内存泄漏
SDF.remove();

// ExecutorService（推荐用线程池而非直接 new Thread）
ExecutorService executor = Executors.newFixedThreadPool(4);
Future<Integer> future = executor.submit(() -> compute());
Integer result = future.get(5, TimeUnit.SECONDS); // 超时抛异常
executor.shutdown();

// CompletableFuture（异步编排）
CompletableFuture.supplyAsync(() -> fetchUser(id))
    .thenApply(user -> enrichData(user))
    .thenAccept(data -> save(data))
    .exceptionally(e -> { log.error("Error", e); return null; });
```

---

## JVM 简述

```
┌─────────────────────────────────────────┐
│                 JVM 内存                 │
├────────────┬────────────────────────────┤
│   方法区    │ 类信息、常量、静态变量、JIT代码 │
│  (元空间)   │（Java 8+ 移到本地内存）      │
├────────────┼────────────────────────────┤
│    堆      │ 对象实例（GC 管理的区域）       │
│            │ 年轻代（Eden + Survivor x2）  │
│            │ 老年代（长期存活对象）          │
├────────────┼────────────────────────────┤
│   栈(线程) │ 栈帧（局部变量表、操作数栈）     │
├────────────┼────────────────────────────┤
│ 程序计数器  │ 当前线程执行行号               │
└────────────┴────────────────────────────┘
```

```
GC 基础：
- Minor GC：清理年轻代（Eden 满触发），速度快
- Major/Full GC：清理老年代（甚至整个堆），STW 更长
- 常用 GC：G1（Java 9+ 默认）、ZGC（低延迟）、Parallel GC（吞吐量）

类加载机制（双亲委派）：
BootstrapClassLoader → ExtClassLoader → AppClassLoader
  先让父类加载器尝试，都失败才自己加载（防止核心类被替换）
```
