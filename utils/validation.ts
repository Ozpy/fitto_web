import { z } from 'zod'
import { Question } from '@/types/onboarding'

export function buildSchemaForQuestion(question: Question) {
  let schema: z.ZodTypeAny

  switch (question.input_type) {
    case 'number_slider':
    case 'number_input':
      schema = z.coerce.number({
        message: 'Necesitamos un número válido para calcular tu plan',
      })
      if (question.validation_min !== null && question.validation_min !== undefined) {
        schema = (schema as z.ZodNumber).min(
          question.validation_min,
          `El valor mínimo es ${question.validation_min}${question.unit ? ' ' + question.unit : ''}`
        )
      }
      if (question.validation_max !== null && question.validation_max !== undefined) {
        schema = (schema as z.ZodNumber).max(
          question.validation_max,
          `El valor máximo es ${question.validation_max}${question.unit ? ' ' + question.unit : ''}`
        )
      }
      break

    case 'date_picker':
      schema = z.string({
        message: 'Necesitamos tu fecha de nacimiento',
      }).regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (AAAA-MM-DD)')
      break

    case 'yes_no':
      schema = z.boolean({
        message: 'Por favor selecciona una opción',
      })
      break

    case 'yes_no_with_followup':
      schema = z.object({
        answered: z.boolean({ message: 'Por favor selecciona una opción' }).refine((val) => val === true, 'Por favor selecciona una opción'),
        hasActiveFollowup: z.boolean(),
        bodyParts: z.array(z.string()),
        description: z.string().optional().nullable().or(z.string()),
      }).refine((data) => {
        if (data.hasActiveFollowup && data.bodyParts.length === 0) {
          return false
        }
        return true
      }, {
        message: 'Por favor selecciona la parte del cuerpo afectada',
        path: ['bodyParts']
      })
      break

    case 'multi_select_icons':
    case 'multi_select_searchable':
    case 'multi_select_with_freetext':
      schema = z.array(z.string())
      if (question.is_required) {
        schema = (schema as z.ZodArray<any>).min(1, 'Selecciona al menos una opción para continuar')
      }
      break

    case 'multi_input_freetext':
      schema = z.array(z.string())
      if (question.is_required) {
        schema = (schema as z.ZodArray<any>).min(1, 'Agrega al menos una opción para continuar')
      }
      break

    case 'textarea_long':
      schema = z.string()
      if (question.is_required) {
        schema = (schema as z.ZodString).min(10, 'Cuéntanos un poco más (mínimo 10 caracteres)')
      }
      break

    default:
      schema = z.coerce.string()
      if (question.is_required) {
        schema = (schema as z.ZodString).min(1, 'Necesitamos esta respuesta para personalizar tu plan')
      }
  }

  if (!question.is_required) {
    schema = schema.optional().nullable()
  }

  return schema
}
