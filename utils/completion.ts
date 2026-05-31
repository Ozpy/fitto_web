import { Question } from '@/types/onboarding'

/**
 * Calculates the completion percentage for a given section.
 * Filtered dynamically by active = true.
 * @param questions List of active questions for the section
 * @param userData Database data for the user grouped by table name
 */
export function calculateSectionCompletion(
  questions: Question[],
  userData: {
    user_profiles?: Record<string, any> | null
    user_health?: Record<string, any> | null
    user_psychology?: Record<string, any> | null
    nutrition_profile?: Record<string, any> | null
    user_conditions?: any[]
    user_injuries?: any[]
    user_medications?: any[]
    user_allergies?: any[]
  }
): number {
  const activeQuestions = questions.filter((q) => q.active)
  if (activeQuestions.length === 0) return 0

  let filledCount = 0

  activeQuestions.forEach((q) => {
    const table = q.target_table
    const col = q.target_column

    if (table === 'user_profiles' && userData.user_profiles) {
      const val = userData.user_profiles[col]
      if (val !== undefined && val !== null && val !== '') {
        if (col === 'has_active_injury' && val === true) {
          const injuries = userData.user_injuries || []
          const activeInjuries = injuries.filter((i: any) => i.is_active !== false)
          if (activeInjuries.length > 0) {
            filledCount++
          }
        } else if (Array.isArray(val)) {
          if (val.length > 0) filledCount++
        } else {
          filledCount++
        }
      }
    } else if (table === 'user_health' && userData.user_health) {
      const val = userData.user_health[col]
      if (val !== undefined && val !== null && val !== '') filledCount++
    } else if (table === 'user_psychology' && userData.user_psychology) {
      const val = userData.user_psychology[col]
      if (val !== undefined && val !== null && val !== '') filledCount++
    } else if (table === 'nutrition_profile' && userData.nutrition_profile) {
      const val = userData.nutrition_profile[col]
      if (val !== undefined && val !== null && val !== '') filledCount++
    } else {
      // Relational tables N:M (user_conditions, user_injuries, etc.)
      // We count it as answered if there are active (is_active !== false) records in that table,
      // OR if we have explicitly answered it in profile (e.g. user_profiles.has_active_injury = false).
      const relArray = (userData as any)[table]
      if (Array.isArray(relArray)) {
        const activeRecords = relArray.filter((r) => r.is_active !== false)
        // If there are active records, it's filled.
        if (activeRecords.length > 0) {
          filledCount++
        } else {
          // Check if user answered "No" in the main profile (e.g., primary toggle)
          // For instance, q_has_active_injury maps to target_table user_injuries, but has an associated
          // yes/no toggle like `user_profiles.has_active_injury`
          let profileField = col || `has_${table.replace('user_', '')}`
          if (table === 'user_injuries') {
            profileField = 'has_active_injury'
          }
          if (userData.user_profiles && userData.user_profiles[profileField] === false) {
            filledCount++
          }
        }
      }
    }
  })

  return Math.round((filledCount / activeQuestions.length) * 100)
}

/**
 * Calculates the profile completion level (0-4) based on filled sections.
 * - 0 = Quick Start completed (Level 0 completed)
 * - 1 = Base Profile completed (Level 1 completed)
 * - 2 = Health and body completed (Level 2 completed)
 * - 3 = Mental and lifestyle completed (Level 3 completed)
 */
export function calculateCompletionLevel(levelsCompleted: Record<number, boolean>): number {
  if (levelsCompleted[3]) return 3
  if (levelsCompleted[2]) return 2
  if (levelsCompleted[1]) return 1
  if (levelsCompleted[0]) return 0
  return 0
}

/**
 * Resolves the saved value from profileData based on question target_table and target_column.
 */
export function getSavedValue(profileData: any, q: any): any {
  const table = q.target_table
  const col = q.target_column

  if (!profileData) return null

  // For yes_no_with_followup questions (injuries)
  if (q.input_type === 'yes_no_with_followup') {
    const isInjury = table === 'user_injuries' || col === 'has_active_injury'
    if (isInjury) {
      const profile = profileData.user_profiles || {}
      const injuries = profileData.user_injuries || []
      const activeInjuries = injuries.filter((i: any) => i.is_active !== false)
      const activeSlugs = activeInjuries.map((i: any) => i.body_part_slug)
      const desc = activeInjuries.length > 0 ? activeInjuries[0].notes : ''

      const hasAnswered = profile.has_active_injury === false || 
        (profile.has_active_injury === true && activeInjuries.length > 0)

      return {
        answered: hasAnswered,
        hasActiveFollowup: profile.has_active_injury ?? false,
        bodyParts: activeSlugs,
        description: desc,
      }
    }
  }

  // Relational tables N:M
  if (table === 'user_conditions') {
    const conds = profileData.user_conditions || []
    return conds.filter((c: any) => c.is_active !== false).map((c: any) => c.condition_slug)
  }

  if (table === 'user_allergies') {
    const alls = profileData.user_allergies || []
    return alls.filter((a: any) => a.is_active !== false).map((a: any) => a.allergen)
  }

  if (table === 'user_medications') {
    const meds = profileData.user_medications || []
    return meds.filter((m: any) => m.is_active !== false).map((m: any) => m.name)
  }

  // Standard columns
  const tableData = profileData[table] || {}
  return tableData[col] !== undefined ? tableData[col] : null
}

