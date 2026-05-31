"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { 
  Dumbbell, 
  Play, 
  RotateCcw, 
  Sparkles, 
  AlertCircle, 
  ArrowRight,
  Clock,
  Zap,
  CheckCircle,
  HelpCircle,
  ShieldAlert,
  Apple,
  TrendingUp,
  AlertTriangle,
  FileText,
  Activity,
  Heart,
  ChevronRight,
  ChevronDown,
  Printer,
  CheckCircle2,
  Check,
  Pause,
  Plus,
  Minus,
  Info,
  Flame,
  Trophy,
  Smile,
  Meh,
  Frown,
  Undo2
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExerciseImage } from "@/components/ExerciseImage";
import { useExerciseCatalog } from "@/hooks/useExerciseCatalog";

interface UserProfile {
  primary_goal: string;
  experience_level: string;
  training_environment: string;
  available_equipment: string[];
  available_days_per_week: number;
  session_duration_minutes: number;
  has_active_injury: boolean;
}

interface WorkoutSetLog {
  set_number: number;
  completed: boolean;
  logged_reps: number;
  logged_weight: number;
}

interface WorkoutItemLog {
  exercise_name: string;
  item_type: string;
  sets: WorkoutSetLog[];
  was_substituted: boolean;
  substitution_reason?: string;
  substituted_with?: string;
}

