---
title: '异常体系'
order: 5
---

# 异常处理

> Java 异常体系分为 Error 和 Exception，正确使用异常机制是写出健壮代码的关键。

---

## 异常体系

```
Throwable
├── Error（JVM 系统级错误，通常不需要捕获）
│   ├── OutOfMemoryError
│   ├── StackOverflowError
│   └── NoClassDefFoundError
└── Exception
    ├── RuntimeException（Unchecked，无需强制处理）
    │   ├── NullPointerException
    │   ├── IllegalArgumentException
    │   ├── IllegalStateException
    │   ├── IndexOutOfBoundsException
    │   ├── ClassCastException
    │   └── UnsupportedOperationException
    └── Checked Exception（必须 try-catch 或 throws 声明）
        ├── IOException
        ├── SQLException
        ├── ClassNotFoundException
        └── InterruptedException
```

---

## Checked vs Unchecked 对比

| 特性        | Checked Exception          | Unchecked Exception     |
| ----------- | -------------------------- | ----------------------- |
| 父类        | `Exception`                | `RuntimeException`      |
| 编译检查    | 必须处理或声明 throws      | 无需强制处理            |
| 典型场景    | 外部资源失败（IO/网络/DB） | 编程错误（空指针/越界） |
| 是否可恢复  | 通常可恢复                 | 通常不可恢复            |
| Spring 事务 | 默认**不**回滚             | 默认回滚                |
| 设计理念    | 强制调用方处理             | 由程序员避免            |

---

## try-with-resources

```java
// ✅ Java 7+ 自动关闭资源（实现 AutoCloseable 接口）
try (Connection conn = dataSource.getConnection();
     PreparedStatement ps = conn.prepareStatement(sql);
     ResultSet rs = ps.executeQuery()) {

    while (rs.next()) {
        // 处理结果
    }
} catch (SQLException e) {
    log.error("查询失败: {}", sql, e);
    throw new BusinessException("DB_QUERY_ERROR", e);
}
// conn、ps、rs 自动关闭，即使抛出异常
// 关闭顺序：与声明顺序相反（rs → ps → conn）
```

---

## 自定义异常

```java
// 业务异常基类（Unchecked，让调用方决定是否处理）
public class BusinessException extends RuntimeException {
    private final String code;    // 错误码

    public BusinessException(String code, String message) {
        super(message);
        this.code = code;
    }

    public BusinessException(String code, String message, Throwable cause) {
        super(message, cause);
        this.code = code;
    }

    public String getCode() { return code; }
}

// 具体业务异常
public class OrderNotFoundException extends BusinessException {
    public OrderNotFoundException(Long orderId) {
        super("ORDER_NOT_FOUND", "订单不存在: " + orderId);
    }
}
```

---

## 异常处理最佳实践

| 原则               | 说明                                      |
| ------------------ | ----------------------------------------- |
| 不要吞异常         | 空 catch 块是最大的恶，至少记录日志       |
| 优先用具体异常     | catch 的异常类型越具体越好                |
| 保留原始异常链     | `new XxxException(msg, cause)` 传入 cause |
| 不要用异常控制流程 | 异常是异常情况，不是 if-else 替代品       |
| 尽早失败           | 参数校验放在方法入口，快速抛出            |
| 统一异常处理       | Spring 用 `@ControllerAdvice` 全局处理    |

```java
// Spring Boot 全局异常处理器
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<Result<?>> handleBusiness(BusinessException e) {
        log.warn("业务异常: code={}, msg={}", e.getCode(), e.getMessage());
        return ResponseEntity.badRequest()
            .body(Result.fail(e.getCode(), e.getMessage()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Result<?>> handleUnknown(Exception e) {
        log.error("未知异常", e);  // 未知异常必须记录完整堆栈
        return ResponseEntity.internalServerError()
            .body(Result.fail("INTERNAL_ERROR", "系统异常，请稍后重试"));
    }
}
```

---

## 常见陷阱

```java
// ❌ 吞掉异常：出了问题完全无法排查
try {
    riskyOperation();
} catch (Exception e) {
    // 什么都不做
}

// ✅ 至少记录日志，或转换后重新抛出
try {
    riskyOperation();
} catch (Exception e) {
    log.error("操作失败", e);
    throw new BusinessException("OP_FAILED", "操作失败", e);
}
```

```java
// ❌ finally 中 return 会吞掉异常
public int getValue() {
    try {
        throw new RuntimeException("出错了");
    } finally {
        return 42;  // 异常被吞掉，调用方永远不知道出了错
    }
}

// ✅ finally 只做清理工作，不要 return
```

```java
// ❌ 用异常控制流程（性能差，语义不清）
try {
    int value = Integer.parseInt(input);
} catch (NumberFormatException e) {
    value = 0;  // 把异常当 if-else 用
}

// ✅ 提前校验
if (input != null && input.matches("\\d+")) {
    int value = Integer.parseInt(input);
}
```

```java
// ❌ catch 了 Exception 但没有区分处理
try {
    readFile();
} catch (Exception e) {  // 一锅端
    log.error("失败", e);
}

// ✅ 分类处理，具体异常具体对待
try {
    readFile();
} catch (FileNotFoundException e) {
    log.warn("文件不存在: {}", e.getMessage());
} catch (IOException e) {
    log.error("IO 异常", e);
    throw new BusinessException("IO_ERROR", "读取文件失败", e);
}
```
