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

<!-- KNOWLEDGE-IMPORT:START -->

## 类型检测(typeof / instanceof / toString.call / NaN / Object.is)

## TL;DR

> 安全的类型检测组合拳:`typeof`(原始 + function)+ `Array.isArray`(数组)+ `Object.prototype.toString.call`(内置对象 tag)+ `instanceof`(自定义类) + `Object.is`(NaN / -0)。

## 背景与动机

JS 没有统一的"getType"运算符,需要按类型挑工具:

- `typeof` 简单但对 object 类太粗(`typeof [] === 'object'`、`typeof null === 'object'`)
- `instanceof` 跨 iframe / realm 不可靠,可被 `Symbol.hasInstance` 篡改
- `===` 不能比较 `NaN`,无法区分 `+0 / -0`

实战代码的"判断类型"问题分两类:

1. **原始 vs 对象**:用 typeof
2. **具体哪个对象类**:Array.isArray / Object.prototype.toString.call / instanceof

熟练组合这些工具是写鲁棒库 / SDK / 工具函数的基本功。

## 核心机制

### `typeof` —— 检测原始类型

| 输入                                   | 返回          |
| -------------------------------------- | ------------- |
| `undefined`                            | `'undefined'` |
| `null`                                 | `'object'` ⚠ |
| `true`                                 | `'boolean'`   |
| `123` / `NaN` / `Infinity`             | `'number'`    |
| `'x'`                                  | `'string'`    |
| `Symbol()`                             | `'symbol'`    |
| `42n`                                  | `'bigint'`    |
| `function(){}` / `class{}` / 箭头      | `'function'`  |
| 其他对象(包括数组 / Date / Map / null) | `'object'`    |

**特殊安全**:`typeof undeclaredVar` 不会抛 ReferenceError,而是返回 `'undefined'`,可用于"探测变量是否定义"。

### `instanceof` —— 检测原型链

```js
[] instanceof Array; // true
[] instanceof Object; // true(链上有 Object.prototype)
new Date() instanceof Date; // true
```

**限制**:

- 跨 iframe / Worker / realm 失效(各自 Array 不同)
- 可被 `Symbol.hasInstance` 篡改
- 原始值永远 false(`'x' instanceof String === false`)

详见 `js-new-and-constructor`。

### `Array.isArray` —— 跨 realm 安全的数组检测

```js
Array.isArray([]); // true
Array.isArray('a'); // false
Array.isArray({ length: 1 }); // false  (不被 length 属性欺骗)

// 跨 iframe 也对
const iframe = document.createElement('iframe');
document.body.appendChild(iframe);
const otherArray = new iframe.contentWindow.Array();
otherArray instanceof Array; // false ❌
Array.isArray(otherArray); // true  ✅
```

**实现层**:Array.isArray 检查的是内部槽 `[[Class]]`(规范术语 `IsArray`),不依赖 prototype。

### `Object.prototype.toString.call(x)` —— 通用 tag

```js
Object.prototype.toString.call([]); // '[object Array]'
Object.prototype.toString.call(new Date()); // '[object Date]'
Object.prototype.toString.call(/x/); // '[object RegExp]'
Object.prototype.toString.call(new Map()); // '[object Map]'
Object.prototype.toString.call(null); // '[object Null]'
Object.prototype.toString.call(undefined); // '[object Undefined]'
Object.prototype.toString.call(123); // '[object Number]'  (装箱)
Object.prototype.toString.call('x'); // '[object String]'
```

原理:每个内置对象都有 `Symbol.toStringTag` 标签,toString 读这个标签。**也可被自定义类型设置**:

```js
class MyType {
  get [Symbol.toStringTag]() {
    return 'MyType';
  }
}
Object.prototype.toString.call(new MyType()); // '[object MyType]'
```

封装一个 `getType`:

```js
function getType(x) {
  return Object.prototype.toString.call(x).slice(8, -1).toLowerCase();
}
getType([]); // 'array'
getType(new Date()); // 'date'
getType(null); // 'null'
getType(123); // 'number'
```

### `NaN` 检测 —— 三种方式对比

