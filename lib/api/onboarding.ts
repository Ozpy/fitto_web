import { createClient } from '@/lib/supabase/client'
import { Question } from '@/types/onboarding'

const supabase = createClient()

const NUMERIC_COLUMNS = new Set([
  'available_days_per_week',
  'session_duration_minutes',
  'height_cm',
  'current_weight_kg',
  'target_weight_kg',
  'body_fat_percentage',
  'waist_cm',
  'hip_cm',
  'chest_cm',
  'avg_sleep_hours',
  'stress_baseline',
  'daily_steps_estimate',
  'water_intake_liters',
  'caffeine_servings_per_day',
  'alcohol_drinks_per_week',
  'blood_pressure_diastolic',
  'blood_pressure_systolic',
  'pregnancy_week',
  'resting_heart_rate',
  'past_attempts_count',
  'priority_aesthetics',
  'priority_health',
  'priority_performance',
  'priority_longevity',
  'priority_energy'
])

function coerceValueForColumn(column: string, val: any): any {
  if (typeof val === 'string' && NUMERIC_COLUMNS.has(column)) {
    const num = Number(val)
    if (!isNaN(num)) return num
  }
  return val
}

export function getFallbackOptionsForSlug(slug: string): any[] {
  const s = slug.toLowerCase()
  if (s.includes('goal')) {
    return [
      { id: '1', value: 'muscle_gain', label: 'Ganar Masa Muscular', subtitle: 'Aumentar volumen y fuerza', icon: 'Dumbbell', position: 1 },
      { id: '2', value: 'fat_loss', label: 'Perder Grasa', subtitle: 'Definición y tono muscular', icon: 'Flame', position: 2 },
      { id: '3', value: 'strength', label: 'Fuerza Absoluta', subtitle: 'Levantar cargas pesadas', icon: 'Target', position: 3 },
      { id: '4', value: 'health', label: 'Salud y Longevidad', subtitle: 'Vitalidad y bienestar', icon: 'Heart', position: 4 }
    ]
  }
  if (s.includes('sex')) {
    return [
      { id: '10', value: 'male', label: 'Hombre', position: 1 },
      { id: '11', value: 'female', label: 'Mujer', position: 2 },
      { id: '12', value: 'other', label: 'Otro / Prefiero no decir', position: 3 }
    ]
  }
  if (s.includes('environment')) {
    return [
      { id: '20', value: 'gym', label: 'Gimnasio Comercial', subtitle: 'Acceso a poleas, racks y barras', icon: 'Dumbbell', position: 1 },
      { id: '21', value: 'home', label: 'En Casa / Parque', subtitle: 'Mancuernas, ligas o peso libre', icon: 'Home', position: 2 }
    ]
  }
  if (s.includes('equipment')) {
    return [
      { id: '30', value: 'dumbbells', label: 'Mancuernas', icon: 'Dumbbell', position: 1 },
      { id: '31', value: 'barbell', label: 'Barra Olímpica', icon: 'Dumbbell', position: 2 },
      { id: '32', value: 'cables', label: 'Poleas / Cables', icon: 'Sliders', position: 3 },
      { id: '33', value: 'bands', label: 'Bandas Elásticas', icon: 'Activity', position: 4 },
      { id: '34', value: 'kettlebells', label: 'Pesas Rusas', icon: 'Dumbbell', position: 5 },
      { id: '35', value: 'bodyweight', label: 'Peso Corporal', icon: 'User', position: 6 },
      { id: '36', value: 'pullup_bar', label: 'Barra de Dominadas', icon: 'TrendingUp', position: 7 },
      { id: '37', value: 'bench', label: 'Banco Inclinable', icon: 'Sliders', position: 8 },
      { id: '38', value: 'machines', label: 'Máquinas de Gym', icon: 'Settings', position: 9 }
    ]
  }
  if (s.includes('experience')) {
    return [
      { id: '40', value: 'beginner', label: 'Principiante', subtitle: 'Menos de 6 meses', icon: 'Zap', position: 1 },
      { id: '41', value: 'intermediate', label: 'Intermedio', subtitle: 'De 6 meses a 2 años', icon: 'Target', position: 2 },
      { id: '42', value: 'advanced', label: 'Avanzado', subtitle: 'Más de 2 años entrenando', icon: 'Trophy', position: 3 }
    ]
  }
  if (s.includes('conditions') || s.includes('injuries') || s.includes('allergies') || s.includes('medications')) {
    return [
      { id: '50', value: 'hypertension', label: 'Hipertensión', position: 1 },
      { id: '51', value: 'diabetes', label: 'Diabetes', position: 2 },
      { id: '52', value: 'asthma', label: 'Asma', position: 3 },
      { id: '53', value: 'none', label: 'Ninguna / Sin problemas', position: 4 }
    ]
  }
  return []
}

