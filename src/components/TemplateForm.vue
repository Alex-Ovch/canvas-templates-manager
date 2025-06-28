<template>
  <div class="template-form">
    <h2>{{ isEdit ? 'Редактировать шаблон' : 'Добавить новый шаблон' }}</h2>

    <form @submit.prevent="handleSubmit">
      <div class="form-group">
        <label for="name">Название *</label>
        <input
          id="name"
          v-model="formData.name"
          type="text"
          required
          :class="{ error: errors.name }"
          placeholder="Введите название шаблона"
        />
        <span v-if="errors.name" class="error-text">{{ errors.name }}</span>
      </div>

      <div class="form-group">
        <label for="description">Описание</label>
        <textarea
          id="description"
          v-model="formData.description"
          placeholder="Описание шаблона (необязательно)"
          rows="3"
        ></textarea>
      </div>

      <div class="form-group">
        <label for="width">Ширина *</label>
        <input
          id="width"
          v-model.number="formData.width"
          type="number"
          required
          min="1"
          max="10000"
          placeholder="1920"
          :class="{ error: errors.width }"
        />
        <span v-if="errors.width" class="error-text">{{ errors.width }}</span>
      </div>

      <div class="form-group">
        <label for="height">Высота *</label>
        <input
          id="height"
          v-model.number="formData.height"
          type="number"
          required
          min="1"
          max="10000"
          placeholder="1080"
          :class="{ error: errors.height }"
        />
        <span v-if="errors.height" class="error-text">{{ errors.height }}</span>
      </div>

      <div class="form-group">
        <label for="tags">Теги</label>
        <input id="tags" v-model="tagsString" type="text" placeholder="тег1, тег2, тег3" />
        <small>Разделяйте теги запятыми</small>
      </div>

      <div class="form-group">
        <label for="preview">Превью картинка</label>
        <input
          id="preview"
          type="file"
          accept="image/*"
          @change="handleFileChange"
          class="file-input"
        />
        <div class="api-warning">
          ⚠️ Примечание: API не поддерживает сохранение картинок. Файл не будет сохранен на сервере.
        </div>
        <div v-if="selectedFile" class="file-info">
          <span>Выбран файл: {{ selectedFile.name }}</span>
          <button type="button" @click="clearFile" class="clear-file-btn">✕</button>
        </div>
        <div v-if="filePreview" class="file-preview">
          <img :src="filePreview" alt="Превью" class="preview-img" />
        </div>
      </div>

      <div class="form-actions">
        <button type="button" @click="$emit('cancel')" class="cancel-btn">Отмена</button>
        <button type="submit" :disabled="isLoading || !isFormValid" class="submit-btn">
          {{ isLoading ? 'Сохранение...' : isEdit ? 'Сохранить' : 'Создать' }}
        </button>
      </div>

      <div v-if="error" class="error-message">
        {{ error }}
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import type { Template } from '@/types/template'

interface Props {
  template?: Template | null
  isLoading?: boolean
  error?: string | null
}

interface Emits {
  (e: 'submit', data: Partial<Template>): void
  (e: 'cancel'): void
}

const props = withDefaults(defineProps<Props>(), {
  template: null,
  isLoading: false,
  error: null,
})

const emit = defineEmits<Emits>()

const formData = ref({
  name: '',
  description: '',
  width: 1920,
  height: 1080,
  preview: '',
})

const tagsString = ref('')
const errors = ref<Record<string, string>>({})

const selectedFile = ref<File | null>(null)
const filePreview = ref<string>('')

const DRAFT_KEY = 'template_draft'

const isEdit = computed(() => !!props.template?.id)

const isFormValid = computed(() => {
  return formData.value.name.trim().length > 0
})

// Работы с черновиками
const saveDraft = () => {
  if (!isEdit.value) {
    const draft = {
      ...formData.value,
      tags: tagsString.value,
      timestamp: Date.now(),
    }
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
  }
}

const loadDraft = () => {
  if (!isEdit.value) {
    const savedDraft = localStorage.getItem(DRAFT_KEY)
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft)

        if (Date.now() - draft.timestamp < 24 * 60 * 60 * 1000) {
          formData.value = {
            name: draft.name || '',
            description: draft.description || '',
            width: draft.width || 1920,
            height: draft.height || 1080,
            preview: draft.preview || '',
          }
          tagsString.value = draft.tags || ''
        }
      } catch (error) {
        console.warn('Ошибка загрузки черновика:', error)
      }
    }
  }
}

