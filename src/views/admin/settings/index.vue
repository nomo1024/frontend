<template>
  <div class="settings-page">
    <el-card class="settings-card">
      <template #header>
        <h3>系统设置</h3>
      </template>

      <el-form label-width="160px">
        <el-divider content-position="left">数据采集</el-divider>

        <el-form-item label="数据轮询间隔 (秒)">
          <el-input-number v-model="settings.pollingInterval" :min="1" :max="60" />
          <span class="form-hint">传感器运行时每多少秒获取一次新数据</span>
        </el-form-item>

        <el-form-item label="状态检查间隔 (秒)">
          <el-input-number v-model="settings.statusInterval" :min="1" :max="30" />
          <span class="form-hint">每多少秒检查一次传感器运行状态</span>
        </el-form-item>

        <el-form-item label="默认显示条数">
          <el-select v-model="settings.defaultMaxPoints" style="width: 120px">
            <el-option label="10条" :value="10" />
            <el-option label="20条" :value="20" />
            <el-option label="30条" :value="30" />
            <el-option label="40条" :value="40" />
          </el-select>
        </el-form-item>

        <el-divider content-position="left">告警</el-divider>

        <el-form-item label="告警通知">
          <el-switch v-model="settings.alertNotification" />
          <span class="form-hint">关闭后仅显示页面徽章，不弹窗通知</span>
        </el-form-item>

        <el-form-item label="告警音效">
          <el-switch v-model="settings.alertSound" />
        </el-form-item>

        <el-divider content-position="left">显示</el-divider>

        <el-form-item label="图表平滑动画">
          <el-switch v-model="settings.chartAnimation" />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleSave">保存设置</el-button>
          <el-button @click="handleReset">恢复默认</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { ElMessage } from 'element-plus'

const STORAGE_KEY = 'system_settings'

const defaults = {
  pollingInterval: 2,
  statusInterval: 3,
  defaultMaxPoints: 40,
  alertNotification: true,
  alertSound: false,
  chartAnimation: true,
}

const settings = reactive({ ...defaults })

const loadSettings = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      Object.assign(settings, { ...defaults, ...parsed })
    }
  } catch {}
}

const handleSave = () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...settings }))
    ElMessage.success('设置已保存')
  } catch {
    ElMessage.error('保存失败')
  }
}

const handleReset = () => {
  Object.assign(settings, { ...defaults })
  handleSave()
}

loadSettings()
</script>

<style scoped lang="less">
.settings-page {
  max-width: 800px;
  margin: 0 auto;
}

.settings-card {
  border-radius: 24px;
  overflow: hidden;

  h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
  }

  .form-hint {
    font-size: 12px;
    color: #999;
    margin-left: 12px;
  }
}
</style>
