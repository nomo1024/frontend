import { ref, computed, onMounted, onUnmounted, onActivated, onDeactivated, watch } from 'vue'
import { startSensor, stopSensor, getSensorStatus, readSensorData } from '@/api'
import { ElMessage } from 'element-plus'

export interface SensorDataPoint {
  time: string
  value: number
}

export interface UseSensorOptions {
  maxPoints?: number
  timeRange?: '5min' | '30min' | '1hour'
}

export function useSensor(source: number, sensorName: string, options?: UseSensorOptions) {
  const isRunning = ref(false)
  const loading = ref(false)
  const chartData = ref<SensorDataPoint[]>([])
  const timerRef = ref<number>()

  const maxPoints = ref(options?.maxPoints ?? 5)
  const timeRange = ref<'5min' | '30min' | '1hour'>(options?.timeRange ?? '5min')

  const getFetchLimit = () => {
    switch (timeRange.value) {
      case '5min': return 5
      case '30min': return 30
      case '1hour': return 60
      default: return 5
    }
  }

  const currentValue = computed(() => {
    if (chartData.value.length === 0) return null
    return chartData.value[chartData.value.length - 1].value
  })

  const statistics = computed(() => {
    const values = chartData.value.map(d => d.value)
    if (values.length === 0) return { max: null, min: null, avg: null }
    return {
      max: Math.max(...values),
      min: Math.min(...values),
      avg: values.reduce((a, b) => a + b, 0) / values.length,
    }
  })

  const lastUpdateTime = computed(() => {
    if (chartData.value.length === 0) return null
    return chartData.value[chartData.value.length - 1].time
  })

  const parseStatus = (data: any): boolean => {
    if (typeof data === 'boolean') return data
    if (typeof data === 'string') return data === '运行中' || data === 'running'
    if (data) {
      const key = `source_${source}`
      if (data[key]) return data[key] === '运行中'
      if (data.running !== undefined) return data.running === true
    }
    return false
  }

  const fetchStatus = async () => {
    try {
      const res = await getSensorStatus(source)
      let raw: any = res
      if (typeof raw === 'boolean') {
        isRunning.value = raw
      } else if (typeof raw === 'string') {
        isRunning.value = raw === '运行中' || raw === 'running'
      } else if (raw && typeof raw === 'object') {
        if (typeof raw.running !== 'undefined') {
          isRunning.value = raw.running === true
        } else {
          isRunning.value = parseStatus(raw)
        }
      }
    } catch {
      // error handled silently
    }
  }

  const formatData = (item: any): SensorDataPoint => {
    return {
      time: item.collect_time || new Date(item.createTime || Date.now()).toLocaleTimeString(),
      value: parseFloat(item.col1 || item.value || 0),
    }
  }

  const fetchInitialData = async () => {
    try {
      const limit = Math.max(getFetchLimit(), maxPoints.value)
      const res = await readSensorData(source, limit)
      if (res && Array.isArray(res)) {
        const formatted = res.map(formatData)
        formatted.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())
        chartData.value = formatted.slice(-maxPoints.value)
      }
    } catch {
      // error handled silently
    }
  }

  const fetchData = async () => {
    try {
      const res = await readSensorData(source, 1)
      if (res && Array.isArray(res) && res.length > 0) {
        const newItem = formatData(res[0])
        const updated = [...chartData.value, newItem]
        chartData.value = updated.slice(-maxPoints.value)
      }
    } catch {
      // error handled silently
    }
  }

  const handleStart = async () => {
    loading.value = true
    try {
      await startSensor(source)
      ElMessage.success(`${sensorName}监测已启动`)
      isRunning.value = true
    } catch {
      ElMessage.error('启动失败')
    } finally {
      loading.value = false
    }
  }

  const handleStop = async () => {
    loading.value = true
    try {
      await stopSensor(source)
      ElMessage.success(`${sensorName}监测已停止`)
      isRunning.value = false
    } catch {
      ElMessage.error('停止失败')
    } finally {
      loading.value = false
    }
  }

  const stopPolling = () => {
    if (timerRef.value) {
      clearInterval(timerRef.value)
      timerRef.value = undefined
    }
  }

  const startPolling = () => {
    stopPolling()
    fetchData()
    timerRef.value = window.setInterval(fetchData, 2000)
  }

  watch(isRunning, (running) => {
    if (running) {
      startPolling()
    } else {
      stopPolling()
    }
  })

  watch(maxPoints, () => {
    chartData.value = chartData.value.slice(-maxPoints.value)
  })

  watch(timeRange, () => {
    fetchInitialData()
  })

  // Tab visibility handling: pause polling when tab is hidden
  let visibilityTimer: ReturnType<typeof setTimeout> | null = null
  const handleVisibility = () => {
    if (document.hidden) {
      stopPolling()
    } else if (isRunning.value) {
      startPolling()
    }
  }

  onMounted(() => {
    fetchStatus()
    fetchInitialData()
    const statusInterval = setInterval(fetchStatus, 3000)
    document.addEventListener('visibilitychange', handleVisibility)
    onUnmounted(() => {
      clearInterval(statusInterval)
      stopPolling()
      document.removeEventListener('visibilitychange', handleVisibility)
    })
  })

  return {
    isRunning,
    loading,
    chartData,
    handleStart,
    handleStop,
    maxPoints,
    timeRange,
    currentValue,
    statistics,
    lastUpdateTime,
  }
}
