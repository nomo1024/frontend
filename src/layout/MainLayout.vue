<template>
  <div class="app-layout">
    <el-container>
      <el-aside width="220px" class="sidebar" :class="{ collapsed: isCollapsed }">
        <div class="logo">
          <img :src="logoUrl" alt="logo" class="logo-img" />
          <span class="logo-text" v-show="!isCollapsed">环境监测系统</span>
        </div>
        <el-menu
          :default-active="activeMenu"
          :collapse="isCollapsed"
          router
          background-color="#001529"
          text-color="rgba(255,255,255,0.65)"
          active-text-color="#1890ff"
          class="sidebar-menu"
        >
          <template v-for="route in menuRoutes" :key="route.path">
            <el-tooltip
              :content="route.meta?.title as string"
              placement="right"
              :disabled="!isCollapsed"
            >
              <el-menu-item :index="route.path" v-if="!route.meta?.hidden && !route.meta?.requiresAdmin">
                <el-icon><component :is="route.meta?.icon || 'Document'" /></el-icon>
                <template #title>{{ route.meta?.title }}</template>
              </el-menu-item>
            </el-tooltip>
            <el-tooltip
              :content="route.meta?.title as string"
              placement="right"
              :disabled="!isCollapsed"
              v-if="route.meta?.requiresAdmin && isAdmin"
            >
              <el-menu-item :index="route.path">
                <el-icon><component :is="route.meta?.icon || 'User'" /></el-icon>
                <template #title>{{ route.meta?.title }}</template>
              </el-menu-item>
            </el-tooltip>
          </template>
        </el-menu>
      </el-aside>

      <el-container>
        <el-header class="header">
          <div class="header-left">
            <el-icon class="collapse-btn" @click="toggleCollapse">
              <Fold v-if="!isCollapsed" />
              <Expand v-else />
            </el-icon>
            <el-breadcrumb separator="/" class="breadcrumb">
              <el-breadcrumb-item :to="{ path: '/sensor/dashboard' }">首页</el-breadcrumb-item>
              <el-breadcrumb-item v-if="route.meta?.title" :to="route.path">
                {{ route.meta?.title as string }}
              </el-breadcrumb-item>
            </el-breadcrumb>
          </div>
          <div class="header-right">
            <el-dropdown @command="handleCommand" trigger="click">
              <span class="avatar-wrapper">
                <el-avatar size="small" :style="{ backgroundColor: '#1890ff', color: '#fff' }">
                  {{ avatarLetter }}
                </el-avatar>
                <span class="username">{{ userStore.currentUser?.userAccount }}</span>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="center">
                    <el-icon><User /></el-icon>
                    个人中心
                  </el-dropdown-item>
                  <el-dropdown-item divided command="logout">
                    <el-icon><SwitchButton /></el-icon>
                    退出登录
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </el-header>

        <el-main class="main-content">
          <router-view v-slot="{ Component, route: r }">
            <transition name="fade" mode="out-in">
              <component :is="Component" :key="r.path" />
            </transition>
          </router-view>
        </el-main>

        <el-footer class="footer">
          {{ currentYear }} 李玉城 出品
          <a href="https://github.com/nomo1024" target="_blank" class="footer-link">
            <el-icon><Link /></el-icon>
            GitHub
          </a>
        </el-footer>
      </el-container>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { outLogin } from '@/api'
import {
  Fold,
  Expand,
  User,
  SwitchButton,
  Link,
} from '@element-plus/icons-vue'
import type { RouteRecordRaw } from 'vue-router'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const isCollapsed = ref(false)

const logoUrl = '/pro_icon.svg'

const isAdmin = computed(() => userStore.currentUser?.userRole === 1)

const avatarLetter = computed(() => {
  return userStore.currentUser?.userAccount?.charAt(0).toUpperCase() || ''
})

const activeMenu = computed(() => route.path)

const menuRoutes = computed(() => {
  const mainRoute = router.options.routes.find(r => r.path === '/')
  const children = (mainRoute?.children || []) as RouteRecordRaw[]
  return children.map(child => ({
    ...child,
    path: child.path.startsWith('/') ? child.path : '/' + child.path
  }))
})

const currentYear = new Date().getFullYear()

const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
}

const handleCommand = async (command: string) => {
  if (command === 'logout') {
    try {
      await outLogin()
    } catch {
      // ignore
    }
    userStore.clearUser()
    router.push({ path: '/user/login' })
  } else if (command === 'center') {
    router.push('/account/center')
  }
}
</script>

<style scoped lang="less">
.app-layout {
  height: 100vh;
}

.el-container {
  height: 100%;
}

.sidebar {
  background-color: #001529;
  transition: width 0.3s;
  overflow: hidden;

  &.collapsed {
    width: 64px !important;
  }
}

.logo {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 64px;
  padding: 0 16px;
  gap: 8px;
  cursor: pointer;

  .logo-img {
    width: 32px;
    height: 32px;
    object-fit: contain;
  }

  .logo-text {
    color: #fff;
    font-size: 16px;
    font-weight: 600;
    white-space: nowrap;
  }
}

.sidebar-menu {
  border-right: none;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
  padding: 0 24px;
  height: 56px;

  .header-left {
    display: flex;
    align-items: center;
    gap: 16px;

    .collapse-btn {
      font-size: 20px;
      cursor: pointer;
      color: #333;
      transition: color 0.3s;

      &:hover {
        color: #1890ff;
      }
    }
  }

  .header-right {
    .avatar-wrapper {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;

      .username {
        font-size: 14px;
        color: #333;
      }
    }
  }
}

.main-content {
  background: #f0f2f5;
  padding: 24px;
  overflow-y: auto;
}

// Page transition
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: rgba(0, 0, 0, 0.45);
  font-size: 13px;
  height: 48px;
  background: #fff;

  .footer-link {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    color: #1890ff;
    text-decoration: none;
    font-size: 13px;

    &:hover {
      color: #40a9ff;
    }
  }
}
</style>
