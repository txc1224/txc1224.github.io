---
title: '响应式原理'
order: 2
---

# 响应式原理

> Vue 3 基于 Proxy 实现响应式系统，理解 ref / reactive / computed / watch 是写好 Vue 的基础。

---

## ref vs reactive

| 特性       | `ref`                       | `reactive`          |
| ---------- | --------------------------- | ------------------- |
| 适用类型   | 任意类型（基本类型 + 对象） | 仅对象/数组/Map/Set |
| 访问方式   | `.value`                    | 直接访问属性        |
| 模板中使用 | 自动解包，无需 `.value`     | 直接使用            |
| 重新赋值   | 可以 `ref.value = newVal`   | 不能整体替换        |
| 解构       | 保持响应式                  | **丢失响应式**      |
| 推荐场景   | 基本类型、需要重新赋值      | 复杂对象、表单数据  |

```ts
import { ref, reactive } from 'vue';

const count = ref(0); // Ref<number>
count.value++; // JS 中需要 .value

const state = reactive({
  name: 'Vue',
  version: 3,
});
state.name = 'Vue 3'; // 直接修改属性
```

---

## computed 计算属性

```ts
import { ref, computed } from 'vue';

const price = ref(100);
const qty = ref(2);

// 只读计算属性
const total = computed(() => price.value * qty.value);

// 可写计算属性
const fullName = computed({
  get: () => `${first.value} ${last.value}`,
  set: (val) => {
    const [f, l] = val.split(' ');
    first.value = f;
    last.value = l;
  },
});
```

---

## watch vs watchEffect

| 特性     | `watch`                          | `watchEffect`  |
| -------- | -------------------------------- | -------------- |
| 数据源   | 需要显式指定                     | 自动收集依赖   |
| 旧值访问 | 可以拿到 oldValue                | 不能           |
| 立即执行 | 默认不执行，需 `immediate: true` | 立即执行一次   |
| 适用场景 | 精确监听特定数据                 | 副作用自动追踪 |

```ts
import { ref, watch, watchEffect } from 'vue';

const keyword = ref('');

// watch：监听指定数据源
watch(
  keyword,
  (newVal, oldVal) => {
    console.log(`${oldVal} -> ${newVal}`);
  },
  { immediate: true },
);

// watch：监听对象属性，使用 getter
watch(
  () => state.name,
  (val) => {
    console.log('name changed:', val);
  },
);

// watchEffect：自动追踪依赖
watchEffect(() => {
  console.log('keyword is:', keyword.value);
});
```

---

## toRef / toRefs / unref / isRef

```ts
import { reactive, toRef, toRefs, unref, isRef } from 'vue';

const state = reactive({ name: 'Vue', version: 3 });

// toRef：将 reactive 某个属性转为 ref（保持响应式连接）
const nameRef = toRef(state, 'name');

// toRefs：将 reactive 全部属性转为 ref（解构不丢失响应式）
const { name, version } = toRefs(state);

// unref：如果是 ref 返回 .value，否则返回本身
const val = unref(count); // 等价于 isRef(count) ? count.value : count

// isRef：判断是否为 ref
isRef(count); // true
```

---

## shallowRef / shallowReactive

```ts
import { shallowRef, shallowReactive, triggerRef } from 'vue';

// shallowRef：只有 .value 的整体替换才触发更新
const data = shallowRef({ list: [1, 2, 3] });
data.value.list.push(4); // 不触发更新
data.value = { list: [1, 2, 3, 4] }; // 触发更新
triggerRef(data); // 手动触发更新

// shallowReactive：只有第一层属性是响应式的
const form = shallowReactive({
  user: { name: 'Vue' }, // user.name 不是响应式
});
```

> 适用场景：大型不可变数据（如列表渲染的原始数据），避免深层 Proxy 带来的性能开销。

---

## 响应式原理简述

| 版本  | 实现方式                | 局限性                              |
| ----- | ----------------------- | ----------------------------------- |
| Vue 2 | `Object.defineProperty` | 无法检测属性新增/删除、数组索引修改 |
| Vue 3 | `Proxy`                 | 需要 ES6+ 环境，不支持 IE11         |

```
Vue 3 响应式��程：
reactive(obj) → new Proxy(obj, handler)
  ├─ get → track(target, key)  收集依赖
  └─ set → trigger(target, key) 触发更新
```

---

## 常见陷阱

```ts
// ❌ 解构 reactive 丢失响应式
const state = reactive({ count: 0 });
let { count } = state; // count 不再是响应式
count++; // 不会触发视图更新

// ✅ 使用 toRefs 解构
const { count } = toRefs(state);
count.value++; // 正常触发更新
```

```ts
// ❌ 整体替换 reactive
let state = reactive({ list: [] });
state = reactive({ list: [1, 2] }); // 原始引用丢失

// ✅ 修改内部属性，或使用 ref
state.list = [1, 2]; // 正常
const state = ref({ list: [] }); // 可以整体替换 .value
```

<!-- KNOWLEDGE-IMPORT:START -->

