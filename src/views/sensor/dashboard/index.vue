<template>
  <div class="dashboard">
    <div class="dashboard-header">
      <div>
        <h2>监测仪表台</h2>
        <span class="header-subtitle">实时传感器数据概览</span>
      </div>
      <el-button size="small" @click="exportAllCSV">
        <el-icon><Download /></el-icon>
        一键导出CSV
      </el-button>
    </div>

    <div class="sensor-grid">
      <el-card v-for="s in sensorItems" :key="s.source" class="sensor-card" shadow="hover" @click="goToSensor(s.source)">
        <div class="card-content">
          <div class="card-top">
            <div class="sensor-icon" :style="{ background: s.iconBg }">
              <el-icon :size="22" color="#fff"><component :is="s.icon" /></el-icon>
            </div>
            <div class="sensor-meta">
              <span class="sensor-name">{{ s.name }}</span>
              <span class="status-badge" :class="s.isRunning ? 'running' : 'stopped'">
                <span class="dot"></span>
                {{ s.isRunning ? '运行中' : '已停止' }}
              </span>
            </div>
          </div>
          <div class="value-row">
            <span class="current-value">{{ formatValue(s.currentValue) }}</span>
            <span class="value-unit">{{ s.unit }}</span>
          </div>
          <div class="stat-row" v-if="s.statistics.max !== null">
            <span>最高 {{ formatValue(s.statistics.max) }}</span>
            <span>最低 {{ formatValue(s.statistics.min) }}</span>
          </div>
          <div :data-source="s.source" class="sparkline-container"></div>
        </div>
        <div class="card-footer">
          <el-button
            size="small"
            :type="s.isRunning ? 'danger' : 'primary'"
            plain
            @click.stop="s.isRunning ? s.handleStop() : s.handleStart()"
          >
            {{ s.isRunning ? '停止' : '启动' }}
          </el-button>
          <span class="update-label" v-if="s.lastUpdateTime">更新: {{ s.lastUpdateTime }}</span>
        </div>
      </el-card>
    </div>

    <el-card class="gps-card" shadow="hover">
      <template #header>
        <div class="gps-header">
          <div class="gps-title">
            <el-icon color="#1890ff" :size="20"><Location /></el-icon>
            <span>GPS 位置</span>
          </div>
          <el-button
            size="small"
            :type="gpsRunning ? 'danger' : 'primary'"
            @click="toggleGps"
            :loading="gpsLoading"
          >
            {{ gpsRunning ? '停止定位' : '开始定位' }}
          </el-button>
        </div>
      </template>
      <div class="gps-content">
        <div id="gps-mini-map" class="mini-map"></div>
        <div class="gps-coords" v-if="gpsCoords">
          <span>经度: {{ gpsCoords.lng.toFixed(4) }}</span>
          <span>纬度: {{ gpsCoords.lat.toFixed(4) }}</span>
        </div>
        <div class="gps-coords" v-else>
          <span class="no-coords">定位中...</span>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ElNotification } from 'element-plus'
import { Location, Sunny, Drizzling, WindPower, HotWater, Download } from '@element-plus/icons-vue'
import { useSensor } from '@/composables/useSensor'
import { useGpsTracker } from '@/composables/useGpsTracker'
import * as echarts from 'echarts'

declare global {
  interface Window {
    AMap?: any
  }
}

const BEIJING_COORDS = { lng: 116.397428, lat: 39.90923 }
const AMAP_KEY = import.meta.env.VITE_AMAP_KEY || 'bdde1002ca2302262381a5f51ca68d9b'
const router = useRouter()

const chartInstances = ref<Map<number, echarts.ECharts>>(new Map())

const temp = useSensor(5, '温度', { maxPoints: 10, timeRange: '5min' })
const humidity = useSensor(2, '湿度', { maxPoints: 10, timeRange: '5min' })
const light = useSensor(3, '光照', { maxPoints: 10, timeRange: '5min' })
const pressure = useSensor(4, '气压', { maxPoints: 10, timeRange: '5min' })

