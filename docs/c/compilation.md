# 编译链接 / 常见陷阱

## 编译链接过程

```
源代码 (.c)
    │
    ▼ 预处理（gcc -E）
展开宏/头文件 (.i)
    │
    ▼ 编译（gcc -S）
汇编代码 (.s)
    │
    ▼ 汇编（gcc -c）
目标文件 (.o)
    │
    ▼ 链接（gcc）
可执行文件 / 库文件
```

```bash
# 常用 gcc 选项
gcc -Wall -Wextra -o program file.c   # 启用所有警告
gcc -g -O0 -o program file.c         # 调试模式（含调试信息，不优化）
gcc -O2 -o program file.c            # 发布模式（优化）
gcc -std=c11 -o program file.c       # 指定 C 标准
gcc -fsanitize=address file.c        # AddressSanitizer（检测内存错误）
gcc -fsanitize=undefined file.c      # UBSan（检测未定义行为）

# 分步编译
gcc -c file1.c -o file1.o
gcc -c file2.c -o file2.o
gcc file1.o file2.o -o program

# 生成静态库 / 动态库
ar rcs libfoo.a file1.o file2.o               # 静态库
gcc -shared -fPIC -o libfoo.so file1.o        # 动态库
```

---

## 常见陷阱

```c
// ❌ 未初始化变量（包含随机值）
int x;
printf("%d\n", x);  // 未定义行为

// ❌ 数组越界（UB，可能崩溃或静默数据损坏）
int arr[5];
arr[5] = 10;  // 越界写入

// ❌ 整型溢出（有符号整数，UB）
int max = INT_MAX;
int overflow = max + 1;  // 未定义行为（可能变成负数）
// ✅ 先检查再运算
if (max > INT_MAX - 1) { /* 处理溢出 */ }

// ❌ 返回局部变量的地址（栈帧销毁后地址无效）
int *bad() {
    int local = 42;
    return &local;  // ❌ 悬挂指针
}

// ❌ 比较指针和整数
if (str == "hello") { }  // 比较地址，不是内容！
// ✅ 用 strcmp
if (strcmp(str, "hello") == 0) { }

// ❌ scanf 缓冲区溢出
char buf[32];
scanf("%s", buf);       // ❌ 没有长度限制
scanf("%31s", buf);     // ✅ 限制长度（31 = 32 - 1）
```
