import React from 'react'
import { Question } from '@/types/onboarding'

type Props = {
  question: Question
  value: string | null
  onChange: (value: string) => void
}

export default function TextareaLong({ question, value = '', onChange }: Props) {
  const currentVal = value || ''

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value)
  }

  return (
    <div className="flex flex-col gap-2 w-full">
      <textarea
        value={currentVal}
        onChange={handleChange}
        placeholder={
          question.slug === 'q_primary_motivator'
            ? 'Cuéntanos qué te impulsa a dar el paso ahora, qué cambios buscas en tu día a día...'
            : 'Escribe tu respuesta aquí...'
        }
        className="w-full min-h-[140px] bg-card border border-border/80 rounded-2xl p-4 text-sm focus:outline-none focus:border-primary font-medium leading-relaxed shadow-inner"
      />
      <div className="flex justify-end text-xs font-semibold text-muted-foreground">
        <span>{currentVal.length} caracteres</span>
      </div>
    </div>
  )
}
