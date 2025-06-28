<template>
  <div>
    <header class="header">
      <h1>Управление шаблонами</h1>
      <div class="header-actions">
        <button @click="showAddForm = !showAddForm" class="add-btn">
          {{ showAddForm ? 'Скрыть форму' : 'Добавить шаблон' }}
        </button>
        <button @click="logout" class="logout-btn">Выйти</button>
      </div>
    </header>

    <!-- Фильтры -->
    <TemplateFilters
      v-if="!showAddForm && templatesStore.templates.length > 0"
      :templates="templatesStore.templates"
      @filter="handleFilter"
    />

    <!-- Форма добавления шаблона -->
    <div v-if="showAddForm" class="form-container">
      <TemplateForm
        :is-loading="templatesStore.isLoading"
        :error="templatesStore.error"
        @submit="handleCreateTemplate"
        @cancel="showAddForm = false"
      />
    </div>

    <!-- Загрузка -->
    <LoadingSpinner v-if="templatesStore.isLoading && !showAddForm" text="Загружаем шаблоны..." />

    <!-- Ошибка -->
    <div v-else-if="templatesStore.error && !showAddForm" class="error">
      Ошибка: {{ templatesStore.error }}
      <button @click="loadTemplates" class="retry-btn">Попробовать снова</button>
    </div>

    <!-- Список шаблонов -->
    <div v-else-if="!showAddForm">
      <div class="templates-info">
        <p>Найдено шаблонов: {{ filteredTemplates.length }}</p>
        <button @click="loadTemplates" class="refresh-btn">Обновить</button>
      </div>

      <!-- Если нет шаблонов -->
      <div v-if="templatesStore.templates.length === 0" class="no-templates">
        <p>Шаблоны не найдены</p>
        <button @click="showAddForm = true" class="add-first-btn">Создать первый шаблон</button>
      </div>

      <!-- Грид шаблонов -->
      <div v-else class="templates-grid">
        <div v-for="template in filteredTemplates" :key="template.id" class="template-card">
          <div class="template-preview">
            <img
              v-if="template.preview_image || template.preview"
              :src="template.preview_image || template.preview"
              :alt="template.name"
              class="preview-image"
            />
            <div v-else class="no-preview">Нет превью</div>
          </div>

          <div class="template-info">
            <h3>{{ template.name }}</h3>
            <p v-if="template.description">{{ template.description }}</p>
            <p class="template-size">{{ template.width }}x{{ template.height }}</p>
            <div v-if="template.tags && template.tags.length" class="tags">
              <span v-for="tag in template.tags" :key="tag" class="tag">{{ tag }}</span>
            </div>
          </div>

          <div class="template-actions">
            <button @click="editTemplate(template.id)" class="edit-btn">
              Просмотреть/Редактировать
            </button>
            <button @click="deleteTemplateConfirm(template.id)" class="delete-btn">Удалить</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Сообщение об успехе -->
    <div v-if="successMessage" class="success-message">
      {{ successMessage }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useTemplatesStore } from '@/stores/templates'
import { useRouter } from 'vue-router'
import TemplateForm from '@/components/TemplateForm.vue'
import type { Template } from '@/types/template'
import TemplateFilters from '@/components/TemplateFilters.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'

const authStore = useAuthStore()
const templatesStore = useTemplatesStore()
const router = useRouter()

const showAddForm = ref(false)
const successMessage = ref('')

const filteredTemplates = ref<Template[]>([])
const activeFilters = ref({ search: '', tags: [] as string[] })

const logout = () => {
  authStore.logout()
  router.push('/login')
}

const loadTemplates = async () => {
  await templatesStore.fetchTemplates()
  applyFilters()
}

const editTemplate = (id: string) => {
  router.push(`/template/${id}`)
}

const deleteTemplateConfirm = async (id: string) => {
  if (confirm('Вы уверены, что хотите удалить этот шаблон?')) {
    try {
      await templatesStore.deleteTemplate(id)
      showSuccessMessage('Шаблон успешно удален')
      applyFilters()
    } catch (error) {
      console.error('Ошибка удаления:', error)
    }
  }
}

const handleCreateTemplate = async (templateData: Partial<Template>) => {
  try {
    await templatesStore.createTemplate(templateData)
    showAddForm.value = false
    showSuccessMessage('Шаблон успешно создан')
    await loadTemplates()
  } catch (error) {
    console.error('Ошибка создания шаблона:', error)
  }
}

const showSuccessMessage = (message: string) => {
  successMessage.value = message
  setTimeout(() => {
    successMessage.value = ''
  }, 3000)
}

const applyFilters = () => {
  let result = templatesStore.templates

  // Фильтр по поиску
  if (activeFilters.value.search) {
    result = result.filter((template) =>
      template.name?.toLowerCase().includes(activeFilters.value.search.toLowerCase()),
    )
  }

  // Фильтр по тегам
  if (activeFilters.value.tags.length > 0) {
    result = result.filter((template) => {
      const templateTags = template.tags || []
      return activeFilters.value.tags.some((tag) => templateTags.includes(tag))
    })
  }

  filteredTemplates.value = result
}

const handleFilter = (filters: { search: string; tags: string[] }) => {
  activeFilters.value = filters
  applyFilters()
}

onMounted(() => {
  loadTemplates()
})
</script>

<style scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.header-actions {
  display: flex;
  gap: 1rem;
}

.add-btn {
  background-color: #28a745;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
}

.logout-btn {
  background-color: #dc3545;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
}

.form-container {
  margin-bottom: 2rem;
}

.loading {
  text-align: center;
  padding: 2rem;
  font-size: 1.2rem;
}

.error {
  background-color: #f8d7da;
  color: #721c24;
  padding: 1rem;
  border-radius: 4px;
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

.retry-btn,
.refresh-btn {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  margin-left: 1rem;
}

.templates-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.no-templates {
  text-align: center;
  padding: 3rem;
  color: #666;
  font-size: 1.1rem;
}

.add-first-btn {
  background-color: #28a745;
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1.1rem;
  margin-top: 1rem;
}

.templates-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.template-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;
}

.template-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.template-preview {
  height: 200px;
  background-color: #f8f9fa;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.no-preview {
  color: #666;
  font-style: italic;
}

.template-info {
  padding: 1rem;
}

.template-info h3 {
  margin: 0 0 0.5rem 0;
  color: #333;
}

.template-size {
  color: #666;
  font-size: 0.9rem;
  margin: 0.5rem 0;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  margin-top: 0.5rem;
}

.tag {
  background-color: #e9ecef;
  color: #495057;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.8rem;
}

.template-actions {
  padding: 1rem;
  border-top: 1px solid #eee;
  display: flex;
  gap: 0.5rem;
}

.edit-btn {
  background-color: #28a745;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  flex: 1;
}

.delete-btn {
  background-color: #dc3545;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  flex: 1;
}
</style>
