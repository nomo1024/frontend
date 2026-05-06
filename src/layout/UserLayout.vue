<template>
  <div class="user-layout">
    <div class="content">
      <router-view />
    </div>
    <div class="footer">
      {{ currentYear }} 李玉城 出品
    </div>
  </div>
</template>

<script setup lang="ts">
const currentYear = new Date().getFullYear()
</script>

<style scoped lang="less">
.user-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: #f0f2f5;
  background-image: url('https://gw.alipayobjects.com/zos/rmsportal/TVYTbAXWheQpRcWDaDMu.svg');
  background-repeat: no-repeat;
  background-position: center 110px;
  background-size: 100%;

  .content {
    flex: 1;
    padding: 32px 0;
  }

  .footer {
    text-align: center;
    padding: 24px;
    color: rgba(0, 0, 0, 0.45);
    font-size: 13px;
  }
}
</style>
