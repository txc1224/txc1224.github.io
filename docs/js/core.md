---
title: '变量 / 闭包 / 原型链'
order: 2
---

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

<!-- KNOWLEDGE-IMPORT:START -->

## ES6 class、继承与继承模式演进

## TL;DR

> `class` 是"构造函数 + 原型"的语法糖,但补强了:严格模式默认、必须 new 调用、原型方法不可枚举、`extends` 自动链接双重原型、`super` 调用、ES2022 私有字段(`#`)、静态成员。

## 背景与动机

ES6 之前实现"继承"要写一堆模板代码(`Child.prototype = Object.create(Parent.prototype)`、`Child.prototype.constructor = Child`、手动 `Parent.call(this)`...),极易写错。ES6 `class` 解决:

- 语法上更接近 OO 语言,降低心智负担
- 自动处理双重原型链(实例链 + 静态链)
- `super` 关键字简化父类调用
- ES2022 加入**真正的私有字段**(`#field`),不是约定下划线

但底层**仍是原型** —— class 不是新机制,只是糖。理解糖底下的运行时仍然重要(性能调优、bundle 体积、看 transpile 后的 ES5 代码)。

## 核心机制

### `class` 编译/解释为构造函数

```js
// 写法 A
class User {
  constructor(name) {
    this.name = name;
  }
  greet() {
    return `hi ${this.name}`;
  }
}

// 等价写法 B(粗略,缺一些 class 特有约束)
function User(name) {
  this.name = name;
}
Object.defineProperty(User.prototype, 'greet', {
  value: function () {
    return `hi ${this.name}`;
  },
  enumerable: false, // ⭐ class 方法不可枚举,普通赋值默认可枚举
  writable: true,
  configurable: true,
});
```

class 强加的额外约束:

- 默认严格模式(class 体内)
- 必须用 `new` 调用,否则 TypeError
- 方法默认 `enumerable: false`
- class 声明**不提升**(Temporal Dead Zone)

### `extends` 建立双重原型链

```js
class Animal {
  eat() {}
}
class Dog extends Animal {
  bark() {}
}

const d = new Dog();
```

- **实例链**: `d` → `Dog.prototype` → `Animal.prototype` → `Object.prototype` → null
- **静态链**: `Dog` → `Animal` → `Function.prototype` → ...

后者让子类**直接调用**父类的静态方法:

```js
class A {
  static hi() {
    return 'A.hi';
  }
}
class B extends A {}
B.hi(); // 'A.hi'  ← 沿静态链找到
```

### `super` 在 constructor vs 方法中的差异

- **constructor 中** `super(...)`: 调父类构造函数。**必须**在使用 `this` 之前调,否则 `ReferenceError`
- **方法中** `super.foo()`: 沿原型链调父类方法,内部 `this` 仍是子类实例

```js
class Parent {
  constructor() {
    this.kind = 'P';
  }
  hello() {
    return `Parent says hi, kind=${this.kind}`;
  }
}

class Child extends Parent {
  constructor() {
    super(); // ← 必须先调,否则后面用 this 会 ReferenceError
    this.kind = 'C';
  }
  hello() {
    return super.hello() + ' [override]';
  }
}

new Child().hello(); // 'Parent says hi, kind=C [override]'
//                                                  ↑ this 仍是 Child 实例
```

### 私有字段(ES2022 `#`)

```js
class Counter {
  #count = 0;
  inc() {
    this.#count++;
  }
  get value() {
    return this.#count;
  }
}

const c = new Counter();
c.inc();
c.value; // 1
c.#count; // ❌ SyntaxError: 私有字段只能在定义 class 内访问
```

这是**真正的语法层私有**,不是社区约定的 `_underscore`。

- `c['#count']` / `Reflect.get(c, '#count')` 都不行 —— 不是字符串属性
- 私有字段不挂在 prototype 上,直接挂实例,但访问要在 class 体内通过 `#` 语法
- `static #x` 是静态私有,只能在 class 体内通过 `ClassName.#x` 或 `this.#x`(静态方法里 this 指 class 本身)

### `static` 字段与方法

```js
class Counter {
  static MAX = 100;
  static reset() {
    return new Counter();
  }
}
Counter.MAX; // 100
Counter.reset(); // Counter 实例
```

- 挂在构造函数本身,不挂 prototype
- 子类通过静态原型链可调用父类静态方法

### `new.target`

在 constructor 内可访问 `new.target`,得到"当前被 new 的真正 class":

```js
class A {
  constructor() {
    console.log(new.target.name); // 'B'  ← 子类 new 时
  }
}
class B extends A {}
new B();
```

用途:工厂模式、判断是否被子类化、阻止抽象类被直接 new。

## 继承模式演进(ES5 → 现代)

| 模式             | 实现                                                                   | 问题                       |
| ---------------- | ---------------------------------------------------------------------- | -------------------------- |
| 原型链继承       | `Child.prototype = new Parent()`                                       | 父类引用属性被子类实例共享 |
| 构造函数借用     | `Parent.call(this)`                                                    | 不继承父类原型方法         |
| 组合继承         | 上两者结合                                                             | 父类构造函数被调用**两次** |
| **寄生组合继承** | `Child.prototype = Object.create(Parent.prototype); Parent.call(this)` | ES5 最优解                 |
| **ES6 extends**  | 内置寄生组合 + super                                                   | 现代推荐                   |

ES6 编译后(Babel)实际就是寄生组合,所以理解寄生组合 = 理解 class 底层。

## 代码示例

```js
// 寄生组合继承的 ES5 模板
function Parent(name) {
  this.name = name;
}
Parent.prototype.greet = function () {
  return `hi ${this.name}`;
};

function Child(name, age) {
  Parent.call(this, name); // 借父构造
  this.age = age;
}
Child.prototype = Object.create(Parent.prototype);
Child.prototype.constructor = Child;
Child.prototype.intro = function () {
  return `${this.greet()}, ${this.age}`;
};

new Child('Alice', 5).intro(); // 'hi Alice, 5'

// 等价 ES6
class P {
  constructor(name) {
    this.name = name;
  }
  greet() {
    return `hi ${this.name}`;
  }
}
class C extends P {
  constructor(name, age) {
    super(name);
    this.age = age;
  }
  intro() {
    return `${this.greet()}, ${this.age}`;
  }
}
```

## 易错点 / 反例

### 1. constructor 里 super 之前用 this → ReferenceError

```js
class Child extends Parent {
  constructor(name) {
    this.name = name; // ❌ ReferenceError: super() before this
    super();
  }
}
```

**根因**: 派生类的 this 是父类构造函数创建的(super 调用时才生成);super 之前根本没 this 可用。

### 2. 静态方法里的 super 指父类**静态**部分,不是 prototype

```js
class P {
  static who() {
    return 'P static';
  }
}
class C extends P {
  static who() {
    return super.who() + ' / C';
  } // 'P static / C'
}
```

要在静态方法里调父类**实例**方法?不能直接,需要 `P.prototype.method.call(instance)`。

### 3. class 字段(field)定义在**实例**上,不是 prototype

```js
class Foo {
  x = 1;
  method() {}
}
const f = new Foo();
Object.hasOwn(f, 'x'); // true  —— 实例自身
Object.hasOwn(Object.getPrototypeOf(f), 'x'); // false —— prototype 上没
Object.hasOwn(Object.getPrototypeOf(f), 'method'); // true —— prototype 上
```

含义:每个实例都有独立 `x` 副本,改一个不影响另一个;但 method 共享。

### 4. 私有字段不能动态访问

```js
class A {
  #x = 1;
  get(k) {
    return this[`#${k}`];
  } // ❌ undefined,#x 不是字符串属性
}
new A().get('x'); // undefined
```

**根因**: `#x` 是语法层标识符,不是字符串属性;`this['#x']` 是访问名叫 `'#x'` 的属性,不存在。私有字段必须用 `this.#x` 字面访问。

### 5. `class` 声明不提升(TDZ)

```js
new Foo(); // ❌ ReferenceError: Cannot access 'Foo' before initialization
class Foo {}
```

函数声明会提升,**class 声明不会**。这是规范故意设计的,防止"使用未完整定义的 class"。

## 高频面试题(5 题)

