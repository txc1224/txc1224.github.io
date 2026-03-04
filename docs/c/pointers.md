# 指针

## 指针

```c
// 声明、赋值、解引用
int x = 42;
int *ptr = &x;   // ptr 存储 x 的地址
*ptr = 100;      // 通过指针修改 x，x 变为 100

// 指针与数组（数组名是首元素的地址）
int arr[5] = {1, 2, 3, 4, 5};
int *p = arr;           // 等价于 &arr[0]
*(p + 2) == arr[2];     // true，两种写法等价
p[3] == *(p + 3);       // true

// 指针算术（单位是元素大小）
p++;        // 移动 sizeof(int) 字节
p += 2;     // 移动 2 * sizeof(int) 字节

// ⚠️ 指针 vs 数组的关键区别
int arr[5];
int *ptr = arr;
sizeof(arr)  // 20（5 * 4，整个数组大小）
sizeof(ptr)  // 8（指针大小，64位系统）

// 函数指针
int add(int a, int b) { return a + b; }
int (*fp)(int, int) = add;  // 声明函数指针
int result = fp(3, 4);      // 7

// 函数指针数组（策略模式）
int (*ops[4])(int, int) = {add, sub, mul, div};
ops[0](3, 4);  // 调用 add

// const 与指针
const int *p;       // 指向常量的指针（不能修改 *p）
int * const p;      // 常量指针（不能修改 p 自身）
const int * const p; // 两者都不能修改

// void 指针（通用指针，需要强转才能使用）
void *generic = malloc(10);
int *iptr = (int *)generic;
```