export function getFallbackQuestionsForLevel(level: number): Question[] {
  if (level === 0) {
    return [
      {
        id: 'q1', slug: 'q_primary_goal', question_text: '¿Cuál es tu objetivo principal?', question_subtitle: 'FITTO adaptará la rutina y la nutrición en base a esto.', input_type: 'single_select_cards', is_required: true, position: 1, level: 0, active: true, section: 'quick-start', target_table: 'user_profiles', target_column: 'primary_goal', options: getFallbackOptionsForSlug('goal')
      },
      {
        id: 'q2', slug: 'q_sex', question_text: '¿Cuál es tu sexo biológico?', question_subtitle: 'Esto ayuda a afinar las estimaciones de gasto calórico basal.', input_type: 'single_select_pills', is_required: true, position: 2, level: 0, active: true, section: 'quick-start', target_table: 'user_profiles', target_column: 'sex', options: getFallbackOptionsForSlug('sex')
      },
      {
        id: 'q3', slug: 'q_birth_date', question_text: '¿Cuándo naciste?', question_subtitle: 'Tu metabolismo y recuperación cambian con la edad.', input_type: 'date_picker', is_required: true, position: 3, level: 0, active: true, section: 'quick-start', target_table: 'user_profiles', target_column: 'birth_date', options: []
      },
      {
        id: 'q4', slug: 'q_training_environment', question_text: '¿Dónde planeas entrenar?', question_subtitle: 'FITTO estructurará tus ejercicios según el lugar y equipo.', input_type: 'single_select_cards', is_required: true, position: 4, level: 0, active: true, section: 'quick-start', target_table: 'user_profiles', target_column: 'training_environment', options: getFallbackOptionsForSlug('environment')
      },
      {
        id: 'q5', slug: 'q_equipment', question_text: '¿De qué equipamiento dispones?', question_subtitle: 'Deselecciona lo que no tengas disponible.', input_type: 'multi_select_icons', is_required: true, position: 5, level: 0, active: true, section: 'quick-start', target_table: 'user_profiles', target_column: 'available_equipment', options: getFallbackOptionsForSlug('equipment')
      },
      {
        id: 'q6', slug: 'q_available_days', question_text: '¿Cuántos días por semana quieres entrenar?', question_subtitle: 'FITTO distribuirá los bloques de fuerza de manera óptima.', input_type: 'number_slider', is_required: true, position: 6, level: 0, active: true, section: 'quick-start', target_table: 'user_profiles', target_column: 'available_days_per_week', validation_min: 1, validation_max: 7, options: []
      },
      {
        id: 'q7', slug: 'q_session_duration', question_text: '¿De cuántos minutos dispones por sesión?', question_subtitle: 'Ajustamos la densidad y volumen de entrenamiento.', input_type: 'number_slider', is_required: true, position: 7, level: 0, active: true, section: 'quick-start', target_table: 'user_profiles', target_column: 'session_duration_minutes', validation_min: 15, validation_max: 120, options: []
      }
    ]
  }
  
  if (level === 1) {
    return [
      {
        id: 'q101', slug: 'q_height', question_text: '¿Cuánto mides (estatura)?', question_subtitle: 'Registrado en centímetros.', input_type: 'number_input', is_required: true, position: 1, level: 1, active: true, section: 'body', target_table: 'user_profiles', target_column: 'height_cm', validation_min: 100, validation_max: 250, options: []
      },
      {
        id: 'q102', slug: 'q_weight', question_text: '¿Cuál es tu peso actual?', question_subtitle: 'Registrado en kilogramos.', input_type: 'number_input', is_required: true, position: 2, level: 1, active: true, section: 'body', target_table: 'user_profiles', target_column: 'current_weight_kg', validation_min: 30, validation_max: 200, options: []
      },
      {
        id: 'q103', slug: 'q_experience', question_text: '¿Cuál es tu experiencia entrenando?', question_subtitle: 'Adaptaremos las técnicas avanzadas según tu nivel.', input_type: 'single_select_cards', is_required: true, position: 3, level: 1, active: true, section: 'body', target_table: 'user_profiles', target_column: 'experience_level', options: getFallbackOptionsForSlug('experience')
      }
    ]
  }

  // Fallbacks for level 2 and 3
  return []
}

