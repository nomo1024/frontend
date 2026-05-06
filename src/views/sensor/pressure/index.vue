<template>
  <el-card class="sensor-card">
    <template #header>
      <div class="card-header">
        <h3>气压监测</h3>
        <el-button :type="isRunning ? 'danger' : 'primary'" @click="isRunning ? handleStop() : handleStart()" :loading="loading">
          <el-icon><VideoPause v-if="isRunning" /><VideoPlay v-else /></el-icon>
          {{ isRunning ? '停止监测' : '开始监测' }}
        </el-button>
      </div>
    </template>

    <div v-if="chartData.length === 0" class="no-data">暂无数据</div>
    <div ref="chartRef" class="chart" v-else></div>
  </el-card>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { VideoPlay, VideoPause } from '@element-plus/icons-vue'
import { useSensor } from '@/composables/useSensor'
import * as echarts from 'echarts'

const { isRunning, loading, chartData, handleStart, handleStop } = useSensor(4, '气压')

const chartRef = ref<HTMLElement>()
let chart: echarts.ECharts | null = null

const renderChart = () => {
  if (!chartRef.value || chartData.value.length === 0) return
  if (!chart) {
    chart = echarts.init(chartRef.value)
  }

  chart.setOption({
    tooltip: { trigger: 'axis' },
    animation: true,
    animationDuration: 600,
    animationEasing: 'cubicOut',
    xAxis: {
      type: 'category',
      data: chartData.value.map((d) => d.time),
      name: '时间',
    },
    yAxis: {
      type: 'value',
      name: '气压 (hPa)',
      min: 300,
      max: 1100,
      interval: 100,
    },
    series: [
      {
        data: chartData.value.map((d) => d.value),
        type: 'line',
        smooth: false,
        itemStyle: { color: '#722ed1' },
        lineStyle: { width: 2, type: 'solid' },
      },
    ],
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  })
}

watch(chartData, () => renderChart(), { deep: true })

onMounted(() => {
  if (chartData.value.length > 0) {
    setTimeout(() => renderChart(), 100)
  }
})

onUnmounted(() => {
  chart?.dispose()
})
</script>

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

.no-data {
  height: 70vh;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  font-size: 16px;
}

.chart {
  height: 70vh;
  width: 100%;
}
</style>