- **Q1**: class 是新机制还是语法糖?和 function 构造函数底层有什么差别?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  语法糖 —— 底层仍是构造函数 + 原型。但 class 加了若干硬约束:

  - 默认严格模式
  - 必须 new 调用
  - 原型方法不可枚举(`enumerable: false`)
  - class 声明不提升(进 TDZ)
  - `extends` 自动建立双重原型链(实例 + 静态)
  - `super` / 私有字段 / class fields 是 class 体内的新语法

  &lt;details&gt;

- **Q2**: `extends` 内部做了什么?为什么 super 必须在 this 之前?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - 把 `Child.prototype.__proto__` 设为 `Parent.prototype`(实例链)
  - 把 `Child.__proto__` 设为 `Parent`(静态链)
  - 派生类的 constructor 模板要求 `super()` 先创建实例,才能用 `this`

  规范层:派生类的 `[[ConstructorKind]]` 是 `derived`,实例由父类 `[[Construct]]` 创建,super 调用才"把 this 给你"。super 之前 this 处于"未初始化"状态(类似 TDZ)。

  &lt;details&gt;

- **Q3**: 私有字段 `#name` 和约定的 `_name` 有什么本质区别?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - `_name`:仅约定,运行时可以正常访问 / 修改,反射 API 都能拿到
  - `#name`:**语法层私有**,只能在定义 class 内访问;外部访问报 SyntaxError;`Object.keys` / `Reflect.ownKeys` / Proxy 都拿不到(WeakMap 实现细节)

  权衡:`#` 真正安全,但不能在子类访问父类的 `#`(各自独立命名空间)。

  &lt;details&gt;

- **Q4**: class 字段(`class A { x = 1; }`)定义在实例上还是原型上?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  **实例上**,等价于 constructor 里 `this.x = 1`。每个实例独立持有副本。

  这点和方法不同 —— 方法定义在 `prototype` 上,所有实例共享。

  含义:把"每个实例需要独立持有的状态"(计数器、回调集合)写成 field;把"共享行为"写成方法。

  &lt;details&gt;

- **Q5**: 为什么寄生组合继承是 ES5 时代的最优继承方案?它的核心做法是什么?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  核心两步:

  1. 借构造:`Parent.call(this, ...args)` —— 继承实例属性
  2. 继承原型:`Child.prototype = Object.create(Parent.prototype)` —— 继承原型方法,**只调一次父类**

  对比组合继承(`Child.prototype = new Parent()`):后者会**多调一次父类构造**,造成实例属性出现在原型上(噪音 + 性能),还可能因副作用产生 bug。

  ES6 `extends` 编译后(Babel)就是寄生组合的形式。

  &lt;details&gt;

## 延伸资源

