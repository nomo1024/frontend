<template>
  <SensorMonitor
    :source="3"
    name="光照"
    unit="kLux"
    chart-type="line"
    :y-axis-min="0"
    :y-axis-max="100"
    :y-axis-interval="10"
    line-color="#faad14"
    :smooth="true"
    :area-color="areaGradient"
    :y-axis-formatter="(v: number) => v + 'k'"
    :alert-max="90"
  />
</template>

<script setup lang="ts">
import SensorMonitor from '@/components/SensorMonitor.vue'

const areaGradient = {
  type: 'linear' as const,
  x: 0, y: 0, x2: 0, y2: 1,
  colorStops: [
    { offset: 0, color: '#faad14' },
    { offset: 1, color: 'rgba(250, 173, 20, 0.1)' },
  ],
}
</script>
