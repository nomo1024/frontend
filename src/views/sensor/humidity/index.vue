<template>
  <SensorMonitor
    :source="2"
    name="湿度"
    unit="%RH"
    chart-type="bar"
    :y-axis-min="0"
    :y-axis-max="100"
    :y-axis-interval="10"
    line-color="#3098d6"
    :bar-item-style="{ color: '#3098d6', borderRadius: [4, 4, 0, 0] }"
    :alert-min="20"
    :alert-max="80"
  />
</template>

<script setup lang="ts">
import SensorMonitor from '@/components/SensorMonitor.vue'
</script>
