<template>
  <div class="register-container">
    <el-card class="register-card">
      <template #header>
        <div class="register-header">
          <img :src="logoUrl" alt="logo" class="logo" />
          <h2>环境监测系统</h2>
        </div>
      </template>

      <el-tabs v-model="activeTab" class="register-tabs">
        <el-tab-pane label="账号密码注册" name="account" />
      </el-tabs>

      <el-form ref="formRef" :model="form" :rules="rules" label-position="top" @submit.prevent="handleSubmit">
        <el-form-item label="账号" prop="userAccount">
          <el-input v-model="form.userAccount" size="large" placeholder="请输入账号">
            <template #prefix>
              <el-icon><User /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item label="密码" prop="userPassword">
          <el-input v-model="form.userPassword" type="password" size="large" placeholder="请输入密码" show-password>
            <template #prefix>
              <el-icon><Lock /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item label="确认密码" prop="checkPassword">
          <el-input v-model="form.checkPassword" type="password" size="large" placeholder="请再次输入密码" show-password>
            <template #prefix>
              <el-icon><Lock /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" size="large" style="width: 100%" :loading="loading" native-type="submit">
            注册
          </el-button>
        </el-form-item>

        <div class="login-link-wrapper">
          已有账号？<router-link to="/user/login" class="login-link">立即登录</router-link>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import { register } from '@/api'
import type { FormInstance, FormRules } from 'element-plus'

const router = useRouter()
const route = useRoute()

const logoUrl = '/pro_icon.svg'
const activeTab = ref('account')
const loading = ref(false)
const formRef = ref<FormInstance>()

const form = reactive({
  userAccount: '',
  userPassword: '',
  checkPassword: '',
  type: 'account',
})

const validateCheckPassword = (rule: any, value: string, callback: any) => {
  if (value !== form.userPassword) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const rules: FormRules = {
  userAccount: [{ required: true, message: '账号是必填项！', trigger: 'blur' }],
  userPassword: [
    { required: true, message: '密码是必填项！', trigger: 'blur' },
    { min: 8, message: '长度不能小于 8', trigger: 'blur' },
  ],
  checkPassword: [
    { required: true, message: '确认密码是必填项！', trigger: 'blur' },
    { min: 8, message: '长度不能小于 8', trigger: 'blur' },
    { validator: validateCheckPassword, trigger: 'blur' },
  ],
}

const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return

    loading.value = true
    try {
      const res = await register(form)
      if (res) {
        ElMessage.success('注册成功！')
        router.push({
          path: '/user/login',
          query: route.query,
        })
      }
    } catch {
      ElMessage.error('注册失败，请重试！')
    } finally {
      loading.value = false
    }
  })
}
</script>

<style scoped lang="less">
.register-container {
  display: flex;
  justify-content: center;
  align-items: center;
  max-width: 480px;
  margin: 0 auto;
  padding: 0 24px;
}

.register-card {
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

.register-header {
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

.register-tabs {
  margin-bottom: 20px;

  :deep(.el-tabs__header) {
    margin-bottom: 20px;
  }
}

.login-link-wrapper {
  text-align: center;
  font-size: 14px;
  color: #666;
}

.login-link {
  color: #1890ff;
  text-decoration: none;
  font-size: 14px;

  &:hover {
    color: #40a9ff;
  }
}
</style>
