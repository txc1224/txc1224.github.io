---
title: 'UI 框架 & 生态'
order: 7
---

# UI 框架 & 生态

> React 生态丰富，选择合适的工具库能显著提升开发效率。

---

## Ant Design

```jsx
// 安装
// pnpm add antd

// 按需引入（v5 默认支持 Tree Shaking）
import { Button, Table, Form, Input, message } from 'antd';

function UserForm() {
  const [form] = Form.useForm();
  const onFinish = (values) => {
    message.success('提交成功');
  };

  return (
    <Form form={form} onFinish={onFinish} layout="vertical">
      <Form.Item name="name" label="姓名" rules={[{ required: true }]}>
        <Input />
      </Form.Item>
      <Button type="primary" htmlType="submit">
        提交
      </Button>
    </Form>
  );
}
```

```jsx
// 主题定制（v5 CSS-in-JS）
import { ConfigProvider } from 'antd';

<ConfigProvider
  theme={{
    token: {
      colorPrimary: '#1677ff',
      borderRadius: 6,
    },
  }}
>
  <App />
</ConfigProvider>;
```

---

## ahooks 常用 Hook

| Hook                   | 用途                  | 示例                     |
| ---------------------- | --------------------- | ------------------------ |
| `useRequest`           | 数据请求（自动/手动） | 替代手写 fetch + loading |
| `useDebounce`          | 值防抖                | 搜索框输入               |
| `useThrottle`          | 值节流                | 滚动事件                 |
| `useLocalStorageState` | localStorage 状态     | 持久化偏好设置           |
| `useToggle`            | 布尔值切换            | 弹窗开关                 |
| `useVirtualList`       | 虚拟列表              | 大数据量列表渲染         |
| `useDynamicList`       | 动态列表操作          | 表单动态增删行           |
| `useInViewport`        | 元素可见性            | 懒加载、曝光埋点         |
| `useCountDown`         | 倒计时                | 验证码倒计时             |

```jsx
import { useRequest } from 'ahooks';

function UserList() {
  const { data, loading, run } = useRequest(fetchUsers, {
    manual: false, // 自动请求
    debounceWait: 300, // 内置防抖
  });
  return loading ? <Spin /> : <Table dataSource={data} />;
}
```

---

## 企业级框架

| 框架      | 特点                         | 适用场景      |
| --------- | ---------------------------- | ------------- |
| UmiJS     | 约定式路由、插件体系、微前端 | 蚂蚁系中后台  |
| Modern.js | 字节出品、SSR/SSG、微前端    | 字节系项目    |
| Remix     | React Router 团队、嵌套路由  | 全栈 Web 应用 |

---

## React Native 概述

| 特性     | 说明                               |
| -------- | ---------------------------------- |
| 核心理念 | "Learn once, write anywhere"       |
| 原生组件 | `<View>`、`<Text>`、`<ScrollView>` |
| 样式     | `StyleSheet.create`（类 CSS 子集） |
| 导航     | React Navigation                   |
| 新架构   | Fabric + TurboModules（性能提升）  |
| 替代方案 | Expo（推荐入门，封装了原生配置）   |

---

## 常用工具库推荐

| 类别     | 库                          | 说明                         |
| -------- | --------------------------- | ---------------------------- |
| 数据请求 | TanStack Query              | 缓存 + 后台刷新 + DevTools   |
| 数据请求 | SWR                         | 轻量、stale-while-revalidate |
| 表单     | React Hook Form             | 高性能非受控表单             |
| 表单     | Formik                      | 老牌表单方案                 |
| 动画     | Framer Motion               | 声明式动画                   |
| 动画     | React Spring                | 物理弹簧动画                 |
| 拖拽     | dnd-kit                     | 现代拖拽方案                 |
| 图表     | Recharts                    | 基于 D3 的声明式图表         |
| 图表     | ECharts (echarts-for-react) | 功能最全的图表库             |
| 虚拟列表 | TanStack Virtual            | 大列表/表格虚拟化            |
| 国际化   | react-i18next               | i18n 标准方案                |
| 测试     | React Testing Library       | 以用户行为驱动测试           |
| 测试     | Vitest                      | Vite 原生测试框架            |

---

## 开发工具

| 工具               | 用途                           |
| ------------------ | ------------------------------ |
| React DevTools     | 组件树检查、性能分析、Profiler |
| React Strict Mode  | 开发环境双重渲染检测��作用问题 |
| Why Did You Render | 追踪不必要的重渲染             |
| Vite               | 开发服务器（推荐替代 CRA）     |

```jsx
// Strict Mode（仅开发环境生效）
<React.StrictMode>
  <App />
</React.StrictMode>

// Vite 创建 React 项目
// pnpm create vite my-app --template react-ts
```
