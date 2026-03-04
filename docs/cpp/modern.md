# Lambda / 现代 C++ 特性

## Lambda 表达式

```cpp
// 基本语法：[捕获列表](参数列表) -> 返回类型 { 函数体 }
auto add = [](int a, int b) -> int { return a + b; };
auto square = [](int x) { return x * x; };  // 返回类型可推导

// 捕获列表
int base = 10;
auto addBase = [base](int x) { return x + base; };    // 值捕获（拷贝）
auto addRef  = [&base](int x) { return x + base; };   // 引用捕获
auto all     = [=](int x) { return x + base; };       // 捕获所有（值）
auto allRef  = [&](int x) { return x + base; };       // 捕获所有（引用）
auto mixed   = [base, &base](int x) { /* ... */ };    // 混合

// 捕获 this（成员函数中的 lambda）
class MyClass {
    int value_ = 42;
    void method() {
        auto fn = [this]() { return value_; };        // 捕获 this 指针
        auto fn2 = [*this]() { return value_; };      // 捕获 this 的拷贝（C++17）
    }
};

// mutable lambda（值捕获默认 const，mutable 解除）
int count = 0;
auto counter = [count]() mutable { return ++count; }; // 修改的是捕获的副本

// std::function（存储任意可调用对象）
#include <functional>
std::function<int(int, int)> fn = [](int a, int b) { return a + b; };
fn = std::plus<int>{};  // 也可以存函数对象
```

---

## 现代 C++ 特性

```cpp
// auto 类型推导
auto x = 42;
auto it = vec.begin();
auto [key, val] = map_entry;  // 结构化绑定（C++17）

// range-for
for (const auto& item : container) { }
for (auto& [key, value] : myMap) { }  // C++17

// nullptr（类型安全的空指针，替代 NULL/0）
int* p = nullptr;
if (p == nullptr) { }

// constexpr（编译时常量/计算）
constexpr int SIZE = 1024;
constexpr int factorial(int n) {
    return n <= 1 ? 1 : n * factorial(n - 1);
}
constexpr int f5 = factorial(5);  // 编译时计算，不占运行时

// 类型别名（using 比 typedef 更清晰）
using StringList = std::vector<std::string>;
using Callback = std::function<void(int, std::string)>;
// 模板别名（typedef 做不到）
template <typename T>
using Matrix = std::vector<std::vector<T>>;

// if constexpr（编译时条件，替代特化技巧）
template <typename T>
void print(T val) {
    if constexpr (std::is_integral_v<T>)
        std::cout << "int: " << val;
    else
        std::cout << "other: " << val;
}
```
