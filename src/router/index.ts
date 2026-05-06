import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useUserStore } from '@/stores/user'
import MainLayout from '@/layout/MainLayout.vue'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'
import { ElMessage } from 'element-plus'

NProgress.configure({ showSpinner: false })

const routes: RouteRecordRaw[] = [
  {
    path: '/user',
    component: () => import('@/layout/UserLayout.vue'),
    meta: { requiresAuth: false },
    children: [
      {
        path: 'login',
        name: 'Login',
        component: () => import('@/views/user/Login.vue'),
        meta: { title: '登录' },
      },
      {
        path: 'register',
        name: 'Register',
        component: () => import('@/views/user/Register.vue'),
        meta: { title: '注册' },
      },
    ],
  },
  {
    path: '/',
    component: MainLayout,
    meta: { requiresAuth: true },
    redirect: '/account/center',
    children: [
      {
        path: 'admin/user-manage',
        name: 'UserManage',
        component: () => import('@/views/admin/user-manage/index.vue'),
        meta: { title: '用户管理', icon: 'User', requiresAdmin: true },
      },
      {
        path: 'sensor/gps',
        name: 'SensorGps',
        component: () => import('@/views/sensor/gps/index.vue'),
        meta: { title: 'GPS监测', icon: 'Location' },
      },
      {
        path: 'sensor/humidity',
        name: 'SensorHumidity',
        component: () => import('@/views/sensor/humidity/index.vue'),
        meta: { title: '湿度监测', icon: 'Van' },
      },
      {
        path: 'sensor/light',
        name: 'SensorLight',
        component: () => import('@/views/sensor/light/index.vue'),
        meta: { title: '光照监测', icon: 'Sunny' },
      },
      {
        path: 'sensor/pressure',
        name: 'SensorPressure',
        component: () => import('@/views/sensor/pressure/index.vue'),
        meta: { title: '气压监测', icon: 'Odometer' },
      },
      {
        path: 'sensor/temperature',
        name: 'SensorTemperature',
        component: () => import('@/views/sensor/temperature/index.vue'),
        meta: { title: '温度监测', icon: 'SemiSelect' },
      },
      {
        path: 'account/center',
        name: 'Center',
        component: () => import('@/views/center/index.vue'),
        meta: { title: '个人中心', hidden: true },
      },
      {
        path: 'welcome',
        name: 'Welcome',
        component: () => import('@/views/Welcome.vue'),
        meta: { title: '欢迎', icon: 'HomeFilled' },
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/404.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(async (to) => {
  NProgress.start()

  const userStore = useUserStore()
  const noNeedLogin = ['/user/login', '/user/register']

  if (noNeedLogin.includes(to.path)) {
    return true
  }

  if (to.path === '/' && userStore.currentUser) {
    return '/account/center'
  }

  if (!userStore.currentUser) {
    await userStore.fetchUserInfo()
    if (!userStore.currentUser) {
      return {
        path: '/user/login',
        query: { redirect: to.fullPath },
      }
    }
  }

  if (to.meta.requiresAdmin && !userStore.canAdmin()) {
    ElMessage.error('权限不足')
    return '/'
  }

  return true
})

router.afterEach(() => {
  NProgress.done()
})

export default router