## Vue 模板编译与 diff 算法

## TL;DR

> Vue 模板在**构建时**(SFC)或**运行时**编译成 `render` 函数,产物是带 **patch flag** + **静态提升** + **块树**(block tree)优化的虚拟 DOM。diff 阶段只比较带 flag 的动态部分,数组用**最长递增子序列**(LIS)算法最小化 DOM 移动。

## 背景与动机

Vue 3 的**性能跨代提升**主要来自编译器:把"运行时不知道什么会变化"的痛点搬到编译期解决。

- Vue 2:diff 每个节点都做属性 / 子节点全量对比,大量浪费在静态内容上
- Vue 3:编译时标记动态部分,运行时直接跳过静态内容

加上 Composition API + Proxy 响应式,Vue 3 在大型应用上的差距 = 决定性。

理解编译产物 / patch flag / 块树 + diff = 看懂 Vue 性能的所有 trick。

## 核心机制

### 编译流程

```
模板 / &lt;template&gt;
   │
   ▼
Parse → AST
   │
   ▼
Transform → 标记静态节点 / 加 patch flag / 提升常量
   │
   ▼
Generate → render 函数 + helpers
```

源码 → 用 [Vue Template Explorer](https://vue-next-template-explorer.netlify.app/) 可看实时产物。

### 例子:模板 → render 函数

模板:

```vue
&lt;template&gt; &lt;div&gt; &lt;h1&gt;Hello&lt;h1&gt; &lt;p&gt;{{ msg }}&lt;p&gt;
<span :class="cls"></span>
```

编译后(伪代码):

```js
import { createElementVNode as _ce, openBlock as _ob, createElementBlock as _ceb, toDisplayString as _ts } from 'vue';

const _hoisted_1 = /*#__PURE__*/ _ce('h1', null, 'Hello', -1);

export function render(_ctx) {
  return (
    _ob(),
    _ceb('div', null, [
      _hoisted_1,
      _ce('p', null, _ts(_ctx.msg), 1 /* TEXT */),
      _ce('span', { class: _ctx.cls }, 'x', 2 /* CLASS */),
    ])
  );
}
```

观察:

- `&lt;h1&gt;Hello&lt;h1&gt;` 是静态,被**提升到 render 函数外**,只创建一次
- `&lt;p&gt;{{ msg }}&lt;p&gt;` 标记 `1 /* TEXT */`,patch 时只比 text 内容
- `<span :class>` 标记 `2 /* CLASS */`,只比 class
- `openBlock + createElementBlock` 建立**块**,块只追踪自身和动态子节点

### Patch Flag(关键优化点)

| 值   | 名               | 含义                                  |
| ---- | ---------------- | ------------------------------------- |
| 1    | TEXT             | 仅 text 内容动态                      |
| 2    | CLASS            | 仅 class 动态                         |
| 4    | STYLE            | 仅 style 动态                         |
| 8    | PROPS            | 部分 props 动态(配 dynamicProps 数组) |
| 16   | FULL_PROPS       | 整体 props 动态(`v-bind="obj"`)       |
| 32   | HYDRATE_EVENTS   | 有事件监听器                          |
| 64   | STABLE_FRAGMENT  | 子节点顺序稳定的片段                  |
| 128  | KEYED_FRAGMENT   | 带 key 的片段(v-for)                  |
| 256  | UNKEYED_FRAGMENT | 不带 key 的片段(性能差)               |
| 512  | NEED_PATCH       | 需要 patch(ref 等)                    |
| 1024 | DYNAMIC_SLOTS    | 动态 slot                             |
| -1   | HOISTED          | 静态提升                              |
| -2   | BAIL             | 跳过优化(动态 component 等)           |

可以**叠加**(bit 或):`TEXT | CLASS = 3`。

### 静态提升(hoistStatic)

完全静态的节点被提到 render 外:

```js
// 模板:&lt;h1&gt;Hello&lt;h1&gt;&lt;p&gt;{{ msg }}&lt;p&gt;
const hoisted = createVNode('h1', null, 'Hello'); // ⭐ render 外,只创建一次

function render() {
  return [hoisted, createVNode('p', null, msg, 1)]; // 复用 hoisted
}
```

每次 render 不重新创建 vnode 对象,GC 压力下降。

### 块树(Block Tree)

传统虚拟 DOM 树是"层层下钻 diff"。Vue 3 的"块"概念:

- 每个组件 / `v-if` / `v-for` 是一个**块**
- 块内**只追踪带 patch flag 的动态子节点**(扁平化到一个数组),静态结构忽略
- diff 块时,跳过整棵静态子树,只比对动态子节点

```
不带块:                           带块:
  div                              div  ← block(只追踪 dynamic[])
   ├─ h1(静态)         vs        │
   ├─ span(静态)                  ▼
   │   └─ b(静态)             dynamic: [p_msg, span_cls]
   └─ p(动态 {{msg}})              ↑
                                   diff 只看这两个
```

**含义**:页面里 99% 静态结构 + 1% 动态 → patch 复杂度从 O(N 全部) 降到 O(动态数)。

### diff 算法(diff 用于 v-for / 子节点列表)

比较新旧子节点数组,目标:最小化 DOM 操作。

经典快速 path(头尾双端):

1. 头头比对相同 patch,头不同跳出
2. 尾尾比对相同 patch,尾不同跳出
3. 老的剩下要删,新的剩下要增

最优 path(无法快速消除时): 4. 把**新数组中未处理部分**做成 `key → index` map 5. 遍历老节点,在 map 里找,记录"新位置序列" 6. 对该序列求**最长递增子序列(LIS)**,LIS 内的节点**不需移动**,LIS 外的节点用 insertBefore 移动 7. 多余的老节点删除,新增的节点插入

LIS 算法保证 DOM 移动次数最少 = 性能最优。

## 代码示例

### v-for 一定要 key,且不能用 index

```vue
<!-- ❌ 没 key 或用 index 当 key -->
<li v-for="(item, i) in list" :key="i"></li>
```

**根因**:用 index 时插入/删除/排序后 key 不变,diff 误判"还是同一个元素",可能复用错节点导致状态混乱(input value、checkbox 状态错位)。

### 用 h() 手写 render(不通过模板)

```js
import { defineComponent, h, ref } from 'vue';

export default defineComponent({
  setup() {
    const count = ref(0);
    return () => h('button', { onClick: () => count.value++ }, count.value);
  },
});
```

适合**高度动态**的场景(JSX 一样)。但失去编译优化(patch flag / 块树),性能不如模板。

## 易错点 / 反例

### 1. v-for 用 index 当 key

```vue
<li v-for="(item, i) in list" :key="i"></li>
```

**修复**:用稳定唯一 id 当 key。

### 2. v-for 和 v-if 同一节点

```vue
<!-- Vue 2 警告但允许;Vue 3 直接错误 -->
<li v-for="item in list" v-if="item.show"></li>
```

**根因**:优先级冲突(Vue 3 v-if 高于 v-for,看到的是单个元素不是数组)。
**修复**:

```vue
<template v-for="item in list" :key="item.id">
  <li v-if="item.show">{{ item.name }}&lt;li&gt; &lt;template&gt;</li>
</template>
```

### 3. 大量 `v-bind="obj"` 让 patch flag 退化

```vue
<div v-bind="dynamicProps"></div>
```

每次都要 diff 整个 props 对象。如果只是几个属性,显式写更优。

### 4. 自己 h() 写 render 失去编译优化

模板被编译器加 patch flag / 静态提升 / 块树;手写 h() 这些全没。复杂动态场景必须 h() 时,接受性能代价。

### 5. `v-html` 内容不参与 vue 响应 / 编译

```vue
<div v-html="rawHtml"></div>
```

内部当作字符串塞进 DOM,**不响应、不编译,XSS 风险**。仅用于可信内容,且最好过 DOMPurify。

### 6. v-once 用错地方

```vue
<div v-once></div>
```

适合"真的永不更新"的内容(常量、初始 banner)。**误用**会让动态内容静止不动。

## 高频面试题(5 题)

- **Q1**: Vue 模板是怎么变成可执行代码的?描述编译流程。
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  三阶段:

  1. **Parse**:模板字符串 → AST(节点树,含 element / text / interpolation 等类型)
  2. **Transform**:遍历 AST 加优化标记(patch flag、静态提升、块树标识)
  3. **Generate**:输出 `render` 函数代码,内部用 `createElementVNode` / `createBlock` 等 helpers

  SFC `&lt;template&gt;` 在构建时编译;运行时模板(`new Vue({ template: ... })`)在浏览器里编译,体积大。生产推荐 SFC + 构建时编译。

  &lt;details&gt;

- **Q2**: Vue 3 的 patch flag 是什么?有什么用?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  patch flag 是编译器给每个动态 vnode 打的"动态类型标记":TEXT(1) / CLASS(2) / STYLE(4) / PROPS(8) / FULL_PROPS(16) 等,可叠加。

  作用:diff 阶段只比对带 flag 的部分:

  - 只 TEXT → 只比 text 字符串
  - 只 CLASS → 只比 class
  - 完全静态 → -1(HOISTED)直接跳过

  对比 Vue 2 全量 diff,patch flag 让虚拟 DOM 性能跨代提升,特别是"99% 静态 + 1% 动态"的常见页面。

  &lt;details&gt;

- **Q3**: 什么是"静态提升"?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  编译器把**完全静态**的 vnode 创建移到 render 函数外,作为常量:

  ```js
  const _hoisted_1 = createVNode('h1', null, 'Hello');
  function render() {
    return [_hoisted_1, ...];   // 复用,不重新创建
  }
  ```

  好处:render 不重复创建静态 vnode 对象,GC 压力 / 内存分配大幅减少。模板里静态结构越多收益越大。

  &lt;details&gt;

- **Q4**: Vue 3 diff 是怎么处理 v-for 列表的?为什么 key 重要?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  diff 列表分快速 path 和最优 path:

  **快速 path**(双端比较):

  1. 头头比 → 相同 patch,不同跳出
  2. 尾尾比 → 同上
  3. 老剩余删除,新剩余插入

  **最优 path**(快速 path 解决不了时): 4. 新数组未处理部分建 `key → index` map 5. 遍历老节点找新位置 → 求**最长递增子序列(LIS)** 6. LIS 内的节点不移动,LIS 外的用 insertBefore 移动

  key 重要的原因:diff 靠 key 识别"是否同一个元素"。用 index 当 key,在插入 / 删除 / 排序后 key 不变,diff 误以为还是同一个 → 状态(input value 等)错位。

  &lt;details&gt;

- **Q5**: 块树(Block Tree)是什么?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  每个组件 / v-if 块 / v-for 块是一个"块"(block)。块内**扁平化追踪所有动态子节点**(带 patch flag 的),静态结构忽略不参与 diff。

  好处:diff 块时只看 `dynamic` 数组,而不是递归整棵 vnode 树。比如 1000 个节点中只有 3 个动态,diff 只看那 3 个,复杂度从 O(1000) 降到 O(3)。

  这是 Vue 3 相对传统虚拟 DOM 的核心优化。

  &lt;details&gt;

## 延伸资源

- [Vue: Rendering Mechanism](https://vuejs.org/guide/extras/rendering-mechanism.html)
- [Vue Compiler 源码](https://github.com/vuejs/core/tree/main/packages/compiler-core)
- [Template Explorer](https://vue-next-template-explorer.netlify.app/)

## (留白) 我的理解

> 这一段不强制填。

---

## Composition API、script setup 与 Pinia

## TL;DR

> **Composition API**(Vue 3 主流写法):用函数式组合逻辑,替代 Options API 的"按选项分块"。**`<script setup>`** 是 Composition API 的语法糖,免 return + 编译时优化。**Pinia** 是 Vue 3 官方推荐状态管理,替代 Vuex,更简洁、类型友好。

## 背景与动机

Vue 2 Options API(`data` / `methods` / `computed` / `watch` / `created` ...)在小组件上很清晰,但复杂组件:

- 同一功能(如"搜索"逻辑)散落在 4-5 个 option
- 复用 = mixin / scoped slot,逻辑追踪困难
- TS 类型推导差

Composition API(Vue 3)的核心见解:**按"业务能力"组织代码,而不是按"选项类型"**。每段功能用一个 `useXxx()` 函数封装,组件 setup 只是把 composable 拼起来。

`<script setup>` 进一步把样板代码删到极致;Pinia 把"模块化、类型推导、devtools"等 Vuex 痛点全部解决。

## 核心机制

### Options API vs Composition API

```vue
<!-- Options API(Vue 2 风格,Vue 3 仍支持) -->
&lt;script&gt;
export default {
  data() { return { count: 0 }; },
  computed: { double() { return this.count * 2; } },
  methods: { inc() { this.count++; } },
  mounted() { console.log('mounted'); },
};
&lt;script&gt;

<!-- Composition API -->
<script setup>
import { ref, computed, onMounted } from 'vue';

const count = ref(0);
const double = computed(() => count.value * 2);
function inc() { count.value++; }

onMounted(() => console.log('mounted'));
&lt;script&gt;
```

两套写法可共存(Vue 3 同时支持),官方推荐 Composition + `<script setup>`。

### `<script setup>` 的编译魔法

```vue
<script setup>
import { ref } from 'vue';
import MyButton from './MyButton.vue';

const count = ref(0);
const props = defineProps<{ msg: string }>();
const emit = defineEmits<{ change: [value: number] }>();
defineExpose({ inc: () => count.value++ });
&lt;script&gt;

&lt;template&gt;
  <MyButton @click="emit('change', count + 1)">{{ msg }} / {{ count }}&lt;MyButton&gt;
&lt;template&gt;
```

- 顶层声明(变量、函数、import 的组件)**自动暴露**给模板,无需 return
- `defineProps` / `defineEmits` / `defineExpose` 是编译器宏(运行时不存在),只能在 `<script setup>` 里用
- 编译器自动加 `setup()` 包装

### 生命周期钩子对照

| Options API     | Composition API                | 时机                      |
| --------------- | ------------------------------ | ------------------------- |
| `beforeCreate`  | (在 setup 之前自动跑,无 hook)  | 实例初始化                |
| `created`       | (`setup` 内同步代码即 created) | 实例创建完成              |
| `beforeMount`   | `onBeforeMount`                | DOM 挂载前                |
| `mounted`       | `onMounted`                    | DOM 挂载后                |
| `beforeUpdate`  | `onBeforeUpdate`               | 数据更新引起 DOM patch 前 |
| `updated`       | `onUpdated`                    | DOM patch 后              |
| `beforeUnmount` | `onBeforeUnmount`              | 卸载前                    |
| `unmounted`     | `onUnmounted`                  | 卸载后                    |
| `errorCaptured` | `onErrorCaptured`              | 子组件错误                |

### 组合式函数(composable)

通过约定 `useXxx` 命名,封装可复用逻辑:

```ts
// composables/useMouse.ts
import { ref, onMounted, onUnmounted } from 'vue';

export function useMouse() {
  const x = ref(0), y = ref(0);
  function update(e: MouseEvent) { x.value = e.pageX; y.value = e.pageY; }
  onMounted(() => window.addEventListener('mousemove', update));
  onUnmounted(() => window.removeEventListener('mousemove', update));
  return { x, y };
}

// 使用
<script setup>
const { x, y } = useMouse();
&lt;script&gt;
```

- 干净的副作用管理(自动 cleanup)
- 任意组件复用,无需 mixin / 高阶组件
- TS 类型推导完整

### Pinia 状态管理

```ts
// stores/counter.ts
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useCounterStore = defineStore('counter', () => {
  const count = ref(0);
  const double = computed(() => count.value * 2);
  function inc() { count.value++; }
  return { count, double, inc };
});

// 组件里
<script setup>
import { useCounterStore } from '@/stores/counter';
const counter = useCounterStore();
// counter.count, counter.double, counter.inc()

// 解构要 storeToRefs
import { storeToRefs } from 'pinia';
const { count, double } = storeToRefs(counter);
&lt;script&gt;
```

Pinia vs Vuex:

- **没有 mutations**(直接改 state,响应式自动跟)
- **没有 modules 嵌套**(每个 store 是平级的 composable)
- **完美 TS 类型推导**(Vuex 4 类型痛苦,Pinia 0 配置)
- **可异步 actions**(就是普通函数)
- **devtools 一样支持**

Vue 3 应用**优先选 Pinia**,Vuex 进入维护模式。

### `provide` / `inject`(跨层级传递)

```ts
// 父
import { provide, ref } from 'vue';
const theme = ref('dark');
provide('theme', theme);

// 任意后代
import { inject } from 'vue';
const theme = inject('theme');
```

适合"跨多层组件传递",但不要替代 Pinia 用作全局状态(provide 仅在子树内可见)。

## 代码示例

### 完整 composable + 测试友好

```ts
// composables/useFetch.ts
import { ref, watchEffect, type Ref } from 'vue';

export function useFetch&lt;T&gt;(url: Ref&lt;string&gt;) {
  const data = ref<T | null>(null);
  const error = ref<Error | null>(null);
  const loading = ref(false);

  watchEffect(async (onCleanup) => {
    loading.value = true;
    error.value = null;
    const ctrl = new AbortController();
    onCleanup(() => ctrl.abort());

    try {
      const res = await fetch(url.value, { signal: ctrl.signal });
      data.value = (await res.json()) as T;
    } catch (e) {
      if ((e as Error).name !== 'AbortError') error.value = e as Error;
    } finally {
      loading.value = false;
    }
  });

  return { data, error, loading };
}
```

特点:

- url 变了自动重 fetch(watchEffect)
- 切到新 url 时旧 fetch 自动 abort(onCleanup)
- 全部响应式,组件 unmount 自动停

## 易错点 / 反例

### 1. `<script setup>` 里访问 ref 忘加 `.value`

```vue
<script setup>
import { ref } from 'vue';
const count = ref(0);
function add() { count++; }    // ❌ count 是 ref 对象,不是 number
&lt;script&gt;
```

**修复**:`count.value++`。

模板里 `{{ count }}` 不用 `.value` 是因为编译器自动展开,但 `&lt;script&gt;` 里**必须** `.value`。

### 2. 在 setup 异步代码里调 lifecycle hook

```vue
<script setup>
import { onMounted } from 'vue';

(async () => {
  await fetchSomething();
  onMounted(() => {});       // ❌ 此时已不在 setup 同步流,绑不上组件实例
})();
&lt;script&gt;
```

**根因**:lifecycle hook 必须在 setup 同步执行期间注册。
**修复**:把 hook 注册放到顶层。

### 3. composable 没自动 cleanup

```ts
export function useTimer() {
  const id = setInterval(() => {}, 1000);
  // ❌ 没 onUnmounted 清,组件销毁后定时器仍跑
}
```

**修复**:`onUnmounted(() => clearInterval(id))`。

### 4. Pinia store 直接解构失去响应

```ts
const counter = useCounterStore();
const { count } = counter; // ❌ 普通 number,不响应
const { count } = storeToRefs(counter); // ✅
```

### 5. `defineProps` 解构默认值失去响应(Vue 3.5 前)

```vue
<script setup>
// Vue 3.5+ 直接解构有 reactivity transform 自动 unwrap
const { msg = 'hi' } = defineProps<{ msg?: string }>();
// 3.5 之前要这样:
const props = withDefaults(defineProps<{ msg?: string }>(), { msg: 'hi' });
&lt;script&gt;
```

### 6. `provide` 不传响应数据 → 后代拿到时刻快照

```ts
provide('count', count.value); // ❌ 传值,后代拿到的是当时的 number
provide('count', count); // ✅ 传 ref,后代用 inject + .value
```

## 高频面试题(5 题)

- **Q1**: Composition API 解决了 Options API 什么问题?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - **逻辑分散**:同一功能在 Options API 里散落在 data / methods / computed / watch / mounted 等多处,大组件难以追踪
  - **复用难**:mixin 隐式合并,命名冲突 / 数据来源不明
  - **TS 推导弱**:Options API 用 this 上下文,TS 推导复杂

  Composition API 按"业务能力"组织,每段功能可抽成 `useXxx()` 可复用、可测试、TS 友好。

  &lt;details&gt;

- **Q2**: `<script setup>` 解决了什么?和 setup() 函数写法有什么不同?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - **样板代码砍掉**:顶层声明自动暴露给模板,无需 return
  - **编译优化**:更少运行时开销,组件 instance 创建更快
  - **专用宏**:`defineProps` / `defineEmits` / `defineExpose` / `defineModel` 是编译时宏,只在 `<script setup>` 内可用
  - **TS 一等公民**:`<script setup lang="ts">` 写起来更自然

  Composition API + `<script setup>` 是 Vue 3 现代写法的标配。

  &lt;details&gt;

- **Q3**: Pinia 和 Vuex 有什么区别?为什么 Vue 3 推荐 Pinia?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - **没有 mutations**:Pinia 直接修改 state(响应式自动跟踪),Vuex 必须 commit('xxx')
  - **没有嵌套 modules**:Pinia 每个 store 是独立 composable,扁平化
  - **TS 推导完美**:Pinia 0 配置类型;Vuex 4 类型很痛苦
  - **支持 setup-style store**:`defineStore('id', () => { ... })` 直接用 ref / computed
  - **devtools 同样支持**

  Vue 3 推荐 Pinia,Vuex 4 进入维护模式不再增新功能。

  &lt;details&gt;

- **Q4**: 组合式函数(composable)的命名和写法约定?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - 命名 `useXxx`(`useMouse` / `useFetch`)
  - 内部使用 ref / reactive / lifecycle hooks
  - **必须在 setup 同步流里调用**(否则 lifecycle hook 绑不上组件)
  - 返回响应式数据 + 操作函数
  - 副作用自管理(onMounted 注册,onUnmounted 清理)

  ```ts
  export function useMouse() {
    const x = ref(0);
    onMounted(() => window.addEventListener('mousemove', ...));
    onUnmounted(() => window.removeEventListener(...));
    return { x };
  }
  ```

  &lt;details&gt;

- **Q5**: 为什么 Pinia 解构 store 需要 `storeToRefs`?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  Pinia 的 store 内部用 reactive(setup-style 也最终是 reactive 包装)。直接解构会把响应属性变成普通值:

  ```ts
  const { count } = useCounterStore(); // count 是 number,不响应
  ```

  `storeToRefs` 把每个 state / getter 转成 ref,解构后仍响应:

  ```ts
  const { count, double } = storeToRefs(useCounterStore());
  ```

  注意:**actions 不需要 storeToRefs**(函数本身可直接解构)。

  &lt;details&gt;

## 延伸资源

- [Vue: Composition API FAQ](https://vuejs.org/guide/extras/composition-api-faq.html)
- [Vue: `<script setup>`](https://vuejs.org/api/sfc-script-setup.html)
- [Pinia 文档](https://pinia.vuejs.org/introduction.html)

## (留白) 我的理解

> 这一段不强制填。

---

## Vue 响应式系统(Vue 2 defineProperty vs Vue 3 Proxy)

## TL;DR

> Vue 响应式 = "**数据变化自动触发视图更新**"。Vue 2 用 `Object.defineProperty`(getter/setter 逐个递归),Vue 3 用 **`Proxy`**(整体拦截 + 懒处理)。核心三件套:`reactive`(对象代理)/ `ref`(原始值包装)/ `effect`(自动追踪依赖)。

## 背景与动机

Vue 的招牌特性是"声明式 + 响应式":

- 你写 `count.value++`,模板里用到 count 的地方自动更新
- 不需要手动 setState / forceUpdate
- 背后是一套"依赖收集 + 派发更新"系统

Vue 3 重写响应式系统(Vue 2 用了 6 年的 `Object.defineProperty` 方案被换掉),原因:

- defineProperty 不能检测**新增/删除属性**(必须 `Vue.set` / `Vue.delete`)
- 不能检测**数组索引修改**和 `length` 直接赋值
- **递归处理整对象**,初始化开销大
- 不支持 Map / Set

Vue 3 用 `Proxy` 一次性解决所有问题,并通过**懒处理**(用到了才递归)提升性能。

## 核心机制

### Vue 3 响应式三件套

```js
import { reactive, ref, effect } from 'vue';

// 1. reactive:把对象包成 Proxy
const state = reactive({ count: 0, list: [] });

// 2. ref:把原始值包成对象 { value: ... }
const count = ref(0);

// 3. effect:自动追踪 effect 内访问的响应式数据,数据变了重新跑
effect(() => {
  console.log(state.count, count.value);
});

state.count = 1; // 触发 effect
count.value = 2; // 触发 effect
```

### `reactive` 内部:Proxy + track/trigger

简化版实现:

```js
const targetMap = new WeakMap(); // target → key → Set&lt;effect&gt;

function reactive(obj) {
  return new Proxy(obj, {
    get(target, key, receiver) {
      track(target, key); // 当前 effect 与 (target, key) 绑定
      const v = Reflect.get(target, key, receiver);
      return typeof v === 'object' && v !== null ? reactive(v) : v;
      //                                                     ↑ 懒递归
    },
    set(target, key, value, receiver) {
      const oldValue = target[key];
      const result = Reflect.set(target, key, value, receiver);
      if (oldValue !== value) trigger(target, key); // 触发所有相关 effect
      return result;
    },
    deleteProperty(target, key) {
      const had = key in target;
      const result = Reflect.deleteProperty(target, key);
      if (had) trigger(target, key);
      return result;
    },
  });
}

let activeEffect = null;
function effect(fn) {
  const wrapped = () => {
    activeEffect = wrapped;
    fn();
    activeEffect = null;
  };
  wrapped();
}

function track(target, key) {
  if (!activeEffect) return;
  let depsMap = targetMap.get(target);
  if (!depsMap) targetMap.set(target, (depsMap = new Map()));
  let dep = depsMap.get(key);
  if (!dep) depsMap.set(key, (dep = new Set()));
  dep.add(activeEffect);
}

function trigger(target, key) {
  const depsMap = targetMap.get(target);
  if (!depsMap) return;
  const dep = depsMap.get(key);
  if (dep) dep.forEach((fn) => fn());
}
```

### 为什么 `ref` 要 `.value`

Proxy 只能代理**对象**,不能代理原始值(基本类型没法塞 getter/setter)。所以 `ref` 用对象包一层:`{ value: rawValue }`,在 `.value` 的 getter / setter 里做 track / trigger。

模板里不需要写 `.value`,因为编译器自动展开;但 `&lt;script&gt;` 里必须显式 `.value`。

### `shallowReactive` / `shallowRef`

默认 reactive **深响应**(嵌套对象访问时也变成 Proxy)。性能敏感场景用 shallow:

```js
const big = shallowReactive({ items: [...10000 items] });
// big.items 不会被 wrap 成 reactive,操作内部不触发响应
// 整个 big.items 替换才触发
```

### `computed`(派生响应数据 + 缓存)

```js
const count = ref(0);
const double = computed(() => count.value * 2);

count.value = 5;
double.value; // 10,内部用 effect + dirty flag,只在依赖变了才重算
```

### Vue 2 vs Vue 3 对比

| 维度               | Vue 2 (defineProperty)  | Vue 3 (Proxy)                 |
| ------------------ | ----------------------- | ----------------------------- |
| 检测**新增**属性   | ❌(`Vue.set`)           | ✅                            |
| 检测**删除**属性   | ❌(`Vue.delete`)        | ✅                            |
| 数组**索引**修改   | ❌(`arr[0] = x` 不响应) | ✅                            |
| 数组 `length` 修改 | ❌                      | ✅                            |
| Map / Set          | ❌                      | ✅                            |
| 初始化开销         | 递归整对象,大对象慢     | 懒处理,用到才代理             |
| 浏览器要求         | 全部支持(ES5)           | IE 不支持,IE 已退役不再是问题 |

## 代码示例

### 完整示例:计数器 + 衍生 + effect 监听

```ts
import { reactive, ref, computed, watch, watchEffect } from 'vue';

const count = ref(0);
const state = reactive({ name: 'Alice', list: [] as number[] });

const double = computed(() => count.value * 2);
const upperName = computed(() => state.name.toUpperCase());

// 一次性运行,自动追踪依赖
watchEffect(() => {
  console.log(`count=${count.value}, double=${double.value}, name=${upperName.value}`);
});

// 精确监听某个源
watch(count, (newV, oldV) => console.log(`count: ${oldV} → ${newV}`));

// 多源 + deep
watch([count, () => state.name], ([c, n]) => console.log(c, n), { deep: true });
```

## 易错点 / 反例

### 1. 解构 reactive 对象失去响应

```js
const state = reactive({ count: 0 });
const { count } = state; // ❌ count 是普通 number,不再响应

// 修复:用 toRef / toRefs
import { toRefs } from 'vue';
const { count } = toRefs(state); // count 现在是 ref&lt;number&gt;
count.value++; // 触发响应
```

### 2. 直接替换整个 reactive 对象会断响应

```js
let state = reactive({ count: 0 });
state = reactive({ count: 5 }); // ❌ 视图绑定的还是旧 state
```

**修复**:

- 不要重新赋值,直接改属性 `Object.assign(state, newData)`
- 用 `ref<{...}>` 然后 `state.value = newObj`

### 3. ref 的对象值也是深响应

```js
const obj = ref({ count: 0 });
obj.value.count++; // ✅ 触发响应,因为 ref 内部对对象值也跑了 reactive()
```

用 `shallowRef` 避免:

```js
const big = shallowRef({ huge: data });
big.value.huge.x = 1; // 不触发
big.value = { huge: newData }; // 触发(替换整个 value)
```

### 4. effect 里访问异步数据漏依赖

```js
effect(() => {
  fetch('/api').then((r) => {
    console.log(state.count); // ❌ 此时 effect 已结束,track 跑不到
  });
});
```

**根因**:track 只在 effect 同步执行时收集依赖。异步回调里的访问拿不到 `activeEffect`。
**修复**:用 `watchEffect + async/await`,且 await 之前先访问要监听的字段。

### 5. Vue 2 的"经典踩坑"(老项目仍有)

```js
// Vue 2
this.list[0] = newItem; // ❌ 不响应
this.$set(this.list, 0, newItem); // ✅
this.list.splice(0, 1, newItem); // ✅(数组方法被 patched)
```

Vue 3 全部不再是问题,但维护 Vue 2 老项目仍要注意。

### 6. `readonly` 不传递到嵌套对象的修改

```js
const state = reactive({ user: { name: 'A' } });
const ro = readonly(state);
ro.user.name = 'B'; // ❌ 警告,但实际可能改成功(看 user 是否也被 readonly 包装)
```

Vue 3.4+ readonly 是深递归的,嵌套也会代理为 readonly,操作时控制台 warn。

## 高频面试题(5 题)

- **Q1**: Vue 2 的 `Object.defineProperty` 响应式有什么局限?为什么 Vue 3 换 Proxy?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  Vue 2 局限:

  - 无法检测**对象新增/删除属性**(必须 `Vue.set / Vue.delete`)
  - 无法检测**数组索引赋值** / `length` 修改(只能 push/pop/splice 等被 patched 的方法)
  - 必须**递归遍历整个对象**初始化,大对象开销大
  - 不支持 Map / Set

  Vue 3 用 Proxy 一次性整体拦截,加上"懒处理"(访问时才递归代理嵌套对象),性能和能力都大幅提升。代价:不支持 IE(已退役不是问题)。

  &lt;details&gt;

- **Q2**: `reactive` 和 `ref` 有什么区别?为什么需要 ref?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - **reactive**:把**对象**包成 Proxy,直接访问 / 修改属性触发响应
  - **ref**:用**对象**包一层 `{ value }`,适用于**原始值**(number / string / boolean)

  原因:Proxy 只能代理对象,不能代理原始值(无法在原始值上塞 getter/setter)。所以原始值需要"装箱"成对象,通过 `.value` 触发 get/set。

  **何时用哪个**:推荐**默认用 ref**(包括对象),因为 reactive 在解构 / 重新赋值时容易丢响应。ref 始终通过 `.value` 操作,行为更可预测。

  &lt;details&gt;

- **Q3**: 解构 reactive 对象后失去响应,怎么解决?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  根因:`const { x } = state` 把响应对象的属性值**拷贝**到普通变量,失去 Proxy。

  解决:

  - `toRefs(state)`:把每个属性转成 ref,解构后仍响应
  - `toRef(state, 'x')`:单个属性转 ref
  - 改用 ref(整个对象用 `ref({...})`,通过 `state.value.x` 访问)

  ```js
  const { count } = toRefs(state);
  count.value++;
  ```

  &lt;details&gt;

- **Q4**: 描述 Vue 3 响应式系统的 track / trigger 机制。
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - **track**:Proxy 的 get 拦截器里,把"当前正在跑的 effect"和"(target, key)"绑定到一张 `WeakMap<target, Map<key, Set&lt;effect&gt;>>`
  - **trigger**:Proxy 的 set / deleteProperty 拦截器里,从那张表里找出所有绑定的 effect,逐个重跑
  - **依赖收集**:effect 第一次跑时把自己挂到 `activeEffect`,内部访问响应数据时被 track 收集;跑完清空 activeEffect

  computed / watchEffect / 组件 render 函数都是用 effect 包装的。

  &lt;details&gt;

- **Q5**: shallowReactive / shallowRef 解决什么问题?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  深响应(默认)对**嵌套深的大对象**有性能负担:每访问一层就 wrap 一次 Proxy。shallow 版本只代理**第一层**,内部对象保持原样:

  ```js
  const state = shallowReactive({ data: largeNestedTree });
  state.data.x.y = 1; // 不触发响应
  state.data = newTree; // 触发响应(整个 data 替换)
  ```

  适合场景:大数据缓存、第三方库实例(Three.js scene、ECharts instance)。整体替换才触发渲染,内部高频修改不触发,可大幅提升性能。

  &lt;details&gt;

## 延伸资源

- [Vue: Reactivity in Depth](https://vuejs.org/guide/extras/reactivity-in-depth.html)
- [Vue: Reactivity Core API](https://vuejs.org/api/reactivity-core.html)
- [Vue Core 源码](https://github.com/vuejs/core)

## (留白) 我的理解

> 这一段不强制填。

<!-- KNOWLEDGE-IMPORT:END -->
