import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

export async function fetchUserProfile(userId: string) {
  // Fetch profiles, user_profiles, user_health, nutrition_profile, user_psychology
  const [
    { data: profiles },
    { data: userProfiles },
    { data: userHealth },
    { data: nutritionProfile },
    { data: userPsychology },
    { data: userInjuries },
    { data: userConditions },
    { data: userAllergies },
    { data: userMedications },
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
    supabase.from('user_profiles').select('*').eq('user_id', userId).maybeSingle(),
    supabase.from('user_health').select('*').eq('user_id', userId).maybeSingle(),
    supabase.from('nutrition_profile').select('*').eq('user_id', userId).maybeSingle(),
    supabase.from('user_psychology').select('*').eq('user_id', userId).maybeSingle(),
    supabase.from('user_injuries').select('*').eq('user_id', userId),
    supabase.from('user_conditions').select('*').eq('user_id', userId),
    supabase.from('user_allergies').select('*').eq('user_id', userId),
    supabase.from('user_medications').select('*').eq('user_id', userId),
  ])

  return {
    profiles,
    user_profiles: userProfiles,
    user_health: userHealth,
    nutrition_profile: nutritionProfile,
    user_psychology: userPsychology,
    user_injuries: userInjuries || [],
    user_conditions: userConditions || [],
    user_allergies: userAllergies || [],
    user_medications: userMedications || [],
  }
}
