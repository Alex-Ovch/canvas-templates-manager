export interface Template {
  id: string
  name: string
  description?: string
  width: number
  height: number
  tags?: string[]
  objects?: any
  preview?: string
  preview_image?: string
}

export interface TemplateFilters {
  page?: number
  filter?: {
    company_id?: string
    collection_id?: string
  }
}

export interface TemplatesResponse {
  data: Template[]
  total?: number
  current_page?: number
  last_page?: number
}
