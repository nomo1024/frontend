import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'
import { ElMessage } from 'element-plus'
import router from '@/router'

const request = axios.create({
  baseURL: import.meta.env.MODE === 'production' ? 'http://192.168.23.128:8080' : 'http://localhost:8080',
  timeout: 100000,
  withCredentials: true,
})

request.interceptors.request.use(
  (config) => {
    console.log(`do request url = ${config.url}`)
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

request.interceptors.response.use(
  async (response: AxiosResponse) => {
    const res = response.data

    if (res.status === 'success') {
      return res.msg ?? res
    }

    if (res.code === 0) {
      return res.data ?? res
    }

    if (res.code === 40100) {
      ElMessage.error('请先登录')
      router.replace({
        path: '/user/login',
        query: { redirect: router.currentRoute.value.fullPath },
      })
      return Promise.reject(new Error('请先登录'))
    }

    const errorMsg = res.description || res.message || res.msg || '请求失败'
    ElMessage.error(errorMsg)
    return Promise.reject(new Error(errorMsg))
  },
  (error) => {
    ElMessage.error(error.message || '网络请求失败')
    return Promise.reject(error)
  }
)

export default request