export default function WorkoutsPage() {
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userName, setUserName] = useState<string>("Deportista");
  const [plan, setPlan] = useState<any>(null);
  const [planState, setPlanState] = useState<string>("no_plan"); // 'no_plan' | 'active' | 'expired'
  const [activeWeek, setActiveWeek] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showRegenerateModal, setShowRegenerateModal] = useState(false);
  const [loadingIndex, setLoadingIndex] = useState(0);
  const [completedDays, setCompletedDays] = useState<Record<string, boolean>>({});

  // --- WORKOUT COMPANION STATES ---
  const [workoutState, setWorkoutState] = useState<'preview' | 'pre_feedback' | 'active' | 'post_feedback' | 'celebration'>('preview');
  const [activeDay, setActiveDay] = useState<any>(null);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState<number>(0);
  const [sessionLogs, setSessionLogs] = useState<Record<string, WorkoutItemLog>>({});
  const [startedAt, setStartedAt] = useState<Date | null>(null);
  const [completedAt, setCompletedAt] = useState<Date | null>(null);
  
  // Biofeedback States
  const [preEnergy, setPreEnergy] = useState<number>(7);
  const [postEnergy, setPostEnergy] = useState<number>(6);
  const [postDifficulty, setPostDifficulty] = useState<number>(5); // RPE (1-10)
  const [postMood, setPostMood] = useState<string>("🙂");
  const [sessionNotes, setSessionNotes] = useState<string>("");

  // Rest Timer State
  const [restTimer, setRestTimer] = useState<{ duration: number; remaining: number; isActive: boolean }>({
    duration: 60,
    remaining: 0,
    isActive: false
  });
  const restTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Active Exercise Timer State (for cardio/duration reps)
  const [exerciseTimer, setExerciseTimer] = useState<{ remaining: number; isActive: boolean; initialDuration: number }>({
    remaining: 0,
    isActive: false,
    initialDuration: 0
  });
  const exerciseTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Substitution state
  const [showSubModal, setShowSubModal] = useState<boolean>(false);
  const [subReason, setSubReason] = useState<string>("Falta de equipo");
  const [customSubName, setCustomSubName] = useState<string>("");

  const loadingMessages = [
    "Analizando tu perfil...",
    "Diseñando tu progresión...",
    "Verificando seguridad...",
    "Adaptando a tu equipo disponible...",
    "Finalizando detalles..."
  ];

  // Rotate loading messages during generation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isGenerating) {
      setLoadingIndex(0);
      interval = setInterval(() => {
        setLoadingIndex((prev) => (prev + 1) % loadingMessages.length);
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [isGenerating]);

  // Load plan and profile on mount
  useEffect(() => {
    loadUserData();
  }, []);

  // Timer runner for Rest Timer
  useEffect(() => {
    if (restTimer.isActive && restTimer.remaining > 0) {
      restTimerRef.current = setTimeout(() => {
        setRestTimer(prev => ({ ...prev, remaining: prev.remaining - 1 }));
      }, 1000);
    } else if (restTimer.isActive && restTimer.remaining === 0) {
      // Sound alert when rest is finished!
      playBeepSequence();
      setRestTimer(prev => ({ ...prev, isActive: false }));
    }
    return () => {
      if (restTimerRef.current) clearTimeout(restTimerRef.current);
    };
  }, [restTimer.isActive, restTimer.remaining]);

  // Timer runner for Exercise Timer
  useEffect(() => {
    if (exerciseTimer.isActive && exerciseTimer.remaining > 0) {
      exerciseTimerRef.current = setTimeout(() => {
        setExerciseTimer(prev => ({ ...prev, remaining: prev.remaining - 1 }));
      }, 1000);
    } else if (exerciseTimer.isActive && exerciseTimer.remaining === 0) {
      playBeepSequence();
      setExerciseTimer(prev => ({ ...prev, isActive: false }));
    }
    return () => {
      if (exerciseTimerRef.current) clearTimeout(exerciseTimerRef.current);
    };
  }, [exerciseTimer.isActive, exerciseTimer.remaining]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Try loading user profile details for greeting
      const { data: profileData } = await supabase
        .from("profiles")
        .select("first_name, last_name")
        .eq("id", user.id)
        .maybeSingle();
      if (profileData?.first_name) {
        setUserName(profileData.first_name);
      }

      // 1. Query the RPC function get_user_plan_status to determine workflow state
      const { data: statusData, error: statusError } = await supabase.rpc("get_user_plan_status");

      if (statusError) {
        console.error("Error get_user_plan_status RPC:", statusError);
      }

      const activeState = statusData?.state || "no_plan";
      setPlanState(activeState);

      if (activeState === "active" && statusData?.program_id) {
        // 2. Query the active program from v_user_current_plan using program_id
        const { data: currentPlan, error: planError } = await supabase
          .from("v_user_current_plan")
          .select("*")
          .eq("program_id", statusData.program_id)
          .maybeSingle();

        if (planError) {
          console.error("Error loading plan:", planError);
        }

        if (currentPlan) {
          setPlan(currentPlan);
          const weekNum = currentPlan.plan_json?.weeks?.[0]?.week_number || 1;
          setActiveWeek(weekNum);

          // 3. Load completed sessions E2E to show checks persistently
          const { data: loggedSessions, error: loggedError } = await supabase
            .from("workout_sessions")
            .select("id, status, metadata")
            .eq("user_id", user.id)
            .eq("status", "completed");

          if (loggedError) {
            console.error("Error loading completed sessions:", loggedError);
          }

          if (loggedSessions) {
            const initialCompleted: Record<string, boolean> = {};
            loggedSessions.forEach((session: any) => {
              if (session.metadata && typeof session.metadata === "object") {
                const meta = session.metadata as any;
                if (meta.week_number && meta.day_index) {
                  initialCompleted[`${meta.week_number}-${meta.day_index}`] = true;
                }
              }
            });
            setCompletedDays(initialCompleted);
          }

        } else {
          setPlanState("no_plan");
          setPlan(null);
        }
      } else {
        setPlan(null);
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();
        
        if (profile) {
          setUserProfile(profile as UserProfile);
        }
      }
    } catch (err) {
      console.error("Error in loadUserData:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePlan = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch("/api/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          compare: false
        })
      });

      const data = await response.json();

      if (data.success) {
        await loadUserData();
      } else {
        alert("Error generando plan: " + (data.error || "Error desconocido"));
      }
    } catch (err: any) {
      console.error(err);
      alert("Error de conexión: " + err.message);
    } finally {
      setIsGenerating(false);
      setShowRegenerateModal(false);
    }
  };

  const toggleDayCompletedLocal = (week: number, day: number) => {
    const key = `${week}-${day}`;
    setCompletedDays(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // --- AUDIO SYNTHESIZED BEETS ---
  const playBeep = (freq = 800, duration = 0.1, type: OscillatorType = "sine") => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = type;
      osc.frequency.value = freq;
      
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + duration);
      
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      console.warn("Audio Context blocked or failed:", e);
    }
  };

  const playBeepSequence = () => {
    // 3 short preparatory beeps and a final high-pitched long beep
    playBeep(600, 0.1);
    setTimeout(() => playBeep(600, 0.1), 200);
    setTimeout(() => playBeep(600, 0.1), 400);
    setTimeout(() => playBeep(900, 0.45, "triangle"), 600);
  };

  // --- COMPANION CONTROLLER FUNCTIONS ---
  const handleStartWorkout = (day: any) => {
    setActiveDay(day);
    setPreEnergy(7);
    setWorkoutState('pre_feedback');
  };

  const handleBeginSession = () => {
    if (!activeDay) return;
    
    // Initialize session logs structure
    const initialLogs: Record<string, WorkoutItemLog> = {};
    activeDay.items?.forEach((item: any) => {
      const setsCount = parseInt(item.config?.sets) || 1;
      const repsTarget = item.config?.reps || "10";
      // Parse reps to get a reasonable prefilled integer
      const parsedReps = parseInt(repsTarget) || 10;
      
      const sets = Array.from({ length: setsCount }, (_, i) => ({
        set_number: i + 1,
        completed: false,
        logged_reps: parsedReps,
        logged_weight: 0
      }));

      initialLogs[item.exercise_name] = {
        exercise_name: item.exercise_name,
        item_type: item.item_type,
        sets,
        was_substituted: false
      };
    });

    setSessionLogs(initialLogs);
    setStartedAt(new Date());
    setCurrentExerciseIndex(0);
    setWorkoutState('active');
    
    // Pre-initialize exercise duration if the first exercise is duration based
    const firstItem = activeDay.items?.[0];
    if (firstItem) {
      const isDur = isDurationBased(firstItem);
      if (isDur) {
        const secs = parseDuration(firstItem.config?.reps);
        setExerciseTimer({ remaining: secs, isActive: false, initialDuration: secs });
      }
    }
  };

  const isDurationBased = (item: any) => {
    const reps = (item.config?.reps || "").toString().toLowerCase();
    return reps.includes("minuto") || reps.includes("segundo") || reps.includes("min") || reps.includes("sec") || reps.includes("s") || item.item_type === "warmup" && reps.includes("minutos");
  };

  const parseDuration = (repsStr: string): number => {
    if (!repsStr) return 60;
    const str = repsStr.toLowerCase();
    
    if (str.includes("minuto") || str.includes("min")) {
      const num = parseInt(str) || 5;
      return num * 60;
    }
    if (str.includes("segundo") || str.includes("seg") || str.includes("s")) {
      if (str.includes("-")) {
        const parts = str.split("-");
        const lastPart = parts[parts.length - 1];
        return parseInt(lastPart) || 30;
      }
      return parseInt(str) || 30;
    }
    return 60; 
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${remaining.toString().padStart(2, "0")}`;
  };

  const handleToggleSet = (exerciseName: string, setIndex: number, restSeconds: number) => {
    setSessionLogs(prev => {
      const next = { ...prev };
      const currentEx = next[exerciseName];
      if (!currentEx) return prev;

      const currentSet = currentEx.sets[setIndex];
      const isChecking = !currentSet.completed;
      currentSet.completed = isChecking;

      // Trigger automatic rest timer if checking a set as completed
      if (isChecking && restSeconds > 0) {
        setRestTimer({
          duration: restSeconds,
          remaining: restSeconds,
          isActive: true
        });
        // Subtle motivation audio feedback
        playBeep(700, 0.08);
      } else {
        playBeep(450, 0.08);
      }

      return next;
    });
  };

  const handleUpdateSetMetric = (exerciseName: string, setIndex: number, field: 'logged_reps' | 'logged_weight', val: number) => {
    setSessionLogs(prev => {
      const next = { ...prev };
      const currentEx = next[exerciseName];
      if (!currentEx) return prev;
      currentEx.sets[setIndex][field] = Math.max(0, val);
      return next;
    });
  };

  const handleSubstitution = (exerciseName: string, selectedAlt: string) => {
    setSessionLogs(prev => {
      const next = { ...prev };
      const currentEx = next[exerciseName];
      if (!currentEx) return prev;

      currentEx.was_substituted = true;
      currentEx.substitution_reason = subReason;
      currentEx.substituted_with = selectedAlt;
      
      return next;
    });
    setShowSubModal(false);
    playBeep(650, 0.15);
  };

  const handleNextStep = () => {
    const totalExercises = activeDay.items?.length || 0;
    if (currentExerciseIndex < totalExercises - 1) {
      const nextIndex = currentExerciseIndex + 1;
      setCurrentExerciseIndex(nextIndex);
      // Auto-set the exercise timer if the next exercise is duration-based
      const nextItem = activeDay.items?.[nextIndex];
      if (nextItem && isDurationBased(nextItem)) {
        const secs = parseDuration(nextItem.config?.reps);
        setExerciseTimer({ remaining: secs, isActive: false, initialDuration: secs });
      }
      playBeep(750, 0.05);
    } else {
      // Completed last exercise! Proceed to post-workout feedback.
      setCompletedAt(new Date());
      setWorkoutState('post_feedback');
      playBeep(880, 0.25);
    }
  };

  const handlePrevStep = () => {
    if (currentExerciseIndex > 0) {
      const prevIndex = currentExerciseIndex - 1;
      setCurrentExerciseIndex(prevIndex);
      const prevItem = activeDay.items?.[prevIndex];
      if (prevItem && isDurationBased(prevItem)) {
        const secs = parseDuration(prevItem.config?.reps);
        setExerciseTimer({ remaining: secs, isActive: false, initialDuration: secs });
      }
      playBeep(550, 0.05);
    }
  };

  const handleFinishWorkout = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !activeDay || !startedAt || !completedAt) return;

      const durationMinutes = Math.max(1, Math.round((completedAt.getTime() - startedAt.getTime()) / 60000));

      // 1. Insert header row in public.workout_sessions
      const sessionMetadata = {
        week_number: activeWeek,
        day_index: activeDay.day_index,
        day_title: activeDay.title,
        logged_reps_and_weights: sessionLogs
      };

      const { data: sessionResult, error: sessionError } = await supabase
        .from("workout_sessions")
        .insert({
          user_id: user.id,
          workout_day_id: null, // day is in program version plan_json
          workout_program_version_id: plan?.version_id,
          started_at: startedAt.toISOString(),
          completed_at: completedAt.toISOString(),
          duration_minutes: durationMinutes,
          perceived_difficulty: postDifficulty,
          perceived_energy_before: preEnergy,
          perceived_energy_after: postEnergy,
          mood_after: postMood,
          status: "completed",
          notes: sessionNotes || null,
          metadata: sessionMetadata
        })
        .select()
        .single();

      if (sessionError) {
        console.error("Error creating workout session:", sessionError);
        alert("Error al registrar la sesión general: " + sessionError.message);
        setLoading(false);
        return;
      }

      const sessionId = sessionResult?.id;

      // 2. Insert item-by-item logs in public.workout_item_logs
      const logInserts = activeDay.items?.map((item: any, idx: number) => {
        const exerciseLog = sessionLogs[item.exercise_name];
        return {
          workout_session_id: sessionId,
          workout_item_id: null,
          exercise_id: null,
          position: idx + 1,
          log_data: {
            exercise_name: item.exercise_name,
            sets: exerciseLog?.sets || [],
            substituted_with: exerciseLog?.substituted_with || null,
            equipment_used: item.equipment || []
          },
          was_substituted: exerciseLog?.was_substituted || false,
          substitution_reason: exerciseLog?.substitution_reason || null,
          perceived_difficulty: null,
          notes: null
        };
      });

      if (logInserts && logInserts.length > 0) {
        const { error: logsError } = await supabase
          .from("workout_item_logs")
          .insert(logInserts);

        if (logsError) {
          console.error("Error saving individual exercise logs:", logsError);
          // Non-blocking but warning
        }
      }

      // 3. Mark completed and update dashboard
      const key = `${activeWeek}-${activeDay.day_index}`;
      setCompletedDays(prev => ({ ...prev, [key]: true }));
      setWorkoutState('celebration');

    } catch (e: any) {
      console.error("Error finishing workout:", e);
      alert("Ocurrió un error inesperado al guardar: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReturnToPreview = () => {
    setWorkoutState('preview');
    setActiveDay(null);
    loadUserData();
  };

  // --- RENDERS OF COMPANION STATES ---

  const renderPreFeedbackScreen = () => {
    const numExercises = activeDay?.items?.length || 0;
    return (
      <div className="max-w-xl mx-auto py-10 px-4 space-y-8 print:hidden select-none">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-card border border-emerald-500/20 backdrop-blur-md p-6 sm:p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden space-y-6"
        >
          {/* Glowing orb */}
          <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-black uppercase tracking-widest leading-none">
              <Zap className="h-3.5 w-3.5 fill-current" />
              <span>Preparación de Sesión</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight uppercase">Día {activeDay?.day_index}: {activeDay?.title}</h2>
            <p className="text-xs sm:text-sm font-semibold text-muted-foreground">{activeDay?.focus}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 bg-muted/30 p-4 rounded-2xl text-center border border-border/40">
            <div>
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block">Duración Estimada</span>
              <span className="text-lg font-bold text-foreground flex items-center justify-center gap-1 mt-0.5">
                <Clock className="h-4.5 w-4.5 text-primary" /> {activeDay?.estimated_duration_minutes} min
              </span>
            </div>
            <div>
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block">Ejercicios</span>
              <span className="text-lg font-bold text-foreground flex items-center justify-center gap-1 mt-0.5">
                <Dumbbell className="h-4.5 w-4.5 text-emerald-500" /> {numExercises} bloques
              </span>
            </div>
          </div>

          {/* Energy feedback slider */}
          <div className="space-y-4 pt-2">
            <div className="flex justify-between items-center text-xs font-black uppercase tracking-wider text-muted-foreground">
              <span>Energía Inicial</span>
              <span className="text-emerald-500 text-sm font-black">{preEnergy}/10</span>
            </div>

            <input 
              type="range" 
              min="1" 
              max="10" 
              value={preEnergy}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                setPreEnergy(val);
                playBeep(400 + val * 30, 0.05);
              }}
              className="w-full accent-emerald-500 h-2 bg-muted rounded-lg appearance-none cursor-pointer"
            />

            <div className="text-center p-3 rounded-xl bg-card border border-border/50 text-xs font-bold text-muted-foreground transition-all duration-300">
              {preEnergy <= 3 && "😴 Siento fatiga o cansancio acumulado. Iré con calma hoy."}
              {preEnergy > 3 && preEnergy <= 6 && "🙂 Energía moderada. Cumpliré la rutina con buen control."}
              {preEnergy > 6 && preEnergy <= 8 && "⚡ ¡Buena energía! Listo para un entrenamiento intenso."}
              {preEnergy > 8 && "🔥 ¡Nivel de energía a tope! Imparable hoy."}
            </div>
          </div>

          {/* Checklist tools */}
          <div className="space-y-3 bg-muted/20 p-5 rounded-2xl border border-border/40">
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-2">Checklist del deportista</span>
            <label className="flex items-center gap-3 text-xs font-bold text-foreground cursor-pointer select-none">
              <input type="checkbox" defaultChecked className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4 accent-emerald-500" />
              <span>Tengo mi agua lista para hidratación 💧</span>
            </label>
            <label className="flex items-center gap-3 text-xs font-bold text-foreground cursor-pointer select-none">
              <input type="checkbox" defaultChecked className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4 accent-emerald-500" />
              <span>Mi espacio y equipamiento están listos 🏋️</span>
            </label>
            <label className="flex items-center gap-3 text-xs font-bold text-foreground cursor-pointer select-none">
              <input type="checkbox" defaultChecked className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4 accent-emerald-500" />
              <span>Sin molestias o dolores punzantes articulares 🩺</span>
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => setWorkoutState('preview')}
              className="rounded-full flex-1 font-bold h-12 border-border hover:bg-card cursor-pointer"
            >
              Regresar
            </Button>
            <Button
              onClick={handleBeginSession}
              className="rounded-full flex-1 font-black h-12 bg-emerald-500 hover:bg-emerald-600 text-white cursor-pointer shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2"
            >
              <span>¡Comenzar!</span>
              <ArrowRight className="h-4 w-4 stroke-[2.5]" />
            </Button>
          </div>
        </motion.div>
      </div>
    );
  };

  const renderActiveCompanionScreen = () => {
    const activeItem = activeDay?.items?.[currentExerciseIndex];
    if (!activeItem) return null;

    const totalExercises = activeDay.items?.length || 0;
    const exerciseLog = sessionLogs[activeItem.exercise_name];
    
    // Description fallback priority
    const description = 
      activeItem.how_to 
      || (activeItem.execution_cues?.length > 0 ? activeItem.execution_cues.join(' ') : null);

    const isDur = isDurationBased(activeItem);

    return (
      <div className="max-w-4xl mx-auto py-6 px-4 space-y-6 print:hidden relative select-none">
        
        {/* top progress interactive timeline */}
        <div className="bg-card border border-border/50 p-4 rounded-3xl shadow-sm space-y-3">
          <div className="flex justify-between items-center text-xs font-black uppercase text-muted-foreground tracking-wider px-1">
            <span>Sesión en Progreso</span>
            <span className="text-emerald-500">Ejercicio {currentExerciseIndex + 1} de {totalExercises}</span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {activeDay.items?.map((item: any, idx: number) => {
              const itemLog = sessionLogs[item.exercise_name];
              const isItemCompleted = itemLog?.sets.every(s => s.completed) || (isDurationBased(item) && itemLog?.sets[0]?.completed);
              const isActive = idx === currentExerciseIndex;

              return (
                <button
                  key={idx}
                  onClick={() => {
                    setCurrentExerciseIndex(idx);
                    if (isDurationBased(item)) {
                      const secs = parseDuration(item.config?.reps);
                      setExerciseTimer({ remaining: secs, isActive: false, initialDuration: secs });
                    }
                    playBeep(600 + idx * 30, 0.05);
                  }}
                  className={`flex-shrink-0 flex items-center justify-center h-8 rounded-full text-[10px] font-extrabold px-3 uppercase tracking-wider transition-all duration-300 border cursor-pointer ${
                    isActive 
                      ? "bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/10 scale-105"
                      : isItemCompleted
                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                        : "bg-muted text-muted-foreground border-transparent hover:bg-muted/70"
                  }`}
                >
                  <span className="mr-1">{idx + 1}.</span>
                  <span className="max-w-[100px] truncate">{item.exercise_name}</span>
                  {isItemCompleted && <Check className="h-3 w-3 ml-1 stroke-[3]" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* central exercise interactive card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Col Left: Details & Media */}
          <div className="lg:col-span-7 space-y-6">
            <Card className="border-border/50 bg-card rounded-[2rem] overflow-hidden shadow-md">
              <CardContent className="p-5 md:p-6 space-y-5">
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/15 text-emerald-600 rounded-full font-black uppercase tracking-wider">
                        {activeItem.item_type}
                      </span>
                      {exerciseLog?.was_substituted && (
                        <span className="text-[9px] px-2 py-0.5 bg-amber-500/10 border border-amber-500/15 text-amber-600 rounded-full font-black uppercase tracking-wider">
                          Sustituido
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl font-black text-foreground tracking-tight leading-snug">
                      {exerciseLog?.was_substituted ? exerciseLog.substituted_with : activeItem.exercise_name}
                    </h3>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setSubReason("Falta de equipo");
                      setCustomSubName("");
                      setShowSubModal(true);
                    }}
                    className="rounded-full text-[10px] font-black uppercase tracking-wider text-muted-foreground hover:text-foreground cursor-pointer shrink-0"
                  >
                    Sustituir
                  </Button>
                </div>

                <div className="relative">
                  <ExerciseImage 
                    exerciseName={exerciseLog?.was_substituted && exerciseLog.substituted_with ? exerciseLog.substituted_with : activeItem.exercise_name}
                    muscles={activeItem.primary_muscles}
                    className="w-full h-44 sm:h-48"
                    showSecondary={true}
                  />
                </div>

                {description && (
                  <div className="space-y-1">
                    <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest block">Técnica de Movimiento</span>
                    <p className="text-xs font-semibold text-foreground/80 leading-relaxed">
                      {description}
                    </p>
                  </div>
                )}

                {activeItem.why_this && (
                  <div className="space-y-1 border-t border-border/30 pt-3">
                    <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest block flex items-center gap-1">
                      <Sparkles className="h-3 w-3" /> Beneficio AI
                    </span>
                    <p className="text-xs font-semibold text-muted-foreground leading-relaxed">
                      {activeItem.why_this}
                    </p>
                  </div>
                )}

                {activeItem.execution_cues?.length > 0 && (
                  <div className="bg-accent/20 rounded-xl p-3.5 space-y-1.5">
                    <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest block">Consejos del Coach</span>
                    <ul className="text-xs font-semibold text-muted-foreground space-y-1 list-disc list-inside">
                      {activeItem.execution_cues.map((cue: string, cueIdx: number) => (
                        <li key={cueIdx} className="marker:text-primary">{cue}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Col Right: Interactive Set Checklist & Timers */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Countdown / Stopwatch block if duration based */}
            {isDur && (
              <Card className="border-emerald-500/20 bg-emerald-500/5 rounded-[2rem] shadow-sm relative overflow-hidden">
                <CardContent className="p-6 text-center space-y-4">
                  <div className="absolute top-3 right-3">
                    <Flame className="w-5 h-5 text-emerald-500 animate-pulse" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest block">Cronómetro Digital</span>
                    <span className="text-xs font-bold text-muted-foreground">Objetivo: {activeItem.config?.reps}</span>
                  </div>

                  <div className="text-5xl font-black tracking-tight text-foreground font-mono">
                    {formatTime(exerciseTimer.remaining)}
                  </div>

                  <div className="flex justify-center gap-3">
                    <Button
                      onClick={() => {
                        setExerciseTimer(prev => ({ ...prev, isActive: !prev.isActive }));
                        playBeep(700, 0.05);
                      }}
                      className={`rounded-full px-5 py-4 font-extrabold text-xs uppercase tracking-wider cursor-pointer ${
                        exerciseTimer.isActive 
                          ? "bg-amber-500 hover:bg-amber-600 text-white" 
                          : "bg-emerald-500 hover:bg-emerald-600 text-white"
                      }`}
                    >
                      {exerciseTimer.isActive ? <Pause className="h-4.5 w-4.5 mr-1" /> : <Play className="h-4.5 w-4.5 mr-1 fill-current" />}
                      <span>{exerciseTimer.isActive ? "Pausa" : "Iniciar"}</span>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        const secs = parseDuration(activeItem.config?.reps);
                        setExerciseTimer({ remaining: secs, isActive: false, initialDuration: secs });
                        playBeep(500, 0.05);
                      }}
                      className="rounded-full border-border hover:bg-card text-xs font-bold px-4 cursor-pointer"
                    >
                      <RotateCcw className="h-4.5 w-4.5" />
                    </Button>
                  </div>

                  <div className="border-t border-emerald-500/10 pt-4 mt-2">
                    <Button
                      onClick={() => {
                        // Mark the single set/exercise as completed
                        setSessionLogs(prev => {
                          const next = { ...prev };
                          const logs = next[activeItem.exercise_name];
                          if (logs && logs.sets[0]) {
                            logs.sets[0].completed = true;
                          }
                          return next;
                        });
                        playBeep(880, 0.15);
                        handleNextStep();
                      }}
                      className="w-full rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-wider py-5 cursor-pointer shadow-md shadow-emerald-500/15"
                    >
                      Completar y Continuar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* General Sets Checklist Table */}
            {!isDur && exerciseLog && (
              <Card className="border-border/50 bg-card rounded-[2rem] shadow-md">
                <CardHeader className="pb-3 border-b border-border/30">
                  <CardTitle className="text-sm font-black uppercase tracking-wider text-foreground">Registro de Carga y Series</CardTitle>
                  <CardDescription className="text-[11px] font-semibold">Completa las series especificadas por tu plan.</CardDescription>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  
                  <div className="space-y-3">
                    {exerciseLog.sets.map((set, setIdx) => {
                      return (
                        <div 
                          key={set.set_number}
                          className={`flex items-center justify-between p-3 rounded-2xl border transition-all duration-300 ${
                            set.completed 
                              ? "bg-emerald-500/5 border-emerald-500/25" 
                              : "bg-muted/10 border-border/50"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => handleToggleSet(activeItem.exercise_name, setIdx, activeItem.config?.rest_seconds || 60)}
                              className={`w-7 h-7 rounded-full flex items-center justify-center border transition-all duration-300 cursor-pointer ${
                                set.completed
                                  ? "bg-emerald-500 border-emerald-500 text-white scale-110"
                                  : "border-border hover:border-primary/60 text-transparent"
                              }`}
                            >
                              <Check className="h-4 w-4 stroke-[3]" />
                            </button>
                            <div>
                              <span className="text-xs font-black text-foreground block">Serie {set.set_number}</span>
                              <span className="text-[10px] text-muted-foreground font-semibold">Meta: {activeItem.config?.reps} reps</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            {/* weight logged controller */}
                            <div className="flex flex-col items-center">
                              <span className="text-[8px] font-black text-muted-foreground uppercase block mb-1">Peso (kg)</span>
                              <div className="flex items-center border border-border rounded-lg bg-card overflow-hidden">
                                <button 
                                  onClick={() => handleUpdateSetMetric(activeItem.exercise_name, setIdx, 'logged_weight', set.logged_weight - 1)}
                                  className="px-2 py-1 bg-muted/30 hover:bg-muted text-xs font-black"
                                >
                                  -
                                </button>
                                <input 
                                  type="number" 
                                  value={set.logged_weight || ""}
                                  onChange={(e) => handleUpdateSetMetric(activeItem.exercise_name, setIdx, 'logged_weight', parseInt(e.target.value) || 0)}
                                  placeholder="0"
                                  className="w-10 text-center font-bold text-xs bg-transparent border-none outline-none p-0 h-6 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                                <button 
                                  onClick={() => handleUpdateSetMetric(activeItem.exercise_name, setIdx, 'logged_weight', set.logged_weight + 1)}
                                  className="px-2 py-1 bg-muted/30 hover:bg-muted text-xs font-black"
                                >
                                  +
                                </button>
                              </div>
                            </div>

                            {/* reps logged controller */}
                            <div className="flex flex-col items-center">
                              <span className="text-[8px] font-black text-muted-foreground uppercase block mb-1">Reps</span>
                              <div className="flex items-center border border-border rounded-lg bg-card overflow-hidden">
                                <button 
                                  onClick={() => handleUpdateSetMetric(activeItem.exercise_name, setIdx, 'logged_reps', set.logged_reps - 1)}
                                  className="px-2 py-1 bg-muted/30 hover:bg-muted text-xs font-black"
                                >
                                  -
                                </button>
                                <input 
                                  type="number" 
                                  value={set.logged_reps || ""}
                                  onChange={(e) => handleUpdateSetMetric(activeItem.exercise_name, setIdx, 'logged_reps', parseInt(e.target.value) || 0)}
                                  className="w-10 text-center font-bold text-xs bg-transparent border-none outline-none p-0 h-6 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                                <button 
                                  onClick={() => handleUpdateSetMetric(activeItem.exercise_name, setIdx, 'logged_reps', set.logged_reps + 1)}
                                  className="px-2 py-1 bg-muted/30 hover:bg-muted text-xs font-black"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="border-t border-border/30 pt-4 flex gap-3">
                    <Button
                      variant="outline"
                      onClick={handlePrevStep}
                      disabled={currentExerciseIndex === 0}
                      className="rounded-full flex-1 font-bold h-11 border-border hover:bg-card cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Undo2 className="h-4 w-4" />
                      <span>Anterior</span>
                    </Button>
                    <Button
                      onClick={handleNextStep}
                      className="rounded-full flex-1 font-black h-11 bg-primary hover:bg-primary/95 text-primary-foreground cursor-pointer shadow-md flex items-center justify-center gap-1.5"
                    >
                      <span>{currentExerciseIndex === totalExercises - 1 ? "Finalizar" : "Siguiente"}</span>
                      <ArrowRight className="h-4 w-4 stroke-[2.5]" />
                    </Button>
                  </div>

                </CardContent>
              </Card>
            )}

            {/* floating active rest timer overlay inside col */}
            {restTimer.isActive && (
              <Card className="border-emerald-500/25 bg-emerald-500/5 rounded-[2rem] shadow-sm relative overflow-hidden animate-pulse">
                <CardContent className="p-5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin flex items-center justify-center text-xs font-black text-emerald-600">
                      ⚡
                    </div>
                    <div>
                      <span className="text-[10px] font-black text-emerald-600 uppercase block">Descanso en Progreso</span>
                      <span className="text-base font-black text-foreground font-mono">
                        {formatTime(restTimer.remaining)}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setRestTimer(prev => ({ ...prev, remaining: prev.remaining + 30 }));
                        playBeep(650, 0.05);
                      }}
                      className="rounded-full h-8 text-[10px] font-black px-3 uppercase border-emerald-500/20 text-emerald-600 bg-card hover:bg-emerald-500/10 cursor-pointer"
                    >
                      +30s
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        setRestTimer(prev => ({ ...prev, isActive: false, remaining: 0 }));
                        playBeep(400, 0.05);
                      }}
                      className="rounded-full h-8 text-[10px] font-black px-3 uppercase bg-emerald-500 hover:bg-emerald-600 text-white cursor-pointer"
                    >
                      Omitir
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

          </div>

        </div>

        {/* --- EXERCISE SUBSTITUTION MODAL --- */}
        {showSubModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm select-none">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-card border border-border/80 rounded-[2.5rem] max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl"
            >
              <div className="flex items-center gap-3 text-amber-500 border-b border-border/40 pb-3">
                <AlertTriangle className="h-6 w-6 shrink-0" />
                <h3 className="text-lg font-black text-foreground tracking-tight uppercase">Sustituir Ejercicio</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-1.5">¿Por qué deseas sustituirlo?</span>
                  <select 
                    value={subReason}
                    onChange={(e) => setSubReason(e.target.value)}
                    className="w-full bg-muted/50 border border-border/60 rounded-xl p-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="Falta de equipo">No tengo el equipo disponible</option>
                    <option value="Dolor o incomodidad">Siento molestias / dolor articular</option>
                    <option value="Demasiado difícil">Es de muy alta dificultad</option>
                    <option value="Otro motivo">Otro motivo</option>
                  </select>
                </div>

                <div>
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-1.5">Alternativas Recomendadas</span>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      "Equivalente con Banda Elástica",
                      "Equivalente con Peso Corporal (Calistenia)",
                      "Variación de menor rango articular"
                    ].map((alt, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setCustomSubName(alt);
                        }}
                        className={`text-left p-3.5 rounded-xl border text-xs font-bold transition-all duration-300 cursor-pointer ${
                          customSubName === alt 
                            ? "bg-emerald-500/10 border-emerald-500 text-emerald-600" 
                            : "bg-muted/10 border-border/50 hover:bg-muted/30"
                        }`}
                      >
                        {alt}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-1.5">Nombre alternativo personalizado</span>
                  <input 
                    type="text" 
                    placeholder="Escribe el nombre del ejercicio sustituto..."
                    value={customSubName}
                    onChange={(e) => setCustomSubName(e.target.value)}
                    className="w-full bg-muted/50 border border-border/60 rounded-xl p-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowSubModal(false)}
                  className="rounded-full flex-1 font-bold h-11 border-border hover:bg-card cursor-pointer"
                >
                  Cancelar
                </Button>
                <Button 
                  disabled={!customSubName}
                  onClick={() => handleSubstitution(activeItem.exercise_name, customSubName)}
                  className="rounded-full flex-1 font-black h-11 bg-amber-500 hover:bg-amber-600 text-white cursor-pointer shadow-md"
                >
                  Sustituir
                </Button>
              </div>
            </motion.div>
          </div>
        )}

      </div>
    );
  };

  const renderPostFeedbackScreen = () => {
    return (
      <div className="max-w-xl mx-auto py-10 px-4 space-y-8 print:hidden select-none">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-card border border-emerald-500/20 backdrop-blur-md p-6 sm:p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden space-y-6"
        >
          <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-black uppercase tracking-widest leading-none">
              <Trophy className="h-3.5 w-3.5 fill-current" />
              <span>¡Rutina Completada!</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight uppercase">Métricas de Log</h2>
            <p className="text-xs sm:text-sm font-semibold text-muted-foreground">Tu salud y percepción son esenciales para adaptar el volumen en el coach AI.</p>
          </div>

          {/* Difficulty Slider (RPE) */}
          <div className="space-y-4 pt-2">
            <div className="flex justify-between items-center text-xs font-black uppercase tracking-wider text-muted-foreground">
              <span>Esfuerzo Percibido (RPE)</span>
              <span className="text-emerald-500 text-sm font-black">{postDifficulty}/10</span>
            </div>

            <input 
              type="range" 
              min="1" 
              max="10" 
              value={postDifficulty}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                setPostDifficulty(val);
                playBeep(400 + val * 30, 0.05);
              }}
              className="w-full accent-emerald-500 h-2 bg-muted rounded-lg appearance-none cursor-pointer"
            />

            <div className="text-center p-3 rounded-xl bg-card border border-border/50 text-xs font-bold text-muted-foreground transition-all duration-300">
              {postDifficulty <= 2 && "🟢 Muy fácil. Podría haber seguido entrenando por horas sin fatiga."}
              {postDifficulty > 2 && postDifficulty <= 4 && "🟢 Moderado. Sentí algo de esfuerzo pero muy controlado."}
              {postDifficulty > 4 && postDifficulty <= 6 && "🟡 Algo duro. Terminé sudando con fatiga moderada normal."}
              {postDifficulty > 6 && postDifficulty <= 8 && "🔥 Duro. Las últimas repeticiones requirieron alta concentración."}
              {postDifficulty > 8 && "🔴 Esfuerzo máximo / Fallo muscular en múltiples series."}
            </div>
          </div>

          {/* Energy Slider */}
          <div className="space-y-4 pt-2">
            <div className="flex justify-between items-center text-xs font-black uppercase tracking-wider text-muted-foreground">
              <span>Energía Final</span>
              <span className="text-emerald-500 text-sm font-black">{postEnergy}/10</span>
            </div>

            <input 
              type="range" 
              min="1" 
              max="10" 
              value={postEnergy}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                setPostEnergy(val);
                playBeep(400 + val * 30, 0.05);
              }}
              className="w-full accent-emerald-500 h-2 bg-muted rounded-lg appearance-none cursor-pointer"
            />

            <div className="text-center p-3 rounded-xl bg-card border border-border/50 text-xs font-bold text-muted-foreground">
              {postEnergy <= 3 && "🔋 Agotado. Consumí todas mis reservas hoy. ¡Gran esfuerzo!"}
              {postEnergy > 3 && postEnergy <= 6 && "🙂 Cansado normal, pero con energía estable y fresca."}
              {postEnergy > 6 && "⚡ ¡Energizado! El entrenamiento me despertó y me activó."}
            </div>
          </div>

          {/* Mood emoji selectors */}
          <div className="space-y-3">
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-1">Estado de ánimo final</span>
            <div className="grid grid-cols-4 gap-2">
              {[
                { emoji: "😆", label: "Motivado" },
                { emoji: "🙂", label: "Satisfecho" },
                { emoji: "😐", label: "Cansado" },
                { emoji: "😫", label: "Agotado" }
              ].map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setPostMood(item.emoji);
                    playBeep(600 + idx * 50, 0.1);
                  }}
                  className={`flex flex-col items-center p-2.5 rounded-xl border transition-all duration-300 cursor-pointer ${
                    postMood === item.emoji 
                      ? "bg-emerald-500/10 border-emerald-500 text-emerald-600 scale-105" 
                      : "bg-muted/10 border-border/50 hover:bg-muted/30 text-muted-foreground"
                  }`}
                >
                  <span className="text-2xl">{item.emoji}</span>
                  <span className="text-[9px] font-bold mt-1 uppercase block">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Notes area */}
          <div className="space-y-2">
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block">Comentarios y bitácora (Opcional)</span>
            <textarea
              rows={3}
              placeholder="¿Qué tal se sintió la rutina? Anota pesos logrados o cualquier molestia..."
              value={sessionNotes}
              onChange={(e) => setSessionNotes(e.target.value)}
              className="w-full bg-muted/50 border border-border/60 rounded-2xl p-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <Button
            onClick={handleFinishWorkout}
            disabled={loading}
            className="w-full rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-black text-sm uppercase tracking-wider py-6 cursor-pointer shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2"
          >
            {loading ? "Sincronizando..." : "Registrar y Finalizar"}
            <CheckCircle2 className="h-5 w-5" />
          </Button>
        </motion.div>
      </div>
    );
  };

  const renderCelebrationScreen = () => {
    // Count total sets completed
    let totalSets = 0;
    let completedExercises = 0;
    Object.values(sessionLogs).forEach(ex => {
      const completedSets = ex.sets.filter(s => s.completed).length;
      totalSets += completedSets;
      if (completedSets > 0) completedExercises++;
    });

    const elapsedMs = completedAt && startedAt ? completedAt.getTime() - startedAt.getTime() : 0;
    const durationMin = Math.max(1, Math.round(elapsedMs / 60000));

    return (
      <div className="max-w-xl mx-auto py-10 px-4 space-y-8 print:hidden select-none">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-card border border-emerald-500/25 backdrop-blur-md p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden text-center space-y-6"
        >
          {/* Confetti background */}
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-teal-500/5 opacity-50" />
          
          <div className="relative z-10 flex flex-col items-center space-y-3">
            <div className="w-20 h-20 bg-yellow-500/10 rounded-full border border-yellow-500/20 flex items-center justify-center text-4xl text-yellow-500 shadow-lg shadow-yellow-500/5 animate-bounce">
              🏆
            </div>
            <h2 className="text-3xl font-black text-foreground tracking-tight uppercase">¡ENTRENAMIENTO LOGRADO!</h2>
            <p className="text-xs sm:text-sm font-semibold text-muted-foreground leading-relaxed max-w-sm">
              Excelente trabajo hoy, {userName}. Has completado con éxito la sesión estructurada por el coach de FITTO.
            </p>
          </div>

          <div className="relative z-10 bg-muted/20 border border-border/40 p-5 rounded-3xl grid grid-cols-2 gap-4 text-left">
            <div>
              <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest block">Tiempo de Esfuerzo</span>
              <span className="text-base font-extrabold text-foreground mt-0.5 block">{durationMin} minutos</span>
            </div>
            <div>
              <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest block">Ejercicios Realizados</span>
              <span className="text-base font-extrabold text-foreground mt-0.5 block">{completedExercises} bloques</span>
            </div>
            <div className="border-t border-border/40 pt-3">
              <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest block">Series Registradas</span>
              <span className="text-base font-extrabold text-foreground mt-0.5 block">{totalSets} series completas</span>
            </div>
            <div className="border-t border-border/40 pt-3">
              <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest block">Dificultad Percibida</span>
              <span className="text-base font-extrabold text-foreground mt-0.5 block">{postDifficulty}/10 RPE</span>
            </div>
          </div>

          <Button
            onClick={handleReturnToPreview}
            className="w-full rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-black text-sm uppercase tracking-wider py-5 cursor-pointer shadow-lg shadow-emerald-500/20 relative z-10"
          >
            Volver a mis entrenamientos
          </Button>
        </motion.div>
      </div>
    );
  };

  if (loading && workoutState === 'preview') {
    return (
      <div className="flex h-[75vh] flex-col items-center justify-center space-y-4">
        <div className="relative flex h-16 w-16 items-center justify-center">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-25"></span>
          <Dumbbell className="h-8 w-8 text-emerald-500 animate-pulse relative z-10" />
        </div>
        <p className="text-muted-foreground font-semibold text-sm animate-pulse">
          Sincronizando con FITTO Cloud...
        </p>
      </div>
    );
  }

  // Active Companion States Render delegation
  if (workoutState === "pre_feedback") {
    return renderPreFeedbackScreen();
  }
  if (workoutState === "active") {
    return renderActiveCompanionScreen();
  }
  if (workoutState === "post_feedback") {
    return renderPostFeedbackScreen();
  }
  if (workoutState === "celebration") {
    return renderCelebrationScreen();
  }

  // Render Generating Loader State
  if (isGenerating) {
    return (
      <AnimatePresence>
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex h-[75vh] flex-col items-center justify-center space-y-6 max-w-lg mx-auto text-center px-6"
        >
          <div className="relative h-24 w-24">
            <div className="absolute inset-0 rounded-full border-4 border-emerald-500/10 border-t-emerald-500 animate-spin" />
            <div className="absolute inset-2 rounded-full border-4 border-teal-500/10 border-b-teal-500 animate-spin [animation-duration:1.5s]" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="h-8 w-8 text-emerald-500 animate-pulse" />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black tracking-tight text-foreground">GENERANDO TU PLAN INTELIGENTE</h2>
            <p className="text-sm font-semibold text-muted-foreground">Esto tomará de 8 a 25 segundos mientras estructuramos tu rutina.</p>
          </div>
          <div className="bg-card/50 backdrop-blur-md border border-border/40 p-4 rounded-2xl w-full flex items-center justify-center min-h-[64px] shadow-sm">
            <motion.p 
              key={loadingIndex}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="text-emerald-500 font-extrabold tracking-wide uppercase text-xs"
            >
              {loadingMessages[loadingIndex]}
            </motion.p>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  const primaryGoalLabels: Record<string, string> = {
    muscle_gain: "Ganancia Muscular",
    fat_loss: "Pérdida de Grasa",
    strength: "Fuerza Absoluta",
    endurance: "Resistencia Cardiovascular",
    health: "Salud Integral"
  };

  // State 1: No Plan Active or Expired
  if (planState === "no_plan" || planState === "expired" || !plan) {
    const isExpired = planState === "expired";
    return (
      <div className="space-y-8 max-w-4xl mx-auto pb-12">
        <div className="border-b border-border/40 pb-6">
          <h1 className="text-3xl font-black tracking-tight text-foreground">
            {isExpired ? "Renovación de Plan" : "Rutina Inteligente"}
          </h1>
          <p className="text-sm font-semibold text-muted-foreground mt-1">
            {isExpired 
              ? "Tu ciclo anterior de entrenamiento ha concluido. Rediseña tu rutina para seguir progresando hacia tus metas."
              : "Diseña entrenamientos basados en ciencia aplicados a tus objetivos reales de salud y rendimiento."
            }
          </p>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-[2.5rem] border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent p-8 md:p-10 shadow-lg text-center"
        >
          <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />
          
          <div className="max-w-2xl mx-auto space-y-6 relative z-10 flex flex-col items-center">
            <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/15 text-[11px] font-black text-emerald-600 uppercase tracking-widest leading-none select-none">
              <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
              <span>{isExpired ? "Plan Anterior Concluido" : "Diagnóstico Onboarding Listo"}</span>
            </div>

            <div className="space-y-2">
              <h2 className="text-3xl font-black text-foreground tracking-tight md:text-4xl">
                {isExpired ? "¡Tu plan anterior ha finalizado!" : "¿Listo para tu Plan de Entrenamiento?"}
              </h2>
              <p className="text-sm md:text-base font-medium text-muted-foreground leading-relaxed">
                {isExpired
                  ? "Para seguir rompiendo mesetas y consolidar tus ganancias, la IA de FITTO reconstruirá tu rutina de 4 semanas incorporando tu progreso acumulado."
                  : "El motor de Inteligencia Artificial de FITTO procesará tus datos biométricos, restricciones de equipamiento y metas de salud para estructurar la progresión óptima de 4 semanas."
                }
              </p>
            </div>

            {userProfile && (
              <div className="w-full bg-card/60 backdrop-blur-sm border border-border/40 rounded-3xl p-6 text-left grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block">Objetivo Primario:</span>
                  <span className="text-sm font-bold text-foreground">{primaryGoalLabels[userProfile.primary_goal] || "Plan General"}</span>
                </div>
                <div>
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block">Compromiso Semanal:</span>
                  <span className="text-sm font-bold text-foreground">{userProfile.available_days_per_week} días disponibles ({userProfile.session_duration_minutes} min/sesión)</span>
                </div>
                <div>
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block">Condición Física / Lesión:</span>
                  <span className="text-sm font-bold text-foreground flex items-center gap-1.5 mt-0.5">
                    {userProfile.has_active_injury ? (
                      <>
                        <ShieldAlert className="h-4 w-4 text-amber-500" />
                        <span className="text-amber-600 font-semibold">Lesión Activa Registrada</span>
                      </>
                    ) : (
                      <>
                        <Heart className="h-4 w-4 text-emerald-500" />
                        <span>Sin Lesiones Activas</span>
                      </>
                    )}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block">Lugar / Equipo:</span>
                  <span className="text-xs font-bold text-foreground truncate block">
                    {userProfile.training_environment === "gym" ? "Gimnasio Comercial" : "En Casa"} • {userProfile.available_equipment?.length || 0} accesorios
                  </span>
                </div>
              </div>
            )}

            <Button 
              onClick={handleGeneratePlan}
              className="rounded-full px-10 py-7 font-black text-base shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all bg-emerald-500 hover:bg-emerald-600 text-white flex items-center gap-2 mt-4 cursor-pointer"
            >
              <span>{isExpired ? "Renovar Mi Plan De Entrenamiento" : "Generar Mi Plan De Entrenamiento"}</span>
              <ArrowRight className="h-5 w-5 stroke-[2.5]" />
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  // State 2: Plan is Active - Parse current plan structures
  const planJson = plan.plan_json;
  const currentWeek = planJson.weeks?.find((w: any) => w.week_number === activeWeek) || planJson.weeks?.[0];

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Estilos específicos de impresión premium en PDF */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          aside, header, nav, footer, [role="navigation"], .sidebar, .navbar, .print-hidden, 
          button, .btn, .select-none, .print\\:hidden {
            display: none !important;
          }

          html, body, .h-screen, [class*="h-screen"], .overflow-hidden, [class*="overflow-hidden"], main, div[class*="overflow-y-auto"] {
            height: auto !important;
            min-height: initial !important;
            overflow: visible !important;
            position: initial !important;
          }

          html, body {
            background: #ffffff !important;
            color: #0f172a !important;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          main {
            padding-left: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            overflow: visible !important;
            height: auto !important;
          }

          .p-4, .lg\\:p-8 {
            padding: 0 !important;
            margin: 0 !important;
          }

          #print-area {
            display: block !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 12mm 15mm !important;
            box-sizing: border-box !important;
          }

          .print-banner {
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
            border-bottom: 2px solid #10b981 !important;
            padding-bottom: 8px !important;
            margin-bottom: 20px !important;
          }

          .print-banner h4 {
            font-size: 20px !important;
            font-weight: 900 !important;
            color: #047857 !important;
            margin: 0 !important;
            letter-spacing: -0.03em !important;
          }

          h1.print-plan-title {
            font-size: 24px !important;
            font-weight: 900 !important;
            color: #0f172a !important;
            margin-top: 8px !important;
            margin-bottom: 8px !important;
            text-transform: uppercase !important;
          }

          .print-plan-description {
            font-size: 13px !important;
            line-height: 1.5 !important;
            color: #475569 !important;
            margin-bottom: 16px !important;
          }

          .print-reasoning-card {
            background-color: #f8fafc !important;
            border: 1px solid #e2e8f0 !important;
            border-left: 4px solid #10b981 !important;
            border-radius: 12px !important;
            padding: 16px !important;
            margin-bottom: 16px !important;
            page-break-inside: avoid !important;
          }

          .print-reasoning-card h3 {
            font-size: 12px !important;
            text-transform: uppercase !important;
            color: #047857 !important;
            font-weight: 800 !important;
            margin: 0 0 6px 0 !important;
          }

          .print-reasoning-card p {
            font-size: 12px !important;
            line-height: 1.45 !important;
            color: #334155 !important;
            margin: 0 !important;
          }

          .print-safety-alert {
            background-color: #fffbeb !important;
            border: 1px solid #fef3c7 !important;
            border-left: 4px solid #f59e0b !important;
            border-radius: 12px !important;
            padding: 14px !important;
            margin-bottom: 16px !important;
            page-break-inside: avoid !important;
          }

          .print-safety-alert h4 {
            font-size: 12px !important;
            text-transform: uppercase !important;
            color: #b45309 !important;
            font-weight: 800 !important;
            margin: 0 0 4px 0 !important;
          }

          .print-safety-alert li {
            font-size: 11px !important;
            color: #78350f !important;
            line-height: 1.45 !important;
          }

          .print-nutrition-card {
            border: 1px solid #e2e8f0 !important;
            border-radius: 14px !important;
            padding: 16px !important;
            background: #ffffff !important;
            page-break-inside: avoid !important;
            margin-bottom: 20px !important;
          }

          .print-nutrition-card h3 {
            font-size: 13px !important;
            font-weight: 800 !important;
            color: #0f172a !important;
            border-bottom: 1px solid #f1f5f9 !important;
            padding-bottom: 6px !important;
            margin-top: 0 !important;
            margin-bottom: 12px !important;
          }

          .print-nutrition-grid {
            display: grid !important;
            grid-template-cols: 1fr 1fr !important;
            gap: 12px !important;
            margin-bottom: 12px !important;
          }

          .print-nutrition-stat {
            border: 1px solid #f1f5f9 !important;
            padding: 10px 12px !important;
            border-radius: 10px !important;
            background: #f8fafc !important;
          }

          .print-nutrition-stat-title {
            font-size: 9px !important;
            font-weight: 800 !important;
            text-transform: uppercase !important;
            color: #64748b !important;
          }

          .print-nutrition-stat-value {
            font-size: 18px !important;
            font-weight: 900 !important;
            color: #0f172a !important;
            margin-top: 2px !important;
            display: block !important;
          }

          .print-nutrition-stat-value span {
            font-size: 10px !important;
            color: #64748b !important;
            font-weight: 700 !important;
          }

          .print-day-card {
            display: block !important;
            border: 2px solid #cbd5e1 !important;
            border-radius: 16px !important;
            margin-top: 0 !important;
            margin-bottom: 20px !important;
            background: #ffffff !important;
            box-shadow: none !important;
            break-before: page !important;
            page-break-before: always !important;
            page-break-inside: auto !important;
          }

          .print-day-header {
            background-color: #f8fafc !important;
            border-bottom: 2px solid #cbd5e1 !important;
            padding: 16px 20px !important;
            display: flex !important;
            flex-direction: column !important;
          }

          .print-day-title-block {
            display: flex !important;
            align-items: center !important;
            gap: 10px !important;
          }

          .print-day-number-badge {
            width: 34px !important;
            height: 34px !important;
            border-radius: 50% !important;
            background-color: #10b981 !important;
            color: #ffffff !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            font-size: 15px !important;
            font-weight: 900 !important;
          }

          .print-day-title-text {
            font-size: 16px !important;
            font-weight: 900 !important;
            color: #0f172a !important;
            margin: 0 !important;
            letter-spacing: -0.02em !important;
          }

          .print-day-meta-text {
            font-size: 11px !important;
            font-weight: 700 !important;
            color: #64748b !important;
            margin-top: 2px !important;
          }

          .print-day-duration-badge {
            font-size: 11px !important;
            font-weight: 800 !important;
            color: #047857 !important;
            background-color: #ecfdf5 !important;
            border: 1.5px solid #bbf7d0 !important;
            padding: 4px 12px !important;
            border-radius: 20px !important;
          }

          .print-day-exercises-index {
            display: flex !important;
            flex-wrap: wrap !important;
            gap: 8px !important;
            border-top: 1px solid #e2e8f0 !important;
            padding-top: 8px !important;
            margin-top: 4px !important;
          }

          .print-day-exercises-container {
            padding: 20px 16px !important;
            background-color: #ffffff !important;
            display: block !important;
          }

          .print-rest-day-card {
            display: block !important;
            break-before: avoid !important;
            page-break-before: avoid !important;
            page-break-inside: avoid !important;
            border: 1.5px dashed #cbd5e1 !important;
            border-radius: 12px !important;
            padding: 12px 16px !important;
            margin-bottom: 12px !important;
            background-color: #f8fafc !important;
          }

          .print-rest-day-card h3 {
            font-size: 12px !important;
            font-weight: 800 !important;
            color: #0f172a !important;
            margin: 0 !important;
          }

          .print-rest-day-card p {
            font-size: 11px !important;
            color: #64748b !important;
            margin: 2px 0 0 0 !important;
          }

          .print-exercise-card {
            display: block !important;
            border: 2px solid #e2e8f0 !important;
            border-radius: 12px !important;
            padding: 16px 18px !important;
            margin-bottom: 16px !important;
            background: #ffffff !important;
            page-break-inside: avoid !important;
            box-shadow: none !important;
          }

          .print-exercise-grid {
            display: flex !important;
            flex-direction: row !important;
            gap: 20px !important;
            align-items: flex-start !important;
          }

          .print-exercise-image-wrapper {
            width: 200px !important;
            flex-shrink: 0 !important;
            display: block !important;
          }

          .print-exercise-image-wrapper img {
            width: 100% !important;
            max-height: 110px !important;
            object-fit: contain !important;
            border: 1.5px solid #cbd5e1 !important;
            border-radius: 8px !important;
            background: #ffffff !important;
          }

          .print-exercise-details-wrapper {
            flex-grow: 1 !important;
            display: block !important;
          }

          .print-exercise-header {
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
            margin-bottom: 8px !important;
          }

          .print-exercise-name-block {
            display: flex !important;
            align-items: center !important;
            gap: 8px !important;
          }

          .print-exercise-number {
            width: 24px !important;
            height: 24px !important;
            border-radius: 50% !important;
            background-color: #10b981 !important;
            color: #ffffff !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            font-size: 11px !important;
            font-weight: 900 !important;
          }

          .print-exercise-name {
            font-size: 16px !important;
            font-weight: 900 !important;
            color: #0f172a !important;
            margin: 0 !important;
            letter-spacing: -0.02em !important;
          }

          .print-exercise-badge {
            font-size: 8px !important;
            font-weight: 800 !important;
            text-transform: uppercase !important;
            color: #475569 !important;
            background-color: #f1f5f9 !important;
            padding: 2px 6px !important;
            border-radius: 4px !important;
          }

          .print-exercise-stats-row {
            display: flex !important;
            flex-direction: row !important;
            gap: 20px !important;
            background-color: #f0fdf4 !important;
            border: 1.5px solid #bbf7d0 !important;
            border-radius: 8px !important;
            padding: 8px 16px !important;
            margin-bottom: 12px !important;
            align-items: center !important;
          }

          .print-exercise-stat-item {
            font-size: 13px !important;
            font-weight: 900 !important;
            color: #065f46 !important;
          }

          .print-exercise-stat-item span {
            font-size: 9.5px !important;
            font-weight: 800 !important;
            color: #047857 !important;
            text-transform: uppercase !important;
            margin-right: 6px !important;
            letter-spacing: 0.05em !important;
          }

          .print-exercise-text-section {
            margin-bottom: 8px !important;
          }

          .print-exercise-text-section span {
            font-size: 8.5px !important;
            font-weight: 800 !important;
            text-transform: uppercase !important;
            color: #64748b !important;
            display: block !important;
            margin-bottom: 2px !important;
          }

          .print-exercise-text-section p {
            font-size: 11px !important;
            line-height: 1.4 !important;
            color: #334155 !important;
            margin: 0 !important;
          }

          .print-exercise-why-this p {
            color: #047857 !important;
            font-weight: 600 !important;
          }

          .print-exercise-cues-box {
            background-color: #f8fafc !important;
            border: 1px solid #e2e8f0 !important;
            border-radius: 6px !important;
            padding: 8px 10px !important;
            margin-top: 8px !important;
          }

          .print-exercise-cues-box-title {
            font-size: 8.5px !important;
            font-weight: 800 !important;
            text-transform: uppercase !important;
            color: #475569 !important;
            margin-bottom: 2px !important;
          }

          .print-exercise-cues-box ul {
            margin: 0 !important;
            padding-left: 12px !important;
          }

          .print-exercise-cues-box li {
            font-size: 10px !important;
            line-height: 1.35 !important;
            color: #475569 !important;
            margin-bottom: 1px !important;
          }
        }
      `}} />

      {/* ==================================================== */}
      {/* 1. SCREEN ONLY VIEW (Fully Interactive Companion)     */}
      {/* ==================================================== */}
      <div className="space-y-8 print:hidden">
        {/* Header section with general plan context */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-border/40 pb-6 select-none">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-bold leading-none select-none">
              <Activity className="h-3.5 w-3.5" />
              <span>Plataforma de Rutinas Activa</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-foreground uppercase">{plan.title}</h1>
            <p className="text-sm font-semibold text-muted-foreground leading-relaxed mt-1">
              {plan.description}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 select-none">
            <Button 
              variant="outline" 
              onClick={() => window.print()} 
              className="rounded-full border-border hover:bg-card text-xs font-bold py-5 px-5 gap-1.5 flex items-center cursor-pointer"
            >
              <Printer className="h-3.5 w-3.5 text-primary" />
              <span>Descargar PDF</span>
            </Button>

            <Button 
              variant="outline" 
              onClick={() => setShowRegenerateModal(true)} 
              className="rounded-full border-border hover:bg-card text-xs font-bold py-5 px-5 gap-1.5 cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Regenerar Rutina</span>
            </Button>
          </div>
        </div>

        {/* AI Summary and Reasoning */}
        <Card className="border-emerald-500/15 bg-emerald-500/5 shadow-sm rounded-3xl overflow-hidden relative select-none">
          <div className="absolute top-0 right-0 p-5 opacity-5 pointer-events-none">
            <Sparkles className="w-16 h-16 text-emerald-500" />
          </div>
          <CardContent className="p-6 md:p-8 space-y-3">
            <h3 className="font-extrabold text-sm uppercase tracking-wider text-emerald-600 flex items-center gap-1.5">
              <Sparkles className="h-4 w-4" /> Diagnóstico y Progresión AI
            </h3>
            <p className="text-sm md:text-base font-semibold leading-relaxed text-muted-foreground">
              {plan.generation_summary || planJson.reasoning}
            </p>
            <div className="flex flex-wrap gap-4 pt-2 text-xs text-muted-foreground font-bold">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-primary" /> {plan.total_weeks} Semanas Totales
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-500" /> Enfoque: {plan.focus || planJson.program?.focus}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Safety Considerations Alert Block */}
        {planJson.safety_considerations?.length > 0 && (
          <div className="bg-amber-500/10 border-l-4 border-amber-500 p-5 rounded-r-3xl rounded-l-md shadow-sm space-y-2 select-none">
            <h4 className="font-extrabold text-sm text-amber-600 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4" /> Instrucción de Seguridad Médica
            </h4>
            <ul className="text-xs md:text-sm font-semibold text-amber-700/90 leading-relaxed space-y-1 list-disc list-inside">
              {planJson.safety_considerations.map((safety: string, idx: number) => (
                <li key={idx} className="marker:text-amber-500">{safety}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Week Tabs Navigation */}
        <div className="space-y-4 select-none">
          <div className="flex items-center justify-between border-b border-border/40 pb-2">
            <h2 className="text-lg font-black tracking-tight text-foreground">Fases del Plan</h2>
            <span className="text-xs font-bold text-muted-foreground">Semana {activeWeek} de {plan.total_weeks}</span>
          </div>
          
          <div className="flex gap-2.5 overflow-x-auto pb-2 select-none">
            {planJson.weeks?.map((week: any) => (
              <button
                key={week.week_number}
                onClick={() => setActiveWeek(week.week_number)}
                className={`flex-shrink-0 px-6 py-3.5 rounded-full text-xs font-extrabold transition-all duration-300 flex items-center gap-2 cursor-pointer ${
                  activeWeek === week.week_number 
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-105" 
                    : "bg-card border border-border/50 text-muted-foreground hover:bg-accent/40"
                }`}
              >
                <span>Semana {week.week_number}</span>
                {week.is_deload && (
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 font-bold shrink-0 uppercase tracking-widest">
                    Deload
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Active Week details */}
          {currentWeek && (
            <div className="p-4 rounded-2xl bg-card border border-border/50 text-xs md:text-sm font-semibold text-muted-foreground flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block">Objetivo de la Fase:</span>
                <p className="text-foreground font-bold">{currentWeek.description}</p>
              </div>
              <div className="flex gap-6 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-border/40">
                <div>
                  <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest block">Intensidad:</span>
                  <span className="font-extrabold text-foreground">{currentWeek.intensity_focus}</span>
                </div>
                <div>
                  <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest block">Volumen:</span>
                  <span className="font-extrabold text-foreground">{currentWeek.volume_focus}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Day Cards Loop */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight select-none">Estructura Semanal de Entrenamientos</h2>
          <div className="grid grid-cols-1 gap-4">
            {currentWeek?.days?.map((day: any) => {
              const isCompleted = completedDays[`${activeWeek}-${day.day_index}`];

              if (day.is_rest_day) {
                return (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={day.day_index}
                    className="p-6 border border-border/40 bg-card/40 backdrop-blur-sm rounded-[2rem] flex flex-col sm:flex-row justify-between sm:items-center gap-4 relative overflow-hidden group select-none"
                  >
                    <div className="absolute top-0 right-0 p-5 opacity-5 pointer-events-none">
                      <Heart className="w-12 h-12 text-emerald-500" />
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-black select-none text-sm shrink-0">
                        D{day.day_index}
                      </div>
                      <div>
                        <h3 className="font-bold text-foreground text-base">Día {day.day_index}: Recuperación Activa</h3>
                        <p className="text-xs font-semibold text-muted-foreground mt-0.5">
                          {day.focus || "Descanso completo, hidratación y estiramiento ligero."}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-extrabold px-4 py-2 bg-emerald-500/10 text-emerald-600 rounded-full shrink-0 uppercase tracking-widest self-start sm:self-auto leading-none">
                      Descanso
                    </span>
                  </motion.div>
                );
              }

              return (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={day.day_index}
                >
                  <details open className="border border-border/50 bg-card rounded-[2rem] overflow-hidden group shadow-sm transition-all duration-300 open:border-emerald-500/20 [&_summary::-webkit-details-marker]:hidden">
                    <summary className="p-6 cursor-pointer select-none list-none flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:bg-accent/20">
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-sm shrink-0 transition-colors ${
                          isCompleted 
                            ? "bg-amber-500 text-white" 
                            : "bg-primary/10 text-primary"
                        }`}>
                          {isCompleted ? <Trophy className="h-5 w-5 text-white" /> : `D${day.day_index}`}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-foreground text-base group-open:text-primary transition-colors">
                              Día {day.day_index}: {day.title}
                            </h3>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground font-bold">
                            <span>{day.focus}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" /> {day.estimated_duration_minutes} min
                            </span>
                            <span>•</span>
                            <span>{day.items?.length || 0} ejercicios</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto select-none">
                        <Button
                          size="sm"
                          variant={isCompleted ? "secondary" : "outline"}
                          onClick={(e) => {
                            e.preventDefault();
                            toggleDayCompletedLocal(activeWeek, day.day_index);
                          }}
                          className={`rounded-full text-[11px] font-black h-8 px-4 uppercase tracking-wider ${
                            isCompleted 
                              ? "bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border-transparent" 
                              : "border-border hover:bg-card"
                          }`}
                        >
                          {isCompleted ? "Completado ✓" : "Sin Registrar"}
                        </Button>
                        <div className="p-1 rounded-full text-muted-foreground border border-border group-open:rotate-180 transition-transform">
                          <ChevronDown className="h-4 w-4" />
                        </div>
                      </div>
                    </summary>

                    {/* Day Exercise Items desglosado */}
                    <div className="px-6 pb-6 border-t border-border/40 pt-4 bg-accent/5 space-y-4">
                      
                      {/* Active companion direct launcher banner */}
                      <div className="flex flex-col sm:flex-row justify-between items-center bg-card border border-emerald-500/10 p-5 rounded-2xl gap-4 shadow-sm select-none">
                        <div>
                          <h4 className="font-extrabold text-sm text-foreground uppercase tracking-wider flex items-center gap-1">
                            <Activity className="h-4 w-4 text-emerald-500" /> Acompañante de Entrenamiento Activo
                          </h4>
                          <p className="text-xs text-muted-foreground mt-1">Inicia la sesión interactiva para registrar tus series, repeticiones y pesos en vivo.</p>
                        </div>
                        <Button
                          onClick={(e) => {
                            e.preventDefault();
                            handleStartWorkout(day);
                          }}
                          className="rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs px-6 py-4 uppercase tracking-wider shadow-lg shadow-emerald-500/15 cursor-pointer shrink-0 flex items-center gap-1.5"
                        >
                          <Play className="h-3.5 w-3.5 fill-current" />
                          <span>Empezar Entrenamiento</span>
                        </Button>
                      </div>

                      {day.items?.map((item: any, idx: number) => (
                        <ExerciseItemCard key={idx} item={item} idx={idx} />
                      ))}
                    </div>
                  </details>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Nutrition Plan Guidance block */}
        {planJson.nutrition_guidance && (
          <Card className="border-border/50 bg-card rounded-[2.5rem] overflow-hidden shadow-md select-none">
            <CardHeader className="border-b border-border/30 pb-4">
              <CardTitle className="text-lg font-black tracking-tight text-foreground flex items-center gap-2">
                <Apple className="h-5 w-5 text-emerald-500" /> Guía Nutricional Personalizada
              </CardTitle>
              <CardDescription className="text-xs font-semibold">Recomendaciones adaptadas para complementar tu desgaste físico hoy.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 md:p-8 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="bg-accent/20 rounded-2xl p-5 border border-border/40 flex flex-col justify-center">
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block">Presupuesto Calórico Diario:</span>
                  <span className="text-3xl font-black text-foreground mt-1.5">
                    ~{planJson.nutrition_guidance.daily_calories_estimate} <span className="text-sm font-bold text-muted-foreground">kcal/día</span>
                  </span>
                  <span className="text-xs font-semibold text-muted-foreground mt-1 block">Para sostener el déficit/superávit programado.</span>
                </div>
                <div className="bg-emerald-500/5 rounded-2xl p-5 border border-emerald-500/10 flex flex-col justify-center">
                  <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest block">Meta de Macronutriente Proteico:</span>
                  <span className="text-3xl font-black text-emerald-600 mt-1.5">
                    {planJson.nutrition_guidance.protein_grams}g <span className="text-sm font-bold text-emerald-600/80">proteína/día</span>
                  </span>
                  <span className="text-xs font-semibold text-emerald-700/80 mt-1 block">Para reparación y mantenimiento muscular.</span>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block select-none">Enfoque Nutricional AI:</span>
                <p className="text-xs md:text-sm font-semibold text-muted-foreground leading-relaxed">
                  {planJson.nutrition_guidance.approach}
                </p>
              </div>

              {planJson.nutrition_guidance.key_recommendations?.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block select-none">Recomendaciones Clave:</span>
                  <ul className="text-xs md:text-sm font-semibold text-muted-foreground space-y-2 leading-relaxed">
                    {planJson.nutrition_guidance.key_recommendations.map((rec: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <ChevronRight className="h-4.5 w-4.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Regeneration Modal Dialog */}
        {showRegenerateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm select-none">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-card border border-border/80 rounded-[2.5rem] max-w-md w-full p-6 md:p-8 space-y-6 shadow-2xl"
            >
              <div className="flex items-center gap-3 text-amber-500">
                <AlertTriangle className="h-8 w-8 shrink-0" />
                <h3 className="text-xl font-black text-foreground tracking-tight">¿Regenerar Plan?</h3>
              </div>
              
              <div className="space-y-3">
                <p className="text-xs md:text-sm font-medium text-muted-foreground leading-relaxed">
                  Esto archivará tu plan inteligente de entrenamiento vigente en tu historial (quedará marcado como <code className="px-1.5 py-0.5 rounded bg-muted text-xs">superseded</code>). 
                </p>
                <p className="text-xs md:text-sm font-semibold text-amber-600/90 bg-amber-500/10 p-3.5 rounded-2xl leading-relaxed">
                  Nuestra Inteligencia Artificial consumirá tokens para rediseñar un plan completamente nuevo basado en tus últimos datos de onboarding actualizados (lesiones, salud y equipamiento).
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowRegenerateModal(false)}
                  className="rounded-full flex-1 font-bold h-12 border-border hover:bg-card cursor-pointer"
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleGeneratePlan}
                  className="rounded-full flex-1 font-black h-12 bg-amber-500 hover:bg-amber-600 text-white cursor-pointer shadow-md"
                >
                  Confirmar y Generar
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </div>

      {/* ==================================================== */}
      {/* 2. PRINT ONLY VIEW (Premium Static Vector A4 PDF)     */}
      {/* ==================================================== */}
      <div className="hidden print:block space-y-6" id="print-area">
        {/* --- PAGE 1: COVER PAGE & DIAGNOSTIC --- */}
        <div className="space-y-6">
          <div className="print-banner">
            <div>
              <h4>FITTO</h4>
              <p className="text-[9px] text-slate-400 uppercase tracking-widest font-extrabold">Inteligencia Artificial aplicada al Deporte</p>
            </div>
            <div className="text-right">
              <span className="text-xs font-black text-slate-800">SEMANA {activeWeek} DE {plan.total_weeks}</span>
              <p className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider">Planificación Semanal</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="inline-flex px-2.5 py-0.5 rounded bg-emerald-50 border border-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-wider">
              Rutina Deportiva Inteligente
            </div>
            <h1 className="print-plan-title">{plan.title}</h1>
            <p className="print-plan-description">{plan.description}</p>
          </div>

          <div className="grid grid-cols-3 gap-4 border-y border-slate-100 py-3 text-slate-600">
            <div>
              <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-wider block">Fase / Enfoque Semanal:</span>
              <span className="text-xs font-black text-slate-800">{plan.focus || planJson.program?.focus || "Acondicionamiento"}</span>
            </div>
            <div>
              <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-wider block">Duración del Bloque:</span>
              <span className="text-xs font-black text-slate-800">{plan.total_weeks} Semanas Totales</span>
            </div>
            <div>
              <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-wider block">Dificultad e Intensidad:</span>
              <span className="text-xs font-black text-slate-800">{currentWeek?.intensity_focus || "Progresiva"}</span>
            </div>
          </div>

          <div className="print-reasoning-card">
            <h3>Diagnóstico del Coach AI</h3>
            <p>{plan.generation_summary || planJson.reasoning}</p>
          </div>

          {planJson.safety_considerations?.length > 0 && (
            <div className="print-safety-alert">
              <h4>Consideraciones de Seguridad Médica</h4>
              <ul className="list-disc list-inside space-y-1">
                {planJson.safety_considerations.map((safety: string, idx: number) => (
                  <li key={idx}>{safety}</li>
                ))}
              </ul>
            </div>
          )}

          {planJson.nutrition_guidance && (
            <div className="print-nutrition-card">
              <h3>Guía de Soporte Nutricional Diario</h3>
              <div className="print-nutrition-grid">
                <div className="print-nutrition-stat">
                  <span className="print-nutrition-stat-title">Presupuesto Calórico Diario</span>
                  <span className="print-nutrition-stat-value">
                    ~{planJson.nutrition_guidance.daily_calories_estimate} <span>kcal/día</span>
                  </span>
                </div>
                <div className="print-nutrition-stat">
                  <span className="print-nutrition-stat-title">Meta Proteica Recomendada</span>
                  <span className="print-nutrition-stat-value">
                    {planJson.nutrition_guidance.protein_grams}g <span>de proteína</span>
                  </span>
                </div>
              </div>
              <p className="print-nutrition-desc">{planJson.nutrition_guidance.approach}</p>
              {planJson.nutrition_guidance.key_recommendations?.length > 0 && (
                <div className="border-t border-slate-100 pt-3 mt-3">
                  <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1.5">Recomendaciones Nutricionales Clave:</span>
                  <ul className="list-disc list-inside space-y-1 text-slate-600 text-xs font-semibold">
                    {planJson.nutrition_guidance.key_recommendations.map((rec: string, idx: number) => (
                      <li key={idx}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* --- PAGES 2+: WORKOUT ROUTINES BY DAY --- */}
        <div className="space-y-4">
          {currentWeek?.days?.map((day: any) => {
            if (day.is_rest_day) {
              return (
                <div key={day.day_index} className="print-rest-day-card">
                  <h3>Día {day.day_index}: Recuperación Activa</h3>
                  <p>{day.focus || "Descanso completo para asimilación de cargas, hidratación y estiramientos."}</p>
                </div>
              );
            }

            return (
              <div key={day.day_index} className="print-day-card">
                <div className="print-day-header flex flex-col gap-3">
                  <div className="w-full flex justify-between items-center">
                    <div className="print-day-title-block">
                      <div className="print-day-number-badge">
                        {day.day_index}
                      </div>
                      <div>
                        <h3 className="print-day-title-text">Día {day.day_index}: {day.title}</h3>
                        <p className="print-day-meta-text">{day.focus}</p>
                      </div>
                    </div>
                    <span className="print-day-duration-badge">
                      {day.estimated_duration_minutes} min • {day.items?.length || 0} Ejercicios
                    </span>
                  </div>

                  {day.items?.length > 0 && (
                    <div className="print-day-exercises-index w-full border-t border-slate-200/60 pt-2.5 mt-1 flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] font-black text-slate-500 uppercase tracking-wide">
                      <span className="text-[9px] text-slate-400 font-extrabold tracking-widest block self-center">Rutina:</span>
                      {day.items.map((item: any, itemIdx: number) => (
                        <span key={itemIdx} className="flex items-center gap-1">
                          <span className="text-[10px] text-slate-700 font-black">{itemIdx + 1}.</span>
                          <span className="text-slate-600 font-extrabold">{item.exercise_name}</span>
                          <span className="text-[9px] text-emerald-600 font-black">({item.config?.sets}x{item.config?.reps})</span>
                          {itemIdx < day.items.length - 1 && <span className="text-slate-300 ml-2">→</span>}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="print-day-exercises-container">
                  {day.items?.map((item: any, idx: number) => (
                    <PrintExerciseCard key={idx} item={item} idx={idx} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Dedicated ExerciseItemCard component to handle custom caching hooks and fallback descriptions
function ExerciseItemCard({ item, idx }: { item: any; idx: number }) {
  const { data: catalogData } = useExerciseCatalog(item.exercise_name, item.primary_muscles);
  
  const description = 
    item.how_to 
    || catalogData?.instructions_short_en 
    || (item.execution_cues?.length > 0 ? item.execution_cues.join(' ') : null);

  return (
    <div className="p-4 md:p-5 rounded-2xl border border-border/40 bg-card hover:border-emerald-500/15 transition-all shadow-inner space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
        <div className="md:col-span-1">
          <ExerciseImage 
            exerciseName={item.exercise_name}
            muscles={item.primary_muscles}
            className="w-full h-32 md:h-36"
            showSecondary={true}
          />
        </div>

        <div className="md:col-span-2 space-y-3">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-xs select-none">
                {item.position || idx + 1}
              </div>
              <h4 className="font-extrabold text-foreground text-sm md:text-base">
                {item.exercise_name}
              </h4>
            </div>
            
            <span className="text-[9px] px-2.5 py-1 bg-muted border border-border/60 text-muted-foreground rounded-full font-black uppercase tracking-wider select-none">
              {item.item_type}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 py-2 border-y border-border/30 text-xs font-bold text-muted-foreground">
            <div>
              <span className="text-[9px] text-muted-foreground/60 uppercase block">Series:</span>
              <span className="font-black text-foreground text-sm">{item.config?.sets}</span>
            </div>
            <div className="h-6 w-px bg-border/40" />
            <div>
              <span className="text-[9px] text-muted-foreground/60 uppercase block">Reps / Tiempo:</span>
              <span className="font-black text-foreground text-sm">{item.config?.reps}</span>
            </div>
            {item.config?.rest_seconds > 0 && (
              <>
                <div className="h-6 w-px bg-border/40" />
                <div>
                  <span className="text-[9px] text-muted-foreground/60 uppercase block">Descanso:</span>
                  <span className="font-black text-foreground text-sm">{item.config?.rest_seconds}s</span>
                </div>
              </>
            )}
            {item.config?.tempo && (
              <>
                <div className="h-6 w-px bg-border/40" />
                <div>
                  <span className="text-[9px] text-muted-foreground/60 uppercase block">Tempo:</span>
                  <span className="font-black text-foreground text-sm">{item.config?.tempo}</span>
                </div>
              </>
            )}
          </div>

          {description && (
            <div className="space-y-1">
              <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest block select-none">
                Instrucciones de movimiento
              </span>
              <p className="text-xs md:text-sm font-semibold text-foreground/85 leading-relaxed">
                {description}
              </p>
            </div>
          )}

          {item.why_this && (
            <div className="space-y-1">
              <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest block flex items-center gap-1 select-none">
                <Sparkles className="h-3 w-3" /> ¿Por qué este ejercicio?
              </span>
              <p className="text-xs font-semibold text-muted-foreground leading-relaxed">
                {item.why_this}
              </p>
            </div>
          )}

          {((item.execution_cues && item.execution_cues.length > 0) || (catalogData?.instructions_en && catalogData.instructions_en.length > 0)) && (
            <div className="bg-accent/20 rounded-xl p-3.5 space-y-2.5">
              {item.execution_cues?.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest block flex items-center gap-1 select-none">
                    <AlertCircle className="h-3 w-3 text-primary" /> Técnica de ejecución
                  </span>
                  <ul className="text-xs font-semibold text-muted-foreground space-y-1 list-disc list-inside">
                    {item.execution_cues.map((cue: string, cueIdx: number) => (
                      <li key={cueIdx} className="marker:text-primary">{cue}</li>
                    ))}
                  </ul>
                </div>
              )}

              {catalogData?.instructions_en && catalogData.instructions_en.length > 0 && (
                <div className="space-y-1 pt-2 border-t border-border/40">
                  <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest block flex items-center gap-1 select-none">
                    <FileText className="h-3 w-3 text-primary" /> Paso a paso (Referencia)
                  </span>
                  <ol className="text-xs font-semibold text-muted-foreground/80 space-y-1 list-decimal list-inside">
                    {catalogData.instructions_en.slice(0, 4).map((step: string, stepIdx: number) => (
                      <li key={stepIdx} className="marker:text-primary/75 text-left">{step}</li>
                    ))}
                  </ol>
                  <span className="text-[8px] text-muted-foreground/50 block italic">Referencia en inglés del catálogo</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Dedicated PrintExerciseCard component optimized for clean, high-contrast, non-accordion vector PDF printing
function PrintExerciseCard({ item, idx }: { item: any; idx: number }) {
  const { data: catalogData } = useExerciseCatalog(item.exercise_name, item.primary_muscles);
  
  const description = 
    item.how_to 
    || catalogData?.instructions_short_en 
    || (item.execution_cues?.length > 0 ? item.execution_cues.join(' ') : null);

  return (
    <div className="print-exercise-card">
      <div className="print-exercise-grid">
        <div className="print-exercise-image-wrapper">
          <ExerciseImage 
            exerciseName={item.exercise_name}
            muscles={item.primary_muscles}
            className="w-full h-28"
            showSecondary={true}
          />
        </div>

        <div className="print-exercise-details-wrapper space-y-2">
          <div className="print-exercise-header">
            <div className="print-exercise-name-block">
              <div className="print-exercise-number">
                {item.position || idx + 1}
              </div>
              <h4 className="print-exercise-name">
                {item.exercise_name}
              </h4>
            </div>
            <span className="print-exercise-badge">
              {item.item_type}
            </span>
          </div>

          <div className="print-exercise-stats-row">
            <div className="print-exercise-stat-item">
              <span>Series:</span>{item.config?.sets}
            </div>
            <div className="print-exercise-stat-item">
              <span>Repeticiones:</span>{item.config?.reps}
            </div>
            {item.config?.rest_seconds > 0 && (
              <div className="print-exercise-stat-item">
                <span>Descanso:</span>{item.config?.rest_seconds}s
              </div>
            )}
            {item.config?.tempo && (
              <div className="print-exercise-stat-item">
                <span>Tempo:</span>{item.config?.tempo}
              </div>
            )}
          </div>

          {description && (
            <div className="print-exercise-text-section">
              <span>Instrucciones de Ejecución</span>
              <p>{description}</p>
            </div>
          )}

          {item.why_this && (
            <div className="print-exercise-text-section print-exercise-why-this">
              <span>Por qué la IA seleccionó este ejercicio</span>
              <p>{item.why_this}</p>
            </div>
          )}

          {item.execution_cues?.length > 0 && (
            <div className="print-exercise-cues-box">
              <span className="print-exercise-cues-box-title">Técnica y Enfoque de Seguridad</span>
              <ul>
                {item.execution_cues.map((cue: string, cueIdx: number) => (
                  <li key={cueIdx}>{cue}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