```js
NaN === NaN; // false (=== 也比不了)
NaN == NaN; // false

// 全局 isNaN: 先 ToNumber 再判,会"误报"
isNaN('abc'); // true   ⚠ 'abc' ToNumber → NaN,但 'abc' 不是 NaN 本体
isNaN(NaN); // true
isNaN(undefined); // true

// Number.isNaN: 严格判,值是 NaN 才 true
Number.isNaN('abc'); // false  ✅
Number.isNaN(NaN); // true
Number.isNaN(undefined); // false

// Object.is: 严格同值判
Object.is(NaN, NaN); // true
Object.is(+0, -0); // false  ← 这是它和 === 唯一差别
Object.is(1, 1); // true
```

**结论**:检测 NaN 用 `Number.isNaN` 或 `Object.is(x, NaN)`,**永远不要用全局 `isNaN`**。

### `Object.is` vs `===`

**只有两处差异**:

- `Object.is(NaN, NaN) === true`,而 `NaN === NaN === false`
- `Object.is(+0, -0) === false`,而 `+0 === -0 === true`

其他场景两者等价。React 等库的 `shallowEqual` 用 Object.is 是基于这两条特殊语义。

## 代码示例

### 完整 getType 工具函数

```js
const toString = Object.prototype.toString;

function getType(x) {
  if (x === null) return 'null';
  if (x === undefined) return 'undefined';
  const t = typeof x;
  if (t !== 'object' && t !== 'function') return t; // primitive
  // object 类:从 [object Xxx] 抽取
  return toString.call(x).slice(8, -1).toLowerCase();
}

getType(null); // 'null'
getType(undefined); // 'undefined'
getType(123); // 'number'
getType('abc'); // 'string'
getType(NaN); // 'number'  (NaN 仍是 number)
getType(true); // 'boolean'
getType(Symbol()); // 'symbol'
getType(42n); // 'bigint'
getType(() => {}); // 'function'
getType([]); // 'array'
getType({}); // 'object'
getType(new Date()); // 'date'
getType(/x/); // 'regexp'
getType(new Map()); // 'map'
getType(new Set()); // 'set'
getType(new Promise(() => {})); // 'promise'
```

## 易错点 / 反例

### 1. 全局 `isNaN` 会先 ToNumber,几乎永远不要用

```js
isNaN('abc'); // true  ❌ —— 'abc' 不是 NaN,但被 ToNumber 后变 NaN
isNaN([]); // false ⚠ —— [] ToNumber → 0
isNaN([1, 2]); // true  ❌
```

**修复**:用 `Number.isNaN`(只在 x 严格是 NaN 时返 true)。

### 2. `instanceof` 跨 iframe 失效

```js
const arr = iframe.contentWindow.getArray();
arr instanceof Array; // false ❌ —— 跨 realm
Array.isArray(arr); // true  ✅
```

**修复**:数组用 `Array.isArray`;其他用 `Object.prototype.toString.call`(因为 tag 是基于 Symbol.toStringTag 的字符串,跨 realm 一致)。

### 3. `typeof null === 'object'`

```js
typeof null; // 'object'

// 错误的"是不是对象"检查
function isObject(x) {
  return typeof x === 'object';
}
isObject(null); // true ❌

// 修复
function isObject(x) {
  return x !== null && typeof x === 'object';
}
```

### 4. `Object.keys(obj).length === 0` 检查空对象的边界

```js
Object.keys([]).length === 0; // true  ⚠ —— 空数组被认为是"空对象"

// 更严格:先 getType
function isEmptyPlainObject(x) {
  if (getType(x) !== 'object') return false;
  return Object.keys(x).length === 0;
}
```

### 5. `Symbol.hasInstance` 让 `instanceof` 撒谎

```js
const Anything = {
  [Symbol.hasInstance]() {
    return true;
  },
};
({}) instanceof Anything; // true
'x' instanceof Anything; // true
```

**含义**:不能盲目相信外部对象的 `instanceof` 结果。安全代码用 `Object.prototype.toString.call` 拿到 tag 字符串(不可被外部覆盖类型推断,除非主动设 Symbol.toStringTag)。

