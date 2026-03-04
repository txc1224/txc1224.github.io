---
title: 'JSX & 组件'
order: 2
---

# JSX & 组件

> JSX 是 React 的模板语法，本质是 `React.createElement` 的语法糖。组件是 React 的核心构建单元。

---

## JSX 语法规则

| 规则          | 说明                                     |
| ------------- | ---------------------------------------- |
| 单根元素      | 必须有一个根元素，可用 `<>...</>` 包裹   |
| 标签闭合      | 所有标签必须闭合，如 `<img />`           |
| 驼峰属性      | `class` → `className`，`for` → `htmlFor` |
| 表达式用 `{}` | JSX 中嵌入 JS 表达式用花括号             |
| 样式对象      | `style={ { color: 'red' } }` 双花括号    |

```jsx
// ❌ 错误：没有根元素
return (
  <h1>标题</h1>
  <p>段落</p>
)

// ✅ 正确：Fragment 包裹
return (
  <>
    <h1>标题</h1>
    <p>段落</p>
  </>
)
```

---

## 函数组件 vs 类组件

| 特性     | 函数组件    | 类组件                    |
| -------- | ----------- | ------------------------- |
| 语法     | 普通函数    | `class extends Component` |
| 状态     | `useState`  | `this.state`              |
| 生命周期 | `useEffect` | `componentDidMount` 等    |
| 性能     | 更轻量      | 较重                      |
| 推荐度   | ✅ 推荐     | ❌ 仅维护旧代码           |

```jsx
// ✅ 函数组件（推荐）
function Greeting({ name }) {
  return <h1>Hello, {name}</h1>;
}

// ❌ 类组件（不推荐用于新项目）
class Greeting extends React.Component {
  render() {
    return <h1>Hello, {this.props.name}</h1>;
  }
}
```

---

## Props 传递与默认值

```jsx
// 解构 + 默认值
function Button({ text = '点击', variant = 'primary', onClick }) {
  return (
    <button className={variant} onClick={onClick}>
      {text}
    </button>
  );
}

// 展开运算符传递 props
function Wrapper(props) {
  return <Button {...props} />;
}
```

---

## children 与组合模式

```jsx
// children：插槽式组合
function Card({ title, children }) {
  return (
    <div className="card">
      <h3>{title}</h3>
      <div className="card-body">{children}</div>
    </div>
  );
}

// 使用
<Card title="用户信息">
  <p>姓名：张三</p>
  <p>年龄：25</p>
</Card>;
```

---

## 条件渲染模式

```jsx
// 1. && 短路：适合"有则显示"
{
  isLoggedIn && <UserPanel />;
}

// ❌ 陷阱：count 为 0 时会渲染 "0"
{
  count && <span>{count}</span>;
}
// ✅ 显式转为布尔值
{
  count > 0 && <span>{count}</span>;
}

// 2. 三元表达式：二选一
{
  isAdmin ? <AdminView /> : <GuestView />;
}

// 3. 提前返回：复杂条件
function Status({ code }) {
  if (code === 'loading') return <Spinner />;
  if (code === 'error') return <ErrorTip />;
  return <Content />;
}
```

---

## 列表渲染与 key

```jsx
// ✅ 使用唯一且稳定的 id 作为 key
{
  users.map((user) => <li key={user.id}>{user.name}</li>);
}

// ❌ 避免使用 index 作为 key（列表会增删排序时导致 bug）
{
  users.map((user, index) => <li key={index}>{user.name}</li>);
}
```

---

## 事件处理

```jsx
function Form() {
  // 合成事件（SyntheticEvent），跨浏览器兼容
  const handleSubmit = (e) => {
    e.preventDefault(); // 阻止默认行为
    e.stopPropagation(); // 阻止冒泡
  };

  // 传递额外参数
  const handleDelete = (id) => () => {
    console.log('删除', id);
  };

  return (
    <form onSubmit={handleSubmit}>
      <button onClick={handleDelete(1)}>删除</button>
    </form>
  );
}
```

---

## 受控组件 vs 非受控组件

| 特性     | 受控组件             | 非受控组件          |
| -------- | -------------------- | ------------------- |
| 数据源   | React state          | DOM 自身            |
| 取值方式 | `value` + `onChange` | `ref.current.value` |
| 适用场景 | 表单校验、联动       | 简单取值、文件上传  |

```jsx
// ✅ 受控组件
function ControlledInput() {
  const [value, setValue] = useState('');
  return <input value={value} onChange={(e) => setValue(e.target.value)} />;
}

// 非受控组件
function UncontrolledInput() {
  const inputRef = useRef(null);
  const handleClick = () => alert(inputRef.current.value);
  return <input ref={inputRef} defaultValue="默认值" />;
}
```

---

## Fragment

```jsx
// 完整写法（需要传 key 时使用）
import { Fragment } from 'react';
{
  items.map((item) => (
    <Fragment key={item.id}>
      <dt>{item.term}</dt>
      <dd>{item.desc}</dd>
    </Fragment>
  ));
}

// 短语法（不支持 key）
<>
  <td>单元格1</td>
  <td>单元格2</td>
</>;
```
