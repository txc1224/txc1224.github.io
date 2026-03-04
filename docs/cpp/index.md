# C++ 核心知识

> 现代 C++ 备忘（C++11/14/17/20）—— 面向有 C/Java 基础的开发者。

## C++ vs C 核心差异

```cpp
// 引用（别名，不可为 null，不可重绑定）
int x = 42;
int& ref = x;   // ref 是 x 的别名
ref = 100;      // x 变为 100
int* p = &ref;  // 取 ref 的地址，得到 x 的地址

// 默认参数
void connect(std::string host, int port = 3306, bool ssl = false);

// 函数重载（同名不同参数）
int add(int a, int b) { return a + b; }
double add(double a, double b) { return a + b; }
std::string add(std::string a, std::string b) { return a + b; }

// 内联函数（建议编译器内联，避免函数调用开销）
inline int square(int x) { return x * x; }

// std::string（相比 C 的字符数组）
#include <string>
std::string s = "Hello";
s += " World";
s.length();
s.substr(0, 5);
s.find("World");
```

---

## 目录

- [面向对象](./oop)
- [RAII / 智能指针](./raii)
- [模板 / STL 容器](./templates)
- [STL 算法 / 移动语义](./stl)
- [Lambda / 现代 C++ 特性](./modern)
- [编译工具链](./toolchain)
