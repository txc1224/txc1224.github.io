# 变量 / 闭包 / 原型链

## 变量与作用域

### var / let / const 区别

|          | `var`                | `let`            | `const`          |
| -------- | -------------------- | ---------------- | ---------------- |
| 作用域   | 函数作用域           | 块作用域         | 块作用域         |
| 变量提升 | ✅（值为 undefined） | ✅（暂时性死区） | ✅（暂时性死区） |
| 重复声明 | ✅                   | ❌               | ❌               |
| 重新赋值 | ✅                   | ✅               | ❌               |

```js
// var 提升陷阱
console.log(a); // undefined（不报错）
var a = 1;

// let 暂时性死区
console.log(b); // ReferenceError
let b = 1;

// const 只是引用不可变，对象内部可修改
const obj = { x: 1 };
obj.x = 2; // ✅ 合法
obj = {}; // ❌ TypeError
```

### 作用域链

函数在**定义时**确定作用域（词法作用域），查找变量时从当前作用域逐级向上。

```js
const x = 'global';
function outer() {
  const x = 'outer';
  function inner() {
    console.log(x); // 'outer'（词法作用域，不是调用时决定）
  }
  inner();
}
```

---

## 闭包

闭包 = 函数 + 其定义时所在的词法环境。函数可以"记住"并访问其外部作用域的变量，即使外部函数已执行完毕。

```js
function makeCounter(start = 0) {
  let count = start;
  return {
    increment: () => ++count,
    decrement: () => --count,
    value: () => count,
  };
}

const counter = makeCounter(10);
counter.increment(); // 11
counter.increment(); // 12
counter.value(); // 12
```

### 常见陷阱：循环中的闭包

```js
// ❌ 错误：所有回调共享同一个 i
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 0); // 3 3 3
}

// ✅ 用 let（块作用域，每次迭代独立）
for (let i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 0); // 0 1 2
}
```

### 实际应用

```js
// 函数工厂
function multiply(factor) {
  return (n) => n * factor;
}
const double = multiply(2);
const triple = multiply(3);
double(5); // 10

// 私有变量模拟
function createStore(initial) {
  let state = initial;
  return {
    get: () => state,
    set: (val) => {
      state = val;
    },
  };
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
  this.name = name;
}
Animal.prototype.speak = function () {
  return `${this.name} makes a sound`;
};

const dog = new Animal('Dog');
dog.speak(); // 'Dog makes a sound'
dog.hasOwnProperty('name'); // true
dog.hasOwnProperty('speak'); // false（在原型上）
Object.getPrototypeOf(dog) === Animal.prototype; // true
```

### class 语法糖

`class` 本质上是构造函数 + 原型的语法糖，行为完全等价。

```js
class Animal {
  #name; // 私有字段（ES2022）

  constructor(name) {
    this.#name = name;
  }

  speak() {
    return `${this.#name} makes a sound`;
  }

  static create(name) {
    return new Animal(name);
  }
}

class Dog extends Animal {
  constructor(name) {
    super(name); // 必须先调用 super
  }

  speak() {
    return super.speak() + ' (woof!)';
  }
}

const d = Dog.create('Rex');
d.speak(); // 'Rex makes a sound (woof!)'
```

### instanceof 原理

```js
// instanceof 检查右侧构造函数的 prototype 是否在左侧对象的原型链上
dog instanceof Animal; // true
dog instanceof Object; // true

// 手写 instanceof
function myInstanceof(obj, Ctor) {
  let proto = Object.getPrototypeOf(obj);
  while (proto !== null) {
    if (proto === Ctor.prototype) return true;
    proto = Object.getPrototypeOf(proto);
  }
  return false;
}
```
