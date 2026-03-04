# JavaScript 核心知识

> 常用知识点、易混淆概念与最佳实践备忘。

## 变量与作用域

### var / let / const 区别

| | `var` | `let` | `const` |
|--|-------|-------|---------|
| 作用域 | 函数作用域 | 块作用域 | 块作用域 |
| 变量提升 | ✅（值为 undefined） | ✅（暂时性死区） | ✅（暂时性死区） |
| 重复声明 | ✅ | ❌ | ❌ |
| 重新赋值 | ✅ | ✅ | ❌ |

```js
// var 提升陷阱
console.log(a) // undefined（不报错）
var a = 1

// let 暂时性死区
console.log(b) // ReferenceError
let b = 1

// const 只是引用不可变，对象内部可修改
const obj = { x: 1 }
obj.x = 2 // ✅ 合法
obj = {}   // ❌ TypeError
```

### 作用域链

函数在**定义时**确定作用域（词法作用域），查找变量时从当前作用域逐级向上。

```js
const x = 'global'
function outer() {
  const x = 'outer'
  function inner() {
    console.log(x) // 'outer'（词法作用域，不是调用时决定）
  }
  inner()
}
```

---

## 闭包

闭包 = 函数 + 其定义时所在的词法环境。函数可以"记住"并访问其外部作用域的变量，即使外部函数已执行完毕。

```js
function makeCounter(start = 0) {
  let count = start
  return {
    increment: () => ++count,
    decrement: () => --count,
    value: () => count,
  }
}

const counter = makeCounter(10)
counter.increment() // 11
counter.increment() // 12
counter.value()     // 12
```

### 常见陷阱：循环中的闭包

```js
// ❌ 错误：所有回调共享同一个 i
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 0) // 3 3 3
}

// ✅ 用 let（块作用域，每次迭代独立）
for (let i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 0) // 0 1 2
}
```

### 实际应用

```js
// 函数工厂
function multiply(factor) {
  return (n) => n * factor
}
const double = multiply(2)
const triple = multiply(3)
double(5) // 10

// 私有变量模拟
function createStore(initial) {
  let state = initial
  return {
    get: () => state,
    set: (val) => { state = val },
  }
}
```

---

## 原型链

每个对象都有一个内部属性 `[[Prototype]]`（可通过 `__proto__` 访问），指向其原型对象。查找属性时沿链向上，直到 `null`。

```
obj → Object.prototype → null
arr → Array.prototype → Object.prototype → null
fn  → Function.prototype → Object.prototype → null
```

```js
function Animal(name) {
  this.name = name
}
Animal.prototype.speak = function () {
  return `${this.name} makes a sound`
}

const dog = new Animal('Dog')
dog.speak()                         // 'Dog makes a sound'
dog.hasOwnProperty('name')          // true
dog.hasOwnProperty('speak')         // false（在原型上）
Object.getPrototypeOf(dog) === Animal.prototype // true
```

### class 语法糖

`class` 本质上是构造函数 + 原型的语法糖，行为完全等价。

```js
class Animal {
  #name // 私有字段（ES2022）

  constructor(name) {
    this.#name = name
  }

  speak() {
    return `${this.#name} makes a sound`
  }

  static create(name) {
    return new Animal(name)
  }
}

class Dog extends Animal {
  constructor(name) {
    super(name) // 必须先调用 super
  }

  speak() {
    return super.speak() + ' (woof!)'
  }
}

const d = Dog.create('Rex')
d.speak() // 'Rex makes a sound (woof!)'
```

### instanceof 原理

```js
// instanceof 检查右侧构造函数的 prototype 是否在左侧对象的原型链上
dog instanceof Animal // true
dog instanceof Object // true

// 手写 instanceof
function myInstanceof(obj, Ctor) {
  let proto = Object.getPrototypeOf(obj)
  while (proto !== null) {
    if (proto === Ctor.prototype) return true
    proto = Object.getPrototypeOf(proto)
  }
  return false
}
```

---

## 异步编程

### Event Loop

JS 是单线程的，通过事件循环处理异步：
1. 执行同步代码（调用栈）
2. 执行所有**微任务**（Promise.then、queueMicrotask）
3. 执行一个**宏任务**（setTimeout、setInterval、I/O）
4. 重复 2-3

```js
console.log('1')
setTimeout(() => console.log('2'), 0)
Promise.resolve().then(() => console.log('3'))
console.log('4')

// 输出顺序：1 → 4 → 3 → 2
// 宏任务：setTimeout
// 微任务：Promise.then（优先级更高）
```

### Promise

```js
// 基础用法
fetch('/api/user')
  .then((res) => res.json())
  .then((data) => console.log(data))
  .catch((err) => console.error(err))
  .finally(() => console.log('done'))

// 并发
const [user, posts] = await Promise.all([
  fetch('/api/user').then(r => r.json()),
  fetch('/api/posts').then(r => r.json()),
])

// 竞速（第一个完成的）
const result = await Promise.race([fetchA(), fetchB()])

