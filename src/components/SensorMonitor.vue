<template>
  <el-card class="sensor-card" :class="{ 'is-fullscreen': isFullscreen }">
    <template #header>
      <div class="card-header">
        <div class="header-left">
          <h3>{{ name }}监测</h3>
          <span class="status-tag" :class="isRunning ? 'running' : 'stopped'">
            <span class="status-dot"></span>
            {{ isRunning ? '运行中' : '已停止' }}
          </span>
        </div>
        <div class="header-actions">
          <el-tooltip content="全屏" placement="top">
            <el-button size="small" circle @click="toggleFullscreen">
              <el-icon><FullScreen /></el-icon>
            </el-button>
          </el-tooltip>
          <el-button
            :type="isRunning ? 'danger' : 'primary'"
            @click="isRunning ? handleStop() : handleStart()"
            :loading="loading"
          >
            <el-icon><VideoPause v-if="isRunning" /><VideoPlay v-else /></el-icon>
            {{ isRunning ? '停止监测' : '开始监测' }}
          </el-button>
        </div>
      </div>
    </template>

    <!-- Current value & statistics panel -->
    <div v-if="chartData.length > 0" class="info-panel">
      <div class="info-row">
        <div class="current-value-box">
          <span class="value-label">当前值</span>
          <span class="value-number">{{ formatNum(currentValue) }}</span>
          <span class="value-unit">{{ unit }}</span>
        </div>
        <div class="stats-box">
          <div class="stat-item">
            <span class="stat-label">最高</span>
            <span class="stat-value hot">{{ formatNum(statistics.max) }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">最低</span>
            <span class="stat-value cold">{{ formatNum(statistics.min) }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">平均</span>
            <span class="stat-value">{{ formatNum(statistics.avg) }}</span>
          </div>
        </div>
        <div class="update-box">
          <span class="update-label">最后更新</span>
          <span class="update-time">{{ lastUpdateTime }}</span>
        </div>
      </div>
    </div>

    <!-- Controls row -->
    <div class="controls-row" v-if="chartData.length > 0">
      <div class="control-group">
        <span class="control-label">显示条数</span>
        <el-select v-model="maxPoints" size="small" style="width: 100px">
          <el-option label="30条" :value="30" />
          <el-option label="40条" :value="40" />
          <el-option label="50条" :value="50" />
          <el-option label="60条" :value="60" />
        </el-select>
      </div>
      <div class="control-group">
        <span class="control-label">时间范围</span>
        <el-select v-model="timeRange" size="small" style="width: 110px" :disabled="!!dateRange">
          <el-option label="5分钟" value="5min" />
          <el-option label="30分钟" value="30min" />
          <el-option label="1小时" value="1hour" />
        </el-select>
      </div>
      <div class="control-group">
        <span class="control-label">历史查询</span>
        <el-date-picker
          v-model="dateRange"
          type="datetimerange"
          range-separator="至"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
          size="small"
          style="width: 260px"
          :shortcuts="dateShortcuts"
          @change="onDateRangeChange"
          clearable
        />
      </div>
      <div class="control-group" v-if="hasAlert">
        <span class="alert-badge">
          <el-icon color="#f5222d"><WarningFilled /></el-icon>
          数值异常
        </span>
      </div>
      <div class="control-group">
        <el-button size="small" @click="exportCSV">
          <el-icon><Download /></el-icon>
          导出CSV
        </el-button>
      </div>
    </div>

    <!-- Chart / Empty / Skeleton -->
    <el-skeleton :loading="loading && chartData.length === 0" animated>
      <template #template>
        <div class="skeleton-chart">
          <el-skeleton-item variant="rect" style="width: 100%; height: 100%; border-radius: 8px;" />
        </div>
      </template>
      <template #default>
        <div v-if="chartData.length === 0 && !loading" class="no-data">
          <div class="no-data-icon">
            <el-icon :size="64" color="#d9d9d9"><DataLine /></el-icon>
          </div>
          <p class="no-data-text">暂无监测数据</p>
          <p class="no-data-hint">点击下方按钮开始订阅 {{ name }} 传感器数据</p>
          <el-button type="primary" @click="handleStart" :loading="loading">
            <el-icon><VideoPlay /></el-icon>
            开始监测
          </el-button>
        </div>
        <div ref="chartRef" class="chart" v-else></div>
      </template>
    </el-skeleton>
  </el-card>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { VideoPlay, VideoPause, FullScreen, WarningFilled, DataLine, Download } from '@element-plus/icons-vue'
import { useSensor, type UseSensorOptions } from '@/composables/useSensor'
import * as echarts from 'echarts'
import { ElNotification } from 'element-plus'
import { useAlertStore } from '@/composables/useAlertStore'

interface AreaColorStop {
  offset: number
  color: string
}

interface LinearGradient {
  type: 'linear'
  x: number
  y: number
  x2: number
  y2: number
  colorStops: AreaColorStop[]
}

interface BarItemStyle {
  color: string
  borderRadius: number[]
}

const props = withDefaults(defineProps<{
  source: number
  name: string
  unit: string
  chartType?: 'line' | 'bar'
  yAxisMin?: number
  yAxisMax?: number
  yAxisInterval?: number
  lineColor?: string
  smooth?: boolean
  areaColor?: string | LinearGradient
  barItemStyle?: BarItemStyle
  maxPoints?: number
  timeRange?: '5min' | '30min' | '1hour'
  yAxisFormatter?: string | ((value: number) => string)
  alertMin?: number
  alertMax?: number
}>(), {
  chartType: 'line',
  yAxisMin: 0,
  yAxisMax: 100,
  lineColor: '#1890ff',
  smooth: false,
  maxPoints: 40,
  timeRange: '5min',
})

const options: UseSensorOptions = {
  maxPoints: props.maxPoints,
  timeRange: props.timeRange,
}

const {
  isRunning, loading, chartData,
  handleStart, handleStop,
  maxPoints, timeRange,
  currentValue, statistics, lastUpdateTime,
} = useSensor(props.source, props.name, options)

const chartRef = ref<HTMLElement>()
let chart: echarts.ECharts | null = null
const isFullscreen = ref(false)
const dateRange = ref<[Date, Date] | null>(null)
const prevAlert = ref(false)

const dateShortcuts = [
  { text: '最近1小时', value: () => [new Date(Date.now() - 3600000), new Date()] },
  { text: '最近6小时', value: () => [new Date(Date.now() - 21600000), new Date()] },
  { text: '最近24小时', value: () => [new Date(Date.now() - 86400000), new Date()] },
  { text: '最近7天', value: () => [new Date(Date.now() - 604800000), new Date()] },
]

const formatNum = (v: number | null) => {
  if (v === null || v === undefined) return '-'
  return Number(v.toFixed(1))
}

const hasAlert = computed(() => {
  if (currentValue.value === null) return false
  if (props.alertMin !== undefined && currentValue.value < props.alertMin) return true
  if (props.alertMax !== undefined && currentValue.value > props.alertMax) return true
  return false
})
const formatTimeLabel = (timeStr: string, sameDay: boolean) => {
  if (!timeStr) return timeStr
  if (/^\d{2}:\d{2}:\d{2}$/.test(timeStr)) return timeStr
  const d = new Date(timeStr)
  if (isNaN(d.getTime())) return timeStr
  if (sameDay) {
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`
  }
  return `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`
}

const isSameDay = (times: string[]) => {
  const parsed = times.map(t => {
    if (/^\d{2}:\d{2}:\d{2}$/.test(t)) return 'same'
    const d = new Date(t)
    return isNaN(d.getTime()) ? null : `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
  }).filter(Boolean)
  if (parsed.length < 2) return true
  return parsed.every(d => d === parsed[0])
}

const renderChart = () => {
  if (!chartRef.value || chartData.value.length === 0) return
  if (!chart) {
    chart = echarts.init(chartRef.value)
  }

  const rawTimes = chartData.value.map((d) => d.time)
  const sameDay = isSameDay(rawTimes)
  const xData = rawTimes.map(t => formatTimeLabel(t, sameDay))
  const yData = chartData.value.map((d) => d.value)

  const seriesItem: any = {
    data: yData,
    type: props.chartType,
  }

  if (props.chartType === 'line') {
    seriesItem.smooth = props.smooth
    seriesItem.itemStyle = { color: props.lineColor }
    seriesItem.lineStyle = { width: 3 }
    seriesItem.symbol = 'circle'
    seriesItem.symbolSize = 6

    if (props.areaColor) {
      seriesItem.areaStyle = { color: props.areaColor }
    } else if (props.lineColor) {
      seriesItem.areaStyle = {
        color: {
          type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: props.lineColor + '40' },
            { offset: 1, color: props.lineColor + '05' },
          ],
        },
      }
    }
  }

  if (props.chartType === 'bar' && props.barItemStyle) {
    seriesItem.itemStyle = props.barItemStyle
  }

  chart.setOption({
    animation: true,
    animationDuration: 300,
    animationDurationUpdate: 300,
    animationEasing: 'cubicOut',
    animationEasingUpdate: 'cubicOut',
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' },
      backgroundColor: 'rgba(255,255,255,0.95)',
      borderColor: '#e8e8e8',
      borderWidth: 1,
      formatter: (params: any) => {
        const p = params[0]
        return `<div style="font-size:13px">
          <div style="color:#999;margin-bottom:4px">${p.axisValue}</div>
          <div><b style="color:${props.lineColor};font-size:16px">${p.value}</b> ${props.unit}</div>
        </div>`
      },
    },
    grid: { left: '1%', right: '1%', bottom: '8%', top: '5%', containLabel: true },
    xAxis: {
      type: 'category',
      data: xData,
      name: '时间',
      axisLine: { lineStyle: { color: '#e8e8e8' } },
      axisLabel: { fontSize: 11 },
    },
    yAxis: {
      type: 'value',
      name: `${props.name} (${props.unit})`,
      min: props.yAxisMin,
      max: props.yAxisMax,
      interval: props.yAxisInterval,
      axisLine: { show: false },
      splitLine: { lineStyle: { color: '#f0f0f0', type: 'dashed' } },
      axisLabel: {
        fontSize: 11,
        formatter: props.yAxisFormatter
          ? props.yAxisFormatter
          : (v: number) => v + '',
      },
    },
    series: [seriesItem],
    dataZoom: [
      { type: 'inside', start: 0, end: 100 },
    ],
  })
}