const sensorItems = computed(() => [
  {
    source: 5, name: '温度', unit: '°C', icon: HotWater, iconBg: '#ff4d4f',
    isRunning: temp.isRunning.value,
    currentValue: temp.currentValue.value,
    statistics: temp.statistics.value,
    lastUpdateTime: temp.lastUpdateTime.value,
    chartData: temp.chartData.value,
    handleStart: temp.handleStart,
    handleStop: temp.handleStop,
  },
  {
    source: 2, name: '湿度', unit: '%RH', icon: Drizzling, iconBg: '#3098d6',
    isRunning: humidity.isRunning.value,
    currentValue: humidity.currentValue.value,
    statistics: humidity.statistics.value,
    lastUpdateTime: humidity.lastUpdateTime.value,
    chartData: humidity.chartData.value,
    handleStart: humidity.handleStart,
    handleStop: humidity.handleStop,
  },
  {
    source: 3, name: '光照', unit: 'kLux', icon: Sunny, iconBg: '#faad14',
    isRunning: light.isRunning.value,
    currentValue: light.currentValue.value,
    statistics: light.statistics.value,
    lastUpdateTime: light.lastUpdateTime.value,
    chartData: light.chartData.value,
    handleStart: light.handleStart,
    handleStop: light.handleStop,
  },
  {
    source: 4, name: '气压', unit: 'hPa', icon: WindPower, iconBg: '#722ed1',
    isRunning: pressure.isRunning.value,
    currentValue: pressure.currentValue.value,
    statistics: pressure.statistics.value,
    lastUpdateTime: pressure.lastUpdateTime.value,
    chartData: pressure.chartData.value,
    handleStart: pressure.handleStart,
    handleStop: pressure.handleStop,
  },
])

const { isRunning: gpsRunning, currentCoords, start: startGpsWatch, stop: stopGpsWatch } = useGpsTracker()
const gpsLoading = ref(false)
const gpsCoords = ref<{ lng: number; lat: number }>({ ...BEIJING_COORDS })
let mapInstance: any = null
let markerInstance: any = null

const formatValue = (v: number | null) => {
  if (v === null || v === undefined) return '-'
  return Number(v.toFixed(1))
}

const exportAllCSV = () => {
  const sensors = [temp, humidity, light, pressure]
  const names = ['温度', '湿度', '光照', '气压']
  const units = ['°C', '%RH', 'kLux', 'hPa']
  let combined = '\uFEFF'
  sensors.forEach((s, i) => {
    const data = s.chartData.value
    if (data.length === 0) return
    combined += `${names[i]} (${units[i]})\n`
    combined += '时间,数值\n'
    combined += data.map(d => `${d.time},${d.value}`).join('\n')
    combined += '\n\n'
  })
  if (combined.trim().length <= 1) {
    ElNotification({ title: '暂无数据', message: '没有可导出的数据', type: 'warning' })
    return
  }
  const blob = new Blob([combined], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `传感器数据_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

const goToSensor = (source: number) => {
  const paths: Record<number, string> = {
    2: '/sensor/humidity',
    3: '/sensor/light',
    4: '/sensor/pressure',
    5: '/sensor/temperature',
  }
  router.push(paths[source] || '/')
}

const loadAMapScript = (key: string) => {
  return new Promise<void>((resolve, reject) => {
    if ((window as any).AMap) { resolve(); return }
    const existing = document.querySelector(`script[src^="https://webapi.amap.com/maps"]`)
    if (existing) {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', reject)
      return
    }
    const script = document.createElement('script')
    script.type = 'text/javascript'
    script.src = `https://webapi.amap.com/maps?v=1.4.15&key=${key}&plugin=AMap.Geolocation`
    script.async = true
    script.onload = () => resolve()
    script.onerror = (e) => reject(e)
    document.head.appendChild(script)
  })
}

const createMap = (lng: number, lat: number) => {
  const container = document.getElementById('gps-mini-map')
  if (!container) return

  if (mapInstance) {
    mapInstance.destroy()
  }

  const AMap = (window as any).AMap
  if (!AMap) return

  mapInstance = new AMap.Map(container, {
    zoom: 15,
    center: [lng, lat],
    resizeEnable: true,
  })

  markerInstance = new AMap.Marker({
    position: [lng, lat],
    map: mapInstance,
  })
}

const updatePosition = (lng: number, lat: number) => {
  gpsCoords.value = { lng, lat }
  if (mapInstance) {
    mapInstance.setCenter([lng, lat])
  }
  if (markerInstance) {
    markerInstance.setPosition([lng, lat])
  } else if ((window as any).AMap) {
    markerInstance = new (window as any).AMap.Marker({
      position: [lng, lat],
      map: mapInstance,
    })
  }
}

const initGpsMap = async () => {
  try {
    await loadAMapScript(AMAP_KEY)
    if (currentCoords.value) {
      createMap(currentCoords.value.lng, currentCoords.value.lat)
    } else {
      createMap(BEIJING_COORDS.lng, BEIJING_COORDS.lat)
      navigator.geolocation.getCurrentPosition(
        (pos) => updatePosition(pos.coords.longitude, pos.coords.latitude),
        () => {},
        { enableHighAccuracy: true, timeout: 10000 }
      )
    }
  } catch {
    // AMap load failed
  }
}

const toggleGps = () => {
  if (gpsRunning.value) {
    stopGpsWatch()
  } else {
    gpsLoading.value = true
    startGpsWatch()
  }
}

