"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Activity, 
  Flame, 
  Target, 
  Trophy, 
  Play, 
  Plus, 
  Bot, 
  Sparkles, 
  ChevronRight, 
  ChevronLeft, 
  Dumbbell, 
  Scale, 
  Calendar, 
  Clock, 
  Compass, 
  Apple, 
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Lock
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useAppStore } from "@/store/useAppStore";
import { translations } from "@/lib/i18n/translations";
import { supabase } from "@/lib/supabase";

// Types for DB entries
interface UserProfile {
  birth_date: string;
  sex: string;
  height_cm: number;
  weight_kg: number;
  body_fat_percentage?: number;
  activity_level: string;
  primary_goal: string;
  experience_level: string;
  training_environment: string;
  available_equipment: string[];
  available_days_per_week: number;
  session_duration_minutes: number;
  dietary_preferences: string[];
  injuries: string[];
  limitations: string[];
}

export default function DashboardPage() {
  const { language } = useAppStore();
  const t = translations[language].dashboard;
  
  // App state
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [workoutProgram, setWorkoutProgram] = useState<any | null>(null);
  const [workoutDays, setWorkoutDays] = useState<any[]>([]);
  const [workoutItems, setWorkoutItems] = useState<any[]>([]);
  
  // Onboarding Wizard state
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);

  // Form states for onboarding
  const [formData, setFormData] = useState<UserProfile>({
    birth_date: "1995-06-15",
    sex: "male",
    height_cm: 175,
    weight_kg: 72,
    body_fat_percentage: 18,
    activity_level: "moderately_active",
    primary_goal: "muscle_gain",
    experience_level: "intermediate",
    training_environment: "gym",
    available_equipment: ["dumbbells", "barbell", "cables"],
    available_days_per_week: 4,
    session_duration_minutes: 45,
    dietary_preferences: ["high_protein"],
    injuries: [],
    limitations: [],
  });

  // Simulated fallback data when Supabase credentials are placeholder or query fails
  const [isSimulatedMode, setIsSimulatedMode] = useState(false);
  const [mounted, setMounted] = useState(false);
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    setMounted(true);
    fetchUserData();
  }, []);

  useEffect(() => {
    if (!mounted) return;

    if (containerRef.current) {
      setContainerWidth(containerRef.current.getBoundingClientRect().width || 400);
    }

    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const width = entry.contentRect.width;
        if (width > 0) {
          setContainerWidth(width);
        }
      }
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [mounted, loading]);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      // 1. Get authenticated user
      const { data: { user: authUser }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !authUser) {
        // Active simulation mode if not authenticated (useful for landing page/guest access)
        setIsSimulatedMode(true);
        simulateData();
        return;
      }

      setUser(authUser);

      // 2. Fetch generic profile
      const { data: prof, error: profError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authUser.id)
        .single();
      
      if (prof) setProfile(prof);

      // 3. Fetch user dynamic profile
      const { data: userProf, error: userProfError } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", authUser.id)
        .single();

      if (userProfError || !userProf) {
        // No profile exists yet! Let's trigger onboarding
        setShowOnboarding(true);
        setUserProfile(null);
      } else {
        setUserProfile(userProf as UserProfile);
        setShowOnboarding(false);
        
        // 4. Fetch workouts
        const { data: programs } = await supabase
          .from("workout_programs")
          .select("*")
          .eq("user_id", authUser.id)
          .eq("status", "active")
          .limit(1);

        if (programs && programs.length > 0) {
          const activeProg = programs[0];
          setWorkoutProgram(activeProg);

          // Get version
          const { data: versions } = await supabase
            .from("workout_program_versions")
            .select("*")
            .eq("workout_program_id", activeProg.id)
            .order("version_number", { ascending: false })
            .limit(1);

          if (versions && versions.length > 0) {
            const latestVer = versions[0];
            
            // Get workout days
            const { data: days } = await supabase
              .from("workout_days")
              .select("*")
              .eq("workout_program_version_id", latestVer.id)
              .order("day_index", { ascending: true });

            if (days) {
              setWorkoutDays(days);
              
              // Get first day's items as a sample
              if (days.length > 0) {
                const { data: items } = await supabase
                  .from("workout_items")
                  .select("*, exercises(*)")
                  .eq("workout_day_id", days[0].id)
                  .order("position", { ascending: true });
                if (items) setWorkoutItems(items);
              }
            }
          }
        } else {
          // Fallback: RLS active on workout tables, generate dynamically on the client!
          const goalTitles: Record<string, string> = {
            muscle_gain: "Hipertrofia Estructurada FITTO",
            fat_loss: "Déficit Inteligente & Acondicionamiento",
            strength: "Fuerza Absoluta & Potencia",
            endurance: "Resistencia Cardiovascular & Atletismo",
            health: "Bienestar Vital & Longevidad",
          };
          
          setWorkoutProgram({
            title: goalTitles[userProf.primary_goal] || "Plan Personalizado FITTO",
            goal: userProf.primary_goal,
          });

          setWorkoutDays([
            { id: "1", title: "Día 1: Fuerza & Acondicionamiento" },
            { id: "2", title: "Día 2: Flexibilidad & Core" },
          ]);

          // Compute exercises dynamically based on their goal, environment and equipment!
          const isGym = userProf.training_environment === "gym";
          const hasDumbbells = userProf.available_equipment?.includes("dumbbells");
          const hasBarbell = userProf.available_equipment?.includes("barbell");
          const hasCables = userProf.available_equipment?.includes("cables");
          
          let dynamicItems = [];
          if (userProf.primary_goal === "muscle_gain" || userProf.primary_goal === "strength") {
            dynamicItems = [
              { title: isGym && hasBarbell ? "Press de Banca con Barra" : hasDumbbells ? "Press de Banca con Mancuernas" : "Flexiones de Pecho (Pushups)", position: 1, config: { sets: 4, reps: "8-10", rest_seconds: 90 }, exercises: { name: "Press de Banca", primary_muscles: ["Pecho", "Tríceps"] } },
              { title: isGym && hasBarbell ? "Sentadilla Libre Trasera" : hasDumbbells ? "Sentadilla Goblet con Mancuerna" : "Sentadillas Peso Corporal", position: 2, config: { sets: 4, reps: "10-12", rest_seconds: 90 }, exercises: { name: "Sentadillas", primary_muscles: ["Cuádriceps", "Glúteos"] } },
              { title: hasDumbbells ? "Remo con Mancuernas a una Mano" : isGym && hasCables ? "Jalón al Pecho en Polea" : "Remo Invertido", position: 3, config: { sets: 3, reps: "10-12", rest_seconds: 75 }, exercises: { name: "Remo", primary_muscles: ["Espalda", "Bíceps"] } },
              { title: hasDumbbells ? "Press Militar Sentado con Mancuernas" : "Flexiones de Pica (Pike Pushups)", position: 4, config: { sets: 3, reps: "12", rest_seconds: 75 }, exercises: { name: "Press Militar", primary_muscles: ["Hombros", "Tríceps"] } }
            ];
          } else {
            dynamicItems = [
              { title: hasDumbbells ? "Zancadas con Mancuernas" : "Zancadas Peso Corporal", position: 1, config: { sets: 3, reps: "12 por pierna", rest_seconds: 60 }, exercises: { name: "Zancadas", primary_muscles: ["Piernas", "Glúteos"] } },
              { title: "Flexiones de Pecho Activas", position: 2, config: { sets: 3, reps: "15", rest_seconds: 60 }, exercises: { name: "Flexiones", primary_muscles: ["Pecho", "Hombros"] } },
              { title: hasDumbbells ? "Remo con Mancuerna Doble" : "Superman isométrico", position: 3, config: { sets: 3, reps: "12", rest_seconds: 60 }, exercises: { name: "Espalda", primary_muscles: ["Espalda", "Core"] } },
              { title: "Plancha Abdominal Activa", position: 4, config: { sets: 3, reps: "45 segundos", rest_seconds: 45 }, exercises: { name: "Plancha", primary_muscles: ["Core"] } }
            ];
          }
          setWorkoutItems(dynamicItems);
        }
      }
    } catch (e) {
      console.error("Error loading data from Supabase, loading fallback simulation.", e);
      setIsSimulatedMode(true);
      simulateData();
    } finally {
      setLoading(false);
    }
  };

  const simulateData = () => {
    // Fill state with mock data that aligns perfectly with database schema structures
    setProfile({
      full_name: "Carlos García",
      username: "carlos_fit",
      avatar_url: null,
    });
    
    // Simulate active profile
    setUserProfile({
      birth_date: "1994-08-12",
      sex: "male",
      height_cm: 180,
      weight_kg: 82,
      body_fat_percentage: 16.5,
      activity_level: "moderately_active",
      primary_goal: "muscle_gain",
      experience_level: "intermediate",
      training_environment: "gym",
      available_equipment: ["dumbbells", "barbell", "cables", "machines"],
      available_days_per_week: 4,
      session_duration_minutes: 60,
      dietary_preferences: ["high_protein"],
      injuries: [],
      limitations: [],
    });

    setWorkoutProgram({
      title: "Hipertrofia Acelerada FITTO",
      goal: "muscle_gain",
    });

    setWorkoutDays([
      { id: "1", title: "Día 1: Empuje (Pecho/Hombro/Tríceps)" },
      { id: "2", title: "Día 2: Tracción (Espalda/Bíceps)" },
      { id: "3", title: "Día 3: Piernas Completas" },
      { id: "4", title: "Día 4: Hombro & Brazos Focalizado" },
    ]);

    setWorkoutItems([
      { title: "Press de Banca con Barra", position: 1, config: { sets: 4, reps: "8-10", rest_seconds: 90 }, exercises: { name: "Press de Banca", primary_muscles: ["Pecho"] } },
      { title: "Press Militar con Mancuernas", position: 2, config: { sets: 3, reps: "10-12", rest_seconds: 75 }, exercises: { name: "Press Militar", primary_muscles: ["Hombros"] } },
      { title: "Fondos de Pecho", position: 3, config: { sets: 3, reps: "Al fallo", rest_seconds: 60 }, exercises: { name: "Fondos", primary_muscles: ["Pecho", "Tríceps"] } },
      { title: "Extensiones de Tríceps en Polea", position: 4, config: { sets: 3, reps: "12-15", rest_seconds: 60 }, exercises: { name: "Extensiones Polea", primary_muscles: ["Tríceps"] } },
    ]);

    setShowOnboarding(false);
  };

  const handleOnboardingSubmit = async () => {
    setIsGenerating(true);
    
    // Simulate satisfying AI generation progress loader
    let progress = 0;
    const interval = setInterval(() => {
      progress += 5;
      setGenerationProgress(Math.min(progress, 100));
      if (progress >= 100) {
        clearInterval(interval);
        saveProfileData();
      }
    }, 150);
  };

  const saveProfileData = async () => {
    try {
      if (isSimulatedMode || !user) {
        // Complete mock onboarding successfully
        setUserProfile(formData);
        setIsGenerating(false);
        setShowOnboarding(false);
        return;
      }

      // 1. Insert or update user_profiles
      const { error: profileError } = await supabase.from("user_profiles").upsert({
        user_id: user.id,
        birth_date: formData.birth_date,
        sex: formData.sex,
        height_cm: formData.height_cm,
        weight_kg: formData.weight_kg,
        body_fat_percentage: formData.body_fat_percentage,
        activity_level: formData.activity_level,
        primary_goal: formData.primary_goal,
        experience_level: formData.experience_level,
        training_environment: formData.training_environment,
        available_equipment: formData.available_equipment,
        available_days_per_week: formData.available_days_per_week,
        session_duration_minutes: formData.session_duration_minutes,
        dietary_preferences: formData.dietary_preferences,
        injuries: formData.injuries,
        limitations: formData.limitations,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: "user_id"
      });

      if (profileError) throw profileError;

      // 2. Try inserting programs and versions. If it fails due to RLS, log it, but proceed!
      try {
        const goalTitles: Record<string, string> = {
          muscle_gain: "Hipertrofia Estructurada FITTO",
          fat_loss: "Déficit Inteligente & Acondicionamiento",
          strength: "Fuerza Absoluta & Potencia",
          endurance: "Resistencia Cardiovascular & Atletismo",
          health: "Bienestar Vital & Longevidad",
        };

        const { data: program, error: progError } = await supabase
          .from("workout_programs")
          .insert({
            user_id: user.id,
            title: goalTitles[formData.primary_goal] || "Plan Personalizado FITTO",
            description: `Plan diseñado a medida considerando un nivel ${formData.experience_level} en entorno de ${formData.training_environment}.`,
            goal: formData.primary_goal,
            status: "active",
          })
          .select()
          .single();

        if (progError) throw progError;

        // 3. Create active version
        const { data: version, error: verError } = await supabase
          .from("workout_program_versions")
          .insert({
            workout_program_id: program.id,
            version_number: 1,
            ai_model: "FITTO-AI-Core",
            ai_version: "v2.5-Stable",
            generation_input: formData,
            generation_output: { status: "success", generated_at: new Date().toISOString() },
          })
          .select()
          .single();

        if (verError) throw verError;

        // 4. Create workout days based on commitment
        const daysToCreate = [];
        for (let i = 0; i < formData.available_days_per_week; i++) {
          daysToCreate.push({
            workout_program_version_id: version.id,
            day_index: i + 1,
            title: `Día ${i + 1}: ${
              formData.primary_goal === "muscle_gain" 
                ? ["Empuje (Pecho/Hombro)", "Tracción (Espalda/Bíceps)", "Piernas", "Fullbody"][i % 4]
                : ["Acondicionamiento HIIT", "Fuerza General", "Core & Cardio", "Movilidad & Recuperación"][i % 4]
            }`,
          });
        }

        const { data: createdDays, error: daysError } = await supabase
          .from("workout_days")
          .insert(daysToCreate)
          .select();

        if (daysError) throw daysError;

        // 5. Create some exercises for Day 1
        if (createdDays && createdDays.length > 0) {
          const dummyItems = [
            { workout_day_id: createdDays[0].id, item_type: "exercise", position: 1, title: "Sentadilla Goblet", config: { sets: 4, reps: "10-12", rest_seconds: 90 } },
            { workout_day_id: createdDays[0].id, item_type: "exercise", position: 2, title: "Flexiones de Brazos (Pushups)", config: { sets: 3, reps: "12-15", rest_seconds: 60 } },
            { workout_day_id: createdDays[0].id, item_type: "exercise", position: 3, title: "Remo con Mancuerna", config: { sets: 3, reps: "10", rest_seconds: 75 } },
            { workout_day_id: createdDays[0].id, item_type: "exercise", position: 4, title: "Plancha Abdominal", config: { sets: 3, reps: "45 segundos", rest_seconds: 45 } },
          ];
          
          await supabase.from("workout_items").insert(dummyItems);
        }
      } catch (rlsError) {
        console.warn("RLS block on auxiliary tables. Program will be computed dynamically in the client state.", rlsError);
      }

      // Reload
      setIsGenerating(false);
      setShowOnboarding(false);
      fetchUserData();
    } catch (err) {
      console.error("Error saving profile to database, switching to simulated mode.", err);
      setIsSimulatedMode(true);
      simulateData();
    }
  };

  const handleResetProfile = () => {
    // Allows user to re-run the gorgeous onboarding wizard
    setShowOnboarding(true);
    setOnboardingStep(1);
    setGenerationProgress(0);
  };

  // Render Loading state
  if (loading && !isGenerating) {
    return (
      <div className="flex h-[70vh] flex-col items-center justify-center space-y-4">
        <div className="relative flex h-16 w-16 items-center justify-center">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-25"></span>
          <img src="/logo.png" className="h-10 w-auto animate-pulse relative z-10" alt="FITTO" />
        </div>
        <p className="text-muted-foreground font-semibold text-sm animate-pulse">Sincronizando con FITTO Cloud...</p>
      </div>
    );
  }

  // Render ONBOARDING SETUP WIZARD
  if (showOnboarding) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <Card className="border-border/80 shadow-2xl relative overflow-hidden bg-card/60 backdrop-blur-md">
          {/* Decorative design watermark */}
          <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
            <img src="/logo.png" className="w-48 h-auto" alt="" />
          </div>

          <CardHeader className="border-b border-border/40 pb-6 relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-primary/20 p-2 rounded-xl text-primary">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold tracking-tight">Completa tu Perfil Vital</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">FITTO necesita estos datos para estructurar tu IA</p>
                </div>
              </div>
              <span className="text-sm font-bold text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                Paso {onboardingStep} de 5
              </span>
            </div>
            
            {/* Progress bar */}
            <div className="mt-4 h-1.5 w-full bg-accent rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-primary" 
                initial={{ width: 0 }}
                animate={{ width: `${(onboardingStep / 5) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </CardHeader>

          <CardContent className="p-8 relative z-10 min-h-[380px] flex flex-col justify-between">
            <AnimatePresence mode="wait">
              {!isGenerating ? (
                <motion.div
                  key={onboardingStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-6 flex-1"
                >
                  {/* STEP 1: GOALS */}
                  {onboardingStep === 1 && (
                    <div className="space-y-5">
                      <div className="space-y-2">
                        <label className="text-base font-bold flex items-center gap-2">
                          <Target className="w-4 h-4 text-primary" /> ¿Cuál es tu objetivo físico principal?
                        </label>
                        <p className="text-xs text-muted-foreground">Tu coach IA basará toda la distribución de calorías y rutinas en esto.</p>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[
                          { id: "muscle_gain", label: "Ganar Masa Muscular", emoji: "💪", desc: "Aumento de volumen e hipertrofia" },
                          { id: "fat_loss", label: "Perder Grasa", emoji: "🔥", desc: "Déficit calórico estructurado y tono" },
                          { id: "strength", label: "Fuerza Absoluta", emoji: "🏋️‍♂️", desc: "Mejorar tus marcas básicas" },
                          { id: "health", label: "Salud & Longevidad", emoji: "🌱", desc: "Energía vital, flexibilidad y salud" },
                        ].map((goal) => (
                          <div 
                            key={goal.id}
                            onClick={() => setFormData({ ...formData, primary_goal: goal.id })}
                            className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 hover:bg-accent/40 ${
                              formData.primary_goal === goal.id 
                                ? "border-primary bg-primary/10 shadow-md shadow-primary/5" 
                                : "border-border/60 bg-card"
                            }`}
                          >
                            <span className="text-2xl">{goal.emoji}</span>
                            <div>
                              <h4 className="font-bold text-sm">{goal.label}</h4>
                              <p className="text-xs text-muted-foreground mt-0.5">{goal.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="space-y-2 pt-2">
                        <label className="text-sm font-bold flex items-center gap-2">
                          <Compass className="w-4 h-4 text-primary" /> Tu nivel de experiencia
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { id: "beginner", label: "Principiante", desc: "< 1 año" },
                            { id: "intermediate", label: "Intermedio", desc: "1-3 años" },
                            { id: "advanced", label: "Avanzado", desc: "> 3 años" },
                          ].map((level) => (
                            <button
                              key={level.id}
                              type="button"
                              onClick={() => setFormData({ ...formData, experience_level: level.id })}
                              className={`p-3 rounded-xl border text-center transition-all ${
                                formData.experience_level === level.id
                                  ? "border-primary bg-primary/10 text-primary font-bold"
                                  : "border-border/60 hover:bg-accent/50 text-muted-foreground text-sm"
                              }`}
                            >
                              <div>{level.label}</div>
                              <div className="text-[10px] opacity-75 font-normal mt-0.5">{level.desc}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* STEP 2: BIOMETRICS */}
                  {onboardingStep === 2 && (
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-base font-bold flex items-center gap-2">
                          <Scale className="w-4 h-4 text-primary" /> Composición Corporal & Datos Básicos
                        </label>
                        <p className="text-xs text-muted-foreground">Medidas exactas para calcular tu tasa metabólica basal (TMB).</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Sexo Biológico</label>
                          <div className="flex gap-2">
                            {[
                              { id: "male", label: "Hombre" },
                              { id: "female", label: "Mujer" },
                            ].map((sex) => (
                              <button
                                key={sex.id}
                                type="button"
                                onClick={() => setFormData({ ...formData, sex: sex.id })}
                                className={`flex-1 py-3 rounded-xl border transition-all font-semibold text-sm ${
                                  formData.sex === sex.id
                                    ? "border-primary bg-primary/10 text-primary"
                                    : "border-border/60 hover:bg-accent/50 text-muted-foreground"
                                }`}
                              >
                                {sex.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Fecha de Nacimiento</label>
                          <input
                            type="date"
                            value={formData.birth_date}
                            onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                            className="w-full bg-muted/40 border border-border/80 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-primary"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-2">
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex justify-between">
                            <span>Estatura</span>
                            <span className="text-primary font-bold">{formData.height_cm} cm</span>
                          </label>
                          <input
                            type="range"
                            min="120"
                            max="220"
                            value={formData.height_cm}
                            onChange={(e) => setFormData({ ...formData, height_cm: parseInt(e.target.value) })}
                            className="w-full accent-primary h-1.5 bg-accent rounded-lg appearance-none cursor-pointer"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex justify-between">
                            <span>Peso Corporal</span>
                            <span className="text-primary font-bold">{formData.weight_kg} kg</span>
                          </label>
                          <input
                            type="range"
                            min="40"
                            max="150"
                            value={formData.weight_kg}
                            onChange={(e) => setFormData({ ...formData, weight_kg: parseFloat(e.target.value) })}
                            className="w-full accent-primary h-1.5 bg-accent rounded-lg appearance-none cursor-pointer"
                          />
                        </div>
                      </div>

                      <div className="space-y-2 pt-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Nivel de Actividad Diaria</label>
                        <select
                          value={formData.activity_level}
                          onChange={(e) => setFormData({ ...formData, activity_level: e.target.value })}
                          className="w-full bg-muted/40 border border-border/80 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary font-medium"
                        >
                          <option value="sedentary">Sedentario (Trabajo de oficina, poco ejercicio)</option>
                          <option value="lightly_active">Ligeramente Activo (Caminatas suaves, 1-2 entrenos/sem)</option>
                          <option value="moderately_active">Moderadamente Activo (Trabajo dinámico, 3-5 entrenos/sem)</option>
                          <option value="very_active">Muy Activo (Atleta, entreno diario o esfuerzo físico duro)</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* STEP 3: TRAINING DISPOSITION */}
                  {onboardingStep === 3 && (
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-base font-bold flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-primary" /> Compromiso Semanal & Lugar
                        </label>
                        <p className="text-xs text-muted-foreground">Distribución de tus días de entrenamiento y tus tiempos disponibles.</p>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex justify-between">
                            <span>Días de entrenamiento por semana</span>
                            <span className="text-primary font-black">{formData.available_days_per_week} días</span>
                          </label>
                          <div className="flex gap-2">
                            {[2, 3, 4, 5, 6].map((day) => (
                              <button
                                key={day}
                                type="button"
                                onClick={() => setFormData({ ...formData, available_days_per_week: day })}
                                className={`flex-1 py-3 rounded-xl border transition-all font-bold text-sm ${
                                  formData.available_days_per_week === day
                                    ? "border-primary bg-primary/10 text-primary"
                                    : "border-border/60 hover:bg-accent/50 text-muted-foreground"
                                }`}
                              >
                                {day}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex justify-between">
                            <span>Duración de la sesión</span>
                            <span className="text-primary font-black">{formData.session_duration_minutes} minutos</span>
                          </label>
                          <div className="grid grid-cols-4 gap-2">
                            {[30, 45, 60, 90].map((mins) => (
                              <button
                                key={mins}
                                type="button"
                                onClick={() => setFormData({ ...formData, session_duration_minutes: mins })}
                                className={`py-3 rounded-xl border transition-all font-bold text-sm ${
                                  formData.session_duration_minutes === mins
                                    ? "border-primary bg-primary/10 text-primary"
                                    : "border-border/60 hover:bg-accent/50 text-muted-foreground"
                                }`}
                              >
                                {mins} min
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Entorno de Entrenamiento</label>
                          <div className="flex gap-3">
                            {[
                              { id: "gym", label: "Gimnasio Comercial", icon: Dumbbell },
                              { id: "home", label: "En Casa", icon: Clock },
                            ].map((env) => (
                              <button
                                key={env.id}
                                type="button"
                                onClick={() => setFormData({ ...formData, training_environment: env.id })}
                                className={`flex-1 p-4 rounded-xl border transition-all flex items-center justify-center gap-3 ${
                                  formData.training_environment === env.id
                                    ? "border-primary bg-primary/10 text-primary font-bold"
                                    : "border-border/60 hover:bg-accent/50 text-muted-foreground text-sm"
                                }`}
                              >
                                <env.icon className="w-5 h-5" />
                                {env.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* STEP 4: EQUIPMENT SELECTOR */}
                  {onboardingStep === 4 && (
                    <div className="space-y-5">
                      <div className="space-y-2">
                        <label className="text-base font-bold flex items-center gap-2">
                          <Dumbbell className="w-4 h-4 text-primary" /> Equipamiento Disponible
                        </label>
                        <p className="text-xs text-muted-foreground">FITTO solo incluirá ejercicios que puedas realizar con lo que marques aquí.</p>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { id: "dumbbells", label: "Mancuernas / Dumbbells", emoji: "🧳" },
                          { id: "barbell", label: "Barra Olímpica", emoji: "🏋️‍♂️" },
                          { id: "cables", label: "Cables / Poleas", emoji: "🚠" },
                          { id: "bands", label: "Bandas Elásticas", emoji: "🎗️" },
                          { id: "kettlebells", label: "Pesas Rusas", emoji: "🍙" },
                          { id: "machines", label: "Máquinas Selectores", emoji: "🤖" },
                        ].map((eq) => {
                          const isSelected = formData.available_equipment.includes(eq.id);
                          return (
                            <div
                              key={eq.id}
                              onClick={() => {
                                const newEq = isSelected
                                  ? formData.available_equipment.filter((item) => item !== eq.id)
                                  : [...formData.available_equipment, eq.id];
                                setFormData({ ...formData, available_equipment: newEq });
                              }}
                              className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${
                                isSelected
                                  ? "border-primary bg-primary/10 text-primary font-semibold"
                                  : "border-border/60 bg-card hover:bg-accent/40"
                              }`}
                            >
                              <span className="text-xl">{eq.emoji}</span>
                              <span className="text-sm font-medium">{eq.label}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* STEP 5: HEALTH & NUTRITION */}
                  {onboardingStep === 5 && (
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-base font-bold flex items-center gap-2">
                          <Apple className="w-4 h-4 text-primary" /> Nutrición & Restricciones Médicas
                        </label>
                        <p className="text-xs text-muted-foreground">Personaliza tus comidas y avísanos de lesiones para adaptar tu seguridad.</p>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Preferencia Alimentaria</label>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {[
                              { id: "high_protein", label: "Alta Proteína" },
                              { id: "vegan", label: "Vegano" },
                              { id: "vegetarian", label: "Vegetariano" },
                              { id: "keto", label: "Cetogénico" },
                              { id: "balanced", label: "Todo / Balanceado" },
                            ].map((pref) => {
                              const isSelected = formData.dietary_preferences.includes(pref.id);
                              return (
                                <button
                                  key={pref.id}
                                  type="button"
                                  onClick={() => {
                                    const newPref = isSelected
                                      ? formData.dietary_preferences.filter((item) => item !== pref.id)
                                      : [...formData.dietary_preferences, pref.id];
                                    setFormData({ ...formData, dietary_preferences: newPref });
                                  }}
                                  className={`py-2 px-3 rounded-lg border text-xs font-bold transition-all ${
                                    isSelected
                                      ? "border-primary bg-primary/10 text-primary"
                                      : "border-border/60 hover:bg-accent/50 text-muted-foreground"
                                  }`}
                                >
                                  {pref.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 text-orange-500">
                            <AlertTriangle className="w-3.5 h-3.5" /> ¿Tienes lesiones activas o dolor en articulaciones?
                          </label>
                          <div className="flex gap-2">
                            {["Hombros", "Rodillas", "Espalda Baja", "Muñecas"].map((injury) => {
                              const isSelected = formData.injuries.includes(injury);
                              return (
                                <button
                                  key={injury}
                                  type="button"
                                  onClick={() => {
                                    const newInjuries = isSelected
                                      ? formData.injuries.filter((item) => item !== injury)
                                      : [...formData.injuries, injury];
                                    setFormData({ ...formData, injuries: newInjuries, limitations: newInjuries });
                                  }}
                                  className={`flex-1 py-2 rounded-lg border text-xs font-bold transition-all ${
                                    isSelected
                                      ? "border-orange-500 bg-orange-500/10 text-orange-500"
                                      : "border-border/60 hover:bg-accent/50 text-muted-foreground"
                                  }`}
                                >
                                  {injury}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              ) : (
                /* LOADING / GENERATION SCREEN */
                <motion.div
                  key="generating"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center space-y-6 py-12 flex-1"
                >
                  <div className="relative flex h-24 w-24 items-center justify-center">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-20"></span>
                    <img src="/logo.png" className="h-16 w-auto animate-pulse relative z-10" alt="FITTO" />
                  </div>

                  <div className="text-center space-y-2">
                    <h3 className="text-xl font-extrabold tracking-tight flex items-center gap-2 justify-center">
                      <Sparkles className="w-5 h-5 text-primary animate-spin" /> FITTO AI está calculando...
                    </h3>
                    <p className="text-xs text-muted-foreground max-w-sm">
                      {generationProgress < 40 && "Analizando biometría y metabolismo basal..."}
                      {generationProgress >= 40 && generationProgress < 75 && "Distribuyendo macros y estructurando calorías..."}
                      {generationProgress >= 75 && "Generando bloques de fuerza y periodización..."}
                    </p>
                  </div>

                  <div className="w-full max-w-md bg-accent rounded-full h-2 overflow-hidden shadow-inner">
                    <div 
                      className="bg-primary h-full transition-all duration-150 ease-out" 
                      style={{ width: `${generationProgress}%` }}
                    />
                  </div>
                  <span className="text-xs font-black text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">{generationProgress}%</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* BUTTON BAR */}
            {!isGenerating && (
              <div className="flex justify-between items-center pt-6 border-t border-border/40 mt-8 relative z-10">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setOnboardingStep(Math.max(1, onboardingStep - 1))}
                  disabled={onboardingStep === 1}
                  className="rounded-full px-5 text-sm font-semibold border border-transparent hover:border-border/60"
                >
                  <ChevronLeft className="mr-2 h-4 w-4" /> Atrás
                </Button>

                {onboardingStep < 5 ? (
                  <Button
                    type="button"
                    onClick={() => setOnboardingStep(onboardingStep + 1)}
                    className="rounded-full px-6 shadow-md shadow-primary/20 hover:scale-105 transition-all"
                  >
                    Siguiente <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={handleOnboardingSubmit}
                    className="rounded-full px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/30 hover:scale-105 active:scale-95 transition-all"
                  >
                    <Sparkles className="mr-2 h-4 w-4" /> Generar Mi Plan
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // RENDER DYNAMIC DASHBOARD
  const primaryGoalLabels: Record<string, string> = {
    muscle_gain: "Ganar Masa Muscular",
    fat_loss: "Pérdida de Grasa",
    strength: "Fuerza Absoluta",
    endurance: "Resistencia",
    health: "Salud Integral",
  };

  const activityLevelLabels: Record<string, string> = {
    sedentary: "Sedentario",
    lightly_active: "Activo Ligero",
    moderately_active: "Moderado",
    very_active: "Muy Activo",
  };

  const calorieChartData = [
    { day: "Lun", kcal: userProfile?.primary_goal === "fat_loss" ? 1750 : 2300 },
    { day: "Mar", kcal: userProfile?.primary_goal === "fat_loss" ? 1800 : 2450 },
    { day: "Mié", kcal: userProfile?.primary_goal === "fat_loss" ? 1650 : 2100 },
    { day: "Jue", kcal: userProfile?.primary_goal === "fat_loss" ? 1850 : 2500 },
    { day: "Vie", kcal: userProfile?.primary_goal === "fat_loss" ? 1900 : 2650 },
    { day: "Sáb", kcal: userProfile?.primary_goal === "fat_loss" ? 1700 : 2200 },
    { day: "Dom", kcal: userProfile?.primary_goal === "fat_loss" ? 1820 : 2400 },
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Simulation Banner */}
      {isSimulatedMode && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-between text-amber-500">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <Lock className="w-4 h-4" /> Modo Simulado (Prueba sin conexión de base de datos)
          </div>
          <Button size="sm" variant="ghost" className="h-7 text-xs hover:bg-amber-500/20 font-bold" onClick={() => setIsSimulatedMode(false)}>
            Conectar DB
          </Button>
        </div>
      )}

      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-black tracking-tight"
          >
            ¡Hola, {profile?.full_name?.split(" ")[0] || "Atleta"}! 💪
          </motion.h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">FITTO ha estructurado tu entrenamiento para hoy.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={handleResetProfile} className="rounded-full text-xs font-bold border-border hover:bg-card">
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Reajustar Perfil
          </Button>
          <Button className="rounded-full shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all text-xs font-bold">
            <Plus className="mr-1.5 h-4 w-4" /> Registrar Actividad
          </Button>
        </div>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
          <Card className="bg-card hover:bg-accent/30 transition-all cursor-pointer border-border/50 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Dumbbell className="w-16 h-16" />
            </div>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-black uppercase tracking-wider text-muted-foreground">{t.workout}</CardTitle>
              <Activity className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold truncate">{workoutProgram?.title || "Plan FITTO"}</div>
              <p className="text-xs text-muted-foreground mt-1 font-semibold flex items-center gap-1">
                <Clock className="w-3 h-3 text-primary" /> {userProfile?.session_duration_minutes || 45} min • {primaryGoalLabels[userProfile?.primary_goal || ""] || "Progreso"}
              </p>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
          <Card className="bg-card hover:bg-accent/30 transition-all cursor-pointer border-border/50 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Flame className="w-16 h-16" />
            </div>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-black uppercase tracking-wider text-muted-foreground">{t.calories}</CardTitle>
              <Flame className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black">1,840 / {userProfile?.primary_goal === "fat_loss" ? "1,900" : "2,500"}</div>
              <div className="mt-2 h-1.5 w-full bg-accent rounded-full overflow-hidden">
                <div 
                  className="h-full bg-orange-500 rounded-full" 
                  style={{ width: userProfile?.primary_goal === "fat_loss" ? "92%" : "73%" }}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}>
          <Card className="bg-card hover:bg-accent/30 transition-all cursor-pointer border-border/50 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Target className="w-16 h-16" />
            </div>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-black uppercase tracking-wider text-muted-foreground">Compromiso</CardTitle>
              <Target className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black">{userProfile?.available_days_per_week || 4} Días/Semana</div>
              <p className="text-xs text-blue-500 mt-1 font-semibold flex items-center gap-1">
                <Scale className="w-3 h-3 text-blue-500" /> {userProfile?.weight_kg || 70} kg registrados
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }}>
          <Card className="bg-primary text-primary-foreground shadow-lg shadow-primary/10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Trophy className="w-16 h-16 text-primary-foreground" />
            </div>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-black uppercase tracking-wider text-primary-foreground/80">{t.recovery}</CardTitle>
              <Trophy className="h-4 w-4 text-primary-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black">92%</div>
              <p className="text-xs text-primary-foreground/80 mt-1 font-semibold">{t.recoverySub}</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-bold tracking-tight">{t.chartTitle}</h2>
          <Card className="p-5 border-border/50 shadow-sm bg-card/50 backdrop-blur-sm">
            <div ref={containerRef} className="mt-4 h-[300px] w-full" style={{ minWidth: 0 }}>
              {mounted && containerWidth > 0 ? (
                <LineChart width={containerWidth} height={300} data={calorieChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8e4" vertical={false} />
                  <XAxis dataKey="day" stroke="#6b7c71" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#6b7c71" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8e4', borderRadius: '12px' }}
                    itemStyle={{ color: '#1c2b23', fontWeight: 'bold' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="kcal" 
                    stroke="#9ad9a4" 
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#ffffff', stroke: '#9ad9a4', strokeWidth: 2 }}
                    activeDot={{ r: 6, fill: '#9ad9a4' }}
                  />
                </LineChart>
              ) : (
                <div className="h-full w-full bg-accent/20 animate-pulse rounded-xl flex items-center justify-center text-sm font-semibold text-muted-foreground">
                  Preparando gráfica de calorías...
                </div>
              )}
            </div>
          </Card>

          {/* Routine List (Workout Items) */}
          <div className="space-y-4 pt-4">
            <h2 className="text-xl font-bold tracking-tight">Ejercicios de Hoy</h2>
            <div className="grid grid-cols-1 gap-3">
              {workoutItems.map((item, i) => (
                <div 
                  key={i} 
                  className="flex items-center justify-between p-4 rounded-2xl border border-border/60 bg-card hover:border-border transition-colors shadow-sm"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                      {item.position || i + 1}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm">{item.title || item.exercises?.name}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {item.exercises?.primary_muscles?.join(", ") || "Fuerza"}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="text-sm font-bold text-foreground">
                        {item.config?.sets} Series × {item.config?.reps}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {item.config?.rest_seconds}s descanso
                      </div>
                    </div>
                    <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full">
                      <Play className="h-4 w-4 text-primary" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* AI Insights & Commitments */}
        <div className="space-y-6">
          <div className="space-y-4">
            <h2 className="text-xl font-bold tracking-tight">{t.aiInsights}</h2>
            <Card className="bg-gradient-to-br from-card to-card/50 border-primary/20 relative overflow-hidden group shadow-sm">
              <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardContent className="p-6 relative z-10 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary">
                    <Bot className="h-4 w-4" />
                  </div>
                  <h4 className="font-bold text-sm">Consejo FITTO</h4>
                </div>
                <p className="text-sm leading-relaxed text-foreground/90 font-medium">
                  {userProfile?.primary_goal === "fat_loss" 
                    ? "Tu meta es Pérdida de Grasa. FITTO ha priorizado una rutina de alta densidad para optimizar el gasto energético. Mantén tu hidratación hoy en 3.5 litros."
                    : "Tu recuperación es alta hoy (92%). Es un gran día para exigirte más en tu rutina de Tren Superior. Considera subir el peso en press de banca un 5%."}
                </p>
                <Button variant="ghost" className="w-full justify-start px-0 text-primary hover:text-primary/80 hover:bg-transparent font-bold text-xs">
                  {t.chatCoach}
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-bold tracking-tight">Tu Ecosistema</h2>
            <div className="space-y-3">
              {[
                { title: "Meta Nutricional", value: userProfile?.dietary_preferences?.includes("high_protein") ? "Alta Proteína" : "Balanceado", icon: Apple, color: "emerald" },
                { title: "Nivel Físico", value: activityLevelLabels[userProfile?.activity_level || ""] || "Moderado", icon: Activity, color: "orange" },
                { title: "Lugar de Entreno", value: userProfile?.training_environment === "gym" ? "Gimnasio Comercial" : "En Casa", icon: Dumbbell, color: "blue" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-2xl border border-border/50 bg-card hover:border-border transition-colors shadow-sm">
                  <div className={`p-2.5 rounded-xl bg-${item.color}-500/10 text-${item.color}-600`}>
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{item.title}</h4>
                    <p className="text-sm font-black text-foreground mt-0.5">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
