<template>
  <div class="filters-container">
    <div class="filters-header">
      <h3>Фильтры и поиск</h3>
      <button @click="clearFilters" class="clear-btn">Очистить</button>
    </div>

    <div class="filters-content">
      <!-- Поиск по названию -->
      <div class="filter-group">
        <label>Поиск по названию:</label>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Введите название шаблона..."
          class="search-input"
        />
      </div>

      <!-- Фильтр по тегам -->
      <div class="filter-group">
        <label>Фильтр по тегам:</label>
        <div class="tags-container">
          <div v-if="availableTags.length === 0" class="no-tags">Теги не найдены</div>
          <button
            v-for="tag in availableTags"
            :key="tag"
            @click="toggleTag(tag)"
            :class="['tag-filter', { active: selectedTags.includes(tag) }]"
          >
            {{ tag }}
            <span v-if="selectedTags.includes(tag)" class="tag-check">✓</span>
          </button>
        </div>
      </div>

      <!-- Показать количество результатов -->
      <div class="results-info">
        <span>Найдено: {{ filteredCount }} шаблонов</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useTemplatesStore } from '@/stores/templates'

interface Props {
  templates: any[]
}

interface Emits {
  (e: 'filter', data: { search: string; tags: string[] }): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const templatesStore = useTemplatesStore()
const searchQuery = ref('')
const selectedTags = ref<string[]>([])

// Дебаунс для поиска
let searchTimeout: ReturnType<typeof setTimeout> | null = null

// Получаем все доступные теги из шаблонов
const availableTags = computed(() => {
  const tagsSet = new Set<string>()
  props.templates.forEach((template) => {
    if (template.tags && Array.isArray(template.tags)) {
      template.tags.forEach((tag: string) => tagsSet.add(tag))
    }
  })
  return Array.from(tagsSet).sort()
})

// Подсчитываем количество отфильтрованных шаблонов
const filteredCount = computed(() => {
  return props.templates.filter((template) => {
    // Фильтр по поиску
    const matchesSearch =
      !searchQuery.value || template.name?.toLowerCase().includes(searchQuery.value.toLowerCase())

    // Фильтр по тегам
    const matchesTags =
      selectedTags.value.length === 0 ||
      (template.tags && selectedTags.value.some((tag: string) => template.tags.includes(tag)))

    return matchesSearch && matchesTags
  }).length
})

const toggleTag = (tag: string) => {
  const index = selectedTags.value.indexOf(tag)
  if (index === -1) {
    selectedTags.value.push(tag)
  } else {
    selectedTags.value.splice(index, 1)
  }
  emitFilter()
}

const clearFilters = () => {
  searchQuery.value = ''
  selectedTags.value = []
  emitFilter()
}

const emitFilter = () => {
  emit('filter', {
    search: searchQuery.value,
    tags: selectedTags.value,
  })
}

// Дебаунс для поиска
watch(searchQuery, () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }

  searchTimeout = setTimeout(() => {
    emitFilter()
  }, 300)
})

watch(
  selectedTags,
  () => {
    emitFilter()
  },
  { deep: true },
)
</script>

<style scoped>
.filters-container {
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.filters-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.filters-header h3 {
  margin: 0;
  color: #333;
}

.clear-btn {
  background-color: #6c757d;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
}

.filter-group {
  margin-bottom: 1.5rem;
}

.filter-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #333;
}

.search-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.search-input:focus {
  outline: none;
  border-color: #007bff;
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.no-tags {
  color: #666;
  font-style: italic;
}

.tag-filter {
  background-color: #e9ecef;
  color: #495057;
  border: 1px solid #ced4da;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.tag-filter:hover {
  background-color: #dee2e6;
}

.tag-filter.active {
  background-color: #007bff;
  color: white;
  border-color: #007bff;
}

.tag-check {
  font-size: 0.8rem;
}

.results-info {
  padding-top: 1rem;
  border-top: 1px solid #eee;
  color: #666;
  font-size: 0.9rem;
}
</style>
