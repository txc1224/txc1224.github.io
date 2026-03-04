# 结构体 / 字符串

## 结构体与联合体

```c
// struct：成员各自独立存储
typedef struct {
    char   name[32];
    int    age;
    double salary;
} Employee;

Employee emp = {"Alice", 30, 50000.0};
Employee *eptr = &emp;
eptr->age = 31;           // 指针访问用 ->
emp.salary = 55000.0;     // 直接访问用 .

// 内存对齐（结构体大小 >= 所有成员大小之和）
struct Padded {
    char  a;    // 1字节
    // 3字节填充
    int   b;    // 4字节
    char  c;    // 1字节
    // 3字节填充
};              // sizeof = 12（不是6）

// 紧凑排列以减少填充
struct Compact {
    int   b;    // 4字节
    char  a;    // 1字节
    char  c;    // 1字节
    // 2字节填充
};              // sizeof = 8（不是12）

// union：所有成员共享同一块内存（大小 = 最大成员的大小）
union Data {
    int   i;
    float f;
    char  bytes[4];
};
union Data d;
d.i = 0x41424344;
printf("%c\n", d.bytes[0]);  // 字节视角查看数据

// 位字段（压缩存储标志位）
typedef struct {
    unsigned int active   : 1;  // 1位
    unsigned int level    : 4;  // 4位（0-15）
    unsigned int priority : 3;  // 3位（0-7）
} Flags;  // 共8位，sizeof = 4（对齐到 int）
```

---

## 字符串

```c
#include <string.h>

// 字符数组（可修改）
char str[32] = "Hello";
str[0] = 'h';  // ✅ 合法

// 字符串字面量指针（只读）
const char *s = "World";
// s[0] = 'w'; // ❌ 段错误（字面量存在只读段）

// 常用 string.h 函数
strlen(s)                   // 长度（不含 \0）
strcpy(dst, src)            // 复制（⚠️ 不检查长度）
strncpy(dst, src, n)        // 安全复制（确保 \0）
strcat(dst, src)            // 追加（⚠️ 不检查长度）
strncat(dst, src, n)        // 安全追加
strcmp(a, b)                // 比较（0相等，<0 a小，>0 a大）
strncmp(a, b, n)            // 前n字节比较
strchr(s, 'c')              // 查找字符，返回指针
strstr(haystack, needle)    // 查找子串，返回指针
sprintf(buf, "%d-%s", n, s) // 格式化到缓冲区
snprintf(buf, size, ...)    // ✅ 安全版本（限制长度）

// ⚠️ 陷阱：strncpy 不保证 \0 结尾
strncpy(dst, src, n);
dst[n-1] = '\0';  // 手动确保结尾
```