### 6. `Number.isFinite` vs `isFinite`

```js
isFinite('123'); // true  ⚠ —— 先 ToNumber
Number.isFinite('123'); // false ✅ —— 严格只对 Number 类型且有限

isFinite(Infinity); // false
Number.isFinite(Infinity); // false (一致)
```

规则相同的还有 `Number.isInteger`、`Number.isSafeInteger`。**始终用带 Number. 前缀的版本**。

## 高频面试题(5 题)

- **Q1**: JS 有哪几种类型检测方法?各自适用什么场景?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - `typeof`:原始类型 + function。`typeof null === 'object'` 是历史 bug
  - `instanceof`:自定义类 / 同 realm 内置类。跨 realm 失效,可被 Symbol.hasInstance 篡改
  - `Array.isArray`:数组,跨 realm 安全
  - `Object.prototype.toString.call(x)`:返回 `[object Tag]` 字符串,通用且跨 realm 安全
  - `Object.is` / `Number.isNaN`:NaN / -0 等特殊值
  - `Number.isFinite` / `Number.isInteger`:严格的数值判断

  实战:封装一个 getType 用 toString.call 拿到 tag,outline 检测覆盖所有情况。

  &lt;details&gt;

- **Q2**: 怎么检测 NaN?为什么 `NaN === NaN` 是 false?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - **推荐**:`Number.isNaN(x)` 或 `Object.is(x, NaN)`
  - **不要用**:全局 `isNaN`(会先 ToNumber,误报 'abc' 为 NaN)
  - **为什么 `NaN === NaN` 是 false**:IEEE 754 规范要求"NaN 与任何值都不相等,包括自己"。设计意图:表达"无效计算结果",任何涉及它的运算都是无意义的

  &lt;details&gt;

- **Q3**: `typeof` 的所有可能返回值?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  8 个字符串:

  - `'undefined'`、`'boolean'`、`'number'`、`'string'`、`'symbol'`、`'bigint'`、`'function'`、`'object'`

  特殊:

  - `typeof null === 'object'`(历史 bug)
  - `typeof undeclaredVar === 'undefined'`(不抛错,可探测变量定义)
  - `typeof document.all === 'undefined'`(HTML 规范特例)

  &lt;details&gt;

- **Q4**: `Object.is` 和 `===` 有什么差异?React 在哪里用?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  两处差异:

  - `Object.is(NaN, NaN) === true`,但 `NaN === NaN === false`
  - `Object.is(+0, -0) === false`,但 `+0 === -0 === true`

  React 的 `shallowEqual`、useState 的"相等判断"用 Object.is,这样:

  - 相邻渲染 NaN 不视为变化(避免无意义重渲)
  - +0 / -0 区分(虽然罕见)

  &lt;details&gt;

- **Q5**: 为什么 `Array.isArray` 比 `arr instanceof Array` 更可靠?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - `instanceof Array` 检查原型链上是否有当前 realm 的 `Array.prototype`,跨 iframe / Worker / Vm context 时各自 Array 不同 → 失效
  - `Array.isArray` 检查规范定义的内部槽(`IsArray` 抽象操作),与 prototype 无关 → 跨 realm 一致

  类似地,`Object.prototype.toString.call(arr)` 也跨 realm 可靠,因为 tag 字符串是规范定义的。

  &lt;details&gt;

## 延伸资源

- [MDN: typeof](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Operators/typeof)
- [MDN: Object.is](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Object/is)
- [MDN: Number.isNaN](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Number/isNaN)

## (留白) 我的理解

> 这一段不强制填。

---

## 类型转换(隐式 / 显式 / == / +)

## TL;DR

> JS 在 `+` / `-` / `==` / `if` 等位置做隐式类型转换,规则可归约为 **ToPrimitive → ToString / ToNumber / ToBoolean** 三步。`==` 用规范的抽象相等算法,`+` 字符串拼接优先。

## 背景与动机

JS 当年为了"宽松、初学者友好",在大量位置允许隐式类型转换。后果:

