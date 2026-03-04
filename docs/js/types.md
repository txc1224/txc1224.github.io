# 类型判断 / 深拷贝

## 类型判断

```js
// typeof 的局限：null 返回 'object'，Array 返回 'object'
typeof null; // 'object' ⚠️
typeof []; // 'object' ⚠️
typeof function () {}; // 'function'

// 精确判断：Object.prototype.toString
function typeOf(val) {
  return Object.prototype.toString.call(val).slice(8, -1).toLowerCase();
}
typeOf(null); // 'null'
typeOf([]); // 'array'
typeOf(new Date()); // 'date'
typeOf(/reg/); // 'regexp'

// 实用判断
Array.isArray([]); // true
Number.isNaN(NaN); // true（比 isNaN 更安全）
Number.isFinite(Infinity); // false
```

---

## 深拷贝

```js
// 简单场景（不含 Date、RegExp、函数、循环引用）
const clone = JSON.parse(JSON.stringify(obj));

// 现代方案（支持更多类型，Node 17+ / 浏览器）
const clone = structuredClone(obj);

// 手写深拷贝（含循环引用处理）
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