let resizeTimer: ReturnType<typeof setTimeout>
const resizeHandler = () => {
  clearTimeout(resizeTimer)
  resizeTimer = setTimeout(() => chart?.resize(), 200)
}

const onDateRangeChange = (val: [Date, Date] | null) => {
  if (!val) return
  fetchHistoricalData(val[0], val[1])
}

const fetchHistoricalData = async (start: Date, end: Date) => {
  try {
    const { readSensorData } = await import('@/api')
    const limit = Math.max(200, maxPoints.value)
    const res = await readSensorData(props.source, limit, start.toISOString(), end.toISOString())
    if (res && Array.isArray(res)) {
      const formatted = res.map((d: any) => ({
        time: d.collect_time || d.createTime || '',
        value: parseFloat(d.col1 || d.value || 0),
      }))
      formatted.sort((a: any, b: any) => new Date(a.time).getTime() - new Date(b.time).getTime())
      chartData.value = formatted.slice(-maxPoints.value)
    }
  } catch {
    // handled
  }
}

const exportCSV = () => {
  const data = chartData.value
  if (data.length === 0) {
    ElNotification({ title: '暂无数据', message: '没有可导出的数据', type: 'warning' })
    return
  }
  const header = '时间,数值\n'
  const rows = data.map(d => `${d.time},${d.value}`).join('\n')
  const blob = new Blob(['\uFEFF' + header + rows], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${props.name}_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

const toggleFullscreen = () => {
  if (!isFullscreen.value) {
    const el = chartRef.value?.closest('.sensor-card') as HTMLElement
    if (el?.requestFullscreen) {
      el.requestFullscreen().then(() => {
        isFullscreen.value = true
        setTimeout(() => chart?.resize(), 200)
      })
    }
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen().then(() => {
        isFullscreen.value = false
        setTimeout(() => chart?.resize(), 200)
      })
    }
  }
}

const alertStore = useAlertStore()

watch(hasAlert, (val) => {
  if (val && !prevAlert.value) {
    const threshold = props.alertMin !== undefined && currentValue.value! < props.alertMin
      ? `低于下限 ${props.alertMin}${props.unit}`
      : `超出上限 ${props.alertMax}${props.unit}`
    ElNotification({
      title: `${props.name} 告警`,
      message: `当前值 ${formatNum(currentValue.value)}${props.unit} ${threshold}`,
      type: 'warning',
      duration: 5000,
    })
    alertStore.pushAlert({
      sensorName: props.name,
      sensorSource: props.source,
      value: currentValue.value!,
      unit: props.unit,
      threshold,
      time: lastUpdateTime.value || new Date().toLocaleString(),
      type: props.alertMin !== undefined && currentValue.value! < props.alertMin ? 'min' : 'max',
    })
  }
  prevAlert.value = val
})

watch(timeRange, () => {
  dateRange.value = null
})

watch(chartData, () => renderChart(), { deep: true })

watch(chartRef, () => {
  if (chartRef.value && chartData.value.length > 0) {
    setTimeout(() => renderChart(), 50)
  }
})

onMounted(() => {
  window.addEventListener('resize', resizeHandler)
  document.addEventListener('fullscreenchange', () => {
    isFullscreen.value = !!document.fullscreenElement
    setTimeout(() => chart?.resize(), 200)
  })
  if (chartData.value.length > 0) {
    setTimeout(() => renderChart(), 100)
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', resizeHandler)
  chart?.dispose()
})
</script>

<style scoped lang="less">
.sensor-card {
  :deep(.el-card) {
    border-radius: 24px;
    overflow: hidden;
    border: 1px solid #eee;
  }

  :deep(.el-card__header) {
    padding: 12px 20px;
  }

  &.is-fullscreen {
    :deep(.el-card__body) {
      height: calc(100vh - 120px);
    }
    .chart {
      height: calc(100vh - 300px) !important;
    }
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;

  .header-left {
    display: flex;
    align-items: center;
    gap: 12px;

    h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
    }

    .status-tag {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      padding: 2px 10px;
      border-radius: 12px;

      &.running {
        color: #389e0d;
        background: #f6ffed;
        border: 1px solid #b7eb8f;
      }

      &.stopped {
        color: #8c8c8c;
        background: #fafafa;
        border: 1px solid #d9d9d9;
      }

      .status-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: currentColor;

        .running & {
          animation: pulse 2s infinite;
        }
      }
    }
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

.info-panel {
  background: #fafbfc;
  border: 1px solid #f0f0f0;
  border-radius: 20px;
  padding: 16px 20px;
  margin-bottom: 12px;

  .info-row {
    display: flex;
    align-items: center;
    gap: 32px;
  }

  .current-value-box {
    display: flex;
    align-items: baseline;
    gap: 4px;

    .value-label {
      font-size: 12px;
      color: #999;
      margin-right: 4px;
    }

    .value-number {
      font-size: 36px;
      font-weight: 700;
      color: #262626;
      line-height: 1;
      font-variant-numeric: tabular-nums;
    }

    .value-unit {
      font-size: 16px;
      color: #666;
      margin-left: 2px;
    }
  }

  .stats-box {
    display: flex;
    gap: 24px;

    .stat-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;

      .stat-label {
        font-size: 11px;
        color: #999;
      }

      .stat-value {
        font-size: 18px;
        font-weight: 600;
        color: #595959;

        &.hot { color: #f5222d; }
        &.cold { color: #1890ff; }
      }
    }
  }

  .update-box {
    margin-left: auto;
    text-align: right;

    .update-label {
      display: block;
      font-size: 11px;
      color: #999;
    }

    .update-time {
      font-size: 14px;
      color: #595959;
      font-variant-numeric: tabular-nums;
    }
  }
}

.controls-row {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 12px;

  .control-group {
    display: flex;
    align-items: center;
    gap: 6px;

    .control-label {
      font-size: 12px;
      color: #999;
    }

    .alert-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      color: #f5222d;
      background: #fff1f0;
      padding: 2px 10px;
      border-radius: 4px;
      border: 1px solid #ffa39e;
    }
  }
}

.skeleton-chart {
  height: 60vh;
  padding: 4px 0;
}

.no-data {
  height: 60vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;

  .no-data-icon {
    margin-bottom: 8px;
  }

  .no-data-text {
    margin: 0;
    font-size: 18px;
    color: #595959;
    font-weight: 500;
  }

  .no-data-hint {
    margin: 0 0 16px;
    font-size: 13px;
    color: #bfbfbf;
  }
}

.chart {
  height: 60vh;
  width: 100%;
  background: #fff;
  border-radius: 1px;
}
</style>