- 简洁场景下确实方便(`if (str)` / `'count: ' + n`)
- 古怪场景下产生"神题"(`[] == ![]` / `{} + []`)
- 真实项目里隐式转换是难以察觉的 bug 来源

掌握类型转换规则的目标不是会做神题,而是:

1. 写代码时能预测每次运算的实际行为
2. 看见 == 立刻条件反射换成 ===
3. 知道何时必须显式 `Number()` / `String()` / `Boolean()`

## 核心机制

### 三个核心抽象操作

1. **ToPrimitive(value, hint)**: 把对象转为原始值
2. **ToNumber / ToString / ToBoolean**: 把原始值转为目标类型

### ToPrimitive(obj, hint)

hint = `'string'` / `'number'` / `'default'`,决定调用顺序:

1. 调 `obj[Symbol.toPrimitive](hint)` —— 如果定义了
2. **hint 是 string**: 先 `toString()`,再 `valueOf()`
3. **hint 是 number / default**: 先 `valueOf()`,再 `toString()`
4. 任一返回原始值 → 用之;都返回对象 → TypeError

```js
const obj = {
  valueOf() {
    return 1;
  },
  toString() {
    return 'foo';
  },
};
+obj; // 1   ← hint 'number',先 valueOf
`${obj}`; // 'foo' ← hint 'string',先 toString
obj + 'x'; // '1x'  ← hint 'default',先 valueOf 拿到 1 → 字符串拼接
```

### ToNumber 规则

| 来源                | 结果                                |
| ------------------- | ----------------------------------- |
| `undefined`         | `NaN`                               |
| `null`              | `0`                                 |
| `true` / `false`    | `1` / `0`                           |
| `''` / `' '`        | `0`                                 |
| `'12'` / `'  12  '` | `12`                                |
| `'12abc'`           | `NaN`                               |
| `'0x10'`            | `16`                                |
| `[]`                | `0`(toString → '' → 0)              |
| `[5]`               | `5`(toString → '5')                 |
| `[1,2]`             | `NaN`(toString → '1,2')             |
| `{}`                | `NaN`(toString → '[object Object]') |
| Symbol              | TypeError                           |
| BigInt              | TypeError                           |

### ToString 规则

| 来源               | 结果                                    |
| ------------------ | --------------------------------------- |
| `undefined`        | `'undefined'`                           |
| `null`             | `'null'`                                |
| `123`              | `'123'`                                 |
| `NaN` / `Infinity` | `'NaN'` / `'Infinity'`                  |
| `[1,2,3]`          | `'1,2,3'`(数组 toString = `.join(',')`) |
| `{}`               | `'[object Object]'`                     |

### ToBoolean —— **falsy 值完整列表**

只有这 7 个是 falsy,其余都 truthy:

- `false`
- `0` / `-0`
- `0n`(BigInt 零)
- `''`(空字符串)
- `null`
- `undefined`
- `NaN`
- (历史特例)`document.all`

注意:`[]` / `{}` / `'0'` / `'false'` 都是 **truthy**。

### `==` 抽象相等算法(简化版)

两端 x、y:

1. 类型相同 → 走 `===` 路径
2. null == undefined → true(且只对这两个)
3. number == string → 把字符串 ToNumber
4. boolean == 任意 → 把 boolean ToNumber
5. (number | string) == object → 把对象 ToPrimitive
6. number == bigint:同值返回 true
7. 其他 → false

教科书结论:**始终用 `===`,除非你专门要利用 null == undefined**(也建议用 `x == null` 这一个特例)。

### `+` 运算符

1. 两端各 ToPrimitive(hint = `'default'`)
2. 任一是字符串 → 字符串拼接
3. 否则 ToNumber 后相加

```js
1 + 2; // 3
'1' + 2; // '12'
1 + null; // 1
1 + undefined; // NaN
[] + []; // ''
[] + {}; // '[object Object]'
{
}
+[]; // 0  ← {} 被当作块语句,实际是 +[] = 0
```

## 代码示例

