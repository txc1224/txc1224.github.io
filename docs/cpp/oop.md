# 面向对象

## 面向对象

```cpp
#include <iostream>

class Animal {
private:
    std::string name_;

protected:
    int age_;

public:
    // 构造函数（成员初始化列表，比在函数体赋值更高效）
    Animal(std::string name, int age)
        : name_(std::move(name)), age_(age) {}

    // 虚析构函数（基类必须声明虚析构，否则派生类析构不被调用）
    virtual ~Animal() = default;

    // 纯虚函数（使类变为抽象类）
    virtual std::string speak() const = 0;

    // 普通虚函数（可有默认实现）
    virtual std::string describe() const {
        return name_ + " is " + std::to_string(age_) + " years old";
    }

    // 访问器（const 方法不修改对象）
    const std::string& name() const { return name_; }
};

class Dog : public Animal {
public:
    Dog(std::string name, int age) : Animal(std::move(name), age) {}

    std::string speak() const override { return "Woof!"; }  // override 关键字（检查是否覆盖了虚函数）
};

// 拷贝构造 / 拷贝赋值 / 移动构造 / 移动赋值 / 析构（Big Five）
class MyClass {
public:
    MyClass() = default;                        // 默认构造
    MyClass(const MyClass&) = default;          // 拷贝构造
    MyClass& operator=(const MyClass&) = default; // 拷贝赋值
    MyClass(MyClass&&) noexcept = default;      // 移动构造
    MyClass& operator=(MyClass&&) noexcept = default; // 移动赋值
    ~MyClass() = default;                       // 析构
};

// 运算符重载
struct Vector2D {
    double x, y;
    Vector2D operator+(const Vector2D& other) const {
        return {x + other.x, y + other.y};
    }
    Vector2D& operator+=(const Vector2D& other) {
        x += other.x; y += other.y; return *this;
    }
    bool operator==(const Vector2D& other) const {
        return x == other.x && y == other.y;
    }
    // 流输出
    friend std::ostream& operator<<(std::ostream& os, const Vector2D& v) {
        return os << "(" << v.x << ", " << v.y << ")";
    }
};
```
