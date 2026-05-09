import { ref } from 'vue'

export interface GpsCoords {
  lng: number
  lat: number
}

const isRunning = ref(false)
const currentCoords = ref<GpsCoords | null>(null)
let gpsTimerId: ReturnType<typeof setInterval> | null = null

export function useGpsTracker() {
  const start = () => {
    if (isRunning.value || !navigator.geolocation) return
    isRunning.value = true

    const doPosition = () => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          currentCoords.value = {
            lng: pos.coords.longitude,
            lat: pos.coords.latitude,
          }
        },
        () => {},
        { enableHighAccuracy: true, timeout: 10000 }
      )
    }

    doPosition()
    gpsTimerId = setInterval(doPosition, 5000)
  }

  const stop = () => {
    isRunning.value = false
    if (gpsTimerId !== null) {
      clearInterval(gpsTimerId)
      gpsTimerId = null
    }
  }

  return { isRunning, currentCoords, start, stop }
}