```js
// 显式转换(推荐)
Number('12'); // 12
Number('12abc'); // NaN
String(123); // '123'
Boolean(0); // false
parseInt('12abc', 10); // 12   ← parseInt 容忍尾随字符
parseInt('0x10', 16); // 16
parseFloat('3.14abc'); // 3.14

// 一元 + 比 Number() 更短,语义相同
+'12'; // 12

// 双 ! 是常用的 Boolean(x) 写法
!!''; // false
!!'0'; // true
```

## 易错点 / 反例

### 1. `[] == ![]` 为 `true`(神题)

```js
[] == ![]; // true
```

**拆解**:

- `![]` → `!true` → `false`
- 变成 `[] == false`
- bool 转 number: `[] == 0`
- 数组 ToPrimitive: `'' == 0`
- 字符串 ToNumber: `0 == 0` → true

避免方法:别写 `==`,这种题在生产代码里就是 bug。

### 2. `{} + []` vs `[] + {}` 结果不同

```js
{
}
+[]; // 在 console 里输出 0
[] + {}; // '[object Object]'
```

**根因**:`{}` 在表达式开头被解析成**空块语句**,不是对象字面量。这等价于:

```js
{
} // 块
+[]; // 一元 + 转空数组 → 0
```

而 `[] + {}` 中 `[]` 是表达式起点,后面 `{}` 是对象字面量,做字符串拼接。

修复:加括号消歧义 `({} + [])` → `'[object Object]'`。

### 3. `==` 和 `===` 的差异不是"严格 vs 宽松"那么简单

```js
NaN === NaN; // false  ← === 也不能比 NaN
+0 === -0; // true   ← === 把 +0 -0 当相等
null == undefined; // true   ← 唯一允许的"跨类型相等"

Object.is(NaN, NaN); // true
Object.is(+0, -0); // false
```

`Object.is` 是"真正的同值比较",见 `js-type-checking`。

### 4. `JSON.stringify` 对特殊值的处理

```js
JSON.stringify(NaN); // 'null'
JSON.stringify(Infinity); // 'null'
JSON.stringify(undefined); // undefined (不是字符串!)
JSON.stringify({ a: undefined }); // '{}'      ← 属性被丢弃
JSON.stringify([undefined]); // '[null]'  ← 数组里变 null
JSON.stringify(123n); // ❌ TypeError: BigInt not serializable
```

排查"为什么传给后端的字段没了"经常踩这里。

### 5. `parseInt` 的隐藏陷阱

```js
parseInt('0x10'); // 16   ← 0x 前缀自动识别 16 进制
parseInt('010'); // 10   ← ES5 起忽略 0 前缀(旧版认 8 进制)
parseInt('  12 abc  '); // 12   ← 容忍空格和尾随字符
parseInt('abc'); // NaN

// ⚠ map 与 parseInt 联用的经典坑
['10', '10', '10'].map(parseInt); // [10, NaN, 2]
//     ↑                              ↑
//   index=0  base=0     index=1, base=1(无效) → NaN
//                                    index=2, base=2 → '10' 解析为二进制 = 2
```

修复:`arr.map((s) => parseInt(s, 10))`,**永远显式传 radix**。

## 高频面试题(5 题)

- **Q1**: 说出 JS 所有的 falsy 值。
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  完整列表(8 个):

  - `false`
  - `0` / `-0`
  - `0n`
  - `''`
  - `null`
  - `undefined`
  - `NaN`
  - `document.all`(浏览器特例)

  追问点:`[]`、`{}`、`'0'`、`'false'`、`new Boolean(false)` 都是 **truthy**。

  &lt;details&gt;

- **Q2**: `==` 和 `===` 的核心差别?在什么场景下用 `==` 是合理的?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - `===`:类型 + 值都相等(`NaN === NaN` 仍为 false,`+0 === -0` 为 true)
  - `==`:经过 ToPrimitive / ToNumber / ToBoolean 转换后再比较;`null == undefined` 是唯一允许的跨类型相等

  实际推荐:**默认 `===`,只有 `x == null` 这一个特例**(同时判断 null 和 undefined)是社区可接受的 `==` 用法。

  &lt;details&gt;

