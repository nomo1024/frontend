<template>
  <div class="login-container">
    <el-card class="login-card">
      <template #header>
        <div class="login-header">
          <img :src="logoUrl" alt="logo" class="logo" />
          <h2>环境监测系统</h2>
        </div>
      </template>

      <el-tabs v-model="activeTab" class="login-tabs">
        <el-tab-pane label="用户登录" name="account" />
      </el-tabs>

      <el-alert v-if="errorMsg" :title="errorMsg" type="error" show-icon closable @close="errorMsg = ''" />

      <el-form ref="formRef" :model="form" :rules="rules" label-position="top" @submit.prevent="handleSubmit">
        <div class="field-label">账号</div>
        <el-form-item prop="userAccount">
          <el-input v-model="form.userAccount" size="large" placeholder="请输入账号">
            <template #prefix>
              <el-icon><User /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <div class="field-label">密码</div>
        <el-form-item prop="userPassword">
          <el-input v-model="form.userPassword" type="password" size="large" placeholder="请输入密码" show-password>
            <template #prefix>
              <el-icon><Lock /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <div class="actions">
          <el-checkbox v-model="form.autoLogin">自动登录</el-checkbox>
          <router-link to="/user/register" class="register-link">用户注册</router-link>
        </div>

        <el-form-item>
          <el-button type="primary" size="large" style="width: 100%" :loading="loading" native-type="submit">
            登录
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import { login } from '@/api'
import { useUserStore } from '@/stores/user'
import type { FormInstance, FormRules } from 'element-plus'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const logoUrl = 'http://mms0.baidu.com/it/u=604189734,1143451865&fm=253&app=138&f=JPEG?w=250&h=250'
const activeTab = ref('account')
const errorMsg = ref('')
const loading = ref(false)
const formRef = ref<FormInstance>()

const form = reactive({
  userAccount: '',
  userPassword: '',
  autoLogin: true,
  type: 'account',
})

const rules: FormRules = {
  userAccount: [{ required: true, message: '账号是必填项！', trigger: 'blur' }],
  userPassword: [
    { required: true, message: '密码是必填项！', trigger: 'blur' },
    { min: 8, message: '长度不能小于 8', trigger: 'blur' },
  ],
}

const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return

    loading.value = true
    try {
      const res = await login({ ...form })
      if (res) {
        ElMessage.success('登录成功！')
        await userStore.fetchUserInfo()

        const redirect = route.query.redirect as string
        const isAdminPath = redirect?.startsWith('/admin')
        const isAdminUser = userStore.currentUser?.userRole === 1

        if (redirect && (!isAdminPath || isAdminUser)) {
          router.push(redirect)
        } else if (isAdminUser) {
          router.push('/admin/user-manage')
        } else {
          router.push('/sensor/gps')
        }
      } else {
        errorMsg.value = '用户名或密码错误'
      }
    } catch {
      errorMsg.value = '登录失败，请重试！'
    } finally {
      loading.value = false
    }
  })
}
</script>

<style scoped lang="less">
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  max-width: 480px;
  margin: 0 auto;
  padding: 0 24px;
}

.login-card {
  width: 100%;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);

  :deep(.el-card__header) {
    padding: 24px 24px 0;
    border: none;
  }

  :deep(.el-card__body) {
    padding: 16px 24px 24px;
  }
}

.login-header {
  text-align: center;
  margin-bottom: 16px;

  .logo {
    width: 48px;
    height: 48px;
    margin-bottom: 8px;
  }

  h2 {
    margin: 0;
    font-size: 22px;
    font-weight: 600;
    color: #1a1a1a;
  }
}

.login-tabs {
  margin-bottom: 20px;

  :deep(.el-tabs__header) {
    margin-bottom: 20px;
  }
}

.field-label {
  margin-bottom: 8px;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.65);
  font-size: 14px;
}

.actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.register-link {
  color: #1890ff;
  text-decoration: none;
  font-size: 14px;

  &:hover {
    color: #40a9ff;
  }
}
</style>
