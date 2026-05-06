<template>
  <div class="not-found">
    <el-result status="404" title="404" sub-title="Sorry, the page you visited does not exist.">
      <template #extra>
        <el-button type="primary" @click="router.push('/')">Back Home</el-button>
      </template>
    </el-result>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<style scoped lang="less">
.not-found {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 70vh;
}
</style>
