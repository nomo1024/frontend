<template>
  <div class="alerts-page">
    <div class="page-header">
      <h2>告警记录</h2>
      <el-button size="small" @click="clearAlerts()" v-if="alerts.length > 0">
        <el-icon><Delete /></el-icon>
        清空记录
      </el-button>
    </div>

    <div class="alert-cards" v-if="currentAlerts.length > 0">
      <el-card v-for="s in currentAlerts" :key="s.source" class="alert-card" :class="{ alarming: s.isAlert }" shadow="hover">
        <div class="alert-card-header">
          <el-icon :size="20" :color="s.iconBg"><component :is="s.icon" /></el-icon>
          <span class="sensor-name">{{ s.name }}</span>
          <el-tag :type="s.isAlert ? 'danger' : 'success'" size="small">
            {{ s.isAlert ? '告警中' : '正常' }}
          </el-tag>
        </div>
        <div class="alert-value">
          {{ formatNum(s.currentValue) }} <small>{{ s.unit }}</small>
        </div>
        <div class="alert-threshold" v-if="s.isAlert">
          阈值: {{ s.alertMin !== undefined ? '下限 ' + s.alertMin : '' }}{{ s.alertMax !== undefined ? '上限 ' + s.alertMax : '' }}
        </div>
      </el-card>
    </div>

    <el-empty v-else-if="alerts.length === 0" description="暂无告警记录" />

    <el-card class="history-card" v-if="alerts.length > 0">
      <template #header>
        <span>历史告警 ({{ alerts.length }})</span>
      </template>
      <el-table :data="alerts" border stripe style="width: 100%" max-height="500px">
        <el-table-column prop="time" label="时间" width="180" />
        <el-table-column prop="sensorName" label="传感器" width="100" />
        <el-table-column prop="value" label="数值" width="100">
          <template #default="{ row }">
            <span :class="row.type === 'max' ? 'hot' : 'cold'">{{ formatNum(row.value) }} {{ row.unit }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="threshold" label="告警原因" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAlertStore } from '@/composables/useAlertStore'
import {
  HotWater, Drizzling, Sunny, WindPower, Delete,
} from '@element-plus/icons-vue'

const { alerts, clearAlerts, pushAlert } = useAlertStore()

const sensors = computed(() => [
  { source: 5, name: '温度', unit: '°C', icon: HotWater, iconBg: '#ff4d4f', alertMin: -10, alertMax: 40 },
  { source: 2, name: '湿度', unit: '%RH', icon: Drizzling, iconBg: '#3098d6', alertMin: 20, alertMax: 80 },
  { source: 3, name: '光照', unit: 'kLux', icon: Sunny, iconBg: '#faad14', alertMin: undefined, alertMax: 90 },
  { source: 4, name: '气压', unit: 'hPa', icon: WindPower, iconBg: '#722ed1', alertMin: 500, alertMax: 1050 },
])

const currentAlerts = computed(() => {
  const latest: Record<number, { value: number | null; alertMin?: number; alertMax?: number }> = {}
  for (const e of alerts.value) {
    if (!latest[e.sensorSource]) {
      latest[e.sensorSource] = { value: e.value, alertMin: undefined, alertMax: undefined }
    }
  }
  sensors.value.forEach(s => {
    const l = latest[s.source]
    if (!l) latest[s.source] = { value: null, alertMin: s.alertMin, alertMax: s.alertMax }
    else {
      l.alertMin = s.alertMin
      l.alertMax = s.alertMax
    }
  })
  return sensors.value.map(s => {
    const l = latest[s.source]
    const isAlert = l?.value !== null && (
      (s.alertMin !== undefined && l!.value! < s.alertMin) ||
      (s.alertMax !== undefined && l!.value! > s.alertMax)
    )
    return { ...s, currentValue: l?.value ?? null, isAlert }
  })
})

const formatNum = (v: number | null) => {
  if (v === null || v === undefined) return '-'
  return Number(v.toFixed(1))
}
</script>

<style scoped lang="less">
.alerts-page {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;

  h2 {
    margin: 0;
    font-size: 22px;
    font-weight: 600;
  }
}

.alert-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;

  .alert-card {
    border-radius: 24px;
    overflow: hidden;

    &.alarming {
      border-color: #ff4d4f;
      animation: alertPulse 2s infinite;

      :deep(.el-card__body) { background: #fff1f0; }
    }

    .alert-card-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;

      .sensor-name { font-weight: 600; }
    }

    .alert-value {
      font-size: 28px;
      font-weight: 700;
      color: #1a1a1a;
      small { font-size: 14px; color: #999; font-weight: 400; }
    }

    .alert-threshold {
      font-size: 12px;
      color: #f5222d;
      margin-top: 4px;
    }
  }
}

.history-card {
  border-radius: 24px;
  overflow: hidden;

  .hot { color: #f5222d; font-weight: 600; }
  .cold { color: #1890ff; font-weight: 600; }
}

@media (max-width: 1200px) {
  .alert-cards { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 768px) {
  .alert-cards { grid-template-columns: 1fr; }
}

@keyframes alertPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(245, 34, 45, 0.2); }
  50% { box-shadow: 0 0 0 8px rgba(245, 34, 45, 0); }
}
</style>
