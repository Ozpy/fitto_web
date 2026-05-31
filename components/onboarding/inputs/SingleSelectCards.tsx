import React from 'react'
import { motion } from 'framer-motion'
import * as Icons from 'lucide-react'
import { Question, QuestionOption } from '@/types/onboarding'

type Props = {
  question: Question
  value: string | null
  onChange: (value: string) => void
}

export function IconResolver({ name, className }: { name: string; className?: string }) {
  // Convert kebab-case or snake_case to PascalCase for Lucide icons
  const pascalName = name
    .split(/[-_]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')

  const IconComponent = (Icons as any)[pascalName] || (Icons as any)[name] || Icons.HelpCircle
  return <IconComponent className={className} />
}

export default function SingleSelectCards({ question, value, onChange }: Props) {
  const options = question.options || []

  return (
    <div className="flex flex-col gap-3 w-full">
      {options.map((option) => {
        const isSelected = String(value) === String(option.value)

        return (
          <motion.div
            key={option.id}
            whileHover={{ scale: 1.015, y: -2 }}
            whileTap={{ scale: 0.985 }}
            onClick={() => onChange(option.value)}
            className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-4 ${
              isSelected
                ? 'border-primary bg-primary/10 shadow-lg shadow-primary/5'
                : 'border-border/60 bg-card hover:border-primary/40 hover:shadow-md'
            }`}
          >
            {option.icon && (
              <div
                className={`p-3 rounded-xl transition-colors ${
                  isSelected ? 'bg-primary/20 text-primary-foreground font-semibold' : 'bg-muted text-muted-foreground'
                }`}
              >
                <IconResolver name={option.icon} className="h-6 h-6" />
              </div>
            )}
            <div className="flex-1">
              <h4 className="font-bold text-base text-foreground leading-snug">{option.label}</h4>
              {option.description && (
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{option.description}</p>
              )}
            </div>
            {isSelected && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="bg-primary text-primary-foreground rounded-full p-1 self-center"
              >
                <Icons.Check className="h-4 w-4 stroke-[3]" />
              </motion.div>
            )}
          </motion.div>
        )
      })}
    </div>
  )
}
