---
title: '常见陷阱'
order: 8
---

# 常见陷阱

> 整理 Vue 3 开发中高频踩坑点，避免重复犯错。

---

## 1. reactive 解构丢失响应式

```ts
// ❌ 解构后变成普通变量，失去响应式
const state = reactive({ count: 0, name: 'Vue' });
let { count } = state;
count++; // 视图不更新

// ✅ 方案一：使用 toRefs 解构
const { count, name } = toRefs(state);
count.value++; // 正常更新

// ✅ 方案二：直接用 ref
const count = ref(0);
count.value++; // 正常更新
```

---

## 2. ref 解包规则

```ts
const count = ref(0);

// 模板中：自动解包，无需 .value
// <template>{{ count }}</template>  ✅

// JS 中：必须 .value
console.log(count.value); // ✅
console.log(count); // ❌ 拿到的是 Ref 对象

// reactive 内嵌套 ref：自动解包
const state = reactive({ count: ref(0) });
console.log(state.count); // 0，不需要 .value ✅

// 数组/Map 内的 ref：不会自动解包
const list = reactive([ref(1)]);
console.log(list[0].value); // 需要 .value ❌ 容易忘
```

---

## 3. watch 监听对象

```ts
const state = reactive({ user: { name: 'Vue' } });

// ❌ 直接监听 reactive 对象的属性（不触发）
watch(state.user.name, (val) => {
  /* 不生效 */
});

// ✅ 使用 getter 函数
watch(
  () => state.user.name,
  (val) => {
    console.log('name changed:', val);
  },
);

// ✅ 监听整个对象，开启 deep
watch(
  () => state.user,
  (val) => {
    console.log('user changed:', val);
  },
  { deep: true },
);

// 注意：watch reactive 对象，默认就是 deep
watch(state, (val) => {
  /* 自动 deep */
});
```

---

## 4. v-if vs v-show

| 特性     | `v-if`                | `v-show`             |
| -------- | --------------------- | -------------------- |
| DOM 操作 | 销毁/重建 DOM 元素    | 切换 `display: none` |
| 初始开销 | 条件为 false 时不渲染 | 始终渲染             |
| 切换开销 | 高（重建组件）        | 低（CSS 切换）       |
| 适用场景 | 条件很少变化          | 频繁切换             |

```vue
<!-- ❌ 频繁切换用 v-if，性能差 -->
<HeavyComponent v-if="showPanel" />

<!-- ✅ 频繁切换用 v-show -->
<HeavyComponent v-show="showPanel" />

<!-- ✅ 很少切换、组件较重时用 v-if，节省初始渲染 -->
<AdminPanel v-if="isAdmin" />
```

---

## 5. key 的正确使用

```vue
<!-- ❌ 用 index 做 key，列表重排序时出问题 -->
<li v-for="(item, index) in list" :key="index">
  <input v-model="item.value" />
</li>

<!-- ✅ 用唯一 id 做 key -->
<li v-for="item in list" :key="item.id">
  <input v-model="item.value" />
</li>

<!-- ✅ 用 key 强制重新创建组件 -->
<UserProfile :key="userId" :user-id="userId" />
<!-- userId 变化时，组件会销毁重建，而非复用 -->
```

---

## 6. 异步组件与 Suspense

```vue
<template>
  <!-- ❌ 不处理加载状态 -->
  <AsyncComp />

  <!-- ✅ 使用 Suspense 提供 fallback -->
  <Suspense>
    <AsyncComp />
    <template #fallback>加载中...</template>
  </Suspense>
</template>
```

> 注意：Suspense 目前仍是实验性特性，API 可能变化。

---

## 7. nextTick 使用场景

```ts
import { ref, nextTick } from 'vue';

const show = ref(false);
const inputRef = ref<HTMLInputElement>();

async function openAndFocus() {
  show.value = true;

  // ❌ DOM 还没更新，ref 为 undefined
  inputRef.value?.focus();

  // ✅ 等待 DOM 更新后再操作
  await nextTick();
  inputRef.value?.focus();
}
```

```ts
// 常见场景：修改数据后立即操作 DOM
const updateChart = async () => {
  chartData.value = newData;
  await nextTick();
  chartRef.value?.offsetHeight; // 获取更新后的高度
};
```

---

## 8. 组件命名规范

| 场景     | 推荐命名           | 说明                      |
| -------- | ------------------ | ------------------------- |
| 文件名   | `UserProfile.vue`  | PascalCase                |
| 模板使用 | `<UserProfile />`  | PascalCase（推荐）        |
| 基础组件 | `BaseButton.vue`   | `Base` / `App` / `V` 前缀 |
| 单例组件 | `TheHeader.vue`    | `The` 前缀                |
| 子组件   | `TodoListItem.vue` | 父组件名作前缀            |

```
// ❌ 模糊的组件命名
components/
  ├── Data.vue
  ├── Item.vue
  └── Header.vue

// ✅ 清晰的组件命名
components/
  ├── UserData.vue
  ├── ProductListItem.vue
  └── TheAppHeader.vue
```

---

## 速查：易错清单

| 陷阱                  | 原因                    | 解决方案                  |
| --------------------- | ----------------------- | ------------------------- |
| reactive 解构失效     | 基本类型脱离 Proxy      | `toRefs()` 或用 `ref`     |
| watch 不触发          | 监听的是值而非引用      | 用 getter `() => state.x` |
| 数组 ref 不解包       | reactive 数组不解包 ref | 手动 `.value`             |
| v-for 无 key          | 就地复用导致状态错乱    | 使用唯一 id 做 key        |
| 修改 props            | Props 只读              | emit 事件通知父组件       |
| 异步操作后更新 DOM    | DOM 更新是异步的        | `await nextTick()`        |
| Store 在 setup 外使用 | Pinia 未初始化          | 在函数内部获取 store      |
