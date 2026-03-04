# 模板 / STL 容器

## 模板

```cpp
// 函数模板
template <typename T>
T max_val(T a, T b) { return a > b ? a : b; }

max_val(3, 4);        // T = int（自动推导）
max_val(3.0, 4.0);    // T = double
max_val<std::string>("abc", "xyz"); // 显式指定

// 类模板
template <typename T, size_t N>
class Array {
    T data_[N];
public:
    T& operator[](size_t i) { return data_[i]; }
    size_t size() const { return N; }
    T* begin() { return data_; }
    T* end() { return data_ + N; }
};

Array<int, 10> arr;

// 模板特化（为特定类型提供不同实现）
template <>
bool max_val<bool>(bool a, bool b) { return a || b; }

// 概念约束（C++20）
template <typename T>
    requires std::integral<T> || std::floating_point<T>
T square(T x) { return x * x; }
```

---

## STL 容器速查

```cpp
#include <vector>
#include <list>
#include <map>
#include <unordered_map>
#include <set>
#include <queue>
#include <stack>
#include <deque>

// vector（动态数组，连续内存，最常用）
std::vector<int> v = {1, 2, 3};
v.push_back(4);
v.emplace_back(5);        // 原地构造，避免拷贝
v.reserve(100);            // 预分配容量
v.size() / v.capacity()
v.front() / v.back()
v.erase(v.begin() + 2)    // 删除第3个元素 O(n)

// map（红黑树，按键有序，O(log n)）
std::map<std::string, int> m;
m["key"] = 1;
m.count("key")            // 0 或 1
m.find("key") != m.end()  // 是否存在
m.emplace("key2", 2);     // 高效插入

// unordered_map（哈希表，平均 O(1)，无序）
std::unordered_map<std::string, int> um;
um.reserve(100);           // 预分配桶数量，减少 rehash
um.max_load_factor(0.5);   // 降低负载因子，减少冲突

// priority_queue（堆，默认最大堆）
std::priority_queue<int> maxHeap;  // 大顶堆
std::priority_queue<int, std::vector<int>, std::greater<int>> minHeap; // 小顶堆
maxHeap.push(3);
maxHeap.top();   // 最大值
maxHeap.pop();

// deque（双端队列，两端 O(1)）
std::deque<int> dq;
dq.push_front(0);
dq.push_back(1);

// 容器选型
// vector：默认选择（缓存友好）
// list：频繁中间插入删除（但缓存不友好，慎用）
// deque：两端频繁操作
// map/set：需要有序
// unordered_map/set：不需要有序，追求性能
```
