import { defineStore } from 'pinia'
import axios from 'axios'

interface User {
  email: string
  token: string
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as User | null,
    isLoading: false,
    error: null as string | null,
  }),

  getters: {
    isAuthenticated: (state) => !!state.user?.token,
  },

  actions: {
    async login(email: string, password: string) {
      this.isLoading = true
      this.error = null

      try {
        const response = await axios.post(
          'https://dev-api.aiscreen.io/api/v1/login',
          {
            email,
            password,
          },
          {
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
          },
        )

        this.user = {
          email,
          token: response.data.access_token || response.data.token || response.data.accessToken,
        }

        localStorage.setItem('auth_token', this.user.token)

        return true
      } catch (error: any) {
        this.error = error.response?.data?.message || error.message || 'Ошибка авторизации'
        return false
      } finally {
        this.isLoading = false
      }
    },

    logout() {
      this.user = null
      localStorage.removeItem('auth_token')
    },

    initAuth() {
      const token = localStorage.getItem('auth_token')
      if (token) {
        this.user = {
          email: '',
          token,
        }
      }
    },
  },
})
