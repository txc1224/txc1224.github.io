# 文件IO / 预处理器

## 文件 I/O

```c
#include <stdio.h>

FILE *fp = fopen("data.txt", "r");  // 打开文件
if (fp == NULL) { perror("fopen"); return -1; }

// 模式：r 读 / w 写（覆盖）/ a 追加 / b 二进制 / + 读写

// 文本文件读写
char line[256];
while (fgets(line, sizeof(line), fp)) {
    printf("%s", line);
}

fprintf(fp, "Name: %s, Age: %d\n", name, age);

// 二进制文件读写
size_t n = fread(buf, sizeof(int), count, fp);
size_t w = fwrite(buf, sizeof(int), count, fp);

// 随机访问
fseek(fp, 0, SEEK_SET);   // 移到开头
fseek(fp, -10, SEEK_END); // 从末尾回退10字节
long pos = ftell(fp);     // 当前位置
rewind(fp);               // 等价于 fseek(fp, 0, SEEK_SET)

fclose(fp);  // ⚠️ 必须关闭，否则内存泄漏和数据未刷新
```

---

## 预处理器

```c
// 宏定义（无类型安全，谨慎使用）
#define PI 3.14159265358979
#define MAX(a, b) ((a) > (b) ? (a) : (b))  // ✅ 加括号防止运算符优先级问题
#define SQUARE(x) ((x) * (x))

// ⚠️ SQUARE(x++) 会对 x++ 求值两次！
// ✅ 现代 C 优先用 inline 函数代替函数宏
static inline int max(int a, int b) { return a > b ? a : b; }

// 头文件保护（防止重复包含）
#ifndef MY_HEADER_H
#define MY_HEADER_H
// 头文件内容...
#endif

// #pragma once（现代等效方案，非标准但广泛支持）
#pragma once

// 条件编译
#ifdef DEBUG
    #define LOG(fmt, ...) fprintf(stderr, "[DEBUG] " fmt "\n", ##__VA_ARGS__)
#else
    #define LOG(fmt, ...) /* 空操作 */
#endif

#if defined(__linux__)
    #include <sys/socket.h>
#elif defined(_WIN32)
    #include <winsock2.h>
#endif
```
