<template>
  <SensorMonitor
    :source="5"
    name="温度"
    unit="°C"
    chart-type="line"
    :y-axis-min="-20"
    :y-axis-max="50"
    :y-axis-interval="5"
    line-color="#ff4d4f"
    :smooth="true"
    :alert-min="-10"
    :alert-max="40"
  />
</template>

<script setup lang="ts">
import SensorMonitor from '@/components/SensorMonitor.vue'
</script>
