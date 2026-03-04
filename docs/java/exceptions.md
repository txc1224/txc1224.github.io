# 异常体系

```
Throwable
├── Error（系统级错误，不需要处理：OOM、StackOverflow）
└── Exception
    ├── RuntimeException（Unchecked，无需声明 throws）
    │   ├── NullPointerException
    │   ├── IllegalArgumentException
    │   ├── IndexOutOfBoundsException
    │   └── ClassCastException
    └── Checked Exception（必须处理或声明 throws）
        ├── IOException
        ├── SQLException
        └── ...
```

```java
// 自定义异常
public class BusinessException extends RuntimeException {
    private final String code;

    public BusinessException(String message, String code) {
        super(message);
        this.code = code;
    }

    public BusinessException(String message, String code, Throwable cause) {
        super(message, cause);
        this.code = code;
    }
}

// try-with-resources（自动关闭，实现 AutoCloseable）
try (Connection conn = dataSource.getConnection();
     PreparedStatement ps = conn.prepareStatement(sql)) {
    // 使用资源
} catch (SQLException e) {
    throw new BusinessException("DB error", "DB_ERR", e);
}
// conn 和 ps 自动 close()，即使抛出异常
```
