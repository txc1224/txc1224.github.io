# STL 算法 / 移动语义

## STL 算法

```cpp
#include <algorithm>
#include <numeric>

std::vector<int> v = {5, 3, 1, 4, 2};

// 排序
std::sort(v.begin(), v.end());                          // 升序
std::sort(v.begin(), v.end(), std::greater<int>());     // 降序
std::sort(v.begin(), v.end(), [](int a, int b) { return a > b; }); // 自定义

// 查找
auto it = std::find(v.begin(), v.end(), 3);
auto it2 = std::find_if(v.begin(), v.end(), [](int x) { return x > 3; });
bool exists = std::binary_search(v.begin(), v.end(), 3); // 有序数组

// 变换
std::vector<int> result;
std::transform(v.begin(), v.end(), std::back_inserter(result),
               [](int x) { return x * 2; });

// 过滤（copy_if）
std::vector<int> evens;
std::copy_if(v.begin(), v.end(), std::back_inserter(evens),
             [](int x) { return x % 2 == 0; });

// 聚合
int sum = std::accumulate(v.begin(), v.end(), 0);
int product = std::accumulate(v.begin(), v.end(), 1, std::multiplies<int>());

// 其他常用
std::for_each(v.begin(), v.end(), [](int& x) { x *= 2; });
std::reverse(v.begin(), v.end());
std::unique(v.begin(), v.end()); // 去除相邻重复（先 sort）
std::count_if(v.begin(), v.end(), [](int x) { return x > 3; });
auto [min, max] = std::minmax_element(v.begin(), v.end());
```

---

## 移动语义

```cpp
// 右值引用（&&）：绑定到临时对象
std::string&& rref = std::string("hello"); // 右值引用

// std::move：将左值转为右值（允许移动）
std::vector<int> a = {1, 2, 3};
std::vector<int> b = std::move(a);  // a 的资源转移给 b，a 变为空
// ⚠️ move 后 a 处于"有效但未指定状态"，不应再使用 a 的内容

// 移动构造 / 移动赋值（接管资源，不拷贝）
class Buffer {
    char* data_;
    size_t size_;
public:
    Buffer(size_t size) : data_(new char[size]), size_(size) {}
    ~Buffer() { delete[] data_; }

    // 移动构造：接管 other 的资源
    Buffer(Buffer&& other) noexcept
        : data_(other.data_), size_(other.size_) {
        other.data_ = nullptr;  // 防止 other 析构时 double free
        other.size_ = 0;
    }

    // 移动赋值
    Buffer& operator=(Buffer&& other) noexcept {
        if (this != &other) {
            delete[] data_;
            data_ = other.data_;
            size_ = other.size_;
            other.data_ = nullptr;
            other.size_ = 0;
        }
        return *this;
    }
};

// 完美转发（保持参数的值类别）
template <typename T>
void wrapper(T&& arg) {
    target(std::forward<T>(arg));  // 左值传左值，右值传右值
}
```
