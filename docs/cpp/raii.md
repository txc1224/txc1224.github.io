# RAII / 智能指针

## RAII & 智能指针

```cpp
#include <memory>

// ✅ 避免裸 new/delete，使用智能指针

// unique_ptr：独占所有权（零开销）
auto uptr = std::make_unique<Dog>("Rex", 3);
uptr->speak();
// uptr2 = uptr;  // ❌ 编译错误，不可复制
auto uptr2 = std::move(uptr);  // ✅ 转移所有权，uptr 变为 null

// shared_ptr：共享所有权（引用计数）
auto sptr1 = std::make_shared<Dog>("Buddy", 2);
auto sptr2 = sptr1;  // 引用计数 +1
sptr1.use_count();   // 2
// 最后一个 shared_ptr 销毁时自动 delete

// weak_ptr：弱引用（不影响引用计数，防止循环引用）
std::weak_ptr<Dog> wptr = sptr1;
if (auto locked = wptr.lock()) {  // 尝试获取 shared_ptr
    locked->speak();
}

// RAII 模式
class FileHandle {
    FILE* fp_;
public:
    explicit FileHandle(const char* path, const char* mode)
        : fp_(fopen(path, mode)) {
        if (!fp_) throw std::runtime_error("Failed to open file");
    }
    ~FileHandle() { if (fp_) fclose(fp_); }
    // 禁止拷贝
    FileHandle(const FileHandle&) = delete;
    FileHandle& operator=(const FileHandle&) = delete;
    FILE* get() { return fp_; }
};
```