function getIconForEquipment(slug: string): string {
  const s = slug.toLowerCase()
  if (s === 'bodyweight') return 'User'
  if (s === 'bands') return 'Activity'
  if (s.includes('dumbbell')) return 'Dumbbell'
  if (s.includes('kettlebell')) return 'Dumbbell'
  if (s.includes('barbell')) return 'Dumbbell'
  if (s === 'pullup_bar') return 'TrendingUp'
  if (s === 'rings') return 'Activity'
  if (s === 'bench') return 'Sliders'
  if (s === 'cable') return 'Sliders'
  if (s === 'machine' || s === 'machines') return 'Settings'
  if (s === 'medicine_ball') return 'Circle'
  if (s.includes('cardio') || s === 'treadmill' || s === 'elliptical' || s === 'rowing_machine') return 'Flame'
  if (s === 'mobility_tools') return 'Sparkles'
  if (s === 'trx') return 'Activity'
  if (s === 'jump_rope') return 'Activity'
  if (s.includes('bike')) return 'Bike'
  return 'Dumbbell'
}

export async function fetchOnboardingQuestions(level: number): Promise<Question[]> {
  try {
    const { data, error } = await supabase
      .from('onboarding_questions')
      .select(`
        *,
        options:onboarding_question_options(*)
      `)
      .eq('level', level)
      .eq('active', true)
      .order('position', { ascending: true })

    if (error) throw error

    // Fetch dynamic database catalog options for catalog-backed questions
    let dbEquipmentOptions: any[] = []
    let dbConditionOptions: any[] = []

    const hasEquipmentQuestion = (data || []).some((q: any) => q.slug === 'q_equipment')
    const hasConditionQuestion = (data || []).some((q: any) => q.slug === 'q_has_chronic_condition')

    if (hasEquipmentQuestion) {
      try {
        const { data: eqData, error: eqError } = await supabase
          .from('catalog_equipment')
          .select('*')
          .eq('active', true)
          .order('position', { ascending: true })

        if (!eqError && eqData && eqData.length > 0) {
          dbEquipmentOptions = eqData.map((item: any) => ({
            id: item.slug,
            question_id: 'q_equipment',
            value: item.slug,
            label: item.name,
            description: item.space_required ? `Espacio: ${item.space_required}` : undefined,
            icon: item.icon || getIconForEquipment(item.slug),
            position: item.position,
            active: item.active,
            category: item.category,
            space_required: item.space_required
          }))
        }
      } catch (err) {
        console.warn('Failed to fetch dynamic catalog_equipment:', err)
      }
    }

    if (hasConditionQuestion) {
      try {
        const { data: condData, error: condError } = await supabase
          .from('catalog_conditions')
          .select('*')
          .eq('active', true)
          .order('position', { ascending: true })

        if (!condError && condData && condData.length > 0) {
          dbConditionOptions = condData.map((item: any) => ({
            id: item.slug,
            question_id: 'q_has_chronic_condition',
            value: item.slug,
            label: item.name,
            description: item.description,
            icon: 'Activity',
            position: item.position,
            active: item.active
          }))
        }
      } catch (err) {
        console.warn('Failed to fetch dynamic catalog_conditions:', err)
      }
    }

    // Sort options by position, and dynamically inject catalog options where needed
    const formattedQuestions = (data || []).map((q: any) => {
      let options = (q.options || []).sort((a: any, b: any) => a.position - b.position)

      if (q.slug === 'q_equipment' && dbEquipmentOptions.length > 0) {
        options = dbEquipmentOptions
      } else if (q.slug === 'q_has_chronic_condition' && dbConditionOptions.length > 0) {
        options = dbConditionOptions
      }

      return {
        ...q,
        options,
      }
    })

    return formattedQuestions as Question[]
  } catch (e) {
    console.error('Supabase fetch failed for onboarding questions:', e)
    throw e
  }
}

export interface SaveAnswerInput {
  question: Question
  value: any
  userId: string
}

