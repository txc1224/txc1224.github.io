# 内存管理

## 内存管理

```c
#include <stdlib.h>
#include <string.h>

// malloc：分配未初始化内存
int *arr = (int *)malloc(10 * sizeof(int));
if (arr == NULL) { /* 处理分配失败 */ }

// calloc：分配并清零
int *arr = (int *)calloc(10, sizeof(int));

// realloc：重新分配（可扩大/缩小）
int *bigger = (int *)realloc(arr, 20 * sizeof(int));
if (bigger == NULL) {
    free(arr);  // realloc 失败，原指针仍有效，必须手动释放
    return -1;
}
arr = bigger;

// free：释放内存
free(arr);
arr = NULL;  // ✅ 良好习惯：避免悬挂指针

// ⚠️ 常见错误
// 1. 内存泄漏：忘记 free
// 2. 双重释放（double free）：free 后再次 free（UB）
// 3. 悬挂指针（dangling pointer）：free 后继续访问
// 4. 缓冲区溢出：写入超出分配大小

// 内存操作函数
memset(arr, 0, 10 * sizeof(int));          // 清零
memcpy(dst, src, n);                       // 内存复制（不重叠）
memmove(dst, src, n);                      // 安全复制（可重叠）
memcmp(a, b, n);                           // 内存比较
```