const handleFileChange = (event: Event) => {}

const clearFile = () => {}

const clearDraft = () => {
  localStorage.removeItem(DRAFT_KEY)
}

// Заполняем форму данными шаблона при редактировании
watch(
  () => props.template,
  (template) => {
    if (template) {
      formData.value = {
        name: template.name || '',
        description: template.description || '',
        width: template.width || 1920,
        height: template.height || 1080,
        preview: template.preview || '',
      }
      tagsString.value = template.tags?.join(', ') || ''
    }
  },
  { immediate: true },
)

watch(formData, saveDraft, { deep: true })
watch(tagsString, saveDraft)

onMounted(() => {
  loadDraft()
})

const validateForm = () => {
  errors.value = {}

  // Проверка названия
  if (!formData.value.name.trim()) {
    errors.value.name = 'Название обязательно для заполнения'
  } else if (formData.value.name.trim().length < 2) {
    errors.value.name = 'Название должно содержать минимум 2 символа'
  } else if (formData.value.name.trim().length > 100) {
    errors.value.name = 'Название не должно превышать 100 символов'
  }

  // Проверка размеров
  if (!formData.value.width || formData.value.width <= 0) {
    errors.value.width = 'Ширина должна быть больше 0'
  } else if (formData.value.width > 10000) {
    errors.value.width = 'Ширина не должна превышать 10000 пикселей'
  }

  if (!formData.value.height || formData.value.height <= 0) {
    errors.value.height = 'Высота должна быть больше 0'
  } else if (formData.value.height > 10000) {
    errors.value.height = 'Высота не должна превышать 10000 пикселей'
  }

  // Проверка URL превью
  if (formData.value.preview && !isValidUrl(formData.value.preview)) {
    errors.value.preview = 'Некорректный URL изображения'
  }

  return Object.keys(errors.value).length === 0
}

const isValidUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url)
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:'
  } catch {
    return false
  }
}

const handleSubmit = () => {
  if (!validateForm()) {
    return
  }

  const tags = tagsString.value
    .split(',')
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0)

  const templateData: any = {
    name: formData.value.name,
    width: String(formData.value.width),
    height: String(formData.value.height),
    tags: tags,
    objects: null,
  }

  if (formData.value.description) {
    templateData.description = formData.value.description
  }

  emit('submit', templateData)
}

const resetForm = () => {
  formData.value = {
    name: '',
    description: '',
    width: 1920,
    height: 1080,
    preview: '',
  }
  tagsString.value = ''
  errors.value = {}
}

defineExpose({ resetForm })
</script>

<style scoped>
.template-form {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  max-width: 600px;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #333;
}

input,
textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  transition: border-color 0.2s;
}

input:focus,
textarea:focus {
  outline: none;
  border-color: #007bff;
}

input.error {
  border-color: #dc3545;
}

.error-text {
  color: #dc3545;
  font-size: 0.875rem;
  margin-top: 0.25rem;
  display: block;
}

small {
  color: #666;
  font-size: 0.875rem;
}

.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
}

.cancel-btn {
  padding: 0.75rem 1.5rem;
  background-color: #6c757d;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  flex: 1;
}

.submit-btn {
  padding: 0.75rem 1.5rem;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  flex: 1;
}

.submit-btn:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.error-message {
  color: #dc3545;
  background-color: #f8d7da;
  padding: 0.75rem;
  border-radius: 4px;
  margin-top: 1rem;
}

.api-warning {
  background-color: #fff3cd;
  color: #856404;
  padding: 0.5rem;
  border: 1px solid #ffeaa7;
  border-radius: 4px;
  font-size: 0.9rem;
  margin-top: 0.5rem;
}

.file-input {
  padding: 0.5rem;
  border: 2px dashed #ddd;
  border-radius: 4px;
  cursor: pointer;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
  padding: 0.5rem;
  background-color: #f8f9fa;
  border-radius: 4px;
}

.clear-file-btn {
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  cursor: pointer;
  font-size: 12px;
}

.file-preview {
  margin-top: 1rem;
}

.preview-img {
  max-width: 200px;
  max-height: 150px;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
</style>
