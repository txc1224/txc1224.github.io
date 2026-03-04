---
title: '设计模式 / 错误处理'
order: 8
---

# 设计模式 / 错误处理

> JS 中最实用的设计模式和错误处理方案，用最少的代码解决最常见的架构问题。

---

## 常见设计模式对比

| 模式   | 解决的问题      | 核心思路                     | 典型场景               |
| ------ | --------------- | ---------------------------- | ---------------------- |
| 单例   | 全局唯一实例    | 缓存实例，重复调用返回同一个 | Store、数据库连接      |
| 观察者 | 一对多通知      | 维护监听列表，变化时遍历通知 | EventEmitter、事件总线 |
| 策略   | 消除 if-else 链 | 将算法封装为独立函数/对象    | 折扣计算、表单校验     |
| 代理   | 控制对象访问    | 包装原始对象，拦截操作       | 缓存、权限、日志       |
| 工厂   | 创建复杂对象    | 封装 new 逻辑                | 组件创建、数据库适配   |

---

## 单例模式

```js
// 模块级单例（ESM 天然单例）
// store.js
let instance = null;
export function getStore() {
  if (!instance) instance = createStore();
  return instance;
}

// Class 实现
class Singleton {
  static #instance = null;
  static getInstance() {
    if (!this.#instance) this.#instance = new Singleton();
    return this.#instance;
  }
  constructor() {
    if (Singleton.#instance) throw new Error('Use getInstance()');
  }
}
```

---

## 观察者 / 发布订阅

```js
class EventEmitter {
  #listeners = new Map();

  on(event, fn) {
    if (!this.#listeners.has(event)) this.#listeners.set(event, []);
    this.#listeners.get(event).push(fn);
    return this; // 链式调用
  }

  once(event, fn) {
    const wrapper = (...args) => {
      fn(...args);
      this.off(event, wrapper);
    };
    return this.on(event, wrapper);
  }

  off(event, fn) {
    const fns = this.#listeners.get(event);
    if (fns)
      this.#listeners.set(
        event,
        fns.filter((f) => f !== fn),
      );
    return this;
  }

  emit(event, ...args) {
    this.#listeners.get(event)?.forEach((fn) => fn(...args));
    return this;
  }
}
```

---

## 策略模式

```js
// ❌ if-else 链（难以扩展）
function getDiscount(type, price) {
  if (type === 'vip') return price * 0.8;
  if (type === 'svip') return price * 0.6;
  return price;
}

// ✅ 策略模式（新增类型无需修改已有代码）
const strategies = {
  regular: (price) => price,
  vip: (price) => price * 0.8,
  svip: (price) => price * 0.6,
};
const getDiscount = (type, price) => (strategies[type] ?? strategies.regular)(price);
```

---

## 代理模式

```js
// 缓存代理
function withCache(fn) {
  const cache = new Map();
  return function (...args) {
    const key = JSON.stringify(args);
    if (cache.has(key)) return cache.get(key);
    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  };
}

const cachedFetch = withCache(async (url) => {
  const res = await fetch(url);
  return res.json();
});
```

---

## 错误处理最佳实践

### 自定义 Error 类

```js
class AppError extends Error {
  constructor(message, code, status = 500) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.status = status;
    Error.captureStackTrace(this, this.constructor);
  }
}

class NotFoundError extends AppError {
  constructor(resource) {
    super(`${resource} not found`, 'NOT_FOUND', 404);
  }
}
```

### 全局错误捕获

```js
// 浏览器
window.onerror = (msg, src, line, col, err) => {
  reportError({ msg, src, line, err });
  return true; // 阻止默认行为
};
window.addEventListener('unhandledrejection', (e) => {
  reportError(e.reason);
  e.preventDefault();
});

// Node.js
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception', err);
  process.exit(1); // 进程状态已不可信
});
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection', reason);
});
```

---

## 错误处理陷阱

```js
// ❌ 吞掉异常
try {
  riskyOperation();
} catch (e) {} // 错误消失了

// ✅ 至少记录日志
try {
  riskyOperation();
} catch (e) {
  logger.error(e);
}
```

```js
// ❌ catch 后链式调用继续执行
fetch('/api')
  .catch((err) => console.error(err))
  .then((data) => console.log(data)); // 仍然执行，data 为 undefined

// ✅ catch 中重新抛出
fetch('/api')
  .catch((err) => {
    console.error(err);
    throw err;
  })
  .then((data) => console.log(data)); // 不会执行
```

```js
// ✅ to 函数：将 Promise 转为 [err, data] 元组
const to = (promise) => promise.then((data) => [null, data]).catch((err) => [err, null]);

const [err, user] = await to(fetchUser(1));
if (err) return handleError(err);
```
