import { ref, onMounted, onUnmounted, watch } from 'vue'
import { startSensor, stopSensor, getSensorStatus, readSensorData } from '@/api'
import { ElMessage } from 'element-plus'

export interface SensorDataPoint {
  time: string
  value: number
}

export function useSensor(source: number, sensorName: string) {
  const isRunning = ref(false)
  const loading = ref(false)
  const chartData = ref<SensorDataPoint[]>([])
  const timerRef = ref<number>()

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
      if (raw && typeof raw === 'object') {
        if (typeof raw === 'boolean') {
          isRunning.value = raw
        } else if (typeof raw.running !== 'undefined') {
          isRunning.value = raw.running === true
        } else if (raw.data) {
          isRunning.value = parseStatus(raw.data)
        }
      } else if (typeof raw === 'string') {
        isRunning.value = raw === '运行中' || raw === 'running'
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
      const res = await readSensorData(source, 5)
      if (res && Array.isArray(res)) {
        const formatted = res.map(formatData)
        formatted.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())
        chartData.value = formatted
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
        chartData.value = updated.slice(-5)
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

  watch(isRunning, (running) => {
    stopPolling()
    if (running) {
      fetchData()
      timerRef.value = window.setInterval(fetchData, 2000)
    }
  })

  onMounted(() => {
    fetchStatus()
    fetchInitialData()
    const statusInterval = setInterval(fetchStatus, 3000)
    onUnmounted(() => {
      clearInterval(statusInterval)
      stopPolling()
    })
  })

  return {
    isRunning,
    loading,
    chartData,
    handleStart,
    handleStop,
  }
}