// 全部结果（不管成功失败）
const results = await Promise.allSettled([fetchA(), fetchB()])
results.forEach(r => {
  if (r.status === 'fulfilled') console.log(r.value)
  else console.error(r.reason)
})
```

### async / await

```js
async function getUser(id) {
  try {
    const res = await fetch(`/api/users/${id}`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } catch (err) {
    console.error('Failed to fetch user:', err)
    throw err // 记得重新抛出，否则调用方拿不到错误
  }
}

// 顺序 vs 并发
async function sequential() {
  const a = await fetchA() // 等 A 完成再请求 B
  const b = await fetchB()
}

async function concurrent() {
  const [a, b] = await Promise.all([fetchA(), fetchB()]) // 同时请求
}
```

---

## ES6+ 常用特性

### 解构赋值

```js
// 数组解构
const [first, , third, fourth = 'default'] = [1, 2, 3]

// 对象解构 + 重命名 + 默认值
const { name: userName = 'anonymous', age } = { age: 18 }

// 函数参数解构
function greet({ name = 'World', greeting = 'Hello' } = {}) {
  return `${greeting}, ${name}!`
}
```

### 展开 / 剩余运算符

```js
// 展开
const arr = [...[1, 2], ...[3, 4]]     // [1, 2, 3, 4]
const obj = { ...defaults, ...overrides } // 对象合并，后者覆盖前者

// 剩余参数
function sum(first, ...rest) {
  return rest.reduce((acc, n) => acc + n, first)
}
sum(1, 2, 3, 4) // 10
```

### 可选链与空值合并

```js
const user = null

// 可选链 ?.（避免 Cannot read property of null）
const city = user?.address?.city        // undefined（不报错）
const fn = user?.greet?.()              // 方法也适用

// 空值合并 ??（只在 null / undefined 时取默认值）
const name = user?.name ?? 'anonymous'  // 'anonymous'

// 注意区分 ?? 和 ||
0 || 'default'  // 'default'（0 是 falsy）
0 ?? 'default'  // 0（0 不是 null/undefined）
```

### 模块系统

```js
// ESM（浏览器/现代 Node）
export const PI = 3.14
export function add(a, b) { return a + b }
export default class Calculator {}

import Calculator, { PI, add } from './math.js'
import * as math from './math.js'

// 动态导入（懒加载）
const module = await import('./heavy-module.js')
```

### 其他常用特性

```js
// 模板字符串
const msg = `Hello, ${name}! You have ${count} messages.`

// 短路赋值
x ||= 'default'  // 等价于 x = x || 'default'
x &&= transform(x)
x ??= 'fallback'

// Object 工具方法
Object.entries({ a: 1, b: 2 })  // [['a', 1], ['b', 2]]
Object.fromEntries([['a', 1]])   // { a: 1 }
Object.keys / Object.values

// Array 工具方法
[1, [2, [3]]].flat(Infinity)     // [1, 2, 3]
[1, 2, 3].at(-1)                 // 3（负索引）
[1, 2, 3].findLast(n => n < 3)  // 2

// 逻辑赋值（ES2021）
// 数组转对象
const obj = Object.fromEntries(
  ['a', 'b', 'c'].map((k, i) => [k, i])
)  // { a: 0, b: 1, c: 2 }
```

---

## 函数技巧

### 防抖与节流

```js
// 防抖：停止操作 n ms 后才执行（搜索框输入）
function debounce(fn, delay) {
  let timer
  return function (...args) {
    clearTimeout(timer)
    timer = setTimeout(() => fn.apply(this, args), delay)
  }
}

// 节流：每 n ms 最多执行一次（滚动、resize）
function throttle(fn, interval) {
  let last = 0
  return function (...args) {
    const now = Date.now()
    if (now - last >= interval) {
      last = now
      fn.apply(this, args)
    }
  }
}
```

### 柯里化

```js
// 将多参数函数转为一系列单参数函数
const curry = (fn) => {
  const arity = fn.length
  return function curried(...args) {
    if (args.length >= arity) return fn(...args)
    return (...more) => curried(...args, ...more)
  }
}

const add = curry((a, b, c) => a + b + c)
add(1)(2)(3) // 6
add(1, 2)(3) // 6
add(1)(2, 3) // 6
```

---

## 类型判断

```js
// typeof 的局限：null 返回 'object'，Array 返回 'object'
typeof null        // 'object' ⚠️
typeof []          // 'object' ⚠️
typeof function(){} // 'function'

// 精确判断：Object.prototype.toString
function typeOf(val) {
  return Object.prototype.toString.call(val).slice(8, -1).toLowerCase()
}
typeOf(null)      // 'null'
typeOf([])        // 'array'
typeOf(new Date)  // 'date'
typeOf(/reg/)     // 'regexp'

// 实用判断
Array.isArray([])          // true
Number.isNaN(NaN)          // true（比 isNaN 更安全）
Number.isFinite(Infinity)  // false
```

---

## 深拷贝

```js
// 简单场景（不含 Date、RegExp、函数、循环引用）
const clone = JSON.parse(JSON.stringify(obj))

// 现代方案（支持更多类型，Node 17+ / 浏览器）
const clone = structuredClone(obj)

// 手写深拷贝（含循环引用处理）
function deepClone(val, cache = new WeakMap()) {
  if (val === null || typeof val !== 'object') return val
  if (cache.has(val)) return cache.get(val)

  const clone = Array.isArray(val) ? [] : {}
  cache.set(val, clone)

  for (const key of Reflect.ownKeys(val)) {
    clone[key] = deepClone(val[key], cache)
  }
  return clone
}
```
