import { ref } from 'vue'

const STORAGE_KEY = 'sensor_alerts'
const MAX_ALERTS = 200

export interface AlertEvent {
  id: number
  sensorName: string
  sensorSource: number
  value: number
  unit: string
  threshold: string
  time: string
  type: 'min' | 'max'
}

function loadAlerts(): AlertEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveAlerts(data: AlertEvent[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    // storage full or unavailable
  }
}

const alerts = ref<AlertEvent[]>(loadAlerts())
let nextId = alerts.value.reduce((max, a) => Math.max(max, a.id), 0) + 1

export function useAlertStore() {
  const pushAlert = (event: Omit<AlertEvent, 'id'>) => {
    const entry: AlertEvent = { id: nextId++, ...event }
    alerts.value.unshift(entry)
    if (alerts.value.length > MAX_ALERTS) {
      alerts.value = alerts.value.slice(0, MAX_ALERTS)
    }
    saveAlerts(alerts.value)
  }

  const clearAlerts = () => {
    alerts.value = []
    saveAlerts(alerts.value)
  }

  return {
    alerts,
    pushAlert,
    clearAlerts,
  }
}
