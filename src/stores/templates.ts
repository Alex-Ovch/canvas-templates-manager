import { defineStore } from 'pinia'
import apiClient from '@/services/api'
import type { Template, TemplateFilters, TemplatesResponse } from '@/types/template'

export const useTemplatesStore = defineStore('templates', {
  state: () => ({
    templates: [] as Template[],
    currentTemplate: null as Template | null,
    isLoading: false,
    error: null as string | null,
    filters: {
      page: 1,
    } as TemplateFilters,
  }),

  actions: {
    async fetchTemplates() {
      this.isLoading = true
      this.error = null

      try {
        const response = await apiClient.get('/v1/canvas_templates', {
          params: this.filters,
        })

        if (response.data.data) {
          this.templates = response.data.data
        } else if (Array.isArray(response.data)) {
          this.templates = response.data
        } else {
          this.templates = []
        }
      } catch (error: any) {
        if (!error.response) {
          this.error = 'Проблемы с сетью. Проверьте интернет-соединение.'
        } else {
          this.error = error.response?.data?.message || 'Ошибка загрузки шаблонов'
        }
      } finally {
        this.isLoading = false
      }
    },

    async fetchTemplate(id: string) {
      this.isLoading = true
      this.error = null

      try {
        const response = await apiClient.get(`/v1/canvas_templates/${id}`)
        this.currentTemplate = response.data
      } catch (error: any) {
        if (!error.response) {
          this.error = 'Проблемы с сетью. Проверьте интернет-соединение.'
        } else {
          this.error = error.response?.data?.message || 'Ошибка загрузки шаблона'
        }
      } finally {
        this.isLoading = false
      }
    },

    async createTemplate(template: Partial<Template>) {
      this.isLoading = true
      this.error = null

      try {
        const response = await apiClient.post('/v1/canvas_templates', template)
        this.templates.push(response.data)
        return response.data
      } catch (error: any) {
        if (!error.response) {
          this.error = 'Проблемы с сетью. Проверьте интернет-соединение.'
        } else {
          this.error = error.response?.data?.message || 'Ошибка создания шаблона'
        }
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async updateTemplate(id: string, template: Partial<Template>) {
      this.isLoading = true
      this.error = null

      try {
        const response = await apiClient.put(`/v1/canvas_templates/${id}`, template)
        const index = this.templates.findIndex((t) => t.id === id)
        if (index !== -1) {
          this.templates[index] = response.data
        }
        this.currentTemplate = response.data
        return response.data
      } catch (error: any) {
        if (!error.response) {
          this.error = 'Проблемы с сетью. Проверьте интернет-соединение.'
        } else {
          this.error = error.response?.data?.message || 'Ошибка обновления шаблона'
        }
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async deleteTemplate(id: string) {
      this.isLoading = true
      this.error = null

      try {
        const response = await apiClient.delete('/v1/canvas_templates', {
          data: {
            id: parseInt(id),
          },
        })

        this.templates = this.templates.filter((t) => t.id !== id)
      } catch (error: any) {
        if (!error.response) {
          this.error = 'Проблемы с сетью. Проверьте интернет-соединение.'
        } else if (error.response?.status === 404) {
          this.templates = this.templates.filter((t) => t.id !== id)
        } else {
          this.error = error.response?.data?.message || 'Ошибка удаления шаблона'
          throw error
        }
      } finally {
        this.isLoading = false
      }
    },
  },
})
