---
title: 'Composition API'
order: 4
---

# Composition API

> 组合式 API 是 Vue 3 的核心特性，通过函数式的方式组织逻辑，实现更好的代码复用和类型推导。

---

## setup() vs `<script setup>`

| 特性       | `setup()` 函数         | `<script setup>` |
| ---------- | ---------------------- | ---------------- |
| 语法       | 需要 return 暴露给模板 | 顶层声明自动暴露 |
| Props 访问 | `setup(props, ctx)`    | `defineProps()`  |
| 代码量     | 较多样板代码           | 更简洁           |
| 组件注册   | 需要 `components` 选项 | import 即注册    |
| TypeScript | 支持但稍复杂           | 原生友好         |

```vue
<!-- setup() 函数写法 -->
<script lang="ts">
import { ref, defineComponent } from 'vue';
import MyButton from './MyButton.vue';

export default defineComponent({
  components: { MyButton },
  props: { title: String },
  setup(props, { emit }) {
    const count = ref(0);
    const increment = () => count.value++;
    return { count, increment }; // 必须 return
  },
});
</script>
```

```vue
<!-- <script setup> 写法（推荐） -->
<script setup lang="ts">
import { ref } from 'vue';
import MyButton from './MyButton.vue'; // 自动注册

const props = defineProps<{ title: string }>();
const emit = defineEmits<{ click: [id: number] }>();

const count = ref(0);
const increment = () => count.value++;
// 无需 return，顶层变量自动暴露给模板
</script>
```

---

## 编译器宏

| 宏              | 用途             | 说明                                 |
| --------------- | ---------------- | ------------------------------------ |
| `defineProps`   | 声明 Props       | 支持类型声明和运行时声明             |
| `defineEmits`   | 声明事件         | 提供类型安全的 emit                  |
| `defineExpose`  | 暴露组件实例方法 | 默认 `<script setup>` 不暴露任何东西 |
| `defineModel`   | 声明 v-model     | Vue 3.4+，替代 props + emit 模式     |
| `defineSlots`   | 声明插槽类型     | Vue 3.3+，提供插槽类型检查           |
| `defineOptions` | 声明组件选项     | Vue 3.3+，设置 name、inheritAttrs 等 |

```vue
<script setup lang="ts">
// defineExpose：暴露方法给父组件通过 ref 调用
const validate = () => {
  /* ... */
};
const reset = () => {
  /* ... */
};
defineExpose({ validate, reset });

// defineOptions：设置组件名称等
defineOptions({ name: 'MyForm', inheritAttrs: false });
</script>
```

```ts
// 父组件通过 ref 调用子组件方法
const formRef = ref<InstanceType<typeof MyForm>>();
formRef.value?.validate();
```

---

## 组合式函数（Composables）

> 约定以 `use` 开头，封装可复用的有状态逻辑。

### 编写规范

```ts
// composables/useCounter.ts
import { ref, computed } from 'vue';

export function useCounter(initialValue = 0) {
  const count = ref(initialValue);
  const doubled = computed(() => count.value * 2);

  const increment = () => count.value++;
  const decrement = () => count.value--;
  const reset = () => (count.value = initialValue);

  return { count, doubled, increment, decrement, reset };
}
```

### 异步 Composable 示例

```ts
// composables/useFetch.ts
import { ref, watchEffect, toValue, type MaybeRefOrGetter } from 'vue';

export function useFetch<T>(url: MaybeRefOrGetter<string>) {
  const data = ref<T | null>(null);
  const error = ref<Error | null>(null);
  const loading = ref(false);

  const fetchData = async () => {
    loading.value = true;
    error.value = null;
    try {
      const res = await fetch(toValue(url));
      data.value = await res.json();
    } catch (e) {
      error.value = e as Error;
    } finally {
      loading.value = false;
    }
  };

  watchEffect(() => {
    fetchData(); // url 变化时自动重新请求
  });

  return { data, error, loading, refetch: fetchData };
}
```

```vue
<!-- 使用 -->
<script setup lang="ts">
import { useFetch } from '@/composables/useFetch';

const { data, loading, error } = useFetch<User[]>('/api/users');
</script>
```

---

## Composition API vs Options API

| 维度       | Options API                         | Composition API               |
| ---------- | ----------------------------------- | ----------------------------- |
| 代码组织   | 按选项分类（data/methods/computed） | 按功能聚合                    |
| 逻辑复用   | Mixins（命名冲突、来源不清）        | Composables（清晰、类型安全） |
| TypeScript | 需要额外类型体操                    | 原生友好                      |
| 学习曲线   | 低                                  | 中等                          |
| 适用场景   | 简单组件、快速原型                  | 复杂组件、大型项目            |

---

## 逻辑复用最佳实践

```ts
// ❌ Mixins：命名冲突、来源不清
export const searchMixin = {
  data() {
    return { keyword: '' };
  }, // 谁定义的 keyword？
  methods: {
    search() {
      /* ... */
    },
  }, // 可能被覆盖
};

// ✅ Composables：清晰、可追溯
export function useSearch() {
  const keyword = ref('');
  const results = ref([]);
  const search = async () => {
    /* ... */
  };
  return { keyword, results, search };
}
```

```ts
// ✅ Composable 组合使用
function useUserPage() {
  const { data: users, loading } = useFetch<User[]>('/api/users');
  const { keyword, results, search } = useSearch();
  const { page, pageSize, paginated } = usePagination(results);

  return { users, loading, keyword, search, page, pageSize, paginated };
}
```
