import axios from 'axios'
import { useAuthStore } from '@/stores/auth'

const API_BASE_URL = 'https://dev-api.aiscreen.io/api'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

apiClient.interceptors.request.use((config) => {
  const authStore = useAuthStore()
  if (authStore.user?.token) {
    config.headers.Authorization = `Bearer ${authStore.user.token}`
  }
  return config
})

export default apiClient
