<template>
  <div class="welcome-page">
    <el-card>
      <el-alert title="欢迎使用环境监测系统" type="success" show-icon :closable="false" style="margin-bottom: 24px" />

      <el-space direction="vertical" :size="16">
        <div>
          <el-text strong>传感器监测</el-text>
          <p>系统支持 GPS、湿度、光照、气压、温度五种传感器数据的实时监测与可视化展示。</p>
        </div>

        <el-divider />

        <div>
          <el-text strong>功能特性</el-text>
          <el-row :gutter="16" style="margin-top: 16px">
            <el-col :span="8">
              <el-card shadow="hover">
                <el-icon size="32" color="#409eff"><Location /></el-icon>
                <h4>GPS监测</h4>
                <p class="desc">实时跟踪海拔高度变化</p>
              </el-card>
            </el-col>
            <el-col :span="8">
              <el-card shadow="hover">
                <el-icon size="32" color="#3098d6"><Van /></el-icon>
                <h4>湿度监测</h4>
                <p class="desc">监控环境湿度百分比</p>
              </el-card>
            </el-col>
            <el-col :span="8">
              <el-card shadow="hover">
                <el-icon size="32" color="#faad14"><Sunny /></el-icon>
                <h4>光照监测</h4>
                <p class="desc">检测光照强度变化</p>
              </el-card>
            </el-col>
          </el-row>
          <el-row :gutter="16" style="margin-top: 16px">
            <el-col :span="12">
              <el-card shadow="hover">
                <el-icon size="32" color="#722ed1"><Odometer /></el-icon>
                <h4>气压监测</h4>
                <p class="desc">大气压力实时监测</p>
              </el-card>
            </el-col>
            <el-col :span="12">
              <el-card shadow="hover">
                <el-icon size="32" color="#ff4d4f"><SemiSelect /></el-icon>
                <h4>温度监测</h4>
                <p class="desc">环境温度实时监控</p>
              </el-card>
            </el-col>
          </el-row>
        </div>
      </el-space>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { Location, Odometer, Sunny, SemiSelect, Van } from '@element-plus/icons-vue'
</script>

<style scoped lang="less">
.welcome-page {
  max-width: 900px;
  margin: 0 auto;

  h4 {
    margin: 12px 0 4px;
    font-weight: 600;
  }

  .desc {
    margin: 0;
    color: #666;
    font-size: 13px;
  }
}
</style>
