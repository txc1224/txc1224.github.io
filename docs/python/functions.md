---
title: '函数 / 推导式'
order: 3
---

# 函数 / 推导式

> 函数是 Python 的一等公民，掌握参数机制、装饰器、生成器和推导式是写出 Pythonic 代码的基础。

---

## 参数类型对比表

| 参数类型   | 语法              | 说明                       | 示例          |
| ---------- | ----------------- | -------------------------- | ------------- |
| 位置参数   | `def f(a, b)`     | 按位置传入                 | `f(1, 2)`     |
| 默认参数   | `def f(a, b=10)`  | 有默认值，可省略           | `f(1)`        |
| 关键字参数 | `def f(*, key)`   | `*` 之后强制关键字传入     | `f(key=1)`    |
| 仅位置参数 | `def f(a, /)`     | `/` 之前强制位置传入(3.8+) | `f(1)`        |
| 可变位置   | `def f(*args)`    | 收集为 tuple               | `f(1, 2, 3)`  |
| 可变关键字 | `def f(**kwargs)` | 收集为 dict                | `f(a=1, b=2)` |

```python
# 完整参数顺序：位置 → 默认 → *args → 关键字 → **kwargs
def example(a, b=10, *args, key='default', **kwargs):
    pass

# 仅位置 + 仅关键字
def strict(pos_only, /, normal, *, kw_only):
    pass

strict(1, 2, kw_only=3)       # 正确
strict(pos_only=1, ...)       # TypeError
```

---

## 装饰器

```python
import functools, time

# 基本装饰器
def timer(func):
    @functools.wraps(func)     # 保留原函数的 __name__、__doc__
    def wrapper(*args, **kwargs):
        start = time.perf_counter()
        result = func(*args, **kwargs)
        print(f'{func.__name__} 耗时 {time.perf_counter() - start:.3f}s')
        return result
    return wrapper

# 带参数装饰器（三层嵌套）
def retry(times=3, exceptions=(Exception,)):
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            for i in range(times):
                try:
                    return func(*args, **kwargs)
                except exceptions:
                    if i == times - 1: raise
        return wrapper
    return decorator

@timer
@retry(times=5, exceptions=(ConnectionError,))
def fetch_data(url): ...

# 类装饰器
class Singleton:
    def __init__(self, cls):
        self._cls = cls
        self._instance = None
    def __call__(self, *args, **kwargs):
        if self._instance is None:
            self._instance = self._cls(*args, **kwargs)
        return self._instance

@Singleton
class Database:
    def __init__(self, url): self.url = url
```

---

## 生成器

```python
# 基本生成器 —— yield 逐个产出值
def countdown(n):
    while n > 0:
        yield n
        n -= 1
list(countdown(5))  # [5, 4, 3, 2, 1]

# yield from —— 委托给子生成器
def flatten(nested):
    for item in nested:
        if isinstance(item, list):
            yield from flatten(item)  # 递归展平
        else:
            yield item
list(flatten([1, [2, [3, 4]], 5]))  # [1, 2, 3, 4, 5]

# send —— 向生成器发送值
def accumulator():
    total = 0
    while True:
        value = yield total    # yield 返回 total，接收 send 的值
        if value is None: break
        total += value

gen = accumulator()
next(gen)        # 0（启动生成器）
gen.send(10)     # 10
gen.send(20)     # 30
```

---

## lambda 表达式

```python
# 适用于简短的匿名函数
square = lambda x: x ** 2

# 排序时指定 key
users = [{'name': 'Bob', 'age': 25}, {'name': 'Alice', 'age': 30}]
users.sort(key=lambda u: u['age'])

# 搭配 map / filter
list(map(lambda x: x * 2, [1, 2, 3]))       # [2, 4, 6]
list(filter(lambda x: x > 0, [-1, 0, 1]))   # [1]
```

> 复杂逻辑不要用 lambda，定义具名函数更清晰。

---

## 推导式对比

| 类型         | 语法               | 返回类型    | 惰性求值 |
| ------------ | ------------------ | ----------- | -------- |
| 列表推导式   | `[x for x in ...]` | `list`      | 否       |
| 字典推导式   | `{k: v for ...}`   | `dict`      | 否       |
| ��合推导式   | `{x for x in ...}` | `set`       | 否       |
| 生成器表达式 | `(x for x in ...)` | `generator` | 是       |

```python
# 列表推导式
squares = [x**2 for x in range(10)]
evens = [x for x in range(20) if x % 2 == 0]

# 嵌套推导式（展平二维列表）
matrix = [[1, 2, 3], [4, 5, 6]]
flat = [x for row in matrix for x in row]  # [1,2,3,4,5,6]

# 字典 / 集合推导式
d = {k: v for k, v in zip('abc', [1, 2, 3])}
s = {x % 3 for x in range(10)}  # {0, 1, 2}

# 生成器表达式（大数据集节省内存）
total = sum(x**2 for x in range(10**6))  # 不创建中间列表
```

---

## 常见陷阱

```python
# ❌ 可变默认参数：默认值在定义时创建，所有调用共享
def add(item, lst=[]):
    lst.append(item)
    return lst
add(1)  # [1]
add(2)  # [1, 2] —— 不是 [2]！

# ✅ 用 None 作为哨兵
def add(item, lst=None):
    if lst is None: lst = []
    lst.append(item)
    return lst

# ❌ 闭包陷阱：循环变量绑定的是引用
funcs = [lambda: i for i in range(3)]
[f() for f in funcs]  # [2, 2, 2]

# ✅ 用默认参数捕获当前值
funcs = [lambda i=i: i for i in range(3)]
[f() for f in funcs]  # [0, 1, 2]
```

<!-- KNOWLEDGE-IMPORT:START -->

## 包管理对比(pip / venv / poetry / uv)

## TL;DR

> pip 装包、venv 隔离环境、poetry/uv 管依赖并锁定版本;uv 用 Rust 重写,最快。

## 背景与动机

Python 项目最大的工程痛点是「在我机器上能跑」。根源有两个:一是**全局环境污染**——所有项目共用一个 site-packages,版本互相打架;二是**依赖不可复现**——`requests` 装的是哪天解析出的版本没人说得清。于是演化出一条工具链:用虚拟环境(venv)做隔离,用 pip 做安装,用 poetry/uv 在更高层做依赖解析、锁定与项目管理。理解它们的职责边界,才能按场景选型而不是盲目跟风。

## 核心机制

这四者不是互斥替代,而是**分层协作**:

- **venv**(PEP 405,标准库):只解决「隔离」。创建独立目录,内含 Python 解释器符号链接和独立的 site-packages,通过 `pyvenv.cfg` 让解释器找到自己的包路径。它不管装什么、也不管版本。
- **pip**:只解决「安装」。从 PyPI 下载 wheel/sdist 并装进当前环境。配合 `requirements.txt` 记录依赖,但它是**平铺快照**,不区分直接/间接依赖,也不做真正的依赖解析锁(早期版本甚至连冲突检测都弱)。
- **poetry**:解决「项目管理 + 锁定」。以 `pyproject.toml`(PEP 621)为唯一事实源,声明顶层依赖(如 `requests = "^2.31"`),由解析器算出兼容的完整依赖树,写入 `poetry.lock` 锁定每一个包的精确版本与哈希,保证任何机器装出完全一致的环境。
- **uv**(Astral 出品,Rust 编写):定位是「更快的 pip + venv + 部分 poetry」。它接口兼容 pip(`uv pip install`),但解析器和下载用 Rust 重写并带全局缓存,速度常快 10-100 倍;同时 `uv venv`、`uv lock`、`uv run` 又覆盖了环境创建与锁定。它的快来自三点:并行下载、依赖元数据缓存、用同一份已下载的包做硬链接而非重复拷贝。

一句话记忆:**venv 管隔离,pip 管安装,poetry/uv 管「声明 + 解析 + 锁定」整个生命周期,uv 是这条路线上当前最快的实现。**

## 代码示例

```bash
# 1. venv + pip(标准库,零依赖,适合脚本/学习)
python -m venv .venv          # 创建隔离环境
source .venv/bin/activate     # 激活(Windows: .venv\Scripts\activate)
pip install requests==2.31.0  # 安装并手动钉版本
pip freeze > requirements.txt # 导出平铺快照(含间接依赖)

# 2. uv(现代工作流,接口兼容 pip 但更快)
uv venv                       # 创建 .venv(自动选新解释器)
uv pip install requests       # 兼容 pip 语法,速度极快
# 或项目管理式:
uv init myproj                # 生成 pyproject.toml
uv add requests               # 声明依赖并写入 uv.lock(锁定)
uv run python main.py         # 在受管环境中运行,免手动 activate
```

## 易错点 / 反例

- **把 `pip freeze` 当依赖声明**:`freeze` 会把所有间接依赖平铺导出,你无法区分「我直接要的」和「顺带装上的」,升级时容易连带破坏。应只声明顶层依赖,交给 lock 文件记录全量。
- **全局 `pip install` 污染系统 Python**:
  ```bash
  # 错误:直接装进系统/全局环境
  pip install django
  # 新版 pip 会直接拒绝(externally-managed-environment, PEP 668)
  # 正确:先建 venv 再装
  ```
- **激活错环境**:开了多个 venv 后忘了 `deactivate`,导致包装进 A 环境却在 B 环境运行,报 `ModuleNotFoundError`。用 `which python` 确认当前解释器路径。
- **requirements.txt 不钉版本**:写 `requests` 不写 `requests==2.31.0`,半年后重装解析到新主版本,API 变更直接炸。lock 文件存在的意义就是消除这种不确定性。
- **混用多套工具**:同一项目既用 poetry 又用 pip 手装,`poetry.lock` 与实际环境漂移,锁定形同虚设。一个项目只选一个「事实源」工具。

