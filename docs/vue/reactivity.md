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
