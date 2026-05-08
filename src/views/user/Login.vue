<template>
  <div class="login-bg" :style="{ backgroundImage: `url(${bgUrl})` }">
    <div class="login-container">
      <el-card class="login-card">
        <div class="login-grid">
          <div class="left" :style="{ backgroundImage: `url(${leftImgUrl})` }">
            <!-- decorative left panel -->
          </div>
          <div class="right">
            <div class="login-header">
              <img :src="logoUrl" alt="logo" class="logo" />
              <h2>环境监测系统</h2>
            </div>

            <el-tabs v-model="activeTab" class="login-tabs">
              <el-tab-pane label="用户登录" name="account" />
            </el-tabs>

            <el-alert v-if="errorMsg" :title="errorMsg" type="error" show-icon closable @close="errorMsg = ''" />

            <div class="form-wrap">
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
                  <el-button type="primary" size="large" class="login-btn" :loading="loading" native-type="submit">
                    登录
                  </el-button>
                </el-form-item>
              </el-form>
            </div>
          </div>
        </div>
      </el-card>
    </div>
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

const logoUrl = '/pro_icon.svg'
const bgUrl = '/login-bg.png' // put your background image in public/login-bg.png or set a full URL
const leftImgUrl = '/login-side.png' // decorative image for left panel; place in public/login-side.png
const activeTab = ref('account')
const errorMsg = ref('')
const loading = ref(false)
const formRef = ref<FormInstance>()

const savedAuto = localStorage.getItem('autoLogin')
const form = reactive({
  userAccount: '',
  userPassword: '',
  autoLogin: savedAuto === null ? false : savedAuto === 'true',
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
        try { localStorage.setItem('autoLogin', String(form.autoLogin)) } catch {}
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
          router.push('/sensor/dashboard')
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
.login-bg {
  min-height: 100vh;
  width: 100%;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #ffffff;
}

.login-container {
  width: 100%;
  max-width: 1000px;
  padding: 24px;
  box-sizing: border-box;
}

.login-card {
  width: 100%;
  height: 640px;
  border-radius: 12px;
  background: #ffffff;
  box-shadow: 0 10px 30px rgba(0,0,0,0.12);
  overflow: hidden;
}

.login-grid {
  display: flex;
  height: 100%;
}

.left {
  flex: 1;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.right {
  flex: 1;
  padding: 48px 56px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.login-header {
  text-align: left;
  margin-bottom: 18px;

  .logo {
    width: 56px;
    height: 56px;
    margin-bottom: 6px;
    border-radius: 8px;
  }

  h2 {
    margin: 0;
    font-size: 22px;
    font-weight: 700;
    color: #222;
  }
}

.login-tabs {
  margin-bottom: 12px;
}

.form-wrap {
  max-width: 420px;
}

/* remove input fill color */
.form-wrap :deep(.el-input__inner),
.form-wrap :deep(.el-input__inner):hover,
.form-wrap :deep(.el-input__inner):focus,
.form-wrap :deep(input.el-input__inner) {
  background-color: transparent !important;
  background-image: none !important;
  box-shadow: none !important;
}

/* make textarea transparent too */
.form-wrap :deep(.el-textarea__inner) {
  background-color: transparent !important;
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
  &:hover { color: #40a9ff; }
}

.login-btn {
  width: 100%;
  height: 44px;
  line-height: 44px;
  border-radius: 6px;
}

@media (max-width: 800px) {
  .login-card { height: auto; }
  .login-grid { flex-direction: column; }
  .left { height: 200px; }
  .right { padding: 32px; }
  .form-wrap { max-width: 100%; }
}
</style>
