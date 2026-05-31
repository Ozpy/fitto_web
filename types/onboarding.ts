export type InputType =
  | 'single_select_cards'
  | 'single_select_pills'
  | 'multi_select_icons'
  | 'multi_select_searchable'
  | 'multi_select_with_freetext'
  | 'multi_input_freetext'
  | 'number_slider'
  | 'number_input'
  | 'date_picker'
  | 'yes_no'
  | 'yes_no_with_followup'
  | 'textarea_long'

export interface QuestionOption {
  id: string
  question_id: string
  value: string
  label: string
  description?: string
  icon?: string
  position: number
  active: boolean
  category?: string
  space_required?: string
}

export interface Question {
  id: string
  slug: string
  level: number
  section: string
  question_text: string
  question_subtitle?: string
  input_type: InputType
  is_required: boolean
  validation_min?: number
  validation_max?: number
  unit?: string
  target_table: string
  target_column: string
  position: number
  active: boolean
  options?: QuestionOption[]
}
