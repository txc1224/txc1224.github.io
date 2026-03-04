---
title: '组件系统'
order: 3
---

# 组件系统

> Vue 的核心思想是组件化。理解 Props、Emits、插槽、生命周期是构建可复用组件的基础。

---

## SFC 单文件组件结构

```vue
<script setup lang="ts">
// 逻辑层：组合式 API
import { ref } from 'vue';
const msg = ref('Hello');
</script>

<template>
  <!-- 视图层：模板语法 -->
  <h1>{{ msg }}</h1>
</template>

<style scoped>
/* 样式层：scoped 限定作用域 */
h1 {
  color: #42b883;
}
</style>
```

> 顺序推荐：`<script>` → `<template>` → `<style>`，逻辑优先。

---

## Props 定义与验证

```vue
<script setup lang="ts">
// 类型声明（推荐）
interface Props {
  title: string;
  count?: number;
  items?: string[];
}

// 带默认值
const props = withDefaults(defineProps<Props>(), {
  count: 0,
  items: () => [],
});
</script>
```

> Props 是只读的，子组件不能直接修改。需要修改时用 `emit` 通知父组件。

---

## Emits 事件

```vue
<script setup lang="ts">
// 运行时声明
const emit = defineEmits(['update', 'delete']);

// 类型声明（推荐）
const emit = defineEmits<{
  update: [id: number, value: string];
  delete: [id: number];
}>();

emit('update', 1, 'new value');
</script>
```

---

## v-model 双向绑定

```vue
<!-- 父组件 -->
<MyInput v-model="name" v-model:title="pageTitle" />

<!-- 等价于 -->
<MyInput :modelValue="name" @update:modelValue="name = $event" :title="pageTitle" @update:title="pageTitle = $event" />
```

```vue
<!-- 子组件 MyInput.vue -->
<script setup lang="ts">
const model = defineModel<string>(); // v-model
const title = defineModel<string>('title'); // v-model:title
</script>

<template>
  <input :value="model" @input="model = $event.target.value" />
</template>
```

> Vue 3.4+ 推荐使用 `defineModel` 宏，更简洁。

---

## 插槽

```vue
<!-- 默认插槽 -->
<MyCard><p>默认内容</p></MyCard>

<!-- 具名插槽 -->
<MyCard>
  <template #header>标题</template>
  <template #default>正文</template>
  <template #footer>页脚</template>
</MyCard>

<!-- 作用域插槽：子组件向插槽传递数据 -->
<MyList :items="list">
  <template #item="{ item, index }">
    {{ index }}. {{ item.name }}
  </template>
</MyList>
```

```vue
<!-- MyList.vue -->
<template>
  <ul>
    <li v-for="(item, index) in items" :key="item.id">
      <slot name="item" :item="item" :index="index" />
    </li>
  </ul>
</template>
```

---

## provide / inject 跨层级通信

```ts
// 祖先组件
import { provide, ref } from 'vue';
const theme = ref('dark');
provide('theme', theme);
provide('toggleTheme', () => {
  theme.value = theme.value === 'dark' ? 'light' : 'dark';
});

// 后代组件（任意层级）
import { inject } from 'vue';
const theme = inject('theme', 'light');
const toggleTheme = inject('toggleTheme', () => {});
```

> 最佳实践：用 Symbol 作为 key，配合 TypeScript 类型定义，避免字符串冲突。

---

## 生命周期钩子

| Options API     | Composition API   | 触发时机             |
| --------------- | ----------------- | -------------------- |
| `beforeCreate`  | `setup()` 本身    | 实例初始化           |
| `created`       | `setup()` 本身    | 实例创建完成         |
| `beforeMount`   | `onBeforeMount`   | 挂载前               |
| `mounted`       | `onMounted`       | 挂载完成，可访问 DOM |
| `beforeUpdate`  | `onBeforeUpdate`  | 数据变更，DOM 更新前 |
| `updated`       | `onUpdated`       | DOM 更新完成         |
| `beforeUnmount` | `onBeforeUnmount` | 卸载前，清理副作用   |
| `unmounted`     | `onUnmounted`     | 卸载完成             |
| -               | `onActivated`     | `<KeepAlive>` 激活   |
| -               | `onDeactivated`   | `<KeepAlive>` 失活   |

```ts
import { onMounted, onUnmounted } from 'vue';

onMounted(() => {
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});
```

---

## 动态组件与异步组件

```vue
<script setup lang="ts">
import { shallowRef, defineAsyncComponent } from 'vue';

const currentTab = shallowRef(TabA);
const AsyncDialog = defineAsyncComponent(() => import('./components/HeavyDialog.vue'));
</script>

<template>
  <KeepAlive>
    <component :is="currentTab" />
  </KeepAlive>

  <Suspense>
    <AsyncDialog />
    <template #fallback>加载中...</template>
  </Suspense>
</template>
```
