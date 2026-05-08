import { ref } from 'vue'

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

const alerts = ref<AlertEvent[]>([])
let nextId = 1

export function useAlertStore() {
  const pushAlert = (event: Omit<AlertEvent, 'id'>) => {
    alerts.value.unshift({ id: nextId++, ...event })
    if (alerts.value.length > 200) {
      alerts.value = alerts.value.slice(0, 200)
    }
  }

  const clearAlerts = () => {
    alerts.value = []
  }

  return {
    alerts,
    pushAlert,
    clearAlerts,
  }
}
