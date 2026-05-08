<template>
  <SensorMonitor
    :source="4"
    name="气压"
    unit="hPa"
    chart-type="line"
    :y-axis-min="300"
    :y-axis-max="1100"
    :y-axis-interval="100"
    line-color="#722ed1"
    :smooth="false"
    :alert-min="500"
    :alert-max="1050"
  />
</template>

<script setup lang="ts">
import SensorMonitor from '@/components/SensorMonitor.vue'
</script>
