---
title: 'Map & Set / Generator / Proxy / Symbol'
order: 6
---

# Map & Set / Generator / Proxy / Symbol

## Map / Set / WeakMap / WeakSet

### Map vs Object

|        | `Map`        | `Object`                 |
| ------ | ------------ | ------------------------ |
| 键类型 | 任意类型     | 仅字符串/Symbol          |
| 有序性 | 插入顺序     | 不保证（现代JS基本有序） |
| 大小   | `.size`      | `Object.keys().length`   |
| 迭代   | 内置可迭代   | 需转换                   |
| 性能   | 频繁增删更优 | 普通读写更优             |

```js
const map = new Map()
map.set('key', 'value')
map.set({ id: 1 }, 'obj-key') // 对象作为键
map.get('key')        // 'value'
map.has('key')        // true
map.delete('key')
map.size              // 剩余条目数

// 迭代
for (const [k, v] of map) { /* ... */ }
map.forEach((v, k) => { /* ... */ })
[...map.keys()]
[...map.values()]
[...map.entries()]
```

### Set

```js
const set = new Set([1, 2, 3, 2, 1]); // 自动去重 => {1, 2, 3}

// 数组去重
const unique = [...new Set(arr)];

// 集合运算
const a = new Set([1, 2, 3]);
const b = new Set([2, 3, 4]);

const union = new Set([...a, ...b]); // {1,2,3,4}
const intersection = new Set([...a].filter((x) => b.has(x))); // {2,3}
const difference = new Set([...a].filter((x) => !b.has(x))); // {1}
```

### WeakMap / WeakSet

```js
// WeakMap：键必须是对象，弱引用（不阻止GC）
const wm = new WeakMap();
let obj = { data: 'secret' };
wm.set(obj, { meta: 'extra' });
obj = null; // obj 可被垃圾回收，WeakMap 中的条目自动清理

// 典型用例：关联私有数据，不影响对象生命周期
const privateData = new WeakMap();
class User {
  constructor(name) {
    privateData.set(this, { name });
  }
  getName() {
    return privateData.get(this).name;
  }
}
```

---

## Generator & Iterator

```js
// Generator 函数：用 yield 暂停执行
function* range(start, end, step = 1) {
  for (let i = start; i < end; i += step) yield i
}

const r = range(0, 10, 2)
r.next() // { value: 0, done: false }
r.next() // { value: 2, done: false }
[...range(0, 5)] // [0, 1, 2, 3, 4]

// 手写可迭代对象（实现 Symbol.iterator）
const range2 = {
  from: 1, to: 5,
  [Symbol.iterator]() {
    let cur = this.from
    return {
      next: () => cur <= this.to
        ? { value: cur++, done: false }
        : { done: true }
    }
  }
}
[...range2] // [1, 2, 3, 4, 5]

// 无限序列（懒求值）
function* fibonacci() {
  let [a, b] = [0, 1]
  while (true) {
    yield a;
    [a, b] = [b, a + b]
  }
}

// 异步生成器（分页请求）
async function* paginate(url) {
  let page = 1
  while (true) {
    const res = await fetch(`${url}?page=${page}`)
    const data = await res.json()
    if (!data.items.length) return
    yield data.items
    page++
  }
}

for await (const items of paginate('/api/users')) {
  console.log(items)
}
```

---

## Proxy & Reflect

```js
// 基础拦截
const handler = {
  get(target, key, receiver) {
    console.log(`读取: ${key}`);
    return Reflect.get(target, key, receiver); // 配合 Reflect 转发
  },
  set(target, key, value, receiver) {
    console.log(`设置: ${key} = ${value}`);
    return Reflect.set(target, key, value, receiver);
  },
  has(target, key) {
    return key in target;
  },
  deleteProperty(target, key) {
    console.log(`删除: ${key}`);
    return Reflect.deleteProperty(target, key);
  },
};

const proxy = new Proxy({ name: 'foo' }, handler);

// 响应式数据（Vue3 原理简化版）
function reactive(obj) {
  return new Proxy(obj, {
    get(target, key, receiver) {
      track(target, key); // 依赖收集
      return Reflect.get(target, key, receiver);
    },
    set(target, key, value, receiver) {
      const result = Reflect.set(target, key, value, receiver);
      trigger(target, key); // 触发更新
      return result;
    },
  });
}

// Reflect：提供操作对象的标准方法，与 Proxy trap 一一对应
Reflect.has(obj, 'key'); // 等价于 'key' in obj
Reflect.ownKeys(obj); // 等价于 Object.getOwnPropertyNames + getOwnPropertySymbols
Reflect.deleteProperty(obj, 'k'); // 等价于 delete obj.k
```

---

## Symbol

```js
// 唯一标识符，即使描述相同也不相等
const s1 = Symbol('id');
const s2 = Symbol('id');
s1 === s2; // false

// 防止属性名冲突（常用于库/框架）
const ID = Symbol('id');
obj[ID] = 123; // 不会覆盖 obj.id

// 全局 Symbol 注册表（跨模块共享）
const shared = Symbol.for('shared');
Symbol.keyFor(shared); // 'shared'

// 内置 Well-known Symbol
class Collection {
  [Symbol.iterator]() {
    /* ... */
  } // 使对象可迭代
  [Symbol.toPrimitive](hint) {
    // 控制类型转换
    return hint === 'number' ? this.size : this.toString();
  }
  static [Symbol.hasInstance](instance) {
    // 控制 instanceof 行为
    return Array.isArray(instance);
  }
}
```
