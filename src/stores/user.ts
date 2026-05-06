import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { CurrentUser } from '@/types'
import { currentUser as fetchCurrentUser } from '@/api'

export const useUserStore = defineStore('user', () => {
  const currentUser = ref<CurrentUser | null>(null)

  async function fetchUserInfo() {
    try {
      const res = await fetchCurrentUser()
      if (res) {
        currentUser.value = (res as any).data || res
      }
    } catch {
      // 401 handled by interceptor
    }
  }

  function setUser(user: CurrentUser | null) {
    currentUser.value = user
  }

  function clearUser() {
    currentUser.value = null
  }

  const canAdmin = () => {
    return currentUser.value?.userRole === 1
  }

  return {
    currentUser,
    fetchUserInfo,
    setUser,
    clearUser,
    canAdmin,
  }
})
