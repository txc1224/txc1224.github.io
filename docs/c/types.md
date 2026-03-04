# 数据类型与运算符

## 基本数据类型与运算符

```c
#include <stdio.h>
#include <stdint.h>  // 固定宽度整型（推荐）

// 固定宽度整型（跨平台一致）
int8_t   a;   // 8位有符号
uint8_t  b;   // 8位无符号
int16_t  c;
int32_t  d;
int64_t  e;

// sizeof 运算符（编译时求值）
printf("%zu\n", sizeof(int));    // 通常 4（平台相关）
printf("%zu\n", sizeof(long));   // 4（32位）或 8（64位）
printf("%zu\n", sizeof(char));   // 始终 1

// 类型转换
int i = 3;
double d = (double)i / 2;    // 1.5（显式转换）
int result = i / 2;          // 1（整数除法截断）

// 位运算
int flags = 0;
flags |= (1 << 2);    // 设置第2位
flags &= ~(1 << 2);   // 清除第2位
flags ^= (1 << 2);    // 翻转第2位
int isSet = (flags >> 2) & 1; // 读取第2位

// ⚠️ 有符号整数溢出是未定义行为（UB）
// ✅ 无符号整数溢出有明确定义（模运算）
```