## 高频面试题(5 题)

- **Q1**: venv 的原理是什么?它是怎么实现隔离的?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - venv 不是复制整个 Python,而是创建一个目录,内含指向系统解释器的符号链接(或副本)、`pyvenv.cfg` 配置文件、独立的 `site-packages` 和 `bin/activate` 脚本
  - 激活的本质是修改 `PATH`,把 venv 的 `bin` 目录提到最前,让 `python`/`pip` 指向 venv 内副本
  - 解释器启动时根据 `pyvenv.cfg` 定位自己的 `site-packages`,从而只看见本环境装的包,实现隔离
  - 隔离的是「包路径」,不隔离解释器本身的 bug 或 C 库;要换 Python 版本得用 pyenv/uv 装新解释器

  &lt;details&gt;

- **Q2**: requirements.txt 和 poetry.lock / uv.lock 有什么本质区别?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - requirements.txt 通常是 `pip freeze` 的平铺快照,不区分直接依赖和间接依赖,也不一定带哈希
  - lock 文件由解析器生成,记录完整依赖树中**每个包的精确版本 + 内容哈希**,可校验完整性防篡改
  - pyproject.toml 声明的是「约束范围」(如 `^2.31`),lock 固定的是「解析结果」(如 `2.31.0`),两者配合实现可复现
  - lock 文件能跨机器、跨时间装出比特级一致的环境,requirements.txt 在不钉版本时做不到

  &lt;details&gt;

- **Q3**: uv 为什么比 pip 快这么多?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - 用 Rust 重写了解析器和下载器,无 Python 启动开销,且能多线程并行下载
  - 维护全局缓存:同一版本的包只下载一次,多项目共享,后续安装直接用缓存
  - 用硬链接(hardlink)/写时复制把缓存的包「链接」进环境,而非逐文件拷贝,几乎零 IO
  - 依赖解析算法(pubgrub)高效,且元数据可缓存,不必每次都重新请求 PyPI

  &lt;details&gt;

- **Q4**: poetry 的 `^2.31.0` 和 `~2.31.0` 有什么区别?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - `^`(caret)允许「不破坏兼容性」的更新:`^2.31.0` 等价于 `>=2.31.0, <3.0.0`,可升到次版本和补丁
  - `~`(tilde)只允许补丁级更新:`~2.31.0` 等价于 `>=2.31.0, <2.32.0`,只能升补丁
  - 注意 `^` 对 0.x 版本更保守:`^0.2.3` 只允许 `>=0.2.3, <0.3.0`,因为 0.x 次版本号视为破坏性
  - 语义化版本(SemVer)约定主版本号变更代表不兼容,这是 caret 规则背后的依据

  &lt;details&gt;

- **Q5**: 团队协作/生产部署时,应该提交 lock 文件吗?为什么?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - 应该提交。lock 文件是「可复现环境」的唯一保证,所有人都装出完全一致的依赖树
  - 应用(application)必须提交 lock,确保 CI、测试、生产环境一致,避免「我本地好好的」
  - CI 中应用 `poetry install` / `uv sync`(默认读 lock),而不是重新解析,保证部署的就是测过的版本
  - 库(library)通常也建议提交 lock 用于 CI 测试,但发布到 PyPI 时只暴露 pyproject 里的宽松约束,不强制下游用 lock

  &lt;details&gt;

## 延伸资源

