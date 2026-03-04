# ES6+ / 函数技巧

## ES6+ 常用特性

### 解构赋值

```js
// 数组解构
const [first, , third, fourth = 'default'] = [1, 2, 3];

// 对象解构 + 重命名 + 默认值
const { name: userName = 'anonymous', age } = { age: 18 };

// 函数参数解构
function greet({ name = 'World', greeting = 'Hello' } = {}) {
  return `${greeting}, ${name}!`;
}
```

### 展开 / 剩余运算符

```js
// 展开
const arr = [...[1, 2], ...[3, 4]]; // [1, 2, 3, 4]
const obj = { ...defaults, ...overrides }; // 对象合并，后者覆盖前者

// 剩余参数
function sum(first, ...rest) {
  return rest.reduce((acc, n) => acc + n, first);
}
sum(1, 2, 3, 4); // 10
```

### 可选链与空值合并

```js
const user = null;

// 可选链 ?.（避免 Cannot read property of null）
const city = user?.address?.city; // undefined（不报错）
const fn = user?.greet?.(); // 方法也适用

// 空值合并 ??（只在 null / undefined 时取默认值）
const name = user?.name ?? 'anonymous'; // 'anonymous'

// 注意区分 ?? 和 ||
0 || 'default'; // 'default'（0 是 falsy）
0 ?? 'default'; // 0（0 不是 null/undefined）
```

### 模块系统

```js
// ESM（浏览器/现代 Node）
export const PI = 3.14;
export function add(a, b) {
  return a + b;
}
export default class Calculator {}

import Calculator, { PI, add } from './math.js';
import * as math from './math.js';

// 动态导入（懒加载）
const module = await import('./heavy-module.js');
```

### 其他常用特性

```js
// 模板字符串
const msg = `Hello, ${name}! You have ${count} messages.`;

// 短路赋值
x ||= 'default'; // 等价于 x = x || 'default'
x &&= transform(x);
x ??= 'fallback';

// Object 工具方法
Object.entries({ a: 1, b: 2 }); // [['a', 1], ['b', 2]]
Object.fromEntries([['a', 1]]); // { a: 1 }
Object.keys /
  Object.values[
    // Array 工具方法
    (1, [2, [3]])
  ]
    .flat(Infinity) // [1, 2, 3]
    [(1, 2, 3)].at(-1) // 3（负索引）
    [(1, 2, 3)].findLast((n) => n < 3); // 2

// 逻辑赋值（ES2021）
// 数组转对象
const obj = Object.fromEntries(['a', 'b', 'c'].map((k, i) => [k, i])); // { a: 0, b: 1, c: 2 }
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
// 将多参数函数转为一系列单参数函数
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
add(1)(2, 3); // 6
```