- [MDN: Classes](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Classes)
- [TC39: Class Fields proposal](https://tc39.es/proposal-class-fields/)
- [ECMA-262: Class Definitions](https://tc39.es/ecma262/#sec-class-definitions)

## (留白) 我的理解

> 这一段不强制填。

---

## new 运算符与构造函数 / instanceof 原理

## TL;DR

> `new Foo(args)` 做 4 件事:① 创建新对象 → ② 链接到 `Foo.prototype` → ③ 以新对象为 `this` 调 Foo → ④ 若 Foo 没返回对象则用新对象。`instanceof` 检查"目标的原���链上是否出现某构造函数的 `prototype`"。

## 背景与动机

JS 想给习惯 OO 语言的开发者一个"看起来像 class"的入口,于是设计了 `new` + 大写构造函数的约定。**但 JS 内部仍是原型继承**,不是真"类"。

理解 `new` 的本质和 `instanceof` 的实现:

- 解释为什么忘 `new` 时 `this` 指向全局
- 解释构造函数返回对象时为什么不返回 `this`
- 解释 `instanceof` 在跨 iframe / 跨 realm 场景下为何不可靠
- 是面试现场最常考的"手写题"前 5

## 核心机制

### `new Foo(...args)` 的 4 步抽象算法

```
1. obj = Object.create(Foo.prototype)        // 新对象,原型指向 Foo.prototype
2. result = Foo.apply(obj, args)             // 用 obj 作为 this 调用 Foo
3. if (typeof result === 'object' && result !== null) return result;
4. return obj                                // Foo 没显式返回对象时,返回新对象
```

关键细节:

- 第 1 步保证实例继承构造函数 prototype 上的方法
- 第 3 步意味着**构造函数显式 return 对象**会覆盖步骤 4 返回的 obj
- return 原始值(数字、字符串、null...)被忽略,仍返回新对象

### 构造函数 vs 普通函数

- **没有语法层面的标记**:任何函数都可以用 `new` 调用
- 大写首字母只是社区约定
- 函数内 `this` 在 `new` 调用时指向新实例;直接调用时是全局对象(非严格)或 undefined(严格)
- **箭头函数没有 `[[Construct]]` 内部槽**,不能用 `new`(TypeError)

### `new.target` —— 区分调用方式

```js
function Foo() {
  if (!new.target) throw new Error('Foo must be called with new');
}
Foo(); // throw
new Foo(); // OK
```

ES6+ 的 class 编译产物就用 `new.target` 强制 new 调用。

### `instanceof` 算法

```
obj instanceof Foo:
  p = obj.[[Prototype]]
  while (p !== null) {
    if (p === Foo.prototype) return true;
    p = p.[[Prototype]]
  }
  return false
```

也就是检查 `Foo.prototype` 是否在 obj 的原型链上的任意位置 —— 不只是直接原型。

### `Symbol.hasInstance` —— 自定义 instanceof

ES6 允许构造函数自定义 instanceof 行为:

```js
class Even {
  static [Symbol.hasInstance](n) {
    return typeof n === 'number' && n % 2 === 0;
  }
}
4 instanceof Even; // true
5 instanceof Even; // false
```

## 代码示例

### 手写 myNew(面试高频)

```js
function myNew(Ctor, ...args) {
  if (typeof Ctor !== 'function') throw new TypeError('not a function');

  // 1. 创建一个新对象,原型指向 Ctor.prototype
  const obj = Object.create(Ctor.prototype);

  // 2. 以新对象为 this 调用构造函数
  const result = Ctor.apply(obj, args);

  // 3. 构造函数返回对象 → 用它;否则用新对象
  return result !== null && (typeof result === 'object' || typeof result === 'function') ? result : obj;
}

function User(name) {
  this.name = name;
}
const u = myNew(User, 'Alice');
u instanceof User; // true
u.name; // 'Alice'
```

### 手写 myInstanceof

```js
function myInstanceof(obj, Ctor) {
  if (obj === null || (typeof obj !== 'object' && typeof obj !== 'function')) return false;
  let p = Object.getPrototypeOf(obj);
  while (p !== null) {
    if (p === Ctor.prototype) return true;
    p = Object.getPrototypeOf(p);
  }
  return false;
}
```

## 易错点 / 反例

### 1. 忘记 new,this 指向全局

```js
function User(name) {
  this.name = name;
}
const u = User('Alice'); // ❌ 忘 new
u; // undefined
window.name; // 'Alice' —— 严格模式下抛 TypeError

// 严格模式 / class:语言会替你拦截
class User2 {
  constructor(name) {
    this.name = name;
  }
}
User2('Alice'); // ❌ TypeError: Class constructor cannot be invoked without 'new'
```

class 是更安全的选择(强制 new),且 ES6+ 默认严格模式。

### 2. 构造函数返回对象 → 覆盖 this

```js
function Box(v) {
  this.value = v;
  return { value: v * 2 }; // 显式返回对象
}
const b = new Box(5);
b.value; // 10 —— 不是 5
b instanceof Box; // false —— 不是 Box 实例!原型链没有 Box.prototype
```

**修复**: 构造函数里别 return 对象,或确认这就是想要的"返回另一种实例"模式(工厂模式)。

### 3. 箭头函数不能 new

```js
const F = () => {};
new F(); // ❌ TypeError: F is not a constructor
```

**根因**: 箭头函数无 `[[Construct]]` / `prototype` / 自己的 `this`,设计上就不是构造器。class 方法也不能 new(同理)。

### 4. `instanceof` 跨 iframe / 跨 realm 失效

```js
// 主文档
const arr = iframe.contentWindow.someApi.returnsArray();
arr instanceof Array; // false  ❌ —— 因为是 iframe 里的 Array,不是主页的 Array
Array.isArray(arr); // true   ✅
```

**根因**: 每个 iframe / Worker / 模块有独立的 realm,内置对象(Array / Object / RegExp)各是各的副本,`prototype` 不同。

**修复**:

- 优先用专用判定函数(`Array.isArray`、`Number.isFinite` 等)
- 必要时用 tag 字段或 `Object.prototype.toString.call(x)` —— 详见 `js-type-checking`

### 5. 用 `Symbol.hasInstance` 重写后行为可被改写

```js
const Pretender = {
  [Symbol.hasInstance]: () => true,
};
({}) instanceof Pretender; // true —— 任何对象都"是"它
```

**含义**: `instanceof` 不是"硬"语言判断,可被构造函数侧改写。安全代码不应过度依赖外部对象的 instanceof 行为。

## 高频面试题(5 题)

- **Q1**: 描述 `new Foo()` 在引擎里做了哪些事?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  4 步:

  1. 创建空对象 `obj`,`obj.[[Prototype]] = Foo.prototype`
  2. 以 `obj` 为 this 调用 `Foo`,得到 `result`
  3. `result` 是非 null 对象 → 返回 `result`
  4. 否则返回 `obj`

  另:`new.target` 会指向 `Foo`,可用于区分调用方式。

  &lt;details&gt;

- **Q2**: 构造函数能返回值吗?返回什么会"取代"this?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  能。规则:

  - 返回**对象 / 函数**(非 null) → 取代 this,`new` 表达式得到该返回值
  - 返回**原始值**(number / string / null / undefined / boolean / symbol / bigint) → 忽略,仍返回 this

  这条规则是"工厂式构造函数"的基础,但也容易踩坑(误返回对象导致 `instanceof` 失败)。

  &lt;details&gt;

- **Q3**: 现场手写 `myNew(Ctor, ...args)`。
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  ```js
  function myNew(Ctor, ...args) {
    const obj = Object.create(Ctor.prototype);
    const result = Ctor.apply(obj, args);
    return result !== null && (typeof result === 'object' || typeof result === 'function') ? result : obj;
  }
  ```

  考点:`Object.create` 建立原型链、`apply` 绑定 this、构造函数返回对象的兜底。

  &lt;details&gt;

- **Q4**: 现场手写 `myInstanceof(obj, Ctor)`,说明它和原生 `instanceof` 的差异。
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  ```js
  function myInstanceof(obj, Ctor) {
    if (obj === null || (typeof obj !== 'object' && typeof obj !== 'function')) return false;
    let p = Object.getPrototypeOf(obj);
    while (p !== null) {
      if (p === Ctor.prototype) return true;
      p = Object.getPrototypeOf(p);
    }
    return false;
  }
  ```

  和原生差异:原生还检查 `Ctor[Symbol.hasInstance]`,可被构造函数侧改写;还能处理 Reflect / Proxy 等异常对象类型。

  &lt;details&gt;

- **Q5**: 箭头函数为什么不能 new?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  设计上箭头函数:

  - 没有自己的 `this`、`arguments`、`new.target`、`super`(从外层继承)
  - 没有 `prototype` 属性,因此 `new ArrowFn()` 第 1 步就拿不到原型来挂
  - 没有 `[[Construct]]` 内部槽,引擎直接拒绝

  规范层 ECMA-262 在创建箭头函数时不分配 `[[Construct]]`,试图 `new` 时直接 TypeError。

  &lt;details&gt;

## 延伸资源

- [MDN: new 运算符](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Operators/new)
- [MDN: instanceof](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Operators/instanceof)
- [ECMA-262: The new Operator](https://tc39.es/ecma262/#sec-new-operator)

## (留白) 我的理解

> 这一段不强制填。

---

## 原型链与 [[Prototype]]

## TL;DR

> 每个 JS 对象有一个隐藏的 `[[Prototype]]` 内部槽,属性查找沿这个槽向上链式回溯;`__proto__` 是它的访问器,`prototype` 是函数对象上的引用,`Object.create` 是创建指定原型对象的工厂。

## 背景与动机

JS 没有传统的"类",对象**直接继承自其他对象**。这个机制叫**原型继承**(prototype-based inheritance),灵感来自 Self 语言。设计动机:

- 比基于类的继承更"动态":可以在运行时改原型
- 一切共享行为(方法)都通过原型完成,大量实例无需各自持有方法副本
- ES6 的 `class` 是这个机制的**语法糖**,底层仍是原型

理解原型链是理解 JS 面向对象、`new`、`class`、`instanceof`、各种继承模式的**唯一前置**。

## 核心机制

### 三件套

| 名称            | 出现在哪               | 是什么                                                  |
| --------------- | ---------------------- | ------------------------------------------------------- |
| `[[Prototype]]` | **所有对象**的内部槽   | 指向上一级对象的指针,规范层定义,引擎实现                |
| `__proto__`     | 对象上的访问器属性     | `[[Prototype]]` 的 getter/setter,在 Object.prototype 上 |
| `prototype`     | **函数对象**自带的属性 | `new fn()` 创建实例时,实例的 `[[Prototype]]` 指向它     |

**关键认知**: `__proto__` 和 `prototype` 不是一回事:

- `__proto__` 是任何对象上的"指针"
- `prototype` 是函数对象上的"模板",用于给 new 出来的实例做指针目标

### 属性查找算法

```
访问 obj.x:
1. obj 自身属性表里有 x? → 返回
2. 没有 → 看 obj.[[Prototype]]
3. 对那个对象继续重复 1-2
4. 一直查到 null → 返回 undefined
```

**写入**不会沿链查找(默认):`obj.x = 1` 直接在 obj 自身建属性,可能"屏蔽"原型链上的同名属性。除非原型链上的同名属性是 setter / 不可写。

### 完整链路示例

```
const obj = { x: 1 };

obj.__proto__                        === Object.prototype
Object.prototype.__proto__           === null    ← 链的尽头

function Foo() {}
const f = new Foo();

f.__proto__                          === Foo.prototype
Foo.prototype.__proto__              === Object.prototype
Foo.__proto__                        === Function.prototype  // 函数本身也是对象
Function.prototype.__proto__         === Object.prototype
```

```
                       f
                       │
                  [[Prototype]]
                       ▼
                 Foo.prototype  ──constructor──► Foo
                       │
                  [[Prototype]]
                       ▼
                 Object.prototype
                       │
                  [[Prototype]]
                       ▼
                      null
```

### 推荐 API(不要用 `__proto__` 直接操作)

- 读: `Object.getPrototypeOf(obj)`
- 写: `Object.setPrototypeOf(obj, proto)` ← **运行时改原型会摧毁性能**
- 创建: `Object.create(proto, props?)`
- 检查链上: `proto.isPrototypeOf(obj)`
- 检查自身: `obj.hasOwnProperty(key)` / `Object.hasOwn(obj, key)`(ES2022)

## 代码示例

```js
// 1. Object.create 是"指定原型创建对象"的标准方式
const animal = {
  eats: true,
  walk() {
    console.log('walking');
  },
};

const rabbit = Object.create(animal);
rabbit.jumps = true;

rabbit.eats; // true   (沿链找到 animal.eats)
rabbit.walk(); // 'walking'
Object.getPrototypeOf(rabbit) === animal; // true

// 2. Object.create(null) 创建"纯净对象"(无原型链)
const dict = Object.create(null);
dict.toString; // undefined  —— 不会从 Object.prototype 继承任何方法
// 用途:做 map / dict 时避免和 toString / hasOwnProperty 等内置 key 冲突

// 3. 手写 Object.create polyfill(很简短,能看出本质)
function myCreate(proto) {
  function F() {}
  F.prototype = proto;
  return new F();
}
```

## 易错点 / 反例

### 1. 混淆 `__proto__` 和 `prototype`

```js
function Foo() {}
Foo.prototype; // {} —— Foo 的"实例模板"
Foo.__proto__; // Function.prototype —— Foo 自己的原型

const f = new Foo();
f.prototype; // undefined —— f 是普通对象,没有 prototype 属性
f.__proto__; // Foo.prototype —— f 的原型
```

口诀:**只有函数有 `prototype`,所有对象都有 `__proto__`**。

### 2. `Object.setPrototypeOf` / `obj.__proto__ =` 性能极差

V8 等引擎用"隐藏类"(hidden class)优化对象。运行时改原型会让对象退出快路径,所有后续访问都走慢路。**禁止在热路径上动原型**。

```js
// ❌ 危险
function Foo() {}
const f = new Foo();
Object.setPrototypeOf(f, Bar.prototype); // 性能爆炸

// ✅ 建立链路在 class / 构造函数定义时一次性做好
```

### 3. `for...in` 会遍历原型链上的可枚举属性

```js
const obj = Object.create({ inherited: 'from proto' });
obj.own = 'mine';

for (const k in obj) console.log(k);
// own, inherited —— 把原型链上的也带出来了
```

**安全写法**:

- `Object.keys(obj)` 只返回自身可枚举键
- `for (const k in obj) if (Object.hasOwn(obj, k)) ...` 过滤
- 用 `Object.create(null)` 创建无原型对象

### 4. `constructor` 属性的"伪可信"

默认情况 `Foo.prototype.constructor === Foo`,但只是个普通属性,可以被随便改:

```js
function Foo() {}
Foo.prototype = {
  /* 重置原型对象,constructor 丢失 */
};
const f = new Foo();
f.constructor; // Object —— 沿链找到 Object.prototype.constructor
// 修复:Foo.prototype = { constructor: Foo, ... };
```

**结论**:不要靠 `obj.constructor` 判断"是哪个类的实例",用 `instanceof` 或 tag 字段。

### 5. 误以为 `Object.create(null)` 等于 `{}`

```js
const a = {};
const b = Object.create(null);

a.toString; // ƒ toString()  (从 Object.prototype 继承)
b.toString; // undefined
console.log(b); // 在某些 console 实现里会报错 —— 因为没法转字符串
```

做 dict / cache 时用 null 原型避免 key 冲突;但要意识到日常调试 / 序列化会"看起来不一样"。

## 高频面试题(5 题)

- **Q1**: `__proto__` 和 `prototype` 有什么区别?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - `__proto__`:**所有对象**都有(它是 `[[Prototype]]` 的访问器),指向对象的原型
  - `prototype`:**只有函数**有,作为该函数被 `new` 调用时实例的原型模板

  关系: `new Foo()` 的实例 `f`,有 `f.__proto__ === Foo.prototype`。

  推荐用 `Object.getPrototypeOf` / `Object.setPrototypeOf`,不要直接用 `__proto__`。

  &lt;details&gt;

- **Q2**: 描述 JS 属性查找的完整过程。
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  1. 在对象自身的属性表里查
  2. 没有 → 沿 `[[Prototype]]` 进入上层对象再查
  3. 重复直到原型链尽头(`null`)
  4. 仍没有 → 返回 `undefined`

  注意:**写入**默认不沿链,直接在对象自身建属性,可能屏蔽原型链上的同名属性。

  &lt;details&gt;

- **Q3**: `Object.create(null)` 和 `{}` 有什么区别?什么时候用前者?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - `{}` 的 `[[Prototype]]` 是 `Object.prototype`,继承 `toString` / `hasOwnProperty` / `valueOf` 等
  - `Object.create(null)` 的 `[[Prototype]]` 是 `null`,**完全干净**

  用 null 原型的场景:用对象当 dict / map 时,避免用户输入的 key("toString"、"constructor"、"**proto**")和内置属性冲突。Map 类型也能解决,选择看是否需要 JSON 序列化。

  &lt;details&gt;

- **Q4**: 为什么不推荐运行时修改对象的原型?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  V8 等现代引擎用"隐藏类(hidden class) + 内联缓存(inline cache)"做对象访问优化,前提是对象的结构(包括原型)稳定。`Object.setPrototypeOf` / `obj.__proto__ = ...` 让对象退化到 slow path,所有后续属性访问都变慢,且影响所有指向它的引用。

  规则:**在对象创建时**就用 `new` / `Object.create` / `class` 把原型链建好,运行时不再改。

  &lt;details&gt;

- **Q5**: `for...in` 和 `Object.keys` 有什么区别?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - `for...in`:遍历对象自身 + **原型链上**所有 `enumerable: true` 的字符串键
  - `Object.keys(obj)`:只返回对象**自身**的 `enumerable: true` 字符串键

  实际工程中需要"只看自己"时用 `Object.keys` / `Object.getOwnPropertyNames`;遍历继承属性才用 `for...in`(且通常配 `Object.hasOwn(obj, k)` 过滤)。Symbol 键都不在以上两者中,要用 `Object.getOwnPropertySymbols`。

  &lt;details&gt;

## 延伸资源

- [MDN: 继承与原型链](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Inheritance_and_the_prototype_chain)
- [ECMA-262: Ordinary Object Behaviours](https://tc39.es/ecma262/#sec-ordinary-and-exotic-objects-behaviours)
- 《You Don't Know JS》this & Object Prototypes Chapter 5

## (留白) 我的理解

> 这一段不强制填。

---

## 闭包导致的内存泄漏

## TL;DR

> 闭包持有外层词法环境的引用,**只要闭包本身可达,它捕获的变量(及其引用的对象)就都不会被 GC**。泄漏发生在闭包被"长期持有"的位置。

## 背景与动机

闭包让函数把"出生时的环境"打包带走 —— 这是设计目标,不是 bug。但在 SPA / Node 长进程场景里:

- 一个未解绑的事件监听器可以让整页 DOM 都不被回收
- 一个忘记 `clearInterval` 的定时器可以让闭包里的大对象永远留存
- 即使代码看起来"没有持有这个对象",**V8 的实现细节**也可能让闭包间接持有它

掌握"闭包-环境-GC 可达性"这三者的关系,是前端进阶绕不开的一环 —— 也是性能 / 内存问题排查的核心思维工具。

## 核心机制

### GC 的可达性分析

现代 JS 引擎(V8 / SpiderMonkey / JavaScriptCore)都用**标记-清除**(mark-and-sweep):

1. 从一组"根"(GC roots,即全局对象、当前调用栈帧、活跃的微任务等)出发
2. 顺着对象引用图深度优先遍历,标记所有"可达"对象
3. 未被标记的就是垃圾,内存被回收

### 闭包让环境记录变得可达

函数对象的内部槽 `[[Environment]]` 指向它定义时的词法环境(LE)。LE 里有环境记录(变量表)+ `[[OuterEnv]]`(指向外层 LE)。只要这个函数还可达:

- 它的 `[[Environment]]` 可达
- 里面的环境记录可达 → 记录里所有变量(及其引用的对象)都可达
- 沿 `[[OuterEnv]]` 一直到全局也都可达

```
window.handler ──▶ function(){}.[[Environment]] ──▶  LE { el, big, … }
       ▲                                                 ▲
       │                                                 │
   GC root                                       即便 DOM 早就移除,
                                                 只要 handler 在,LE 不释放
```

### V8 的"共享闭包"细节(⭐⭐⭐⭐ 重点)

V8 不是为**每个闭包**单独建一个环境记录,而是**同一作���域里的所有闭包共享一个 Context 对象**。这意味着:

- 即便某个闭包只用到外层的一个小变量,**只要同作用域里另一个闭包用到了大变量,大变量也会被共享 Context 持有**
- 后果:你以为没引用的 `huge`,实际上因为旁边那个 sibling 闭包还活着,被间接锁死

V8 后续做了"逃逸分析"等优化,部分场景下能砍掉未使用的变量,但**不能依赖这个优化**。规则是:**写代码时主动收窄闭包捕获范围**。

## 代码示例

### 一个典型泄漏(以及修复)

```js
// 泄漏版本
function attach(el) {
  const big = new Array(1e6).fill('x'); // 假装是大数据
  el.addEventListener('click', () => {
    console.log(el.id, big[0]);
  });
}
// 即便后续 el 从 DOM 移除,只要监听器没解绑,big 和 el 都不释放

// 修复版本
function attach(el) {
  const big = new Array(1e6).fill('x');
  const handler = () => console.log(el.id, big[0]);
  el.addEventListener('click', handler);
  return () => el.removeEventListener('click', handler); // 返回解绑函数
}
// 调用方负责在合适的时机(组件 unmount / 页面切换)执行解绑函数
```

## 易错点 / 反例

### 1. addEventListener 没有对应的 removeEventListener

```js
function mount() {
  window.addEventListener('resize', () => {
    expensiveLayout();
  });
}
// 每次 mount 都注册一个新监听器,从此 expensiveLayout 永远活着
// SPA 路由切换 100 次 → window 上 100 个监听器,触发 100 次/调整
```

**修复**: 监听器必须保留引用并在销毁时解绑;Vue/React 用对应生命周期或 `useEffect` 的清理函数。

### 2. setInterval 不清理

```js
function startPolling(state) {
  setInterval(() => {
    fetch('/api').then((r) => Object.assign(state, r));
  }, 1000);
}
// 整个 state 永远不释放,即便组件已被销毁
```

**修复**: 用 `const id = setInterval(...)` 保存 id,在销毁时 `clearInterval(id)`。

### 3. V8 共享闭包陷阱

```js
function build() {
  const huge = new Array(1e7); // 几十 MB
  const small = 'hi';
  function useHuge() {
    return huge.length;
  }
  function useSmall() {
    return small;
  }
  return useSmall; // 只返回了 useSmall
}

const fn = build();
// 直觉:huge 没人用,可以被回收
// 现实:V8 把同作用域的两个闭包合并到一个 Context,
//      只要 fn 存活,Context 存活,huge 也跟着存活
```

**缓解方案**:

```js
function build() {
  const huge = new Array(1e7);
  // 立即在闭包里把 huge 用完,然后把它释放
  const hugeLen = huge.length; // 提取真正需要的标量
  // huge 不再被任何闭包引用,可以被 GC
  return () => hugeLen;
}
// 或干脆把不同闭包拆到不同函数里,不共享作用域
```

### 4. WeakMap 不是万能解药

```js
const cache = new WeakMap();
function compute(el) {
  if (!cache.has(el)) cache.set(el, doExpensive(el));
  return cache.get(el);
}
// el 被回收后,cache 里的条目自动消失 ✅
```

但:

```js
const cache = new WeakMap();
function compute(el) {
  cache.set(el, { node: el, data: heavy() });
  // value 内部又持有 el 的强引用 → key 永远不会被 GC
  // WeakMap "弱"的是 key 这一头,不是 value
}
```

**规则**: WeakMap / WeakSet 弱引用只在"key 是被弱持有"时起作用;value 仍是强引用。

### 5. 误用 console.log 让对象一直可达

```js
function debug(obj) {
  console.log(obj); // 在 DevTools Console 里这条 log 会保留 obj 引用
  // 直到你手动 Clear Console
}
```

排查内存问题时,**关掉 Console、关掉断点**,��则 DevTools 自身会让对象"看起来未泄漏"。

## 排查方法(Chrome DevTools)

1. **Memory 面板 → Heap Snapshot**:打两个 snapshot(操作前 / 后),用 "Comparison" 模式找新增对象
2. **Detached DOM tree**:专门看那些从 DOM 移除但仍被 JS 引用的节点
3. **Allocation instrumentation on timeline**:实时录制对象分配,定位泄漏点的代码位置
4. **Performance Monitor**:观察"JS Heap Size"是否随操作单调上升 —— 是的话基本是泄漏

## 高频面试题(5 题)

- **Q1**: 闭包为什么会导致内存泄漏?根本原因是什么?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  闭包通过函数对象的 `[[Environment]]` 持有外层词法环境的引用。GC 的可达性分析里,只要闭包函数本身被某个 GC root(全局变量、调用栈、事件监听器等)引用,它的环境记录、记录里的变量、变量引用的对象**全部可达**,无法回收。

  根本原因不是"闭包本身有问题",而是"持有闭包的那个位置生命周期太长"(全局变量、未解绑事件、未清理定时器)。

  &lt;details&gt;

- **Q2**: 在 SPA 项目里如何系统避免闭包泄漏?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - 任何 `addEventListener` / `setInterval` / `setTimeout` 都要有配对的清理路径(组件销毁、路由切换)
  - 框架的清理钩子(React `useEffect` return / Vue `onBeforeUnmount`)是标配,不可省略
  - 避免在闭包里捕获"超出实际需要"的变量(主动提取标量)
  - 缓存型数据用 `WeakMap` / `WeakRef`,前提是理解弱引用的方向限制
  - 定期跑 Heap Snapshot 比较,把泄漏挡在上线前

  &lt;details&gt;

- **Q3**: `WeakMap` 能避免哪些泄漏?不能避免哪些?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  **能避免**:以对象为 key 的缓存场景。key 被���收时,对应 entry 自动消失,缓存不会变成内存黑洞。

  **不能避免**:

  - value 内部又强引用 key(自引用),GC 无法回收
  - 非"key 是对象"的场景(原始值不能做 WeakMap 的 key)
  - 全局变量持有的普通数据 —— 那不是 WeakMap 能解决的问题

  &lt;details&gt;

- **Q4**: V8 的"共享闭包"为什么会让看起来不用的变量被持有?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  V8 把**同一作用域**里所有闭包用到的变量合并到一个 Context 对象上,所有同作用域闭包共享这个 Context。所以只要有任一闭包还可达,Context 就可达,Context 里所有变量都可达 —— 即便另一个闭包(已被回收的那个)才是真正用大变量的人。

  缓解方法:让每个闭包写在不同作用域里,或者主动把大变量替换为提炼出的标量。

  &lt;details&gt;

- **Q5**: 如何在 Chrome DevTools 里定位一段疑似闭包泄漏的代码?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  1. Memory 面板 → Heap Snapshot,操作前打一张 A
  2. 执行可疑操作(打开关闭对话框 50 次 / 切换路由 N 次)
  3. 再打一张 snapshot B,选 "Comparison: B vs A"
  4. 看 "# New" 列,定位异常增长的构造函数(如 `Detached HTMLDivElement`)
  5. 展开 retainer 链,顺着 Context / Closure 找到代码位置
  6. 切到 Sources 面板,在那段代码上加清理逻辑

  &lt;details&gt;

## 延伸资源

- [MDN: Memory management](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Memory_management)
- [V8 blog: V8 closures and scopes](https://v8.dev/blog/free-garbage-collection)
- [Chrome DevTools: Memory problems](https://developer.chrome.com/docs/devtools/memory-problems)

## (留白) 我的理解

> 这一段不强制填。

---

## 闭包

## TL;DR

> 函数对象持有它**定义时**所在的词法环境引用,因此即便在外部调用也能访问那些变量。

## 背景与动机

JS 是函数即对象 + 词法作用域的语言,但只靠"作用域规则"还不足以解释下面这些场景:

- 函数返回函数后,内层函数为什么仍然能读到外层的局部变量?
- 异步回调(`setTimeout` / Promise / 事件监听)在多久之后执行,凭什么还能访问注册时的局部变量?
- ES6 之前没有 `class private`,`#name` 也是 ES2022 才进规范,如何实现"对外不可见的状态"?

闭包就是这些能力的统一解释:**函数把它出生时所在的"环境"打包带走了**。这是 JS 实现模块封装、柯里化、防抖节流、回调上下文保持的语言基础。

## 核心机制

JS 引擎为每段代码维护一个"词法环境"(Lexical Environment, LE),环境里有一张当前作用域的变量表,以及一个指向外层环境的引用 `[[OuterEnv]]`。

每个**函数对象**在被创建时,会把当前所在的词法环境记到自己的 `[[Environment]]` 内部槽上。当这个函数被调用时,就以 `[[Environment]]` 为外层,创建新的 LE 来跑函数体。这一指针就是闭包的本质 —— 而不是某种特殊的"语法糖"。

```
makeCounter() 调用栈帧                     返回的 inc / get 函数对象
┌──────────────────┐                       ┌───────────────────────┐
│ count: 0         │ ◀──── [[OuterEnv]] ── │ inc.[[Environment]]   │
└──────────────────┘ ◀──── [[OuterEnv]] ── │ get.[[Environment]]   │
       ▲                                   └───────────────────────┘
       │
   makeCounter 执行完返回后,栈帧本来该被回收
   但 inc / get 引用着它,GC 不回收 → "记住了" count
```

只要还有任何引用指向这两个函数,`count` 这块"环境记录"就一直活着 —— 这是闭包能"持久记住"变量的真实原因,也是闭包可能造成内存泄漏的根源。

## 代码示例

```js
function makeCounter() {
  let count = 0; // 被闭包"封装"的私有变量
  return {
    inc: () => ++count,
    get: () => count,
    reset: () => (count = 0),
  };
}

const c = makeCounter();
c.inc();
c.inc();
console.log(c.get()); // 2

// count 无法从外部直接访问,只能通过返回的三个方法
console.log(c.count); // undefined,这就是"私有变量"的实现
```

## 易错点 / 反例

### 1. 经典 `for + var` 闭包陷阱

```js
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 0);
}
// 输出: 3 3 3 (而不是 0 1 2)
```

**原因**: `var` 没有块级作用域,3 个 setTimeout 闭包共享**同一个** `i`,等回调跑起来时 `i` 已经是 3。

**修复**:

```js
for (let i = 0; i < 3; i++) {
  // let 每轮迭代新建绑定
  setTimeout(() => console.log(i));
}
// 或 IIFE
for (var i = 0; i < 3; i++) {
  ((j) => setTimeout(() => console.log(j)))(i);
}
```

### 2. 闭包持有 DOM 引用导致内存泄漏

```js
function bindHandler(el) {
  const big = new Array(1e6).fill('x'); // 大数据
  el.onclick = () => console.log(el.id, big.length);
}
// 即使 el 从 DOM 移除,只要 onclick 还在,big 和 el 都不释放
```

**修复**: 解绑或者把闭包不需要的局部变量主动置空。

### 3. 误以为 `this` 是闭包的一部分

```js
function obj() {
  this.name = 'foo';
  setTimeout(function () {
    console.log(this.name); // undefined (this 是 window/undefined)
  }, 0);
}
```

**原因**: `this` 由调用方式决定,**不**通过词法作用域传递,自然也不被闭包"打包"。

**修复**: 用箭头函数(箭头函数没有自己的 `this`,会沿词法链向上找)或 `.bind(this)`。

## 高频面试题(5 题)

- **Q1**: 什么是闭包?用一句话解释。
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  函数 + 它定义时所在的词法环境(LexicalEnvironment)。即使函数在原作用域外被调用,它也能继续访问这些变量。本质是函数对象的 `[[Environment]]` 内部槽持有的环境引用。

  &lt;details&gt;

- **Q2**: 闭包能解决哪些工程问题?举 3 个真实场景。
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - **私有状态封装**:模块模式 / IIFE / `makeCounter` 一类的工厂函数
  - **回调保持上下文**:`setTimeout` / 事件监听 / Promise then 中复用注册时的局部变量
  - **函数式技巧**:柯里化、偏应用、防抖、节流、记忆化(memoize)

  &lt;details&gt;

- **Q3**: 经典 `for (var i…) setTimeout(…)` 输出 `3 3 3` 的根因和至少两种修复方案?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  **根因**:`var` 在 for 内不是块级作用域,3 个 setTimeout 闭包共享同一个 `i`。等微/宏任务出队执行时,`i` 已经走完循环到 3。

  **修复**:

  1. `let`:ES6 规范规定 `for` + `let` 每轮迭代创建新的绑定
  2. IIFE 把 `i` 当参数传进去,创建独立作用域
  3. `setTimeout` 第三参数(IE 系)或 `bind(null, i)` 提前固化

  &lt;details&gt;

- **Q4**: 闭包一定会导致内存泄漏吗?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  不一定。**闭包只是把外层环境的生命周期延长到与闭包函数相同**,这是设计目标,不是 bug。

  泄漏发生在:闭包被长期引用(全局变量、未解绑的事件、定时器、DOM 持有),且持有了不必要的大对象。修复重点是**解除引用**而不是"避免闭包"。

  &lt;details&gt;

- **Q5**: 闭包和模块模式(IIFE)是什么关系?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  IIFE(立即执行函数表达式)创建一个**一次性的局部作用域**,通过返回对象暴露公有 API,把内部变量留在闭包里 —— 这是 ES6 module 之前**最广泛的私有化方案**。本质上 IIFE 是"用闭包实现的模块",module 化后这个模式被原生 import/export + 块级作用域取代。

  &lt;details&gt;

## 延伸资源

- [MDN: 闭包](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Closures)
- [ECMA-262: Lexical Environments](https://tc39.es/ecma262/#sec-lexical-environments)
- 《You Don't Know JS》Scope & Closures Chapter 5
- 《JavaScript Definitive Guide》7e §8.6

## (留白) 我的理解

> 这一段不强制填。学完后用自己的话复述、记下踩过的坑、和其他知识的连接。

---

## 变量提升 vs 函数提升

## TL;DR

> 引擎在执行前会先扫描声明、登记到当前 LE 的环境记录;声明"看起来"被提到顶部,但**赋值/初始化仍留在原地**。函数声明整体提升,函数表达式只提升其变量绑定。

## 背景与动机

JS 不像 C/Java 那样要求"先声明、后使用"。从开发者视角,`f()` 写在 `function f(){}` 之前依然能跑。这种"看似宽松"的行为不是 bug,而是规范规定:**任何代码段在执行前,引擎先做一次 declaration instantiation(声明实例化)**。

理解提升的真正价值是:

- 解释为什么 `console.log(a); var a = 1` 输出 undefined 而不是 ReferenceError
- 解释 `let` / `const` 的 TDZ 是怎么实现的
- 解释函数声明能"跨位置调用",函数表达式不能
- 解释同名 `var` + `function` 的"奇怪"覆盖规则

## 核心机制

代码进入一个执行上下文(全局 / 函数 / 块)时,引擎按顺序:

1. **创建词法环境** + 环境记录
2. **扫描声明**(声明实例化阶段),根据类型分别处理:
   - `var x` → 注册 `x`,**初始化为 undefined**
   - `function f(){...}` → 注册 `f`,**初始化为函数对象本身**
   - `let x` / `const x` / `class x` → 注册 `x`,**不初始化**(进入 TDZ)
3. **执行代码**:遇到赋值/`=` 才真正给变量赋值;遇到 `let x = …` 才解除 TDZ

```
源码:                              声明实例化后(执行前的环境记录):
console.log(a, fn, fe);            { a: undefined,   ← var 已初始化
var a = 1;                           fn: &lt;function&gt;, ← function 声明整体提升
function fn() {}                     fe: undefined   ← var 形式的绑定提升,值还没赋
var fe = function() {};            }
console.log(a, fn, fe);

输出:
undefined, function fn(){}, undefined    ← 第一次 log
1,         function fn(){}, function     ← 第二次 log(已执行完赋值)
```

**注意:`let` / `const` 也"提升",但提升的是"未初始化的绑定",这就是 TDZ 的本质**。社区常说"`let` 不提升"是简化说法,准确说法是"提升但不初始化"。

## 代码示例

```js
// 1. var 提���:声明提升,赋值留在原地
console.log(a); // undefined
var a = 1;
console.log(a); // 1

// 2. 函数声明整体提升:可在声明之前调用
greet(); // 'hello'
function greet() {
  console.log('hello');
}

// 3. 函数表达式只提升变量名,函数体不提升
// sayHi();         // TypeError: sayHi is not a function
var sayHi = function () {
  console.log('hi');
};
sayHi(); // 'hi'
```

## 易错点 / 反例

### 1. 函数声明 vs 函数表达式 提升差异

```js
foo(); // ✅ 'function declaration'
function foo() {
  console.log('function declaration');
}

bar(); // ❌ TypeError: bar is not a function
var bar = function () {
  console.log('function expression');
};
```

**根因**: `function foo(){}` 是函数声明,整个函数对象在声明实例化阶段就绑定到 `foo`;`var bar = function(){}` 是变量声明 + 表达式赋值,提升阶段只让 `bar = undefined`,赋值要等到执行该行才发生。

### 2. 同名 var 与 function 的"覆盖"

```js
var x = 1;
function x() {
  return 2;
}
console.log(x); // 1 —— var x 的赋值最后跑,把函数对象覆盖了

// 反过来:
function y() {
  return 2;
}
var y; // var y 没有初始化值,不会覆盖前面绑定的函数对象
console.log(y); // function y(){return 2}
```

**规则**: 声明实例化阶段处理顺序是 `function` 整体绑定在前 → `var` 仅声明绑定后跳过(因为已存在),不会覆盖;但运行时 `var x = 1` 这一行的**赋值**会覆盖。

### 3. 块级 function 声明在不同环境下的语义

```js
if (true) {
  function f() {
    return 'A';
  }
} else {
  function f() {
    return 'B';
  }
}
f();
// 严格模式:f 是块级作用域,块外不可见 → ReferenceError
// 非严格 浏览器: Annex B 兼容,f 被提升到外层并赋值最后执行的那个声明 → 'A'
```

**结论**: 不要在块里写函数声明,改用函数表达式 `const f = …` 或顶层声明。

### 4. let / const 也"提升",只是进入 TDZ

```js
console.log(x); // ReferenceError —— TDZ
let x = 1;

// 不是 ReferenceError "x is not defined",而是 TDZ 错误
// 说明引擎已经知道 x 存在,只是还没初始化
```

## 高频面试题(5 题)

- **Q1**: 什么是变量提升?为什么会有提升?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  执行上下文进入时,引擎先做"声明实例化",把当前作用域内所有声明(var / function / let / const / class)登记到环境记录里,这是"提升"的本质。设计目的:让作用域信息在执行前就完整、可静态分析,JIT 才能优化。

  &lt;details&gt;

- **Q2**: 函数声明和函数表达式的提升有什么差异?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - **函数声明** `function f(){}`:整个函数对象在声明实例化时就绑定到 `f`,可在声明之前调用
  - **函数表达式** `var f = function(){}`:只提升 `f` 这个变量名(`var` → undefined / `let`,`const` → TDZ),函数体要等运行时赋值后才存在

  &lt;details&gt;

- **Q3**: 解释 `console.log(a); var a = 1;` 输出 undefined 的原因。
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  执行前的声明实例化阶段把 `a` 注册并初始化为 undefined,所以 `console.log(a)` 读到 undefined。`a = 1` 这个赋值要等到运行到该行才发生。

  &lt;details&gt;

- **Q4**: `let` / `const` 也提升吗?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  从规范层面也"提升"(声明绑定在执行前就被创建),但**不初始化**,进入暂时性死区(TDZ)。区别于 `var` 的"提升 + 初始化为 undefined",这是规范让"声明前访问"必然报错的方式。

  &lt;details&gt;

- **Q5**: 如下代码输出什么?为什么?

  ```js
  var x = 1;
  function x() {}
  console.log(typeof x);
  ```

  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  输出 `'number'`。声明实例化阶段:`function x` 先注册并绑定为函数对象,然后 `var x` 因为同名跳过初始化。运行时 `var x = 1` 这条赋值把 `x` 覆盖为 `1`,所以 `typeof x === 'number'`。如果去掉 `= 1`,只剩 `var x;`,运行时不再赋值,输出 `'function'`。

  &lt;details&gt;

## 延伸资源

- [MDN: Hoisting](https://developer.mozilla.org/zh-CN/docs/Glossary/Hoisting)
- [ECMA-262: FunctionDeclarationInstantiation](https://tc39.es/ecma262/#sec-functiondeclarationinstantiation)
- 《You Don't Know JS》Scope & Closures Appendix A

## (留白) 我的理解

> 这一段不强制填。

---

## 作用域与作用域链

## TL;DR

> 作用域是一段代码"能看见哪些变量"的规则;作用域链是这些规则从内向外的查找路径。

## 背景与动机

任何一门语言都需要回答两个问题:**变量从哪里来 / 变量到哪里去**。如果没有作用域,所有变量都暴露在全局空间,大型工程根本无法协作。

JS 的设计选择是:

- **静态(词法)作用域** —— 作用域由代码**写在哪里**决定,而不是被谁调用决定。
- **函数作用域 + 块级作用域**并存(ES6 起 `let` / `const` / `class` 才给了块级)。
- 嵌套作用域之间形成一条**只能向外查找、不能向内**的链。

工程价值:

- 命名冲突被天然隔离
- 闭包、模块、私有状态都建立在这套规则上
- 编译期(parse 阶段)就能确定变量绑定,JIT 才有优化空间

## 核心机制

每段可执行代码(全局 / 函数 / 块)开始执行时,引擎都会创建一个**词法环境** Lexical Environment(LE),包含两部分:

1. **环境记录(Environment Record)**:当前作用域里声明的变量、函数、参数
2. **外层引用 `[[OuterEnv]]`**:指向外层 LE(根据**源码嵌套关系**决定,不是调用栈)

变量查找时,从当前 LE 的记录开始;找不到就顺着 `[[OuterEnv]]` 向上查,直到全局 LE。还找不到 → `ReferenceError`(读取)或隐式全局变量(非严格模式下的赋值,严格模式直接报错)。

```
代码:                                  作用域链(从内向外):
function outer() {                     ┌─ inner LE  { c }
  let a = 1;                           │   ↓ [[OuterEnv]]
  function inner() {                   ├─ outer LE  { a, b, inner }
    let b = 2;                         │   ↓ [[OuterEnv]]
    function deepest() {               └─ global LE { outer, console, … }
      let c = 3;
      console.log(a, b, c); // 顺链向上找
    }
    deepest();
  }
  inner();
}
outer();
```

关键性质:**链由代码嵌套位置决定**,跟函数从哪里被调用无关 —— 这就是"词法/静态作用域"。

## 代码示例

```js
const a = 'global';

function outer() {
  const a = 'outer';
  return function inner() {
    console.log(a); // 'outer' —— 沿链向上找到的第一个 a 就停
  };
}

const fn = outer();
fn();
// 即使 fn 是在全局执行,它依然访问 outer 的 a
// 因为作用域链在"定义时"已经确定了,不会被"调用位置"改变
```

## 易错点 / 反例

### 1. 误以为 JS 是动态作用域

```js
function whoAmI() {
  console.log(name);
}

function caller() {
  const name = 'I am caller';
  whoAmI(); // 输出 undefined(严格模式)或全局 name
  // 不会输出 'I am caller'
}
caller();
```

**原因**: `whoAmI` 的作用域链在它**定义时**就锚定了全局,跟 `caller` 没关系。如果你想要 `caller` 的 name,只能显式传参或闭包。

### 2. 未声明就赋值(隐式全局)

```js
function leak() {
  foo = 42; // 没有 var/let/const,严格模式下 ReferenceError
  // 非严格模式下偷偷挂到 window.foo
}
leak();
console.log(window.foo); // 42 —— 污染了全局
```

**修复**: 文件首加 `"use strict"`,或全面使用 ESM(自带严格模式)。

### 3. `with` / `eval` 破坏静态分析

```js
function withDemo(obj) {
  with (obj) {
    a = 1; // 是 obj.a 还是外层 a?要等运行时才知道
  }
}
```

`with` 把对象临时塞进作用域链,使变量绑定**无法在编译期确定**,直接关闭 JIT 优化。**严格模式禁止使用 with**,几乎所有工程规范也都禁止。

`eval` 在非严格模式下能往外层作用域注入新变量,同样要命。能不用就不用。

## 高频面试题(5 题)

- **Q1**: 词法作用域和动态作用域的区别?JS 是哪种?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - **词法/静态**:作用域链由代码书写位置决定(parse 阶段就定下来)
  - **动态**:作用域链由调用栈决定(运行时才确定),如 Bash、早期 Lisp 方言

  JS 是词法作用域,但 `this` 是动态绑定 —— 这是两个独立机制,不要混淆。

  &lt;details&gt;

- **Q2**: 函数作用域和块级作用域有什么区别?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - **函数作用域**:`var`、`function` 声明的作用域以函数为边界
  - **块级作用域**:`let`、`const`、`class`、`function`(严格模式块内)以 `{}` 为边界
  - ES6 之前 JS 没有块级作用域,因此 `for (var i…)` 的 `i` 泄漏到外层

  &lt;details&gt;

- **Q3**: 描述一次变量查找的完整过程。
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  1. 当前 LE 的 Environment Record 里查
  2. 没有 → 沿 `[[OuterEnv]]` 进入上层 LE 再查
  3. 一直查到全局 LE
  4. 全局还没有:
     - 读取 → `ReferenceError`
     - 严格模式赋值 → `ReferenceError`
     - 非严格模式赋值 → 隐式创建为全局变量(`window.xxx`)

  &lt;details&gt;

- **Q4**: 全局变量有几种创建方式?推荐哪种?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  1. 顶层 `var x = 1`(挂到 `window`)
  2. 顶层 `let x = 1` / `const x = 1`(进入全局 LE,但**不**挂 `window`)
  3. 不声明直接赋值 `x = 1`(非严格模式下偷偷创建,严格禁止)
  4. 显式 `window.x = 1`(浏览器)/ `globalThis.x = 1`

  **推荐**: 业务代码避免任何全局变量;真要导出全局,显式 `globalThis.x = 1` 比让 `var` 副作用挂载更清晰。

  &lt;details&gt;

- **Q5**: `with` 为什么被严格模式禁用?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  `with(obj)` 把对象临时插入作用域链,内部所有标识符到底引用哪个变量,**必须**等运行时才知道。这一点:

  - 让作用域分析无法在编译期完成 → JIT 无法做内联缓存等优化
  - 让 minifier / linter 无法可靠改名
  - 代码可读性极差,且容易因属性同名"远程操控"外层变量

  ES5 严格模式直接禁用 `with`,工程界共识也是不用。

  &lt;details&gt;

## 延伸资源

- [MDN: Scope](https://developer.mozilla.org/zh-CN/docs/Glossary/Scope)
- [ECMA-262: Lexical Environments](https://tc39.es/ecma262/#sec-lexical-environments)
- 《You Don't Know JS》Scope & Closures Chapter 1-2

## (留白) 我的理解

> 这一段不强制填。

---

## var / let / const 与暂时性死区

## TL;DR

> `var` 是函数作用域 + 提升初始化为 undefined;`let`/`const` 是块级作用域 + 进入 TDZ;`const` 还多一条"绑定不可变"。

## 背景与动机

`var` 是 ES1 就有的关键字,在 JS 设计早期"宽松、能跑就行"的氛围里留下了一系列坑:

- 没有块级作用域,`for (var i)` 的 `i` 会泄漏出 for 块
- 可以无限次重复声明而不报错,大型协作时容易踩坑
- 变量提升让"未声明就用"看起来"也能跑"(实际是 undefined),掩盖了 bug

ES6 引入 `let` / `const` 修补这些设计缺陷,几乎所有 lint 规则都建议**业务代码彻底放弃 `var`**。理解三者的差异,是写出可预测、可重构 JS 的基本功。

## 核心机制

| 维度                | `var`                     | `let`               | `const`             |
| ------------------- | ------------------------- | ------------------- | ------------------- |
| 作用域              | 函数作用域                | 块级作用域          | 块级作用域          |
| 提升                | 提升 + 初始化 `undefined` | 提升但未初始化(TDZ) | 提升但未初始化(TDZ) |
| 重复声明            | 允许(覆盖)                | 同作用域报错        | 同作用域报错        |
| 声明时必须赋值      | 否                        | 否                  | **是**              |
| 绑定是否可变        | 可变                      | 可变                | **不可变**          |
| 全局顶层挂 `window` | **是**                    | 否                  | 否                  |

**关键概念:暂时性死区(Temporal Dead Zone, TDZ)**

- `let` / `const` 的绑定**在块开始时就已经创建**(也在"提升"),但**未初始化**
- 从块开始到声明语句执行之间的这段区域里,任何对该变量的读取/赋值都会抛 `ReferenceError`
- 这是规范故意设计的"硬错误",防止把"声明前使用"当成正常逻辑

**const 不可变的真正含义**

- `const` 锁的是**绑定**(变量名到值的映射),**不是值本身**
- `const arr = []; arr.push(1)` 完全合法,因为 `arr` 这个绑定没换目标
- 想要值也不可变,需要 `Object.freeze()`(浅冻结)或不可变库

## 代码示例

```js
function demo() {
  console.log(a); // undefined  (var 提升 + 初始化为 undefined)
  // console.log(b); // ReferenceError —— TDZ
  // console.log(c); // ReferenceError —— TDZ

  var a = 1;
  let b = 2;
  const c = 3;

  if (true) {
    var a2 = 10; // 泄漏到 demo 整个函数
    let b2 = 20; // 仅在 if 块内
  }
  console.log(a2); // 10
  // console.log(b2); // ReferenceError —— 块外不可见

  const obj = { x: 1 };
  obj.x = 99; // OK,改的是内部属性,不是绑定
  // obj = {};      // TypeError —— 绑定不可换目标
}
```

## 易错点 / 反例

### 1. const 数组 / 对象内容仍可变

```js
const list = [1, 2];
list.push(3); // ✅ 完全合法
list = []; // ❌ TypeError: Assignment to constant variable

const config = { debug: true };
config.debug = false; // ✅ 合法
```

**修复(若想真不可变)**:`Object.freeze(config)` 浅冻结,或用 Immer / Immutable.js。

### 2. TDZ 比直觉早

```js
let x = 'outer';
function trap() {
  console.log(x); // ReferenceError —— 不是 'outer'
  let x = 'inner';
}
trap();
```

**原因**: 函数体一开始就创建了局部 `x` 的绑定(进入 TDZ),后续 `console.log(x)` 访问的是这个局部绑定,而不是外层 `'outer'`。声明位置在下面也没用 —— **声明的位置只决定 TDZ 何时结束**。

### 3. for + var vs for + let 的关键差异

```js
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 0);
}
// 3 3 3 —— var 全程共享一个 i

for (let i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 0);
}
// 0 1 2 —— let 在每轮迭代中新建一个 i 绑定
```

**规范依据**: ECMA-262 § ForBodyEvaluation 对 `let`-绑定 for 循环有专门规定,每轮迭代会复制一份新绑定。这是 `let` 在 for 循环中的特殊行为。

### 4. 顶层 var 污染全局对象

```js
// 浏览器全局脚本
var leaked = 'hi';
console.log(window.leaked); // 'hi'

let kept = 'hi';
console.log(window.kept); // undefined
```

**含义**: 全局脚本里用 `var` 等于隐式 `window.xxx = ...`,容易和第三方脚本冲突。用 ESM 或顶层 `let`/`const` 避免。

## 高频面试题(5 题)

- **Q1**: `var` / `let` / `const` 的核心区别?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  作用域(函数 vs 块)、提升后是否初始化(undefined vs TDZ)、是否允许重复声明、是否必须初始化、绑定是否可变、是否挂 `window`。表里 6 维全部讲全。

  &lt;details&gt;

- **Q2**: 什么是 TDZ?为什么 `let` / `const` 要设计 TDZ?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  TDZ 是"绑定已创建但未初始化"的时间段,期间访问报 `ReferenceError`。

  设计动机:让"声明前使用"变成硬错误而不是返回 undefined,消除 var 时代靠"提升 + undefined"误导的隐蔽 bug。本质是规范用语义代价换可预测性。

  &lt;details&gt;

- **Q3**: `const arr = []; arr.push(1)` 合法吗?为什么?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  合法。`const` 锁的是绑定,不是值本身。`arr.push(1)` 修改的是数组内部状态,并没有让 `arr` 这个绑定指向另一个数组。想要值不可变需要显式 `Object.freeze()` 或不可变数据结构库。

  &lt;details&gt;

- **Q4**: 解释 `for (let i…)` 和 `for (var i…)` 在闭包场景下输出不同的根因。
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - `var`:整个 for 循环只有一个 `i` 绑定,三次 setTimeout 闭包共享它,执行时 `i === 3`
  - `let`:ECMA-262 规定 for + let 每轮迭代生成新的绑定,三个闭包各自捕获不同的 `i`

  追问点:这不是闭包"行为差异",而是绑定数量不同。

  &lt;details&gt;

- **Q5**: 工程上推荐用 `let` 还是 `const`?为什么?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  默认 `const`,只在确实需要重新赋值时改 `let`。原因:

  - 不可变绑定让代码更容易静态推理
  - 现代 lint(`prefer-const`)能自动检测
  - 大多数业务变量是"声明后就不重新赋值"的,`const` 是正常情况
  - `var` 几乎没有正当用例,只在与古老兼容代码共存时才考虑

  &lt;details&gt;

## 延伸资源

- [MDN: let](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Statements/let)
- [MDN: const](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Statements/const)
- [ECMA-262: let and const Declarations](https://tc39.es/ecma262/#sec-let-and-const-declarations)

## (留白) 我的理解

> 这一段不强制填。

<!-- KNOWLEDGE-IMPORT:END -->
