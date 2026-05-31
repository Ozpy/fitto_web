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
  Dumbbell,
  Scale,
  Clock,
  Apple,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Lock,
  Calendar,
  AlertCircle
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
import { useRouter } from "next/navigation";
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
  completion_level?: number | null;
}

interface WorkoutSessionStat {
  duration_minutes: number;
  perceived_difficulty: number;
  started_at: string;
  metadata?: any;
}

export default function DashboardPage() {
  const router = useRouter();
  const { language } = useAppStore();
  const t = translations[language].dashboard;

  // App state
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [workoutProgram, setWorkoutProgram] = useState<any | null>(null);
  const [workoutItems, setWorkoutItems] = useState<any[]>([]);
  
  // Real stats state
  const [stats, setStats] = useState({
    totalWorkouts: 0,
    totalMinutes: 0,
    avgRpe: 0,
    consistencyPercentage: 0
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [activeDayTitle, setActiveDayTitle] = useState<string>("Rutina de Fuerza");
  const [injuryAlerts, setInjuryAlerts] = useState<any[]>([]);

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
        router.push('/onboarding/path-selector');
        return;
      } 

      // --- DYNAMIC RE-CALCULATION OF COMPLETION LEVEL ---
      // Evaluates level of completion based on fields populated to solve the dashboard callout sync bug
      const { data: healthData } = await supabase
        .from("user_health")
        .select("id")
        .eq("user_id", authUser.id)
        .maybeSingle();

      const { data: psychData } = await supabase
        .from("user_psychology")
        .select("id")
        .eq("user_id", authUser.id)
        .maybeSingle();

      let calculatedLvl = 0;
      const hasLevel1 = userProf.height_cm && userProf.weight_kg && userProf.birth_date && userProf.sex;
      const hasLevel2 = hasLevel1 && healthData;
      const hasLevel3 = hasLevel2 && psychData;

      if (hasLevel3) {
        calculatedLvl = 3;
      } else if (hasLevel2) {
        calculatedLvl = 2;
      } else if (hasLevel1) {
        calculatedLvl = 1;
      }

      const effectiveLvl = Math.max(userProf.completion_level ?? 0, calculatedLvl);
      userProf.completion_level = effectiveLvl;
      
      setUserProfile(userProf as UserProfile);

      // 4. Fetch injuries details
      const { data: injuries } = await supabase
        .from("user_injuries")
        .select("body_part, notes")
        .eq("user_id", authUser.id);
      if (injuries) {
        setInjuryAlerts(injuries);
      }

      // 5. Fetch real logged stats from public.workout_sessions
      const { data: loggedSessions, error: sessionError } = await supabase
        .from("workout_sessions")
        .select("duration_minutes, perceived_difficulty, started_at, metadata")
        .eq("user_id", authUser.id)
        .eq("status", "completed")
        .order("completed_at", { ascending: true });

      let calculatedStats = {
        totalWorkouts: 0,
        totalMinutes: 0,
        avgRpe: 0,
        consistencyPercentage: 0
      };

      let computedChartData: any[] = [];

      if (loggedSessions && loggedSessions.length > 0) {
        const totalW = loggedSessions.length;
        let sumMinutes = 0;
        let sumRpe = 0;
        
        loggedSessions.forEach((s: WorkoutSessionStat) => {
          sumMinutes += s.duration_minutes || 0;
          sumRpe += s.perceived_difficulty || 0;
        });

        // Consistency percentage: active sessions relative to plan commitment (e.g. available_days_per_week * 4 weeks)
        const weeklyCommitment = userProf.available_days_per_week || 3;
        const totalCommitment = weeklyCommitment * 4;
        const consistency = Math.min(100, Math.round((totalW / totalCommitment) * 100));

        calculatedStats = {
          totalWorkouts: totalW,
          totalMinutes: sumMinutes,
          avgRpe: parseFloat((sumRpe / totalW).toFixed(1)),
          consistencyPercentage: consistency
        };

        // Populate real chart data (last 7 workouts)
        const lastSessions = loggedSessions.slice(-7);
        computedChartData = lastSessions.map((s: WorkoutSessionStat, idx: number) => {
          const date = new Date(s.started_at);
          const dayName = date.toLocaleDateString("es-ES", { weekday: "short" });
          return {
            day: `${dayName} (D${idx + 1})`,
            minutos: s.duration_minutes,
            esfuerzo: s.perceived_difficulty
          };
        });
      } else {
        // Mock curve for empty chart to prevent empty view, showing onboarding commitment
        computedChartData = [
          { day: "Semana 1", minutos: 0, esfuerzo: 0 },
          { day: "Semana 2", minutos: 0, esfuerzo: 0 },
          { day: "Semana 3", minutos: 0, esfuerzo: 0 },
          { day: "Semana 4", minutos: 0, esfuerzo: 0 }
        ];
      }

      setStats(calculatedStats);
      setChartData(computedChartData);

      // 6. Fetch workout program from v_user_current_plan view
      const { data: statusData } = await supabase.rpc("get_user_plan_status");
      
      if (statusData?.state === "active" && statusData?.program_id) {
        const { data: currentPlan } = await supabase
          .from("v_user_current_plan")
          .select("*")
          .eq("program_id", statusData.program_id)
          .maybeSingle();

        if (currentPlan) {
          setWorkoutProgram(currentPlan);

          const planJson = currentPlan.plan_json;
          const activeWeekNum = currentPlan.current_week || 1;
          const weekData = planJson.weeks?.find((w: any) => w.week_number === activeWeekNum) || planJson.weeks?.[0];

          if (weekData) {
            // Find today's exercise day (first training day that is not a rest day, or select based on logged session count)
            const trainingDays = weekData.days?.filter((d: any) => !d.is_rest_day) || [];
            // Select training day index based on workouts completed in active week
            const workoutsThisWeek = loggedSessions?.filter((s: any) => {
              return s.metadata?.week_number === activeWeekNum;
            }).length || 0;

            const todayDay = trainingDays[workoutsThisWeek % trainingDays.length] || weekData.days?.[0];

            if (todayDay) {
              setActiveDayTitle(todayDay.title || `Día ${todayDay.day_index}`);
              
              const mappedItems = todayDay.items?.map((item: any, idx: number) => ({
                title: item.exercise_name,
                position: item.position || idx + 1,
                config: item.config,
                exercises: {
                  name: item.exercise_name,
                  primary_muscles: item.primary_muscles || []
                }
              })) || [];
              setWorkoutItems(mappedItems);
            }
          }
        }
      } else {
        // Fallback fallback if status RPC is inactive but profile is complete
        setWorkoutProgram({
          title: "Generando Progresión Inteligente...",
          goal: userProf.primary_goal
        });
        setWorkoutItems([]);
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
    setProfile({
      full_name: "Oscar García",
      username: "oscar_fit",
      avatar_url: null,
    });

    setUserProfile({
      birth_date: "1998-05-12",
      sex: "male",
      height_cm: 187,
      weight_kg: 119,
      body_fat_percentage: 34.0,
      activity_level: "sedentary",
      primary_goal: "fat_loss",
      experience_level: "beginner",
      training_environment: "home",
      available_equipment: ["bands", "rings", "pullup_bar", "stationary_bike", "yoga_mat"],
      available_days_per_week: 3,
      session_duration_minutes: 45,
      dietary_preferences: ["high_protein"],
      injuries: ["knee"],
      limitations: [],
    });

    setWorkoutProgram({
      title: "Acondicionamiento Seguro y Recomposición Articular",
      goal: "fat_loss",
      plan_json: {
        nutrition_guidance: {
          daily_calories_estimate: 2100,
          protein_grams: 170
        }
      }
    });

    setInjuryAlerts([
      { body_part: "knee", notes: "dolor cuando con ejercicio pesado" }
    ]);

    setStats({
      totalWorkouts: 4,
      totalMinutes: 180,
      avgRpe: 5.5,
      consistencyPercentage: 33
    });

    setChartData([
      { day: "Mar (D1)", minutos: 45, esfuerzo: 5 },
      { day: "Jue (D2)", minutos: 45, esfuerzo: 6 },
      { day: "Sáb (D3)", minutos: 45, esfuerzo: 5 },
      { day: "Mar (D4)", minutos: 45, esfuerzo: 6 }
    ]);

    setWorkoutItems([
      { title: "Movilidad de hombros y cadera en yoga mat", position: 1, config: { sets: 1, reps: "5 minutos", rest_seconds: 0 }, exercises: { name: "Movilidad", primary_muscles: ["shoulders", "hips"] } },
      { title: "Remo con Anillas Suspendidas (Inclinación moderada)", position: 2, config: { sets: 3, reps: "8-10", rest_seconds: 90 }, exercises: { name: "Remo Anillas", primary_muscles: ["back", "biceps"] } },
      { title: "Prensa de Pecho de Pie con Banda Elástica", position: 3, config: { sets: 3, reps: "12", rest_seconds: 75 }, exercises: { name: "Prensa Pecho", primary_muscles: ["chest", "triceps"] } },
      { title: "Plancha Abdominal Modificada sobre rodillas", position: 4, config: { sets: 3, reps: "20-30 segundos", rest_seconds: 60 }, exercises: { name: "Plancha", primary_muscles: ["core"] } },
    ]);
  };

  const handleResetProfile = () => {
    router.push('/onboarding/path-selector');
  };

  // Render Loading state
  if (loading) {
    return (
      <div className="flex h-[70vh] flex-col items-center justify-center space-y-4">
        <div className="relative flex h-16 w-16 items-center justify-center">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-25"></span>
          <Dumbbell className="h-8 w-8 text-primary animate-pulse relative z-10" />
        </div>
        <p className="text-muted-foreground font-semibold text-sm animate-pulse">Sincronizando con FITTO Cloud...</p>
      </div>
    );
  }

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

  // Dynamic nutrition variables from active plan
  const nutritionGuidance = workoutProgram?.plan_json?.nutrition_guidance;
  const targetKcal = nutritionGuidance?.daily_calories_estimate || (userProfile?.primary_goal === "fat_loss" ? 1900 : 2500);
  const targetProtein = nutritionGuidance?.protein_grams || 150;

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12 select-none">
      
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

      {/* Injury Warnings Banner */}
      {injuryAlerts.length > 0 && (
        <div className="bg-amber-500/15 border-l-4 border-amber-500 p-4 rounded-r-3xl rounded-l-md shadow-sm flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-extrabold text-xs text-amber-700 uppercase tracking-wider">Aviso de Adaptación por Lesión</h4>
            <p className="text-xs font-semibold text-amber-800/90 leading-relaxed">
              Registramos dolor en zona de **{injuryAlerts.map(i => i.body_part).join(", ")}**. Tu plan inteligente ha sido adaptado limitando la flexión profunda cargada y el impacto de saltos para proteger tus articulaciones.
            </p>
          </div>
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
          <p className="text-muted-foreground mt-1 text-sm font-medium">
            {stats.totalWorkouts > 0 
              ? `Llevas ${stats.totalWorkouts} entrenamientos registrados. ¡Sigue así!` 
              : "Tu coach AI ha estructurado tu entrenamiento para hoy."
            }
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={handleResetProfile} className="rounded-full text-xs font-bold border-border hover:bg-card cursor-pointer">
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Reajustar Perfil
          </Button>
          <Button 
            onClick={() => router.push('/app/workouts')}
            className="rounded-full shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all text-xs font-black cursor-pointer bg-emerald-500 hover:bg-emerald-600 text-white flex items-center gap-1.5"
          >
            <Play className="h-3.5 w-3.5 fill-current" /> Entrenar Ahora
          </Button>
        </div>
      </div>

      {/* Top dynamic stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Workout Plan Stat */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
          <Card className="bg-card hover:bg-accent/30 transition-all cursor-pointer border-border/50 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Dumbbell className="w-16 h-16 text-primary" />
            </div>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-black uppercase tracking-wider text-muted-foreground">{t.workout}</CardTitle>
              <Activity className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-sm font-extrabold truncate text-foreground">{workoutProgram?.title || "Plan FITTO Inteligente"}</div>
              <p className="text-[10px] text-muted-foreground mt-1 font-bold flex items-center gap-1">
                <Clock className="w-3 h-3 text-primary" /> {userProfile?.session_duration_minutes || 45} min • {primaryGoalLabels[userProfile?.primary_goal || ""] || "Progreso"}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Dynamic Caloric target */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
          <Card className="bg-card hover:bg-accent/30 transition-all cursor-pointer border-border/50 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Flame className="w-16 h-16 text-orange-500" />
            </div>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-black uppercase tracking-wider text-muted-foreground">{t.calories}</CardTitle>
              <Flame className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-foreground">~{targetKcal} <span className="text-xs font-bold text-muted-foreground">kcal/día</span></div>
              <p className="text-[10px] text-muted-foreground mt-1 font-bold">Presupuesto diario recomendado por la IA.</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Commitment & Stats (Dynamic Completed Workouts count) */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}>
          <Card className="bg-card hover:bg-accent/30 transition-all cursor-pointer border-border/50 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Target className="w-16 h-16 text-blue-500" />
            </div>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-black uppercase tracking-wider text-muted-foreground">Historial de Log</CardTitle>
              <Target className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-foreground">{stats.totalWorkouts} Completados</div>
              <p className="text-[10px] text-blue-500 mt-1 font-bold flex items-center gap-1">
                <Scale className="w-3 h-3 text-blue-500" /> {stats.totalMinutes} minutos entrenados
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Average RPE Effort rating */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }}>
          <Card className="bg-emerald-500 text-white shadow-lg shadow-emerald-500/10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Trophy className="w-16 h-16 text-white" />
            </div>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-black uppercase tracking-wider text-emerald-100">{t.recovery}</CardTitle>
              <Trophy className="h-4 w-4 text-white" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black">{stats.avgRpe > 0 ? `${stats.avgRpe}/10` : "S/R"}</div>
              <p className="text-xs text-emerald-100 mt-1 font-semibold">
                {stats.avgRpe > 0 ? "Nivel de esfuerzo (RPE) promedio" : "Registra sesiones para calcular esfuerzo"}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Chart Column */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-bold tracking-tight">Evolución de Entrenamientos</h2>
          <Card className="p-5 border-border/50 shadow-sm bg-card/50 backdrop-blur-sm">
            <div className="flex justify-between items-center text-xs font-black uppercase tracking-wider text-muted-foreground mb-3 px-1">
              <span>Tiempo de Esfuerzo por Sesión</span>
              <span className="text-emerald-500 font-bold">Últimos {chartData.filter(d => d.minutos > 0).length || 4} entrenamientos</span>
            </div>

            <div ref={containerRef} className="mt-4 h-[280px] w-full" style={{ minWidth: 0 }}>
              {mounted && containerWidth > 0 ? (
                <LineChart width={containerWidth} height={280} data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8e4" vertical={false} />
                  <XAxis dataKey="day" stroke="#6b7c71" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#6b7c71" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8e4', borderRadius: '12px' }}
                    itemStyle={{ color: '#047857', fontWeight: 'bold' }}
                  />
                  <Line
                    type="monotone"
                    name="Minutos"
                    dataKey="minutos"
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#ffffff', stroke: '#10b981', strokeWidth: 2 }}
                    activeDot={{ r: 6, fill: '#10b981' }}
                  />
                  <Line
                    type="monotone"
                    name="Esfuerzo (RPE)"
                    dataKey="esfuerzo"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={{ r: 3, fill: '#ffffff', stroke: '#f59e0b', strokeWidth: 1.5 }}
                    activeDot={{ r: 5, fill: '#f59e0b' }}
                  />
                </LineChart>
              ) : (
                <div className="h-full w-full bg-accent/20 animate-pulse rounded-xl flex items-center justify-center text-sm font-semibold text-muted-foreground">
                  Preparando gráfica de rendimiento...
                </div>
              )}
            </div>
          </Card>

          {/* Routine List (Workout Items) */}
          <div className="space-y-4 pt-4">
            <div className="flex justify-between items-end">
              <h2 className="text-xl font-bold tracking-tight">Ejercicios Programados de Hoy</h2>
              <span className="text-xs font-extrabold text-emerald-600 uppercase bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/10">
                {activeDayTitle}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {workoutItems.length > 0 ? (
                workoutItems.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-4 rounded-2xl border border-border/60 bg-card hover:border-emerald-500/15 hover:shadow-sm transition-all duration-300"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-xs">
                        {item.position || i + 1}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-foreground">{item.title}</h4>
                        <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wider font-extrabold">
                          {item.exercises?.primary_muscles?.join(", ") || "General"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="text-sm font-extrabold text-foreground">
                          {item.config?.sets} Series × {item.config?.reps}
                        </div>
                        {item.config?.rest_seconds > 0 && (
                          <div className="text-[10px] text-muted-foreground font-bold mt-0.5">
                            {item.config?.rest_seconds}s descanso
                          </div>
                        )}
                      </div>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        onClick={() => router.push('/app/workouts')}
                        className="h-8 w-8 rounded-full hover:bg-emerald-500/10 text-primary cursor-pointer shrink-0"
                      >
                        <Play className="h-4 w-4 fill-current" />
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 border border-dashed border-border rounded-[2rem] text-center text-muted-foreground space-y-2 select-none">
                  <Sparkles className="w-8 h-8 text-primary mx-auto opacity-30 animate-pulse" />
                  <h4 className="font-extrabold text-sm text-foreground">Generación en Progreso</h4>
                  <p className="text-xs max-w-sm mx-auto font-medium">Ve a la pestaña de entrenamientos para estructurar o activar tu plan de 4 semanas personalizado.</p>
                  <Button
                    onClick={() => router.push('/app/workouts')}
                    className="rounded-full mt-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold px-4 py-2 cursor-pointer"
                  >
                    Estructurar Mi Plan
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* AI Insights & Commitments Column */}
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
                  <h4 className="font-bold text-sm text-foreground">Consejo FITTO</h4>
                </div>
                <p className="text-sm leading-relaxed text-foreground/90 font-medium">
                  {userProfile?.primary_goal === "fat_loss"
                    ? `Tu enfoque de Pérdida de Grasa está activo. El coach AI programó un presupuesto de ~${targetKcal} kcal para optimizar el gasto calórico de forma controlada. Mantén tu hidratación en 3 a 3.5 litros hoy.`
                    : `Meta de Ganancia Muscular activa. Tu sintonía es alta. Asegura tus ${targetProtein}g de proteína diarios hoy para acelerar la síntesis proteica e hipertrofia de fibras post-entrenamiento.`}
                </p>
                <Button 
                  onClick={() => router.push('/app/assistant')}
                  variant="ghost" 
                  className="w-full justify-start px-0 text-primary hover:text-primary/80 hover:bg-transparent font-black text-xs cursor-pointer"
                >
                  {t.chatCoach}
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-bold tracking-tight">Tu Ecosistema</h2>
            <div className="space-y-3">
              {[
                { title: "Meta Nutricional", value: `${targetProtein}g Proteína (${userProfile?.dietary_preferences?.includes("high_protein") ? "Alta Proteína" : "Balanceado"})`, icon: Apple, color: "emerald" },
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
