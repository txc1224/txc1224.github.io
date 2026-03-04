---
title: 'ES6+ / 函数技巧'
order: 4
---

# ES6+ / 函数技巧

> ES6+ 引入了大量语法糖和新 API，掌握解构、展开、可选链、模块等特性是现代 JS 开发的基础。

---

## ES6+ 核心特性速查

| 特性              | 版本   | 说明                  |
| ----------------- | ------ | --------------------- | ------ | -------- |
| `let` / `const`   | ES6    | 块级作用域            |
| 箭头函数          | ES6    | `() => {}`            |
| 解构赋值          | ES6    | `const { a } = obj`   |
| 模板字符串        | ES6    | `` `${name}` ``       |
| `...` 展开/剩余   | ES6    | 展开数组/对象         |
| `Promise`         | ES6    | 异步编程              |
| `class`           | ES6    | 语法糖                |
| `async/await`     | ES2017 | 异步语法糖            |
| `?.` 可选链       | ES2020 | 安全访问属性          |
| `??` 空值合并     | ES2020 | null/undefined 默认值 |
| `                 |        | =` `&&=` `??=`        | ES2021 | 逻辑赋值 |
| `.at()`           | ES2022 | 负索引                |
| `structuredClone` | ES2022 | 深拷贝                |

---

## 解构赋值

```js
// 数组解构
const [first, , third, fourth = 'default'] = [1, 2, 3];

// 对象解构 + 重命名 + 默认值
const { name: userName = 'anonymous', age } = { age: 18 };

// 嵌套解构
const {
  address: { city },
} = { address: { city: 'Beijing' } };

// 函数参数解构
function greet({ name = 'World', greeting = 'Hello' } = {}) {
  return `${greeting}, ${name}!`;
}
```

---

## 展开 / 剩余运算符

```js
// 展开
const arr = [...[1, 2], ...[3, 4]]; // [1, 2, 3, 4]
const obj = { ...defaults, ...overrides }; // 对象合并，后者覆盖前者

// 剩余参数
function sum(first, ...rest) {
  return rest.reduce((acc, n) => acc + n, first);
}
```

```js
// ❌ 展开只做浅拷贝
const original = { a: { b: 1 } };
const copy = { ...original };
copy.a.b = 2;
console.log(original.a.b); // 2（原对象也被修改）

// ✅ 深层对象需要深拷贝
const copy = structuredClone(original);
```

---

## 可选链与空值合并

```js
const user = null;

// 可选链 ?.（避免 Cannot read property of null）
const city = user?.address?.city; // undefined（不报错）
const fn = user?.greet?.(); // 方法也适用
const val = arr?.[0]; // 数组也适用

// 空值合并 ??（只在 null / undefined 时取默认值）
const name = user?.name ?? 'anonymous';
```

### ?? vs ||

```js
// ❌ || 把所有 falsy 值都替换
0 || 'default'; // 'default'（0 是 falsy）
'' || 'default'; // 'default'

// ✅ ?? 只替换 null 和 undefined
0 ?? 'default'; // 0
'' ?? 'default'; // ''
null ?? 'default'; // 'default'
```

---

## 模块系统

```js
// ESM 导出
export const PI = 3.14;
export function add(a, b) {
  return a + b;
}
export default class Calculator {}

// ESM 导入
import Calculator, { PI, add } from './math.js';
import * as math from './math.js';

// 动态导入（懒加载 / 代码分割）
const module = await import('./heavy-module.js');
```

---

## 实用新 API

```js
// Object 工具方法
Object.entries({ a: 1, b: 2 }); // [['a', 1], ['b', 2]]
Object.fromEntries([['a', 1]]); // { a: 1 }
Object.keys({ a: 1, b: 2 }); // ['a', 'b']
Object.values({ a: 1, b: 2 }) // [1, 2]

  [
    // Array 新方法
    (1, [2, [3]])
  ].flat(Infinity) // [1, 2, 3]
  [(1, 2, 3)].at(-1) // 3（负索引）
  [(1, 2, 3)].findLast((n) => n < 3); // 2

// 逻辑赋值（ES2021）
x ||= 'default'; // x = x || 'default'
x &&= transform(x);
x ??= 'fallback'; // x = x ?? 'fallback'

// WeakRef / FinalizationRegistry（ES2021）
const weakRef = new WeakRef(largeObj); // 弱引用，不阻止 GC
weakRef.deref(); // 获取对象，可能为 undefined
```

---

## 函数技巧

### 防抖与节流

```js
// 防抖：停止操作 n ms 后才执行（搜索框输入）
function debounce(fn, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

// 节流：每 n ms 最多执行一次（滚动、resize）
function throttle(fn, interval) {
  let last = 0;
  return function (...args) {
    const now = Date.now();
    if (now - last >= interval) {
      last = now;
      fn.apply(this, args);
    }
  };
}
```

### 柯里化

```js
const curry = (fn) => {
  const arity = fn.length;
  return function curried(...args) {
    if (args.length >= arity) return fn(...args);
    return (...more) => curried(...args, ...more);
  };
};

const add = curry((a, b, c) => a + b + c);
add(1)(2)(3); // 6
add(1, 2)(3); // 6
```
