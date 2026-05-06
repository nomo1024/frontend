# 环境监测系统

基于 Vue 3 + Element Plus + Vite 构建的环境监测系统前端项目。

## 技术栈

- **Vue 3** - 渐进式 JavaScript 框架
- **TypeScript** - 类型安全的 JavaScript 超集
- **Vite** - 下一代前端构建工具
- **Element Plus** - 基于 Vue 3 的组件库
- **Pinia** - Vue 状态管理库
- **Vue Router** - Vue 官方路由
- **Axios** - HTTP 客户端
- **ECharts** - 数据可视化图表库

## 快速开始

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

### 预览生产构建

```bash
npm run preview
```

## 项目结构

```
src/
├── api/              # API 接口
├── assets/           # 静态资源
├── components/       # 公共组件
├── composables/      # 组合式函数
├── layout/           # 布局组件
├── router/           # 路由配置
├── stores/           # Pinia 状态管理
├── types/            # TypeScript 类型定义
├── utils/            # 工具函数
└── views/            # 页面组件
    ├── user/         # 登录/注册
    ├── admin/        # 管理页面
    ├── sensor/       # 传感器监测
    └── center/       # 个人中心
```

## 功能模块

- 用户登录/注册
- 用户管理（管理员）
- GPS监测
- 湿度监测
- 光照监测
- 气压监测
- 温度监测
- 个人中心