watch(currentCoords, (coords) => {
  if (coords) {
    if (gpsLoading.value) gpsLoading.value = false
    updatePosition(coords.lng, coords.lat)
  }
})

const renderSparklines = () => {
  sensorItems.value.forEach((s) => {
    if (s.chartData.length === 0) return
    const values = s.chartData.map(d => d.value)
    const container = document.querySelector(`[data-source="${s.source}"]`) as HTMLElement
    if (!container) return

    let chart = chartInstances.value.get(s.source)
    if (!chart) {
      chart = echarts.init(container)
      chartInstances.value.set(s.source, chart)
    }

    chart.setOption({
      animation: true,
      animationDuration: 300,
      animationDurationUpdate: 300,
      animationEasing: 'cubicOut',
      animationEasingUpdate: 'cubicOut',
      grid: { left: 0, right: 0, top: 2, bottom: 2 },
      xAxis: { show: false, type: 'category', data: values.map(() => '') },
      yAxis: { show: false, min: 'dataMin', max: 'dataMax' },
      series: [{
        data: values,
        type: 'line',
        smooth: true,
        showSymbol: false,
        lineStyle: { width: 2, color: s.iconBg },
        areaStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: s.iconBg + '40' },
              { offset: 1, color: s.iconBg + '05' },
            ],
          },
        },
      }],
    })
  })
}

watch([temp.chartData, humidity.chartData, light.chartData, pressure.chartData], () => {
  renderSparklines()
}, { deep: true })

onMounted(() => {
  initGpsMap()
  nextTick(() => {
    setTimeout(renderSparklines, 300)
  })
})

onUnmounted(() => {
  chartInstances.value.forEach(c => c.dispose())
  if (mapInstance) {
    mapInstance.destroy()
    mapInstance = null
  }
})
</script>

<style scoped lang="less">
.dashboard {
  max-width: 1200px;
  margin: 0 auto;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.dashboard-header {
  margin-bottom: 24px;

  h2 {
    margin: 0;
    font-size: 22px;
    font-weight: 600;
    color: #1a1a1a;
  }

  .header-subtitle {
    font-size: 13px;
    color: #999;
    margin-top: 4px;
    display: block;
  }
}

.sensor-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-bottom: 20px;
}

:deep(.el-card) {
  border-radius: 24px;
  overflow: hidden;
  border: 1px solid #eee;
}

.sensor-card {
  cursor: pointer;
  transition: transform 0.25s ease, box-shadow 0.25s ease;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  }
}

.card-content {
  padding: 4px 0;

  .card-top {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;

    .sensor-icon {
      width: 44px;
      height: 44px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .sensor-meta {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 0;
      flex: 1;

      .sensor-name {
        font-size: 16px;
        font-weight: 600;
        color: #1a1a1a;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .status-badge {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        font-size: 11px;
        padding: 2px 10px;
        border-radius: 10px;
        width: fit-content;
        white-space: nowrap;

        &.running {
          color: #389e0d;
          background: #f6ffed;
          border: 1px solid #b7eb8f;
          .dot { animation: pulse 2s infinite; }
        }
        &.stopped {
          color: #8c8c8c;
          background: #fafafa;
          border: 1px solid #d9d9d9;
        }
        .dot {
          width: 6px; height: 6px; border-radius: 50%; background: currentColor;
        }
      }
    }
  }

  .value-row {
    display: flex;
    align-items: baseline;
    gap: 6px;
    margin-bottom: 6px;

    .current-value {
      font-size: 30px;
      font-weight: 700;
      color: #1a1a1a;
      line-height: 1.2;
    }
    .value-unit {
      font-size: 14px;
      color: #999;
      flex-shrink: 0;
    }
  }

  .stat-row {
    display: flex;
    gap: 20px;
    font-size: 12px;
    color: #999;
    margin-bottom: 10px;
    span { white-space: nowrap; }
  }

  .sparkline-container {
    height: 54px;
    width: 100%;
  }
}

.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 10px;
  border-top: 1px solid #f0f0f0;

  .update-label {
    font-size: 11px;
    color: #bfbfbf;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-left: 8px;
  }
}

.gps-card {
  :deep(.el-card__body) {
    padding: 0;
  }

  .gps-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .gps-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 16px;
      font-weight: 600;
    }
  }

  .gps-content {
    .mini-map {
      height: 420px;
      width: 100%;
    }

    .gps-coords {
      padding: 12px 20px 16px;
      display: flex;
      gap: 24px;
      font-size: 14px;
      color: #595959;
      .no-coords { color: #bfbfbf; }
    }
  }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

@media (min-width: 1400px) {
  .sensor-grid { grid-template-columns: repeat(4, 1fr); }
}
@media (max-width: 768px) {
  .sensor-grid { grid-template-columns: 1fr; }
}
</style>
