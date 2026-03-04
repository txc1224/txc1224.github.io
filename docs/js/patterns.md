# 设计模式 / 错误处理

## 常见设计模式

### 单例模式

```js
// 模块级单例（ESM 天然单例）
// store.js
let instance = null
export function getStore() {
  if (!instance) instance = createStore()
  return instance
}

// Class 实现
class Singleton {
  static #instance = null
  static getInstance() {
    if (!this.#instance) this.#instance = new Singleton()
    return this.#instance
  }
  private constructor() {}
}
```

### 观察者 / 发布订阅

```js
// EventEmitter 手写
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

### 策略模式

```js
// ❌ if-else 链（难以扩展）
function getDiscount(userType, price) {
  if (userType === 'vip') return price * 0.8;
  if (userType === 'svip') return price * 0.6;
  return price;
}

// ✅ 策略模式（新增类型无需修改已有代码）
const discountStrategies = {
  regular: (price) => price,
  vip: (price) => price * 0.8,
  svip: (price) => price * 0.6,
};
const getDiscount = (userType, price) => (discountStrategies[userType] ?? discountStrategies.regular)(price);
```

---

## 错误处理最佳实践

### 自定义 Error 类

```js
// 携带 code 和 status 的业务错误
class AppError extends Error {
  constructor(message, code, status = 500) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.status = status;
    Error.captureStackTrace(this, this.constructor); // V8 优化堆栈
  }
}

class NotFoundError extends AppError {
  constructor(resource) {
    super(`${resource} not found`, 'NOT_FOUND', 404);
  }
}

// 使用
throw new NotFoundError('User');
```

### 全局错误捕获

```js
// 浏览器：捕获同步错误
window.onerror = (msg, src, line, col, err) => {
  reportError({ msg, src, line, err });
  return true; // 阻止默认行为（控制台打印）
};

// 浏览器：捕获未处理的 Promise rejection
window.addEventListener('unhandledrejection', (e) => {
  reportError(e.reason);
  e.preventDefault();
});

// Node.js
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception', err);
  process.exit(1); // 必须退出，进程状态已不可信
});
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection', reason);
});
```

### try/catch 对比

```js
// ✅ async/await 错误处理
async function fetchUser(id) {
  try {
    const res = await fetch(`/api/users/${id}`);
    if (!res.ok) throw new AppError(`HTTP ${res.status}`, 'HTTP_ERROR', res.status);
    return await res.json();
  } catch (err) {
    if (err instanceof AppError) throw err; // 业务错误直接上抛
    throw new AppError('Network error', 'NETWORK_ERROR'); // 包装底层错误
  }
}

// 工具函数：将 Promise 转为 [err, data] 元组（避免嵌套 try/catch）
const to = (promise) => promise.then((data) => [null, data]).catch((err) => [err, null]);

const [err, user] = await to(fetchUser(1));
if (err) return handleError(err);
```