- [venv 官方文档](https://docs.python.org/3/library/venv.html)
- [PEP 621 – pyproject.toml 元数据](https://peps.python.org/pep-0621/)
- [uv 官方文档(Astral)](https://docs.astral.sh/uv/)
- [Poetry 官方文档](https://python-poetry.org/docs/)
- [Python Packaging User Guide](https://packaging.python.org/)

## (留白) 我的理解

> 这一段不强制填。学完后用自己的话复述、记下踩过的坑、和其他知识的连接。AI 写不出这段。

---

## pre-commit 与 CI 集成

## TL;DR

> pre-commit 在 `git commit` 时自动跑 lint/format/测试;CI(GitHub Actions 等)在 push/PR 时再做一边,保证永远不会把脏代码推上主分支。

## 背景与动机

代码质量问题分两种:**本地的**(忘了跑测试就提交)和**协作的**(别人合并了不干净的代码)。pre-commit 解决前者 —— 每次 commit 前自动运行你指定的检查;CI(GitHub Actions / GitLab CI)解决后者 —— 每次 push 或 PR 在干净环境重跑全套。两者组合就是「人写代码、机器守门」的开发流水线。

工程价值:新人第一天配置好 pre-commit,之后代码格式、import 排序、静态检查都自动执行,Review 只关注逻辑,不再花时间指出「这里缺了空行」「import 没排序」。

## 核心机制

- **pre-commit 框架**:一个 YAML 配置(`.pre-commit-config.yaml`)声明哪些 hook(ruff/black/mypy/pre-commit-hooks 等)。`pre-commit install` 后,每次 `git commit` 都会按配置运行,任一 hook 失败则 commit 中断。
- **hook 类型**:本地 hook(`entry: ruff`)和远程 repo hook(`repo: https://github.com/pre-commit/pre-commit-hooks`)。Python 项目常用:trailing-whitespace(去末尾空格)、end-of-file-fixer(补末尾换行)、ruff、mypy。
- **CI(GitHub Actions 为例)**:在 `.github/workflows/ci.yml` 声明触发条件(on: [push, pull_request]),`steps:` 里跑 `pip install` + `ruff check` + `pytest` 等。与 pre-commit 互补:CI 在服务器跑,防止有人跳过 pre-commit;CI 还能跑 pre-commit 跑不了的重活(integration test、build deploy)。

## 代码示例

```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v5.0.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
  - repo: https://github.com/astral-sh/ruff-pre-commit
    rev: v0.9.0
    hooks:
      - id: ruff # lint
      - id: ruff-format # format
```

## 易错点 / 反例

- **`git commit --no-verify` 跳过 pre-commit**:可以绕过,所以 CI 必须有(防人绕过)。
- **pre-commit hook 太慢**:每个 commit 都跑 mypy、全套测试会让人不想提交。把重活留给 CI,pre-commit 只做轻量检查(ruff check + format, ≤3s)。
- **pre-commit 版本锁住不升级**:建议 renovate/dependabot 自动提 PR 升级 `rev:`。

## 高频面试题(5 题)

- **Q1**: pre-commit 和 CI 有什么区别,为什么两个都要?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - pre-commit 在本地 commit 前跑,快速拦截,但可以被绕过(`--no-verify`)
  - CI 在服务器上 push/PR 时跑,不可绕过,且能跑重活(集成测试/构建)
  - 两者互补:pre-commit 让开发者尽早发现,CI 保证最终质量
    &lt;details&gt;

- **Q2**: 怎么在项目中配置 pre-commit?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - 写 `.pre-commit-config.yaml`,声明 hooks
  - `pip install pre-commit && pre-commit install` 激活
  - 每次 commit 自动跑,`pre-commit run --all-files` 手动全量跑
    &lt;details&gt;

- **Q3**: 为什么 ci 要用 GitHub Actions 而不是手跑脚本?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - 自动化:每 push/PR 自动触发,零人为遗忘
  - 标准化:执行环境干净一致,输出可追溯
  - 与 Code Review 集成:失败时 PR 标红,阻止合并
    &lt;details&gt;

- **Q4**: pre-commit hook 一直失败,我急着提交怎么办?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - 修掉 hook 报的问题(通常是 lint/format),修复后再提交
  - 真不行用 `git commit --no-verify`,但 CI 会拦住你
  - 不要在团队仓库里频繁跳过 pre-commit
    &lt;details&gt;

- **Q5**: pre-commit 和 ruff 怎么配合最高效?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - 用 `ruff-pre-commit` 的两个 hook: `ruff`(lint) + `ruff-format`(format)
  - pre-commit 配置里这两个 hook 排在末尾,前面放 whitespace/merge-conflict 基础检查
  - 可以再加 `mypy`(单独一个 hook),但注意 pre-commit 跑 mypy 可能较慢
    &lt;details&gt;

## 延伸资源

- [pre-commit 官方文档](https://pre-commit.com/)
- [ruff pre-commit 集成](https://docs.astral.sh/ruff/integrations/#pre-commit)
- [GitHub Actions 文档](https://docs.github.com/en/actions)

## (留白) 我的理解

> 这一段不强制填。学完后用自己的话复述、记下踩过的坑、和其他知识的连接。AI 写不出这段。

---

## pyproject.toml 与打包发布到 PyPI

## TL;DR

> pyproject.toml 声明元数据,build 打出 sdist/wheel,twine 上传到 PyPI。

## 背景与动机

写好一个库只是第一步,让别人 `pip install yourpkg` 才算交付。早期 Python 用 `setup.py` 打包——它本质是可执行脚本,带来两个麻烦:构建前要 import 它就先得装好它的依赖(鸡生蛋),而且元数据散落在代码里不利于工具静态读取。PEP 517/518/621 三件套把这件事彻底「声明化」:构建配置、构建后端、项目元数据全部收敛到一个静态的 `pyproject.toml`,任何工具不用执行 Python 就能读出包名、版本、依赖。理解这条链路(声明 → 构建 → 上传)是把库推向社区的必修课。

## 核心机制

三个 PEP 各司其职,合起来定义了现代打包:

- **PEP 518**:引入 `pyproject.toml` 的 `[build-system]` 表,声明「构建这个包需要什么」。关键是 `requires`(构建时依赖,如 `hatchling`)和 `build-backend`(用哪个后端来构建)。这让 pip 能在隔离环境里先装好构建工具,再去构建你的包。
- **PEP 517**:定义了构建后端的**标准接口**(`build_wheel` / `build_sdist` 等钩子)。由此前端(pip/build)可以用统一方式调用任意后端(setuptools、hatchling、flit-core、pdm-backend),`setup.py` 不再是必需品。
- **PEP 621**:规定 `[project]` 表里放**静态元数据**——`name`、`version`、`dependencies`、`requires-python`、`authors`、`license` 等。元数据声明化后,PyPI、IDE、依赖解析器都能直接读取。

**构建产物有两种**:

- **sdist**(source distribution,`.tar.gz`):源码归档,安装时需现场构建。
- **wheel**(`.whl`,PEP 427):预构建的二进制格式,本质是 zip,解压即用,无需执行构建,**安装更快更安全**,是发布的推荐格式。

发布链路:`pyproject.toml` 声明 → `python -m build` 调用后端产出 `dist/*.tar.gz` 和 `dist/*.whl` → `twine upload dist/*` 通过 HTTPS 安全上传到 PyPI(twine 取代了不安全的 `setup.py upload`)。

## 代码示例

```toml
# pyproject.toml(PEP 518 + 621,以 hatchling 为后端)
[build-system]
requires = ["hatchling"]          # PEP 518:构建时依赖
build-backend = "hatchling.build" # PEP 517:构建后端入口

[project]                         # PEP 621:静态元数据
name = "mydemo-pkg"
version = "0.1.0"
description = "A minimal demo package"
requires-python = ">=3.9"
dependencies = ["requests>=2.31"] # 运行期依赖(宽松约束)
authors = [{ name = "橙子", email = "cheng@example.com" }]

[project.urls]
Homepage = "https://github.com/cheng/mydemo-pkg"
```

```bash
# 构建 + 发布(需 pip install build twine)
python -m build                 # 产出 dist/*.tar.gz 和 dist/*.whl
twine check dist/*              # 校验元数据是否会被 PyPI 接受
twine upload -r testpypi dist/* # 先发到测试站 TestPyPI 演练
twine upload dist/*             # 正式发布到 PyPI(用 API token 认证)
```

## 易错点 / 反例

- **version 写死又忘改**:发布 0.1.0 后改了代码却忘 bump version,PyPI 拒绝同版本重复上传(`File already exists`)。PyPI 的版本号**一经发布不可覆盖**,只能升版本号重发。
- **包名与导入名混淆**:`pyproject` 里的 `name` 是**发行名**(`pip install` 用的,如 `mydemo-pkg`),而代码目录名是**导入名**(`import` 用的,如 `mydemo`),两者可以不同。常犯的错误是目录结构和 `name` 对不上导致 wheel 里没打到代码。
- **依赖约束写死**:
  ```toml
  # 错误:库依赖钉死精确版本,会和下游环境冲突
  dependencies = ["requests==2.31.0"]
  # 正确:库用宽松下界约束,把精确锁定交给应用层的 lock 文件
  dependencies = ["requests>=2.31"]
  ```
- **还在用 `python setup.py sdist upload`**:已废弃。`setup.py upload` 走 HTTP 明文且不安全,应用 `python -m build` + `twine`。
- **LICENSE / README 缺失**:`long_description`(PyPI 项目页)默认读 README,缺了页面空白;没 `license` 字段会让企业用户不敢用。发布前用 `twine check` 提前发现。

## 高频面试题(5 题)

- **Q1**: sdist 和 wheel 有什么区别?为什么推荐发 wheel?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - sdist 是源码归档(`.tar.gz`),安装时需在用户机器上执行一次构建(调用 build backend)
  - wheel 是预构建格式(`.whl`,PEP 427),本质是带元数据的 zip,解压拷贝即用,不执行任何构建代码
  - wheel 安装更快(跳过构建)、更安全(不运行 setup 逻辑)、且纯 Python 的 wheel 是跨平台通用的(py3-none-any)
  - 含 C 扩展的包要按平台分别构建 wheel;只发 sdist 会强迫用户本地装编译器,体验差

  &lt;details&gt;

- **Q2**: PEP 517/518/621 各自解决了什么问题?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - PEP 518:引入 `pyproject.toml` 的 `[build-system]`,声明构建依赖和构建后端,解决「构建前要先装构建工具」的鸡生蛋问题
  - PEP 517:定义构建后端的标准接口(`build_wheel`/`build_sdist`),让 pip 能统一调用 setuptools/hatchling 等任意后端,摆脱对 setup.py 的强依赖
  - PEP 621:规定 `[project]` 表放静态元数据(name/version/dependencies),让工具无需执行 Python 即可读取包信息
  - 三者合力把打包从「可执行脚本(setup.py)」转向「声明式配置(pyproject.toml)」

  &lt;details&gt;

- **Q3**: build backend(构建后端)是什么?常见的有哪些?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - 构建后端是真正实现「把源码变成 sdist/wheel」的工具,通过 PEP 517 定义的钩子被前端调用
  - 常见后端:setuptools(老牌默认)、hatchling(现代、零配置)、flit-core(纯 Python 极简)、pdm-backend、maturin(Rust 扩展)、setuptools-rust
  - 在 `[build-system]` 的 `requires` 声明后端包、`build-backend` 指定入口对象
  - 前端(pip、build)与后端解耦,换后端只需改 pyproject,不用改构建命令

  &lt;details&gt;

- **Q4**: 为什么发布到 PyPI 用 twine 而不是 `setup.py upload`?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - `setup.py upload` 已废弃,曾走不安全的连接,且要先执行 setup.py 代码,有安全风险
  - twine 只负责「上传已有产物」,全程 HTTPS,认证用 API token(而非账号密码),更安全
  - twine 支持上传前 `twine check` 校验元数据,能提前发现 README 渲染失败等问题
  - twine 可先传 `-r testpypi` 到测试站演练,验证无误再发正式 PyPI

  &lt;details&gt;

- **Q5**: 库(library)的依赖约束应该怎么写?和应用(application)有何不同?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - 库要被无数下游项目依赖,约束应**宽松**,只写必要的下界(`requests>=2.31`),避免和下游环境冲突
  - 库若钉死精确版本(`==`),下游一旦需要别的版本就会产生无法调和的依赖冲突(diamond dependency)
  - 应用是最终交付物,应**精确锁定**(用 poetry.lock/uv.lock),保证部署环境可复现
  - 一句话:库写「范围」给兼容性,应用写「锁定」给确定性;lock 文件只在应用侧生效,不随库发布

  &lt;details&gt;

## 延伸资源

- [PEP 621 – pyproject.toml 元数据](https://peps.python.org/pep-0621/)
- [PEP 517 – 构建后端接口](https://peps.python.org/pep-0517/)
- [PEP 518 – 构建系统依赖](https://peps.python.org/pep-0518/)
- [Packaging Python Projects 官方教程](https://packaging.python.org/en/latest/tutorials/packaging-projects/)
- [Python Packaging User Guide](https://packaging.python.org/)

## (留白) 我的理解

> 这一段不强制填。学完后用自己的话复述、记下踩过的坑、和其他知识的连接。AI 写不出这段。

---

## pytest 测试(fixture / parametrize / marker)

## TL;DR

> 用最小样板写出高表达力测试:fixture 管依赖,parametrize 管数据,marker 管分类。

## 背景与动机

Python 内置的 `unittest` 沿袭 Java JUnit 风格:测试必须写进 `TestCase` 类、用 `self.assertEqual` 等断言方法、`setUp/tearDown` 模板代码繁重。结果是「写测试的心理成本高」,很多项目干脆不写。

pytest 用三个设计扭转了这个局面:

- **断言就用原生 `assert`**,失败时自动重写字节码、展开表达式左右两边的值,报错信息比 `assertEqual` 更直观。
- **fixture 用「依赖注入」代替继承**,测试函数需要什么资源就声明什么参数,pytest 负责装配与回收。
- **`parametrize` 把「同逻辑多数据」从 for 循环里解放出来**,每组数据是独立用例,挂一个不影响其它,报告也精确到哪组数据挂了。

工程价值:降低写测试的边际成本,让团队愿意补测试;配合 `--maxfail`、`-k`、marker 等机制,大测试套件也能跑得又快又稳。它是现代 Python 项目事实上的测试标准,也是 CI 流水线的第一道质量闸。

## 核心机制

**1. 用例发现与执行模型**:pytest 默认收集 `test_*.py` / `*_test.py` 中名为 `test_*` 的函数(或 `Test*` 类中方法),逐个调用。断言失败即判定失败,未捕获异常同理;`pytest.raises` 用于断言「应该抛异常」。

**2. fixture(核心)**:用 `@pytest.fixture` 装饰的函数返回资源,测试函数把 fixture 名写成参数即可获得其返回值——这是**依赖注入**。fixture 有 `scope`(`function` 默认 / `class` / `module` / `session`),scope 越大创建次数越少、越省时间。`yield` 写法把「前置准备」和「后置清理」合在一个函数里,替代 `setUp/tearDown`。`conftest.py` 是跨文件共享 fixture 的机制,作用域覆盖所在目录及子目录,**无需 import**。

**3. parametrize**:`@pytest.mark.parametrize("入参名,期望名", [(...), (...)])` 让一个测试函数按多组数据各跑一遍,每组是独立用例(独立计数、独立失败)。

**4. marker**:用 `@pytest.mark.slow` 等打标签,`pytest -m "not slow"` 按标签筛选;内置 `skip`/`skipif`(跳过)、`xfail`(预期失败)控制用例行为。自定义 marker 需在 `pyproject.toml` 注册避免拼写漂移。

**5. 插件体系**:`pytest-mock`(封装 `unittest.mock`)、`pytest-cov`(覆盖率)、`pytest-xdist`(并行)等通过 entry-points 挂载,是 pytest 生态繁荣的根因。

## 代码示例

```python
# test_calc.py —— 运行: pytest -v
import pytest

# 1. fixture: yield 前是 setup, yield 后是 teardown
@pytest.fixture
def cart():
    c = {"items": [], "total": 0.0}
    yield c                      # 测试拿到这个 dict
    c.clear()                    # 用例结束后的清理

def add_item(cart, name, price):
    cart["items"].append(name)
    cart["total"] += price

def test_add_one_item(cart):     # 参数名=fixture名,自动注入
    add_item(cart, "apple", 3.5)
    assert cart["total"] == 3.5  # 原生 assert,失败自动展开

# 2. parametrize: 一组数据一个用例
@pytest.mark.parametrize("a,b,expected", [
    (1, 2, 3), (0, 0, 0), (-1, 1, 0),
])
def test_add(a, b, expected):
    assert a + b == expected

# 3. 断言应当抛出的异常
def test_div_zero():
    with pytest.raises(ZeroDivisionError):
        1 / 0
```

## 易错点 / 反例

- **fixture 之间通过可变默认值共享状态,导致用例互相污染**。错误示例:

  ```python
  @pytest.fixture
  def cart(cache={}):        # 可变默认参数,跨用例共享同一 dict!
      return cache
  ```

  一个用例写入的数据会泄漏到下一个用例。正确做法是在 fixture 内每次新建对象(`c = {...}`),不依赖函数默认参数。

- **fixture 被当函数直接调用**。fixture 是「声明注入」的,不能 `cart()` 手动调,会报 `Failed: fixtures are not meant to be called directly`。需要复用逻辑时,把公共代码抽成普通函数,fixture 与测试都调它。

- **scope 不匹配导致的脏数据**:把连接数据库的 fixture 默认 `function` scope,每个用例都重建连接,慢;但若升到 `session` 又没在 teardown 清表,用例间数据残留。原则:**创建昂贵用 scope=session/module,但 teardown 必须把状态还原到用例无关的干净基线**。

- **`parametrize` 参数个数与测试函数签名对不上**:`@pytest.mark.parametrize("a,b", [(1,2,3)])` 元素长度 3、声明 2 个,直接 collection error。`ids` 与数据条数也要一致。

- **在 `conftest.py` 里写业务逻辑或 import 测试模块**:conftest 只放 fixture 和 hook,放业务代码会让共享与测试耦合、难以定位;它靠目录位置生效,不该被 import。

## 高频面试题(5 题)

- **Q1**: pytest 的 fixture 和 unittest 的 setUp/tearDown 有什么本质区别?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - 装配方式:fixture 是**依赖注入**(测试函数声明参数即获得),`setUp/tearDown` 是**类内固定钩子**,所有用例共享同一套准备逻辑。
  - 复用粒度:fixture 可按需组合、可被多个测试类/文件通过 `conftest.py` 复用;`setUp` 绑定在单个 `TestCase` 类上,复用要靠继承。
  - 生命周期:fixture 有 `function/class/module/session` 四种 scope 精细控制创建次数;`setUp` 固定每个用例都跑。
  - 清理:`yield fixture` 把准备与清理写在一处,异常时清理仍执行;`tearDown` 是单独方法,逻辑分离。

  &lt;details&gt;

- **Q2**: fixture 的 scope 有哪些?如何在保证隔离性的同时提升速度?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - scope 取值:`function`(默认,每用例一次)、`class`、`module`、`session`(整个会话一次)。
  - scope 越大,fixture 创建次数越少、越省时,适合「创建昂贵、内容只读」的资源(如数据库连接、配置加载)。
  - 隔离性靠 teardown 保证:高 scope fixture 的 `yield` 后必须**把可变状态还原到干净基线**(如 `TRUNCATE` 表),否则用例间脏数据。
  - 经验法则:连接/服务用高 scope,业务数据用 function scope,二者结合(高 scope 提供连接,function scope 负责建清数据)。

  &lt;details&gt;

- **Q3**: `conftest.py` 是什么?它如何生效、为什么不能 import?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - 定义:pytest 的特殊文件,存放该目录及子目录共享的 fixture 与 hook 函数。
  - 生效机制:pytest 收集用例时**自动按目录层级加载**各层 `conftest.py`,fixture 对其下所有测试可见,**无需也不应 import**。
  - 作用域层级:可有多层 conftest,内层可覆盖同名 fixture,实现「就近覆盖」。
  - 不 import 的原因:它靠「文件位置 + pytest 加载」注册,import 会破坏自动装配,造成 fixture 重复注册或路径错乱。

  &lt;details&gt;

- **Q4**: `parametrize` 相比在测试里写 for 循环有什么优势?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - 用例独立性:parametrize 每组数据是**独立用例**,一组失败不影响其它组执行;for 循环里第一次断言失败,后续数据根本不会跑到。
  - 报告精确:结果能定位到「哪组数据」挂了(自动带参数值的用例 id);for 循环只报一个测试函数失败。
  - 计数与统计:每组单独计入通过/失败数,覆盖统计更真实;for 循环整体只算一个用例。
  - 可筛选:parametrize 的用例可用 `-k` 按参数值选中单独跑,for 循环做不到。

  &lt;details&gt;

- **Q5**: 如何标记并筛选测试?`skip`、`xfail`、自定义 marker 分别用在什么场景?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - 标记:`@pytest.mark.<名字>` 打标签;筛选:`pytest -m "slow and not web"` 按表达式跑子集。
  - `skip`:无条件跳过(如该功能未实现);`skipif(条件)`:满足条件才跳(如仅在 Windows 跳过)。
  - `xfail`:预期失败——已知 bug 但暂不修,失败不计入失败数(`strict=True` 时若意外通过反而报错,用于督促修 bug)。
  - 自定义 marker:需在 `pyproject.toml` 的 `[tool.pytest.ini_options] markers` 注册,避免拼写错误导致筛选失效;典型用于 `slow`、`integration`、`smoke` 分层跑测。

  &lt;details&gt;

## 延伸资源

- [pytest 官方文档](https://docs.pytest.org/en/stable/)
- [pytest fixture 官方指南](https://docs.pytest.org/en/stable/how-to/fixtures.html)
- [pytest parametrize 官方指南](https://docs.pytest.org/en/stable/how-to/parametrize.html)
- [pytest marker 官方指南](https://docs.pytest.org/en/stable/how-to/mark.html)
- 书籍:《Python Testing with pytest, 2nd Edition》(Brian Okken)

## (留白) 我的理解

> 这一段不强制填。学完后用自己的话复述、记下踩过的坑、和其他知识的连接。AI 写不出这段。

---

## 代码质量(ruff / black / isort / mypy)

## TL;DR

> 用 ruff(极速 lint+格式)、black(统一格式)、isort(import 排序)、mypy(类型检查)把你的代码变成「没有争议」的样子。

## 背景与动机

没有统一格式的代码,Review 时会浪费大量时间争论「这个括号该不该换行」「import 顺序对不对」。PEP 8 定风格,但这四个工具把它变成**自动执行**:

- **ruff**(Rust 写的 Python 工具)同时做 linting + 格式化,比 flake8+isort 快几十倍,正在取代 flake8/isort/autoflake 这一整套。
- **black**:不商量格式化器,配置极少,所有人输出一模一样。
- **isort**:把 import 自动分标准库/第三方/本地三段排序。
- **mypy**:静态类型检查,在运行前发现类型不匹配 bug。

工程价值:这四件套写到 pre-commit 或 CI 里,提交即检查,代码统一、消灭格式纠纷、类型 bug 提前发现。

## 核心机制

- **ruff lint**:检查未使用变量、未定义名字、多余括号等数百条规则(兼容 flake8/pyflakes/pycodestyle/isort 等插件的规则集)。`ruff check .` 扫描项目,`--fix` 自动修复安全的问题。
- **ruff format**:2024 年起 ruff 内置 black 兼容的格式化器,在 `ruff.toml` 配置后 `ruff format .` 即可,不依赖 black。
- **isort 在 ruff 里**:ruff 内置 isort 兼容规则(I 系列),`ruff check --fix` 自动排 import 顺序。
- **mypy**:读源码和 stub 文件,根据类型注解做推断和校验。可通过 `# type: ignore` 局部跳过。

## 代码示例

```toml
# pyproject.toml 里的 ruff + mypy 配置
[tool.ruff]
target-version = "py312"
[tool.ruff.lint]
select = ["E", "F", "I", "N", "W", "UP"]  # pycodestyle/pyflakes/isort/pep8-naming/pyupgrade
ignore = ["E501"]  # 行长度交给格式处理
[tool.ruff.format]
quote-style = "double"

[tool.mypy]
strict = true
```

```bash
ruff check .          # lint
ruff check --fix .    # 自动修复
ruff format .         # 格式化
mypy .                # 静态类型检查
```

## 易错点 / 反例

- **一行 `# type: ignore` 太多**:掩盖了真正的类型问题,应尽快消除,或加注释说明原因。
- **ruff 规则全开再慢慢关**:几百条规则瞬间大量报错,建议 `select` 指定范围逐步扩展。
- **只跑 ruff format 不跑 ruff check**:格式对不代表没 bug,两套都要跑(或 CI 里一起)。

## 高频面试题(5 题)

- **Q1**: ruff 和 flake8 + isort + black 三件套有什么区别?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - ruff 一个工具覆盖 lint + format + import 排序,基于 Rust,速度是 flake8 的几十倍
  - 配置在一次 `ruff.toml` 或 `pyproject.toml` 里完成,不用分别装插件
  - 正在成为社区新一代默认推荐(`uv` 同家公司 Astral)
    &lt;details&gt;

- **Q2**: 为什么团队要统一格式化?主要争论是什么?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - 消除 Code Review 里的风格争论,让 Review 关注逻辑而非格式
  - black 的设计哲学是「不商量」—— 唯一配置是行长度,输出跨团队一致
  - 配合 Git pre-commit 或 CI,在提交前就统一好
    &lt;details&gt;

- **Q3**: isort 把 import 分成哪三段?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - 标准库(`os`, `sys`, `json`…)
  - 第三方依赖(`requests`, `pandas`, `fastapi`…)
  - 本地/项目内(`from .module import …`, `from mypkg import …`)
  - 每段内字母序,段间空一行
    &lt;details&gt;

- **Q4**: mypy 和 ruff 能互相替代吗?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - 不能。ruff 做 lint+格式(运行时语义不关心),mypy 做静态类型检查(类型推导与校验)
  - 两者互补:ruff 保证代码风格干净,mypy 保证类型逻辑正确
  - 实践中两台一起跑: `ruff check && mypy .`
    &lt;details&gt;

- **Q5**: 如何在已有项目中增量引入 mypy?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - 配置 `check_untyped_defs = true` 启动渐进类型覆盖
  - 从新代码开始要求,旧代码暂时 `# type: ignore`
  - 配合 `mypy --strict --follow-imports=skip` 逐步收紧
    &lt;details&gt;

## 延伸资源

- [ruff 文档](https://docs.astral.sh/ruff/) · [black 文档](https://black.readthedocs.io/)
- [mypy 官方文档与备忘](https://mypy.readthedocs.io/) · [PEP 8](https://peps.python.org/pep-0008/)
- 书籍: 《Robust Python》第 2 章(Type Annotations)

## (留白) 我的理解

> 这一段不强制填。学完后用自己的话复述、记下踩过的坑、和其他知识的连接。AI 写不出这段。

---

## Django ORM 与 Admin / DRF 入门

## TL;DR

> 用 Python 类映射数据表,链式惰性查询,Admin 与 DRF 免费得来。

## 背景与动机

直接写 SQL 操作数据库,要手工拼接字符串、处理注入风险、把行结果手动转成对象,既繁琐又危险。Django ORM 的动机是**让开发者用 Python 对象思考数据**:`class Article(models.Model)` 定义即表结构,`Article.objects.filter(...)` 即查询。配合 migration 系统,模型改动可版本化地同步到数据库。在这之上,Django Admin 仅凭模型就能生成可用的后台管理界面,DRF(Django REST framework)用「序列化器 + ViewSet」把模型暴露成 REST API——三者共享同一套模型定义,这是 Django「batteries-included」哲学最集中的体现:写一份 Model,后台、API、校验全都长出来。

## 核心机制

- **Model → 表**:每个 `models.Model` 子类对应一张表,字段是 `CharField`/`IntegerField`/`ForeignKey` 等描述符。`Meta` 内类配置表名、排序、索引。
- **QuerySet 惰性求值**:`filter()`/`exclude()`/`annotate()` 只是拼接查询,**不访问数据库**;直到迭代、`len()`、`list()`、切片取值时才真正执行 SQL。这让查询可以层层组合、按需优化。
- **关系与 N+1**:外键/多对多默认懒加载,循环里逐条访问关联对象会触发 N+1 查询;`select_related`(正向 FK,SQL JOIN)和 `prefetch_related`(反向/多对多,Python 侧二次查询)是标准解法。
- **migration**:`makemigrations` 读模型 diff 生成迁移文件,`migrate` 应用到库,迁移文件进版本控制,实现 schema 的可追溯演进。
- **Admin**:`admin.site.register(Model)` + `ModelAdmin` 配置列表页、搜索、过滤器、内联编辑,几乎零代码得到后台。
- **DRF 三件套**:`Serializer` 负责模型↔JSON 转换与校验(类似 Pydantic),`ViewSet`/`ModelViewSet` 封装 CRUD,`Router` 自动生成 URL。序列化器同样基于声明式字段,与表单/模型复用同一套校验思想。

## 代码示例

```python
from django.db import models
from rest_framework import serializers, viewsets

class Author(models.Model):               # 模型 → 表
    name = models.CharField(max_length=50)

class Book(models.Model):
    title = models.CharField(max_length=100)
    author = models.ForeignKey(Author, on_delete=models.CASCADE)

class BookSerializer(serializers.ModelSerializer):  # 模型 → JSON
    class Meta:
        model = Book
        fields = ["id", "title", "author"]

class BookViewSet(viewsets.ModelViewSet):  # CRUD 全免费
    queryset = Book.objects.select_related("author")  # 防 N+1
    serializer_class = BookSerializer
# urls.py: router.register("books", BookViewSet) → /books/ REST API
```

## 易错点 / 反例

- **N+1 查询**(最常见性能杀手):

```python
for book in Book.objects.all():        # 1 次查询
    print(book.author.name)            # 每本再查 1 次 author → N+1
# 正确:Book.objects.select_related("author").all()
```

- **误以为 filter 立即查库**:`qs = Book.objects.filter(...)` 后马上 `if qs:` 会触发求值;而真正复用 `qs` 多次迭代,若不缓存会重复查库,`list(qs)` 一次性物化更稳。
- **在循环里写库**:循环 `obj.save()` 产生 N 次写入,应改用 `bulk_create` / `bulk_update`。
- **`on_delete` 不设或不理解**:FK 必填 `on_delete`,误用 `CASCADE` 会级联删光关联数据;该用 `PROTECT`/`SET_NULL` 时别图省事。
- **忘了生成迁移**:改了模型直接上线,数据库没跟上 → `migrate` 报不一致。模型变更必须 `makemigrations` 并提交迁移文件。
- **DRF 序列化器漏 `read_only_fields`**:把 `id`/创建时间暴露成可写,客户端就能篡改主键。

## 高频面试题(5 题)

- **Q1**: Django QuerySet 的「惰性求值」是什么?什么时候真正执行 SQL?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - `filter`/`exclude`/`annotate` 只构建查询对象,不发 SQL,可无限链式组合。
  - 触发求值的时刻:迭代、切片带步长、`len()`、`list()`、`bool()`、序列化、显式取值。
  - 求值后结果缓存于 QuerySet,重复迭代同一对象不再查库(但新增查询条件会生成新 QuerySet)。
  - 好处:便于按需优化、组合复用;坑:在模板/循环中反复触发隐式求值导致多余查询。

  &lt;details&gt;

- **Q2**: `select_related` 和 `prefetch_related` 的区别与适用场景?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - `select_related`:用 SQL JOIN 一次性把正向关系(ForeignKey、OneToOne)查回来,适合「一对一/多对一」。
  - `prefetch_related`:对每条主记录单独查关联表,在 Python 侧做拼接,适合「一对多反向、多对多」。
  - 误用 JOIN 处理多对多会产生笛卡尔积放大结果集;二者都是为解决 N+1。
  - 选择依据:看关系方向与基数,目标是减少查询次数且不引入巨量冗余行。

  &lt;details&gt;

- **Q3**: Django migration 的工作原理?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - `makemigrations` 对比当前模型与历史迁移的状态,生成描述变更的迁移文件(CreateModel/AddField/AlterField 等操作)。
  - 每个迁移记录 `dependencies` 形成有向链;`migrate` 按序应用,`django_migrations` 表记录已应用的迁移。
  - 迁移可 forwards/backwards,支持数据迁移(`RunPython`)。
  - 迁移文件应纳入版本控制;冲突(两人改同一 app)需手工合并或 `makemigrations --merge`。

  &lt;details&gt;

- **Q4**: DRF 的 Serializer / ViewSet / Router 各自职责?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - Serializer:模型实例 ↔ 原生类型/JSON 的双向转换,并承担字段校验(类似 Pydantic),`ModelSerializer` 可从模型自动派生字段。
  - ViewSet:把 list/retrieve/create/update/destroy 这些动作聚合到一个类,`ModelViewSet` 默认全套实现。
  - Router:扫描 ViewSet,自动生成标准 REST URL(`/books/`、`/books/{pk}/`),省去手写 urlpatterns。
  - 三者协作:Router 路由 → ViewSet 动作 → Serializer 校验与序列化。

  &lt;details&gt;

- **Q5**: 如何排查和解决 Django 的 N+1 问题?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - 先用 `django-debug-toolbar` 或 `connection.queries` 观察实际 SQL 数,确认是否随记录数线性增长。
  - 正向 FK/一对一用 `select_related`,反向/多对多用 `prefetch_related`。
  - 更精细时用 `Prefetch` 对象定制预取查询集。
  - 列表接口优先 `only()`/`values()` 只取需要的列;序列化器中避免在方法字段里再访问未预取的关联。

  &lt;details&gt;

## 延伸资源

- [Django 模型官方文档](https://docs.djangoproject.com/en/stable/topics/db/models/)
- [QuerySet API 参考](https://docs.djangoproject.com/en/stable/ref/models/querysets/)
- [Django Admin 官方文档](https://docs.djangoproject.com/en/stable/ref/contrib/admin/)
- [Django REST framework 官方文档](https://www.django-rest-framework.org/)
- 书籍:《Two Scoops of Django》

## (留白) 我的理解

> 这一段不强制填。学完后用自己的话复述、记下踩过的坑、和其他知识的连接。AI 写不出这段。

---

## FastAPI(路由 / 依赖注入 / Pydantic 校验 / OpenAPI)

## TL;DR

> 用类型注解驱动校验、依赖注入和自动文档的现代 ASGI 框架。

## 背景与动机

传统框架(Flask)里,请求参数校验、序列化、API 文档都要手写或用第三方库拼凑,既啰嗦又容易前后不一致。FastAPI 的出发点是:**把 Python 类型注解当作单一事实来源**。函数签名里的 `item: Item`、`q: int = 0` 同时承担三件事——请求体/查询参数的运行时校验(Pydantic)、依赖注入的解析入口、OpenAPI schema 的生成依据。结果是:写一份类型,校验、文档、IDE 提示、客户端代码生成都免费得到。底层基于 Starlette(ASGI)和 Pydantic,异步性能接近 Node/Go,适合 IO 密集的后端服务。

## 核心机制

- **路由**:装饰器 `@app.get("/items/{item_id}")` 把路径参数、查询参数、请求体映射到函数参数。路径参数来自 URL,带默认值的标量视为查询参数,`BaseModel` 子类视为请求体。
- **Pydantic 校验**:继承 `BaseModel` 声明数据形状。请求进来时先做类型强制转换与校验,失败自动返回 422 及逐字段错误明细——校验不是手写的 `if`,而是声明式模型。
- **依赖注入 `Depends`**:`def get_db(): ...` 这样的可调用对象声明为依赖,FastAPI 按依赖图自动解析、缓存(同一请求内同一依赖只算一次)并注入。用 `yield` 的依赖支持请求结束后的清理(关连接、回滚)。依赖可嵌套、可在路由级批量声明,天然适合做鉴权、DB session、公共参数。
- **OpenAPI / 自动文档**:框架根据类型注解实时生成符合 OpenAPI 标准的 schema,挂在 `/docs`(Swagger UI)和 `/redoc`。`response_model` 单独控制出参形状,可过滤敏感字段,实现「入参模型 ≠ 出参模型」。

类型注解是这套机制的粘合剂(PEP 484)。FastAPI 不是「又一个 Web 框架」,而是「类型注解 + ASGI」的范式组合。

## 代码示例

```python
from fastapi import FastAPI, Depends, HTTPException
from pydantic import BaseModel

app = FastAPI()

class Item(BaseModel):          # 请求体模型,自动校验
    name: str
    price: float
    tags: list[str] = []

def get_token(x_token: str = ""):  # 依赖:从 header 取 token
    if x_token != "secret":
        raise HTTPException(401, "无效 token")
    return x_token

@app.post("/items/", response_model=Item)   # 出参复用模型
def create_item(item: Item, token: str = Depends(get_token)):
    return item                  # 校验失败自动 422,文档自动生成
# 运行: uvicorn main:app --reload  →  /docs 看交互文档
```

## 易错点 / 反例

- **可变默认参数**(经典 Python 坑,在模型里同样中招):

```python
class Bad(BaseModel):
    tags: list = []   # Pydantic 会为每实例拷贝,侥幸安全;但普通函数里 def f(x=[]) 是真坑
```

普通依赖函数里 `def f(cache=[])` 才是灾难——所有请求共享同一列表。模型字段建议用 `Field(default_factory=list)`。

- **同步阻塞拖垮事件循环**:把 `time.sleep(10)` 或同步 ORM 调用写进 `async def` 路由,整个 worker 卡住。要么用 `def`(FastAPI 丢线程池跑),要么用真异步库。
- **`response_model` 漏配导致泄露**:直接 `return db_user` 会把密码哈希也吐给前端;必须用 `response_model=UserOut` 收窄出参。
- **依赖缓存误区**:同一请求内同一 `Depends` 只执行一次,若你在依赖里做了「每次都要重新读」的逻辑(如刷新计数),会得到旧值。
- **路径顺序**:`/items/me` 必须定义在 `/items/{item_id}` 之前,否则 `me` 被当成 `item_id` 匹配。

## 高频面试题(5 题)

- **Q1**: FastAPI 为什么快?性能来自哪几层?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - 底层是 ASGI(Starlette),原生支持 asyncio 协程并发,单进程能扛大量并发 IO 连接,远超 WSGI 同步框架。
  - 数据校验/序列化用 Pydantic(v2 核心为 Rust 实现的 pydantic-core),速度比纯 Python 校验快一个数量级。
  - 注意:快指的是 IO 并发能力;CPU 密集任务仍受 GIL 限制,需多进程或下沉到任务队列。

  &lt;details&gt;

- **Q2**: `Depends` 依赖注入是怎么工作的?有什么用?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - 把可调用对象(函数/类)声明为依赖,FastAPI 构建依赖图,按拓扑顺序解析并把返回值注入路由参数。
  - 同一请求内相同依赖只执行一次并缓存,子依赖可共享。
  - `yield` 形式的依赖在响应发出后执行 `yield` 之后的清理代码,适合做 DB session 关闭、事务提交/回滚。
  - 典型用途:鉴权、数据库会话、公共查询参数、限流,替代装饰器堆叠,便于测试时覆写(`app.dependency_overrides`)。

  &lt;details&gt;

- **Q3**: 路径参数、查询参数、请求体在 FastAPI 里如何区分?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - 出现在路径模板里的参数(`{item_id}`)→ 路径参数。
  - 函数签名中的标量类型(`int`/`str`/`bool`)且不在路径里 → 查询参数,有默认值即可选。
  - 参数类型是 Pydantic `BaseModel` 子类 → 解析为请求体(JSON)。
  - 可用 `Path()` / `Query()` / `Body()` / `Header()` 显式覆盖默认推断并附加校验约束。

  &lt;details&gt;

- **Q4**: Pydantic 校验失败时 FastAPI 的行为?为什么这是优点?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - 校验失败自动返回 HTTP 422,响应体带逐字段的错误位置(loc)、错误类型(msg/type)。
  - 优点:校验逻辑零手写,错误格式统一,前端可程序化解析;文档与校验规则天然一致,不会出现「文档说一套、代码做一套」。
  - v2 中可用 `@field_validator` / `@model_validator` 加自定义校验逻辑。

  &lt;details&gt;

- **Q5**: `response_model` 和请求体模型为什么要分开?有什么好处?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - 入参模型描述客户端该传什么,出参模型描述服务端愿返回什么,二者字段常不同(如密码、内部 ID、时间戳)。
  - `response_model` 会做二次过滤与校验:多余字段被剔除,敏感字段(密码哈希)不会泄露。
  - 出参模型也进入 OpenAPI 文档,让接口契约更精确,且能对返回值做类型兜底。

  &lt;details&gt;

## 延伸资源

- [FastAPI 官方文档](https://fastapi.tiangolo.com/)
- [FastAPI 依赖注入教程](https://fastapi.tiangolo.com/tutorial/dependencies/)
- [Pydantic 官方文档](https://docs.pydantic.dev/latest/)
- [PEP 484 – Type Hints](https://peps.python.org/pep-0484/)
- 书籍:《Fluent Python》第二版(类型注解与异步章节)

## (留白) 我的理解

> 这一段不强制填。学完后用自己的话复述、记下踩过的坑、和其他知识的连接。AI 写不出这段。

---

## Flask 路由 / 蓝图 / 扩展

## TL;DR

> Flask 是最简的 Python Web 微框架:一个文件、几行装饰器就能写个 API。蓝图让大型应用模块化,扩展生态(Flask-SQLAlchemy 等)按需加载。

## 背景与动机

Django 太重、FastAPI 需要 Python 3.6+ 的 async。Flask(2010 年诞生)走「极简核心 + 丰富生态」路线:**核心只有路由和请求响应处理**（依赖 Werkzeug+Jinja2),ORM、认证、CMS 全由社区扩展提供。适合小 API、原型、不想学全家桶的场景。虽不如 async-first 的 FastAPI 语法优雅,但 Flask 3.x 已支持 async —— 也能写异步端点。

工程价值:微服务 API 原型、内部工具、简单 Web UI(配合 Jinja2),几个文件就能从零搭好,生态插件成熟。

## 核心机制

- **路由**:`@app.route('/hello/&lt;name&gt;')` 装饰器将 URL 路径映射到视图函数;支持 methods=['GET','POST']、int/path 等转换器。
- **请求与响应**:Flask 把 WSGI 包装成 `request`(全局代理对象,背后线程隔离)、`g`(请求级临时存储)、`session`(加密 cookie 会话)。
- **蓝图(Blueprint)**:把视图按功能模块分文件,`Blueprint('users', __name__, url_prefix='/users')` 定义子路由,`app.register_blueprint()` 注册。是 Django app 的轻量替代。
- **扩展生态**:`Flask-SQLAlchemy`(ORM)、`Flask-Login`(认证)、`Flask-Migrate`(迁移,用 Alembic)、`Flask-CORS` 等,一 pip 一 import 即用。

## 代码示例

```python
from flask import Flask, Blueprint, jsonify

app = Flask(__name__)

# 蓝图:用户模块
users = Blueprint('users', __name__, url_prefix='/api/users')

@users.route('/<int:user_id>')
def get_user(user_id):
    # 实际项目查数据库,这里演示
    return jsonify({'id': user_id, 'name': '无名'})

app.register_blueprint(users)

if __name__ == '__main__':
    app.run(debug=True)   # 仅开发用,生产用 gunicorn
```

## 易错点 / 反例

- **`app.run(debug=True)` 上生产**:Flask 内置服务器是单线程且不安全,生产必须用 `gunicorn` 或 `waitress`。
- **蓝图嵌套路径冲突**:`url_prefix` 重复或蓝图名冲突会导致注册失败,团队规范命名即可避免。
- **`request` 是全局代理**:看起来像全局变量,实际是线程/协程安全(push/pop context),不要在非请求上下文里调它。
- **Flask 2.x 默认不支持异步 View**:`async def` 的路由在 Flask 3.x(2024)起原生支持,之前有额外配置或用 `quart` 替代。

## 高频面试题(5 题)

- **Q1**: Flask 和 Django 在架构上最大的区别?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - Django 是「自带电池」的全栈框架:ORM/Admin/Template 引擎/Form 内建
  - Flask 是微内核:核心只处理路由和请求响应,其它靠扩展按需加载
  - Flask 更灵活、适合小型/原型;Django 适合快速构建标准业务 CRUD
    &lt;details&gt;

- **Q2**: 蓝图(Blueprint)解决了什么问题?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - 把路由按功能模块分文件,打破单文件地狱
  - 可复用:写好用户蓝图,注册到不同 app 前缀
  - 类比 Django 的 app,但更轻无 ORM 绑定
    &lt;details&gt;

- **Q3**: Flask 的请求上下文(request context)怎么实现线程安全?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - `request` 是 `LocalProxy`,背后是 Werkzeug 的 `LocalStack`(线程/协程局部存储)
  - 每个请求进来时 `push` 上下文,处理完 `pop`,不同工作线程/协程互不干扰
  - 非请求上下文(如 CLI 脚本)调用 `request` 直接抛异常
    &lt;details&gt;

- **Q4**: 如何让 Flask 处理异步请求?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - Flask 3.x 起支持 `async def` 路由,内部用 `asgiref` 适配
  - 部署时用支持 ASGI 的服务(如 `gunicorn -k uvicorn`)
  - 需要真正的全异步生态时建议直接用 FastAPI
    &lt;details&gt;

- **Q5**: 生产环境部署 Flask 的推荐组合?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - WSGI 或 ASGI 服务: `gunicorn` / `uwsgi` / `gunicorn -k uvicorn`
  - 前面上反向代理: nginx 或 Caddy
  - 数据库: SQLAlchemy + Alembic(迁移)、Redis(缓存/会话)
  - 配置用环境变量 / `python-dotenv`
    &lt;details&gt;

## 延伸资源

- [Flask 官方文档](https://flask.palletsprojects.com/)
- [Flask Mega-Tutorial(Miguel Grinberg)](https://blog.miguelgrinberg.com/post/the-flask-mega-tutorial-part-i-hello-world)
- 书籍: 《Flask Web Development》第 2 版

## (留白) 我的理解

> 这一段不强制填。学完后用自己的话复述、记下踩过的坑、和其他知识的连接。AI 写不出这段。

---

## LLM API 集成与 RAG 流程(OpenAI / Claude / 向量库)

## TL;DR

> 先检索相关文档塞进 Prompt，再让 LLM 基于它作答，缓解幻觉与知识过期。

## 背景与动机

LLM 有两个硬伤:**幻觉**(对不知道的事一本正经地编造)和**知识截止**(训练后发生的事、企业内部私有文档一概不知)。微调成本高且更新慢，无法跟上业务数据的变化。**RAG(Retrieval-Augmented Generation,检索增强生成)** 用「外挂知识库」的方式解决:把私有/最新文档切成块、用 Embedding 模型转成向量存进向量库;用户提问时先检索出最相关的几段，连同问题一起塞进 Prompt，让模型**基于检索到的内容作答**。这样无需重训模型，就能让它回答私有知识、给出可溯源的依据。这是当前企业级 LLM 应用(智能客服、内部知识库问答)的主流落地范式。

## 核心机制

RAG 分**离线索引**和**在线问答**两条流水线。

**离线(Indexing)**:

1. **加载 + 切分(Chunking)**:把文档按语义/固定长度切成块(常见 256~512 tokens，块间保留重叠 overlap 避免切断语义)。
2. **Embedding**:用向量模型(OpenAI `text-embedding-3` / 开源 BGE)把每块编码成定长向量,语义相近的文本向量距离近。
3. **入库**:向量连同原文、元数据写入向量库(Chroma / Milvus / FAISS / PGVector)。

**在线(Retrieval + Generation)**: 4. **检索**:把用户问题也 Embedding 成向量,在向量库做近似最近邻(ANN)搜索，取 Top-K 最相关块。5. **增强**:把检索到的块拼进 Prompt 模板(「基于以下资料回答:...」)。6. **生成**:调用 LLM API(OpenAI `chat.completions` / Claude `messages`)生成有据可依的答案。

关键点:**Embedding 决定召回质量,Prompt 模板决定生成质量**。 chunk 太小丢上下文、太大引入噪声;Top-K 太少漏信息、太多超上下文窗口且稀释重点。

## 代码示例

```python
# 依赖:pip install chromadb openai(向量库可换 Milvus/FAISS;LLM 可换 anthropic)
import chromadb, openai

client = chromadb.Client()
coll = client.create_collection("docs")
coll.add(  # 离线:切好块直接入库,Chroma 内置默认 embedding
    documents=["Python 用缩进表示代码块", "RAG 用检索增强生成", "GIL 限制多线程并行"],
    ids=["a", "b", "c"],
)
question = "Python 怎么划分代码结构?"
retrieved = coll.query(query_texts=[question], n_results=1)  # 在线:向量检索
context = retrieved["documents"][0][0]

resp = openai.chat.completions.create(  # 增强生成
    model="gpt-4o-mini",
    messages=[{"role": "user", "content": f"基于资料回答:{context}\n\n问题:{question}"}],
)
print(resp.choices[0].message.content)
```

Claude 调用形态类似:`anthropic.Anthropic().messages.create(model=..., max_tokens=..., messages=[...])`。

## 易错点 / 反例

- **切块不动脑子,直接按字符硬切**:
  ```python
  # 错误:固定每 500 字符切,把"watch TV"这类短语、完整句子拦腰切断
  chunks = [text[i:i+500] for i in range(0, len(text), 500)]
  # 正确:按段落/句子语义边界切,且块间留重叠(如 chunk_overlap=50)
  ```
  切坏语义会导致检索召回的是「半句话」,模型自然答非所问。
- **把整篇文档塞进 Prompt,不做检索**:既超上下文窗口烧钱，又稀释关键信息(「大海捞针」效应,中间内容容易被模型忽略)。RAG 的意义正在于「只喂相关的」。
- **Embedding 模型与查询用不同模型/语言不匹配**:索引用中文 BGE、查询却用英文模型，向量空间对不上，召回全是噪声。**索引进库和在线查询必须用同一 Embedding 模型**。
- **认为 RAG 能杜绝幻觉**:检索不到相关资料时，模型仍会强行作答。工程上要加「资料不足请直说不知道」的 Prompt 约束 + 设置相似度阈值，低于阈值就不走生成。
- **元数据/来源不存**:只存向量不存原文出处，答案无法溯源，无法向用户展示引用，也无法排查召回质量。

## 高频面试题(5 题)

- **Q1**: RAG 解决了 LLM 的什么问题?相比微调有什么优劣?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - 解决幻觉、知识截止、缺乏私有知识三大问题:靠检索注入实时/私有资料,让答案有据可依。
  - 优势:无需重训、知识可热更新(改库即可)、可溯源(返回引用来源)、成本低。
  - 劣势:不教模型「新能力/新风格」,只补知识;检索质量差时会被无关资料带偏;增加系统复杂度(向量库 + 检索链路)。
  - 经验法则:补「知识」用 RAG,改「行为/格式/风格」用微调,二者常结合。

  &lt;details&gt;

- **Q2**: 描述 RAG 的完整流程,各环节有哪些关键选型?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - 离线:文档加载 → 切分(chunk size / overlap 权衡)→ Embedding(选型影响召回)→ 向量入库。
  - 在线:query 向量化 → ANN 检索取 Top-K → (可选 rerank 重排)→ 拼 Prompt → LLM 生成。
  - 选型:向量库(Chroma 轻量/Milvus 大规模/FAISS 本地库/PGVector 复用 PG)、Embedding(商用 API vs 开源 BGE)、检索策略(纯向量 vs BM25 混合检索)。
  - 进阶:加 rerank(如 Cohere Rerank / BGE-reranker)可显著提升精度。

  &lt;details&gt;

- **Q3**: 如何评估和提升 RAG 系统的召回质量?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - 评估:用 RAGAS 等框架,指标含 context_precision / recall(检索是否相关齐全)、faithfulness(答案是否忠于资料)、answer_relevancy。
  - 提升召回:优化切块策略(语义切分、父子块)、换更匹配的 Embedding、混合检索(向量 + 关键词 BM25)、query 改写/扩展(多 query、HyDE)。
  - 提升精度:rerank 重排、调 Top-K、过滤低相似度结果。
  - 工程上常配「bad case 回流」:收集答错的 query,针对性优化对应环节。

  &lt;details&gt;

- **Q4**: chunk size 和 overlap 怎么选?切太碎或太大各有什么问题?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - chunk 太大:单块混入多主题,向量语义被稀释,检索不精准,且占用上下文窗口。
  - chunk 太小:语义不完整(半句话),召回后模型缺上下文,无法作答。
  - 经验值 256~512 tokens;overlap 取 chunk 的 10%~20%,防止关键句正好落在边界被切断。
  - 没有银弹,应结合文档结构(Markdown 按标题、代码按函数)做结构化切分,并对候选配置做检索质量 A/B。

  &lt;details&gt;

- **Q5**: 向量检索为什么用近似最近邻(ANN)而不是精确搜索?余弦相似度为何常用?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - 高维向量(数百~数千维)精确 KNN 随库规模线性扫描,百万级以上不可用;ANN(HNSW、IVF、PQ)牺牲极小精度换取数量级提速。
  - HNSW(图索引)是当前主流,召回率与速度平衡好,Chroma/Milvus 默认支持。
  - 余弦相似度只关注向量方向、忽略模长,契合「语义相似 = 方向相近」的假设,且多数 Embedding 模型训练时即按余弦/对比损失优化。
  - 若向量已归一化,余弦相似度退化为点积,可用点积进一步提速。

  &lt;details&gt;

## 延伸资源

- [OpenAI API Reference](https://platform.openai.com/docs/api-reference)
- [Anthropic Messages API](https://docs.anthropic.com/en/api/messages)
- [Chroma 向量库文档](https://docs.trychroma.com/)
- [RAG 原始论文(NeurIPS 2020)](https://arxiv.org/abs/2005.11401)
- 框架:LangChain / LlamaIndex 文档;评估:RAGAS

## (留白) 我的理解

> 这一段不强制填。学完后用自己的话复述、记下踩过的坑、和其他知识的连接。AI 写不出这段。

---

## PyTorch(tensor / autograd / 训练循环)

## TL;DR

> 张量 + 自动微分 + 训练循环，用 define-by-run 动态图训练神经网络。

## 背景与动机

深度学习本质是「用梯度下降最小化损失函数」。手写反向传播推导每层梯度既繁琐又易错，且每次改网络结构都要重推。PyTorch 用 **autograd** 自动记录前向计算图、一键反向求梯度，把研究者从求导地狱里解放出来。它的 **define-by-run(动态图)** 特性让计算图在每次前向时即时构建——可以用普通 Python 控制流(if/for)写模型，调试时直接 print 中间张量，这是它击败早期静态图框架(TensorFlow 1.x)的关键。工程上，几乎所有论文复现、LLM 微调(HuggingFace 生态)都以 PyTorch 为底座。

## 核心机制

- **Tensor**:多维数组，类似 NumPy 的 ndarray，但可驻留 GPU 并携带梯度信息。`requires_grad=True` 的张量参与梯度追踪。
- **autograd(自动微分)**:前向时，每个运算在后台构建一个有向无环计算图(DAG)，叶子是输入张量，根是输出。调用 `loss.backward()` 从根出发做反向链式求导，把梯度累积到各叶子张量的 `.grad` 属性上。
- **动态计算图**:图随前向即时建立、随 `backward()` 默认销毁(`retain_graph=True` 可保留)，因此每个 batch 的图可以不同。
- **训练循环五部曲**(固定套路，背下来):
  1. `outputs = model(inputs)` 前向算预测
  2. `loss = criterion(outputs, labels)` 算损失
  3. `optimizer.zero_grad()` 清空上一轮的梯度(关键!PyTorch 默认**累加**梯度)
  4. `loss.backward()` 反向传播，计算本轮梯度
  5. `optimizer.step()` 按梯度更新参数
- **`model.train()` / `model.eval()`**:切换 Dropout、BatchNorm 等层的行为;推理时配合 `torch.no_grad()` 关掉梯度追踪省显存。

## 代码示例

```python
import torch
import torch.nn as nn

# 造数据:学 y = 2x + 1
X = torch.linspace(0, 10, 100).unsqueeze(1)      # (100, 1)
y = 2 * X + 1 + torch.randn_like(X) * 0.5        # 加噪声

model = nn.Linear(1, 1)                          # 一个线性层
criterion = nn.MSELoss()                         # 均方误差
optimizer = torch.optim.SGD(model.parameters(), lr=0.01)

for epoch in range(200):
    pred = model(X)                  # 1. 前向
    loss = criterion(pred, y)        # 2. 算损失
    optimizer.zero_grad()            # 3. 清梯度(必须!)
    loss.backward()                  # 4. 反向求梯度
    optimizer.step()                 # 5. 更新参数

w, b = model.parameters()
print(f"w={w.item():.3f}, b={b.item():.3f}")  # 接近 w=2, b=1
```

## 易错点 / 反例

- **忘记 `optimizer.zero_grad()` 导致梯度累加**:PyTorch 的 `.grad` 是「+=」累加而非覆盖。不清零会让梯度越滚越大，模型很快发散。这是新手第一大坑。
- **推理时忘加 `torch.no_grad()`，显存爆了**:
  ```python
  # 错误:评估时仍追踪梯度,白白占用显存并保留计算图
  for X, y in test_loader:
      pred = model(X)          # 持续建图,显存泄漏式增长
  # 正确:
  with torch.no_grad():
      for X, y in test_loader:
          pred = model(X)
  ```
- **对非标量调 `backward()` 不传参数**:`backward()` 默认对标量 loss 求导;若输出是张量,需显式传 `gradient=` 权重张量,否则报 `grad can be implicitly created only for scalar outputs`。
- **in-place 操作破坏计算图**:如 `x += 1`、`y.copy_()` 作用于需要梯度的中间张量,会报 `a variable needed for gradient computation has been modified by an inplace operation`。改用 `x = x + 1`。
- **`model.eval()` 忘了,Dropout/BatchNorm 行为错乱**:评估时不切 eval,Dropout 仍随机丢弃、BN 仍用 batch 统计,导致同一输入每次结果都不一样。

## 高频面试题(5 题)

- **Q1**: PyTorch 的 autograd 是如何实现自动微分的?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - 前向时对每个运算记录「函数 + 输入」,构建动态计算图(DAG),叶子是 requires_grad=True 的输入,根是输出 loss。
  - 每个张量的 `grad_fn` 指回产生它的运算节点,`backward()` 从根出发沿图反向应用链式法则,把梯度累加进叶子的 `.grad`。
  - 采用反向模式自动微分(reverse-mode AD),一次前向 + 一次反向即可得到所有参数梯度,复杂度与输出个数无关——这正是深度学习「单输出(标量 loss)、海量参数」场景的最佳匹配。

  &lt;details&gt;

- **Q2**: 为什么训练循环里必须先 `optimizer.zero_grad()` 再 `backward()`?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - PyTorch 默认把梯度**累加**到 `.grad`(`+=`)而非覆盖,这是为支持梯度累加(模拟大 batch)和多 loss 共用参数而设计。
  - 若不清零,上一轮的梯度会残留并叠加到本轮,等价于用了错误的、持续膨胀的梯度,loss 不降反升。
  - 顺序:`zero_grad()` 清空 → `backward()` 写入本轮梯度 → `step()` 消费梯度更新。
  - 例外:做梯度累加时,有意在多个 micro-batch 间不清零,每 N 步才 `step()` 一次。

  &lt;details&gt;

- **Q3**: 动态图(define-by-run)相比静态图(define-and-run)有什么优劣?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - 动态图每次前向即时建图,可用原生 Python 控制流、直接 print/pdb 调试,开发体验好;PyTorch、TF2 eager 属此类。
  - 静态图先定义完整图再编译执行,便于全局优化(算子融合、显存复用)和跨平台部署,但调试难;TF1 属此类。
  - 现代方案趋于融合:PyTorch 提供 `torch.compile` / TorchScript 把动态图捕获成静态图用于部署提速;TF2 用 `@tf.function` 反向从 eager 生成静态图。

  &lt;details&gt;

- **Q4**: `torch.no_grad()` 和 `model.eval()` 有什么区别,能互相替代吗?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - 不能替代,二者作用层面不同:`no_grad()` 是上下文管理器,关闭梯度追踪、不建图,省显存算力;`model.eval()` 切换模块模式,影响 Dropout(关闭随机丢弃)和 BatchNorm(用 running 统计而非 batch 统计)等层的前向行为。
  - 评估/推理时应**同时**用:`model.eval()` 保证结果确定性,`torch.no_grad()` 保证不浪费显存。
  - 只用 `no_grad()` 而忘了 `eval()`:虽省显存,但 Dropout/BN 仍按训练模式工作,结果仍随机。

  &lt;details&gt;

- **Q5**: `loss.backward()` 之后计算图还在吗?什么是 `retain_graph`?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - 默认 `backward()` 执行后会**释放**计算图以回收内存,再对同一图二次反向会报 `Trying to backward through the graph a second time`。
  - `loss.backward(retain_graph=True)` 保留图,允许再次反向,用于:多 loss 分支共享部分网络、GAN 判别器/生成器分别反向、RNN 截断反向传播(BPTT)。
  - 代价是显存不释放,滥用会导致显存持续上涨;能不用就不用。

  &lt;details&gt;

## 延伸资源

- [PyTorch 官方文档](https://pytorch.org/docs/stable/index.html)
- [Autograd 机制详解](https://pytorch.org/docs/stable/autograd.html)
- [官方入门教程 Learn the Basics](https://pytorch.org/tutorials/beginner/basics/intro.html)
- 书籍:《Deep Learning with PyTorch》(Eli Stevens 等)

## (留白) 我的理解

> 这一段不强制填。学完后用自己的话复述、记下踩过的坑、和其他知识的连接。AI 写不出这段。

<!-- KNOWLEDGE-IMPORT:END -->