- **Q3**: `[] == false` 为什么是 true?完整推导。
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - 一边 number/bool 一边 object:bool 先 ToNumber → `[] == 0`
  - 一边 number 一边 object:对象 ToPrimitive → `'' == 0`(空数组 toString)
  - 一边 number 一边 string:string 先 ToNumber → `0 == 0`
  - true

  追问:为什么不直接判断"empty array is truthy"?因为 `==` 走的不是 ToBoolean,而是 ToPrimitive + ToNumber。`Boolean([])` 才是 true。

  &lt;details&gt;

- **Q4**: `+` 运算符的类型转换规则?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  1. 两端 ToPrimitive(hint 'default')
  2. **任一变成字符串** → 字符串拼接
  3. 否则 ToNumber 后数学加

  关键陷阱:

  - `1 + null = 1`(null → 0)
  - `1 + undefined = NaN`(undefined → NaN)
  - `1 + [] = '1'`(`[]` → `''`,触发字符串拼接)
  - `{} + []` 看起来是对象 + 数组,实际是 `空块语句; +[]` = 0

  &lt;details&gt;

- **Q5**: 解释 `ToPrimitive` 的算法,为什么 `+obj` 和 `\`${obj}\`` 可能得到不同结果?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  ToPrimitive(obj, hint) 调用顺序:

  1. 先看 `obj[Symbol.toPrimitive]`,有就用
  2. 否则按 hint:
     - hint='string':先 toString,再 valueOf
     - hint='number' / 'default':先 valueOf,再 toString
  3. 任一返回原始值就用;都返回对象 → TypeError

  `+obj` hint='number',`\`${obj}\``hint='string',若对象同时定义 valueOf 和 toString 且返回不同值,结果不同。详见`Symbol.toPrimitive` 用例。

  &lt;details&gt;

## 延伸资源

