import React from 'react'
import { Question } from '@/types/onboarding'
import SingleSelectCards from './inputs/SingleSelectCards'
import SingleSelectPills from './inputs/SingleSelectPills'
import MultiSelectIcons from './inputs/MultiSelectIcons'
import MultiSelectSearchable from './inputs/MultiSelectSearchable'
import MultiSelectWithFreetext from './inputs/MultiSelectWithFreetext'
import MultiInputFreetext from './inputs/MultiInputFreetext'
import YesNoToggle from './inputs/YesNoToggle'
import YesNoWithFollowup from './inputs/YesNoWithFollowup'
import TextareaLong from './inputs/TextareaLong'
import NumberSlider from './inputs/NumberSlider'
import NumberInput from './inputs/NumberInput'
import DatePicker from './inputs/DatePicker'

type Props = {
  question: Question
  value: any
  onChange: (value: any) => void
}

export function QuestionRenderer({ question, value, onChange }: Props) {
  switch (question.input_type) {
    case 'single_select_cards':
      return <SingleSelectCards question={question} value={value} onChange={onChange} />
      
    case 'single_select_pills':
      return <SingleSelectPills question={question} value={value} onChange={onChange} />
      
    case 'multi_select_icons':
      return <MultiSelectIcons question={question} value={value} onChange={onChange} />
      
    case 'multi_select_searchable':
      return <MultiSelectSearchable question={question} value={value} onChange={onChange} />
      
    case 'multi_select_with_freetext':
      return <MultiSelectWithFreetext question={question} value={value} onChange={onChange} />
      
    case 'multi_input_freetext':
      return <MultiInputFreetext question={question} value={value} onChange={onChange} />
      
    case 'yes_no':
      return <YesNoToggle question={question} value={value} onChange={onChange} />
      
    case 'yes_no_with_followup':
      return <YesNoWithFollowup question={question} value={value} onChange={onChange} />
      
    case 'textarea_long':
      return <TextareaLong question={question} value={value} onChange={onChange} />
      
    case 'number_slider':
      return <NumberSlider question={question} value={value} onChange={onChange} />
      
    case 'number_input':
      return <NumberInput question={question} value={value} onChange={onChange} />
      
    case 'date_picker':
      return <DatePicker question={question} value={value} onChange={onChange} />
      
    default:
      return (
        <div className="p-4 rounded-xl border border-destructive/40 bg-destructive/10 text-destructive text-sm font-bold">
          Tipo de input no soportado: "{question.input_type}"
        </div>
      )
  }
}
