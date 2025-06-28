<template>
  <div>
    <header class="header">
      <button @click="goBack" class="back-btn">← Назад к списку</button>
      <h1>{{ isLoading ? 'Загрузка...' : template?.name || 'Шаблон' }}</h1>
    </header>

    <!-- Загрузка -->
    <LoadingSpinner v-if="isLoading" text="Загружаем шаблон..." />

    <!-- Ошибка -->
    <div v-else-if="error" class="error">
      Ошибка: {{ error }}
      <button @click="loadTemplate" class="retry-btn">Попробовать снова</button>
    </div>

    <!-- Форма редактирования -->
    <div v-else-if="template" class="template-page">
      <TemplateForm
        :template="template"
        :is-loading="templatesStore.isLoading"
        :error="templatesStore.error"
        @submit="handleUpdateTemplate"
        @cancel="goBack"
      />
    </div>

    <!-- Шаблон не найден -->
    <div v-else class="not-found">
      <h2>Шаблон не найден</h2>
      <button @click="goBack" class="back-btn">Вернуться к списку</button>
    </div>

    <!-- Сообщение об успехе -->
    <div v-if="successMessage" class="success-message">
      {{ successMessage }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTemplatesStore } from '@/stores/templates'
import TemplateForm from '@/components/TemplateForm.vue'
import type { Template } from '@/types/template'
import LoadingSpinner from '@/components/LoadingSpinner.vue'

const route = useRoute()
const router = useRouter()
const templatesStore = useTemplatesStore()

const successMessage = ref('')

const templateId = computed(() => route.params.id as string)
const template = computed(() => templatesStore.currentTemplate)
const isLoading = computed(() => templatesStore.isLoading)
const error = computed(() => templatesStore.error)

const goBack = () => {
  router.push('/home')
}

const loadTemplate = async () => {
  if (templateId.value) {
    await templatesStore.fetchTemplate(templateId.value)
  }
}
const handleUpdateTemplate = async (templateData: Partial<Template>) => {
  try {
    await templatesStore.updateTemplate(templateId.value, templateData)
    showSuccessMessage('Шаблон успешно обновлен')
  } catch (error) {
    console.error('Ошибка обновления шаблона:', error)
  }
}

const showSuccessMessage = (message: string) => {
  successMessage.value = message
  setTimeout(() => {
    successMessage.value = ''
  }, 3000)
}

onMounted(() => {
  loadTemplate()
})

watch(templateId, () => {
  loadTemplate()
})
</script>

<style scoped>
.header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.back-btn {
  background-color: #6c757d;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  text-decoration: none;
}

.back-btn:hover {
  background-color: #5a6268;
}

.loading {
  text-align: center;
  padding: 3rem;
  font-size: 1.2rem;
}

.error {
  background-color: #f8d7da;
  color: #721c24;
  padding: 2rem;
  border-radius: 4px;
  text-align: center;
}

.retry-btn {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  margin-left: 1rem;
}

.template-page {
  max-width: 800px;
  margin: 0 auto;
}

.not-found {
  text-align: center;
  padding: 3rem;
}

.not-found h2 {
  color: #dc3545;
  margin-bottom: 1rem;
}

.success-message {
  background-color: #d4edda;
  color: #155724;
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}
</style>
