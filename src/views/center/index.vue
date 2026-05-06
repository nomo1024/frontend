<template>
  <div class="center-page">
    <el-card>
      <template #header>
        <h3>个人中心</h3>
      </template>

      <div v-if="!userStore.currentUser" class="no-login">
        <el-empty description="请先登录" />
      </div>

      <template v-else>
        <div class="user-info-header">
          <el-avatar :size="80" :style="{ backgroundColor: '#1890ff', color: '#fff', fontSize: '36px' }">
            {{ avatarLetter }}
          </el-avatar>
          <h2 class="username">{{ userStore.currentUser.userAccount }}</h2>
        </div>

        <el-divider content-position="left">基本信息</el-divider>

        <el-descriptions :column="2" border>
          <el-descriptions-item label="ID">{{ userStore.currentUser.id }}</el-descriptions-item>
          <el-descriptions-item label="角色">
            <el-tag :type="userStore.currentUser.userRole === 1 ? 'success' : 'info'">
              {{ userStore.currentUser.userRole === 1 ? '管理员' : '普通用户' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-select v-model="statusValue" @change="handleStatusChange" style="width: 120px">
              <el-option label="离线" :value="0" />
              <el-option label="在线" :value="1" />
              <el-option label="隐身" :value="2" />
              <el-option label="忙碌" :value="3" />
            </el-select>
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">
            {{ formatTime(userStore.currentUser.createTime) }}
          </el-descriptions-item>
        </el-descriptions>

        <el-divider content-position="left">修改信息</el-divider>

        <el-form :model="editForm" label-width="100px" style="max-width: 500px">
          <el-form-item label="用户名">
            <el-input v-model="editForm.userAccount" :disabled="!editMode" />
          </el-form-item>
          <el-form-item label="密码">
            <el-input v-model="editForm.userPassword" type="password" :disabled="!editMode" show-password placeholder="输入新密码（不修改请留空）" />
          </el-form-item>
          <el-form-item label="手机号">
            <el-input v-model="editForm.phone" :disabled="!editMode" />
          </el-form-item>
          <el-form-item label="邮箱">
            <el-input v-model="editForm.email" :disabled="!editMode" />
          </el-form-item>
          <el-form-item>
            <template v-if="!editMode">
              <el-button type="primary" @click="editMode = true">编辑信息</el-button>
            </template>
            <template v-else>
              <el-button type="primary" @click="handleSave">保存</el-button>
              <el-button @click="handleCancel">取消</el-button>
            </template>
          </el-form-item>
        </el-form>
      </template>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { useRouter } from 'vue-router'
import { updateUser } from '@/api'
import type { CurrentUser } from '@/types'
import dayjs from 'dayjs'

const router = useRouter()
const userStore = useUserStore()

onMounted(() => {
  if (!userStore.currentUser) {
    ElMessage.error('请先登录')
    router.push('/user/login')
  }
})

const avatarLetter = computed(() => {
  return userStore.currentUser?.userAccount?.charAt(0).toUpperCase() || ''
})

const statusValue = computed({
  get: () => userStore.currentUser?.userStatus ?? 0,
  set: (val) => {
    if (userStore.currentUser) {
      userStore.currentUser = { ...userStore.currentUser, userStatus: val }
    }
  },
})

const editMode = ref(false)
const editForm = reactive({
  userAccount: '',
  userPassword: '',
  phone: '',
  email: '',
})

const formatTime = (time: string | Date) => {
  if (!time) return '-'
  return dayjs(time).format('YYYY-MM-DD HH:mm:ss')
}

const handleStatusChange = async (newStatus: number) => {
  if (!userStore.currentUser) return
  try {
    await updateUser({
      id: userStore.currentUser.id,
      userAccount: userStore.currentUser.userAccount,
      phone: userStore.currentUser.phone,
      email: userStore.currentUser.email,
      userRole: userStore.currentUser.userRole,
      userStatus: newStatus,
      createTime: userStore.currentUser.createTime,
    } as Partial<CurrentUser>)
    userStore.setUser({ ...userStore.currentUser, userStatus: newStatus })
    ElMessage.success('状态更新成功')
  } catch {
    // error handled by interceptor
  }
}

const handleSave = async () => {
  if (!userStore.currentUser) return
  try {
    const changedValues: Partial<CurrentUser> = {}
    if (editForm.userAccount && editForm.userAccount !== userStore.currentUser.userAccount) {
      changedValues.userAccount = editForm.userAccount
    }
    if (editForm.phone && editForm.phone !== userStore.currentUser.phone) {
      changedValues.phone = editForm.phone
    }
    if (editForm.email && editForm.email !== userStore.currentUser.email) {
      changedValues.email = editForm.email
    }
    if (editForm.userPassword) {
      changedValues.userPassword = editForm.userPassword
    }

    if (Object.keys(changedValues).length === 0) {
      ElMessage.info('没有任何修改')
      return
    }

    const updatedUser = {
      ...userStore.currentUser,
      ...changedValues,
    }
    await updateUser(updatedUser as Partial<CurrentUser>)
    userStore.setUser(updatedUser as CurrentUser)
    ElMessage.success('更新成功')
    editMode.value = false
  } catch {
    // error handled by interceptor
  }
}

const handleCancel = () => {
  if (userStore.currentUser) {
    editForm.userAccount = userStore.currentUser.userAccount
    editForm.phone = userStore.currentUser.phone
    editForm.email = userStore.currentUser.email
  }
  editForm.userPassword = ''
  editMode.value = false
}

// Initialize form values
if (userStore.currentUser) {
  editForm.userAccount = userStore.currentUser.userAccount
  editForm.phone = userStore.currentUser.phone
  editForm.email = userStore.currentUser.email
  editForm.userPassword = ''
}
</script>

<style scoped lang="less">
.center-page {
  max-width: 800px;
  margin: 0 auto;

  .user-info-header {
    text-align: center;
    margin-bottom: 24px;

    .username {
      margin-top: 16px;
      font-size: 22px;
      font-weight: 600;
    }
  }
}
</style>
