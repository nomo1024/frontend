<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { VideoPlay, VideoPause } from '@element-plus/icons-vue'
import { useGpsTracker } from '@/composables/useGpsTracker'

declare global {
  interface Window {
    AMap?: any
  }
}

const AMAP_KEY = import.meta.env.VITE_AMAP_KEY || 'bdde1002ca2302262381a5f51ca68d9b'
const { isRunning, currentCoords, start, stop } = useGpsTracker()
const loading = ref(false)
let mapInstance: any = null
let geolocationInstance: any = null
let markerInstance: any = null

function loadAMapScript(key: string) {
  return new Promise<void>((resolve, reject) => {
    if ((window as any).AMap) {
      return resolve()
    }
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

function updateMarker(lng: number, lat: number) {
  const AMap = (window as any).AMap
  if (!AMap) return
  if (markerInstance) {
    markerInstance.setPosition([lng, lat])
  } else {
    markerInstance = new AMap.Marker({
      position: [lng, lat],
      map: mapInstance,
    })
  }
}

function doGeolocation() {
  if (!geolocationInstance) return
  geolocationInstance.getCurrentPosition(function (status: string, result: any) {
    if (status === 'complete') {
      const lng = result.position.lng
      const lat = result.position.lat
      updateMarker(lng, lat)
      mapInstance.setCenter([lng, lat])
    }
  })
}

async function initMap() {
  try {
    await loadAMapScript(AMAP_KEY)
    const AMap = (window as any).AMap
    if (!AMap) {
      console.warn('AMap not available')
      return
    }

    mapInstance = new AMap.Map('container', {
      zoom: 15,
      resizeEnable: true,
    })

    if (currentCoords.value) {
      updateMarker(currentCoords.value.lng, currentCoords.value.lat)
      mapInstance.setCenter([currentCoords.value.lng, currentCoords.value.lat])
    } else {
      AMap.plugin('AMap.Geolocation', function () {
        geolocationInstance = new AMap.Geolocation({
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
          showButton: false,
          showCircle: false,
        })
        mapInstance.addControl(geolocationInstance)
        doGeolocation()
      })
    }
  } catch (e) {
    console.error('初始化地图失败:', e)
  }
}

function handleStart() {
  loading.value = true
  start()
}

function handleStop() {
  loading.value = false
  stop()
}

watch(currentCoords, (coords) => {
  if (coords) {
    if (loading.value) loading.value = false
    updateMarker(coords.lng, coords.lat)
    mapInstance?.setCenter([coords.lng, coords.lat])
  }
})

onMounted(() => {
  initMap()
})

onUnmounted(() => {
  mapInstance = null
  geolocationInstance = null
})
</script>

<template>
  <el-card class="sensor-card">
    <template #header>
      <div class="card-header">
        <h3>GPS监测</h3>
        <el-button
          :type="isRunning ? 'danger' : 'primary'"
          @click="isRunning ? handleStop() : handleStart()"
          :loading="loading"
        >
          <el-icon><VideoPause v-if="isRunning" /><VideoPlay v-else /></el-icon>
          {{ isRunning ? '停止监测' : '开始监测' }}
        </el-button>
      </div>
    </template>
    <div id="container"></div>
  </el-card>
</template>

<style scoped lang="less">
.sensor-card {
  :deep(.el-card__header) {
    padding: 16px 24px;
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;

  h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
  }
}

#container {
  width: 100%;
  height: 70vh;
}
</style>