- [MDN: 等于运算符](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Operators/Equality)
- [ECMA-262: 抽象操作](https://tc39.es/ecma262/#sec-abstract-operations)
- 《You Don't Know JS》Types & Grammar(Kyle Simpson)

## (留白) 我的理解

> 这一段不强制填。

---

## 原始类型与引用类型(含 Symbol / BigInt)

## TL;DR

> JS 有 **7 种原始类型**(undefined / null / boolean / number / string / symbol / bigint) + **1 种引用类型 object**;原始值不可变、按值传递;访问 `'x'.length` 这种方法时引擎自动"装箱"成对应包装对象。

## 背景与动机

类型系统是其他一切语言特性的基础:

- 决定 `==` / `+` 的行为(类型转换)
- 决定函数传参是按值还是按引用
- 决定相等比较的语义(原始值比较值,对象比较引用)

JS 类型系统的历史:

- ES5 之前:6 种类型(undefined / null / boolean / number / string / object)
- ES6 加入 **Symbol**:唯一标识、协议字段(`Symbol.iterator` / `Symbol.asyncIterator`...)
- ES2020 加入 **BigInt**:超过 `Number.MAX_SAFE_INTEGER`(2^53-1)的整数运算

至今:**7 种原始类型 + 1 种引用类型**。

## 核心机制

### 8 种类型对照表

| 类型      | typeof 结果               | 字面量例                     | 是否原始 |
| --------- | ------------------------- | ---------------------------- | -------- |
| undefined | `'undefined'`             | `undefined`                  | 是       |
| null      | `'object'` ⚠             | `null`                       | 是       |
| boolean   | `'boolean'`               | `true` / `false`             | 是       |
| number    | `'number'`                | `1`、`NaN`、`Infinity`       | 是       |
| string    | `'string'`                | `'a'`、`` `t` ``             | 是       |
| symbol    | `'symbol'`                | `Symbol('id')`               | 是       |
| bigint    | `'bigint'`                | `42n`                        | 是       |
| object    | `'object'` / `'function'` | `{}` / `[]` / `function(){}` | 否(引用) |

注意:**`typeof null === 'object'`** 是历史遗留 bug(早期实现把 null 当对象的零指针),被规范固定下来无法修复。

### 原始 vs 引用的核心差异

| 维度     | 原始类型                     | 引用类型              |
| -------- | ---------------------------- | --------------------- |
| 内存模型 | 栈上直接存值                 | 堆上存对象,栈上存指针 |
| 赋值     | 拷贝值                       | 拷贝引用(共享对象)    |
| 函数传参 | 按值传                       | 按引用传              |
| 不可变性 | 不可变(字符串"修改"返回新串) | 可变                  |
| 相等比较 | 按值                         | 按引用                |

```js
let a = 1;
let b = a;
b = 2;
a; // 1  ← 不受影响

let o = { x: 1 };
let p = o;
p.x = 2;
o.x; // 2  ← 共享引用,被改了
```

### 装箱(autoboxing)

原始值本身没有方法,但 `'hello'.length` 能跑,因为引擎临时把它包装成 `String` 对象,访问完丢弃:

```js
'hello'.length; // 5
// 等价于:
new String('hello').length;

// 但 new String('x') 不是字符串,是对象
typeof new String('x'); // 'object'
typeof 'x'; // 'string'

new String('x') === 'x'; // false  ← 一个是对象一个是原始值
new String('x') == 'x'; // true   ← 装箱后比较
```

**生产代码不要用包装对象(`new String / new Number / new Boolean`)**,只是徒增混淆,几乎没用例。

### Symbol —— 唯一性标识

```js
const s1 = Symbol('id');
const s2 = Symbol('id');
s1 === s2; // false ← 即便描述相同,每次创建都是唯一的

// 作为对象 key,不会和字符串 key 冲突
const obj = {};
obj[s1] = 'value';

// 用途:实现"协议"
class MyCol {
  [Symbol.iterator]() {
    let i = 0;
    return { next: () => (i < 3 ? { value: i++, done: false } : { done: true }) };
  }
}
for (const v of new MyCol()) console.log(v); // 0, 1, 2
```

内置 Symbol(`Symbol.iterator` / `Symbol.asyncIterator` / `Symbol.hasInstance` / `Symbol.toPrimitive`)是 JS 后期扩展机制的核心。

### BigInt —— 大整数

```js
const big = 9007199254740993n; // n 后缀
typeof big; // 'bigint'

big + 1n; // 9007199254740994n
big + 1; // ❌ TypeError: Cannot mix BigInt and other types

Number(big); // 9007199254740992 ← 精度丢失
BigInt(123); // 123n
```

用于:加密、ID(雪花算法 / Twitter snowflake)、高精度计算。**不能和 Number 直接运算**,必须显式转换。

## 代码示例

```js
// 1. 原始值"修改"实际是创建新值
let s = 'hello';
s.replace('h', 'H'); // 返回新串 'Hello'
console.log(s); // 'hello' —— 原值不变

// 2. 函数传参:原始按值 vs 对象按引用
function bump(n, obj) {
  n++; // 局部修改,不影响外部
  obj.x++; // 改的是堆上的对象,外部看得到
}
let n = 1,
  o = { x: 1 };
bump(n, o);
n; // 1 (没变)
o.x; // 2 (被改了)

// 3. Symbol 当协议字段
class Lazy {
  constructor(fn) {
    this._fn = fn;
  }
  [Symbol.toPrimitive](hint) {
    return hint === 'string' ? `lazy<${this._fn()}>` : this._fn();
  }
}
const a = new Lazy(() => 42);
+a; // 42
`${a}`; // 'lazy<42>'
```

## 易错点 / 反例

### 1. `typeof null === 'object'`

```js
typeof null; // 'object'
```

**根因**:早期 V8 之前的实现里,值的低位标签 0 代表对象,null 是全 0 指针,被误识为 object。规范因兼容性原因保留这个行为。

**安全检测 null**:`x === null` 或 `Object.is(x, null)`。

### 2. `new Number(1) !== 1`

```js
new Number(1) === 1; // false  (一个对象,一个原始)
typeof new Number(1); // 'object'
new Boolean(false); // ❗ 这是真值对象!if (new Boolean(false)) {} 会进 if
```

**结论**:不要用 `new String / new Number / new Boolean`。

### 3. `Symbol` 不能 `new`

```js
new Symbol('x'); // ❌ TypeError: Symbol is not a constructor
Symbol('x'); // ✅ 函数调用
```

**根因**:Symbol 是不可变原始值,不允许包装对象;但 `Object(Symbol())` 仍可显式装箱。

### 4. NaN 是 number 类型,且不等于自己

```js
typeof NaN; // 'number'
NaN === NaN; // false
NaN == NaN; // false

// 安全检测
Number.isNaN(NaN); // true
Object.is(NaN, NaN); // true
```

### 5. BigInt 和 Number 不能混算

```js
1n + 1; // ❌ TypeError
1n + BigInt(1); // 2n
Number(1n) + 1; // 2

// 但比较是允许的
1n == 1; // true (== 走 ToNumber)
1n === 1; // false (类型不同)
1n < 2; // true
```

### 6. `document.all` 是 falsy(浏览器特例)

```js
typeof document.all; // 'undefined' ⚠ —— 标准要求如此
Boolean(document.all); // false
```

HTML 规范专门为 `document.all` 留了"魔法值"以兼容老网站,这是唯一一个 `typeof` 返回 `'undefined'` 但实际存在的对象。可作为奇技淫巧记。

## 高频面试题(5 题)

- **Q1**: JS 有几种数据类型?分别是?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  **8 种**:

  - **7 种原始**:undefined / null / boolean / number / string / symbol / bigint
  - **1 种引用**:object(包含 array / function / Date / RegExp / Map / Set ...)

  其中 Symbol 是 ES6 加的,BigInt 是 ES2020 加的。typeof 返回 8 种值,其中 'function' 是 object 的特例。

  &lt;details&gt;

- **Q2**: `typeof null` 为什么是 `'object'`?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  历史遗留 bug:早期实现用低 3 位标签区分类型,000 代表对象,null 表示为全 0 指针,被识别为对象。规范曾考虑改成 'null' 但会破坏兼容,故保留。

  推论:检测 null 用 `x === null`,不要用 `typeof x === 'null'`(永远 false)。

  &lt;details&gt;

- **Q3**: 为什么 `'hello'.length` 能跑?原始值不是没有方法吗?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  自动装箱(autoboxing):访问原始值上的属性/方法时,引擎临时把它包装成对应的对象(String / Number / Boolean),访问完丢弃。这是规范规定的 `ToObject` 语义。

  注意:这不等于真的有 `new String('hello')`;`typeof 'hello' === 'string'`,但 `typeof new String('hello') === 'object'`。

  &lt;details&gt;

- **Q4**: Symbol 解决什么问题?举两个真实场景。
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  Symbol 是"唯一性标识",每次 `Symbol()` 返回的值都不同。两类用途:

  1. **私有对象 key**:用 Symbol 做 key,避免和用户/第三方添加的字符串 key 冲突
  2. **协议字段**:`Symbol.iterator` / `Symbol.asyncIterator` / `Symbol.toPrimitive` / `Symbol.hasInstance` 让自定义类型遵循语言级协议

  内置 Symbol 是 JS 通过 "well-known symbols" 扩展语言行为的方式,几乎所有迭代器协议、Proxy hooks 都建立在 Symbol 上。

  &lt;details&gt;

- **Q5**: BigInt 与 Number 互转规则?能直接相加吗?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - `BigInt → Number`: `Number(big)`,大于 `2^53 - 1` 时精度丢失
  - `Number → BigInt`: `BigInt(num)`,小数会抛 `RangeError`
  - **不能直接混算**(`1n + 1` 报 TypeError),必须显式转换

  但比较运算符允许混用:`1n == 1` 是 true(走 ToNumber),`1n === 1` 是 false(类型不同),`1n < 2` 也成立。

  &lt;details&gt;

## 延伸资源

- [MDN: JS 数据类型](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Data_structures)
- [ECMA-262: Types](https://tc39.es/ecma262/#sec-ecmascript-data-types-and-values)
- [MDN: BigInt](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/BigInt)

## (留白) 我的理解

> 这一段不强制填。

<!-- KNOWLEDGE-IMPORT:END -->