export async function saveAnswer({ question, value, userId }: SaveAnswerInput) {
  const table = question.target_table
  const column = question.target_column

  // --- SPECIAL CASE: YesNoWithFollowup (e.g., q_has_active_injury) ---
  if (question.input_type === 'yes_no_with_followup') {
    const isInjury = table === 'user_injuries' || column === 'has_active_injury'
    
    if (isInjury) {
      const payload = value as {
        hasActiveFollowup: boolean
        bodyParts: string[]
        description: string
      }

      // 1. Update the main flag in user_profiles
      const { error: profileError } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: userId,
          has_active_injury: payload.hasActiveFollowup,
        }, { onConflict: 'user_id' })

      if (profileError) throw profileError

      // 2. Perform relational soft-delete or active upsert in user_injuries
      if (payload.hasActiveFollowup) {
        // Mark all existing injuries not in the selection as is_active = false
        const { data: existing } = await supabase
          .from('user_injuries')
          .select('id, body_part_slug')
          .eq('user_id', userId)

        const existingMap = new Map((existing || []).map((i) => [i.body_part_slug, i.id]))

        const upserts = []
        
        // Mark all previous active records as inactive if not in selection
        if (existing) {
          for (const ext of existing) {
            if (!payload.bodyParts.includes(ext.body_part_slug)) {
              upserts.push({
                id: ext.id,
                user_id: userId,
                body_part_slug: ext.body_part_slug,
                is_active: false,
                resolved_at: new Date().toISOString().split('T')[0],
              })
            }
          }
        }

        // Add or reactivate selected body parts
        for (const bp of payload.bodyParts) {
          const existingId = existingMap.get(bp)
          upserts.push({
            ...(existingId ? { id: existingId } : {}),
            user_id: userId,
            body_part_slug: bp,
            notes: payload.description,
            is_active: true,
            resolved_at: null,
          })
        }

        if (upserts.length > 0) {
          const { error: injuriesError } = await supabase
            .from('user_injuries')
            .upsert(upserts)
          if (injuriesError) throw injuriesError
        }
      } else {
        // Soft delete only active injuries and set resolved_at
        const { error: injuriesError } = await supabase
          .from('user_injuries')
          .update({
            is_active: false,
            resolved_at: new Date().toISOString().split('T')[0],
          })
          .eq('user_id', userId)
          .eq('is_active', true)

        if (injuriesError) throw injuriesError
      }
    }
    return
  }

  // --- SPECIAL CASE: Relational N:M Tables (user_conditions, user_allergies, user_medications) ---
  if (table === 'user_conditions') {
    const selectedSlugs = value as string[]
    
    // Fetch existing user conditions
    const { data: existing } = await supabase
      .from('user_conditions')
      .select('id, condition_slug')
      .eq('user_id', userId)

    const existingMap = new Map((existing || []).map((c) => [c.condition_slug, c.id]))
    const upserts = []

    // Soft delete deselected ones
    if (existing) {
      for (const ext of existing) {
        if (!selectedSlugs.includes(ext.condition_slug)) {
          upserts.push({
            id: ext.id,
            user_id: userId,
            condition_slug: ext.condition_slug,
            is_active: false,
          })
        }
      }
    }

    // Activate selected ones
    for (const slug of selectedSlugs) {
      const existingId = existingMap.get(slug)
      upserts.push({
        ...(existingId ? { id: existingId } : {}),
        user_id: userId,
        condition_slug: slug,
        is_active: true,
      })
    }

    if (upserts.length > 0) {
      const { error: condError } = await supabase
        .from('user_conditions')
        .upsert(upserts)
      if (condError) throw condError
    }
    return
  }

  if (table === 'user_allergies') {
    const selectedAllergies = value as string[]
    
    const { data: existing } = await supabase
      .from('user_allergies')
      .select('id, allergen')
      .eq('user_id', userId)

    const existingMap = new Map((existing || []).map((a) => [a.allergen, a.id]))
    const upserts = []

    // Soft delete deselected ones
    if (existing) {
      for (const ext of existing) {
        if (!selectedAllergies.includes(ext.allergen)) {
          upserts.push({
            id: ext.id,
            user_id: userId,
            allergen: ext.allergen,
            is_active: false,
          })
        }
      }
    }

    // Activate selected ones
    for (const name of selectedAllergies) {
      const existingId = existingMap.get(name)
      upserts.push({
        ...(existingId ? { id: existingId } : {}),
        user_id: userId,
        allergen: name,
        is_active: true,
      })
    }

    if (upserts.length > 0) {
      const { error: allergyError } = await supabase
        .from('user_allergies')
        .upsert(upserts)
      if (allergyError) throw allergyError
    }
    return
  }

  if (table === 'user_medications') {
    const selectedMedications = value as string[]
    
    const { data: existing } = await supabase
      .from('user_medications')
      .select('id, name')
      .eq('user_id', userId)

    const existingMap = new Map((existing || []).map((m) => [m.name, m.id]))
    const upserts = []

    // Soft delete deselected ones
    if (existing) {
      for (const ext of existing) {
        if (!selectedMedications.includes(ext.name)) {
          upserts.push({
            id: ext.id,
            user_id: userId,
            name: ext.name,
            is_active: false,
          })
        }
      }
    }

    // Activate selected ones
    for (const name of selectedMedications) {
      const existingId = existingMap.get(name)
      upserts.push({
        ...(existingId ? { id: existingId } : {}),
        user_id: userId,
        name: name,
        is_active: true,
      })
    }

    if (upserts.length > 0) {
      const { error: medError } = await supabase
        .from('user_medications')
        .upsert(upserts)
      if (medError) throw medError
    }
    return
  }

  // --- STANDARD COLUMN UPSERTS ---
  const coercedValue = coerceValueForColumn(column, value)
  const { error } = await supabase
    .from(table)
    .upsert({
      user_id: userId,
      [column]: coercedValue,
    }, { onConflict: 'user_id' })

  if (error) throw error
}
