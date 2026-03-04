# 编译工具链

## 编译工具链

```bash
# g++ 常用选项
g++ -std=c++17 -Wall -Wextra -o program main.cpp
g++ -std=c++20 -O2 -o program main.cpp         # 发布模式
g++ -g -O0 -fsanitize=address -o program main.cpp  # 调试 + ASan
g++ -std=c++17 -c utils.cpp -o utils.o          # 只编译不链接

# 头文件组织最佳实践
# ✅ foo.h：声明（类定义、函数原型、inline/template 实现）
# ✅ foo.cpp：非模板函数的实现
# ✅ 头文件加 #pragma once
# ✅ 头文件只包含必要的其他头文件（减少编译依赖）
```

```cmake
# CMakeLists.txt 基础
cmake_minimum_required(VERSION 3.16)
project(MyProject CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# 可执行文件
add_executable(my_app
    src/main.cpp
    src/utils.cpp
)

# 静态库
add_library(mylib STATIC
    src/lib.cpp
)

# 链接库
target_link_libraries(my_app PRIVATE mylib)

# 包含目录
target_include_directories(my_app PRIVATE include)

# 编译选项
target_compile_options(my_app PRIVATE -Wall -Wextra)
```

```bash
# CMake 构建流程
mkdir build && cd build
cmake ..              # 生成构建文件
cmake --build .       # 编译（等价于 make）
cmake --build . --target clean  # 清理

# 或用 Ninja（更快）
cmake -G Ninja ..
ninja
```
