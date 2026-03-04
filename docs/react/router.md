---
title: 'React Router'
order: 5
---

# React Router

> React Router v6+ 是 React 生态事实标准的路由方案，支持声明式路由、嵌套路由和数据路由。

---

## 基础配置

```jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
```

---

## 嵌套路由与 Outlet

```jsx
// 父路由定义布局
<Route path="/dashboard" element={<DashboardLayout />}>
  <Route index element={<Overview />} /> {/* /dashboard */}
  <Route path="settings" element={<Settings />} /> {/* /dashboard/settings */}
  <Route path="profile" element={<Profile />} /> {/* /dashboard/profile */}
</Route>;

// DashboardLayout.jsx
function DashboardLayout() {
  return (
    <div>
      <Sidebar />
      <main>
        <Outlet /> {/* 子路由渲染在这里 */}
      </main>
    </div>
  );
}
```

---

## 动态参数

```jsx
// 路由定义
<Route path="/user/:id" element={<UserDetail />} />;

// 组件中获取参数
import { useParams } from 'react-router-dom';

function UserDetail() {
  const { id } = useParams(); // id 为 string 类型
  // ✅ 使用前做类型转换和校验
  const userId = Number(id);
  if (isNaN(userId)) return <NotFound />;
  return <p>用户 ID：{userId}</p>;
}
```

---

## 编程式导航

```jsx
import { useNavigate } from 'react-router-dom';

function LoginForm() {
  const navigate = useNavigate();

  const handleLogin = async () => {
    await login();
    navigate('/dashboard'); // 跳转
    navigate('/dashboard', { replace: true }); // 替换当前历史记录
    navigate(-1); // 后退
  };

  return <button onClick={handleLogin}>登录</button>;
}
```

---

## 路由守卫

```jsx
// ProtectedRoute 组件
function ProtectedRoute({ children }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    // 未登录跳转登录页，记录来源路径
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}

// 使用
<Route
  path="/dashboard"
  element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  }
/>;
```

---

## 路由懒加载

```jsx
import { lazy, Suspense } from 'react';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Settings = lazy(() => import('./pages/Settings'));

function App() {
  return (
    <Suspense fallback={<Spinner />}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Suspense>
  );
}
```

---

## useSearchParams

```jsx
import { useSearchParams } from 'react-router-dom';

function ProductList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get('page')) || 1;
  const keyword = searchParams.get('q') || '';

  const handleSearch = (q) => {
    setSearchParams({ q, page: 1 }); // URL: ?q=xxx&page=1
  };

  return (
    <>
      <input value={keyword} onChange={(e) => handleSearch(e.target.value)} />
      <p>当前第 {page} 页</p>
    </>
  );
}
```

---

## 数据路由（v6.4+）

```jsx
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

const router = createBrowserRouter([
  {
    path: '/user/:id',
    element: <UserDetail />,
    // loader：路由匹配时自动加载数据
    loader: async ({ params }) => {
      const res = await fetch(`/api/users/${params.id}`);
      if (!res.ok) throw new Response('Not Found', { status: 404 });
      return res.json();
    },
    // action：处理表单提交
    action: async ({ request }) => {
      const formData = await request.formData();
      await updateUser(formData);
      return redirect('/users');
    },
    errorElement: <ErrorBoundary />,
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

// 组件中使用 loader 数据
import { useLoaderData } from 'react-router-dom';

function UserDetail() {
  const user = useLoaderData();
  return <h1>{user.name}</h1>;
}
```

| 概念            | 作用                   |
| --------------- | ---------------------- |
| `loader`        | 路由匹配时预加载数据   |
| `action`        | 处理 `<Form>` 提交     |
| `useLoaderData` | 获取 loader 返回的数据 |
| `useActionData` | 获取 action 返回的数据 |
| `errorElement`  | 路由级错误边界         |
