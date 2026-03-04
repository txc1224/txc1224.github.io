---
title: '类型判断 / 深拷贝'
order: 5
---

# 类型判断 / 深拷贝

> JS 有 8 种数据类型，类型判断方式各有优劣；深拷贝方案选择取决于数据复杂度。

---

## 数据类型总览

| 类型        | typeof 返回值 | 分类     | 示例                     |
| ----------- | ------------- | -------- | ------------------------ |
| `undefined` | `'undefined'` | 基本类型 | `let x`                  |
| `null`      | `'object'` ⚠️ | 基本类型 | `null`                   |
| `boolean`   | `'boolean'`   | 基本类型 | `true`                   |
| `number`    | `'number'`    | 基本类型 | `42`, `NaN`, `Infinity`  |
| `bigint`    | `'bigint'`    | 基本类型 | `9007199254740993n`      |
| `string`    | `'string'`    | 基本类型 | `'hello'`                |
| `symbol`    | `'symbol'`    | 基本类型 | `Symbol('id')`           |
| `object`    | `'object'`    | 引用类型 | `{}`, `[]`, `new Date()` |
| `function`  | `'function'`  | 引用类型 | `() => {}`               |

---

## 类型判断方法对比

| 方法                        | 优点         | 缺点                                      | 适用场景       |
| --------------------------- | ------------ | ----------------------------------------- | -------------- |
| `typeof`                    | 简单快速     | null 返回 `'object'`，数组也是 `'object'` | 基本类型判断   |
| `instanceof`                | 判断原型链   | 跨 iframe 失效，基本类型不行              | 判断类实例     |
| `Array.isArray`             | 准确判断数组 | 只能判断数组                              | 数组判断       |
| `Object.prototype.toString` | 最精确       | 写法略长                                  | 万能判断       |
| `Number.isNaN`              | 严格判断 NaN | 只能判断 NaN                              | 替代全局 isNaN |

```js
// typeof 的局限
typeof null; // 'object' ⚠️ 历史遗留 bug
typeof []; // 'object' ⚠️ 无法区分数组
typeof NaN; // 'number' ⚠️ NaN 也是 number

// 精确判断：Object.prototype.toString
function typeOf(val) {
  return Object.prototype.toString.call(val).slice(8, -1).toLowerCase();
}
typeOf(null); // 'null'
typeOf([]); // 'array'
typeOf(new Date()); // 'date'
typeOf(/reg/); // 'regexp'
typeOf(new Map()); // 'map'
```

---

## 类型转换规则

```js
// ❌ 隐式转换陷阱
'5' + 3       // '53'（字符串拼接）
'5' - 3       // 2（数字运算）
true + 1      // 2
[] + {}        // '[object Object]'
{} + []        // 0（{} 被解析为空代码块）

// ✅ 显式转换
Number('123')   // 123
String(123)     // '123'
Boolean('')     // false
parseInt('10px') // 10
+'123'          // 123（一元加号转数字）
```

### falsy 值完整列表

```js
// 以下 7 个值转布尔为 false，其余全部为 true
false, 0, -0, 0n, '', null, undefined, NaN;
```

---

## == vs ===

```js
// ❌ 使用 == 会触发隐式类型转换
0 == ''; // true
0 == false; // true
null == undefined; // true
'' == false; // true

// ✅ 始终使用 ===（严格相等）
0 === ''; // false
0 === false; // false
null === undefined; // false
```

> 唯一例外：`val == null` 等价于 `val === null || val === undefined`，可以接受。

---

## 深拷贝方案对比

| 方案                           | 循环引用 | Date/RegExp | 函数    | 性能 | 推荐         |
| ------------------------------ | -------- | ----------- | ------- | ---- | ------------ |
| `JSON.parse(JSON.stringify())` | ❌ 报错  | ❌ 丢失     | ❌ 丢失 | 快   | 简单数据     |
| `structuredClone()`            | ✅       | ✅          | ❌ 报错 | 快   | ✅ 首选      |
| 手写递归                       | ✅       | ✅          | ✅      | 中   | 需要拷贝函数 |
| lodash `_.cloneDeep`           | ✅       | ✅          | ✅      | 慢   | 兼容旧环境   |

```js
// 方案一：JSON（简单场景）
const clone1 = JSON.parse(JSON.stringify(obj));

// 方案二：structuredClone（推荐，Node 17+ / 现代浏览器）
const clone2 = structuredClone(obj);

// 方案三：手写深拷贝（含循环引用处理）
function deepClone(val, cache = new WeakMap()) {
  if (val === null || typeof val !== 'object') return val;
  if (cache.has(val)) return cache.get(val);

  const clone = Array.isArray(val) ? [] : {};
  cache.set(val, clone);

  for (const key of Reflect.ownKeys(val)) {
    clone[key] = deepClone(val[key], cache);
  }
  return clone;
}
```

---

## 常见陷阱

```js
// ❌ NaN 不等于自身
NaN === NaN; // false

// ✅ 使用 Number.isNaN 或 Object.is
Number.isNaN(NaN); // true
Object.is(NaN, NaN); // true

// ❌ 全局 isNaN 会先转换类型
isNaN('hello'); // true（先转为 NaN 再判断）
Number.isNaN('hello'); // false（严格判断）
```

```js
// ❌ 浮点数精度问题
0.1 + 0.2 === 0.3; // false

// ✅ 使用 epsilon 比较
Math.abs(0.1 + 0.2 - 0.3) < Number.EPSILON; // true
```
