"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { 
  Dumbbell, 
  Play, 
  Square, 
  CheckCircle, 
  RotateCcw, 
  Sparkles, 
  AlertCircle, 
  ArrowRight,
  Clock,
  Zap
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface UserProfile {
  primary_goal: string;
  experience_level: string;
  training_environment: string;
  available_equipment: string[];
}

export default function WorkoutsPage() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [selectedDay, setSelectedDay] = useState(1);
  const [loading, setLoading] = useState(true);
  const [activeSession, setActiveSession] = useState(false);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [completedExercises, setCompletedExercises] = useState<number[]>([]);
  const [sessionCompleted, setSessionCompleted] = useState(false);

  // Timer effect for active session
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeSession && !sessionCompleted) {
      interval = setInterval(() => {
        setTimerSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeSession, sessionCompleted]);

  useEffect(() => {
    async function loadProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase
            .from("user_profiles")
            .select("*")
            .eq("user_id", user.id)
            .single();
          if (data) setUserProfile(data as UserProfile);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  const profile = userProfile || {
    primary_goal: "muscle_gain",
    experience_level: "intermediate",
    training_environment: "gym",
    available_equipment: ["barbell", "dumbbells", "cables"],
  };

  const isGym = profile.training_environment === "gym";
  const hasDumbbells = profile.available_equipment?.includes("dumbbells") ?? true;
  const hasBarbell = profile.available_equipment?.includes("barbell") ?? true;
  const hasCables = profile.available_equipment?.includes("cables") ?? true;

  // Generate dynamic days
  const days = [
    { id: 1, title: "Día 1: Fuerza & Empuje", focus: "Pecho, Hombro, Tríceps" },
    { id: 2, title: "Día 2: Tracción & Tracción", focus: "Espalda, Bíceps, Core" },
    { id: 3, title: "Día 3: Tren Inferior", focus: "Piernas, Glúteos, Pantorrillas" },
  ];

  // Dynamic routines based on goal and day selection
  const getExercises = () => {
    if (selectedDay === 1) {
      return [
        { name: isGym && hasBarbell ? "Press de Banca con Barra" : hasDumbbells ? "Press de Banca con Mancuernas" : "Flexiones de Pecho Estrictas", muscle: "Pecho", sets: 4, reps: "8-10", rest: 90, desc: "Mantén las escápulas retraídas y baja la barra o mancuernas de forma controlada hasta tocar ligeramente el pecho." },
        { name: hasDumbbells ? "Press Militar con Mancuernas" : "Flexiones en Pica (Pike Pushups)", muscle: "Hombros", sets: 3, reps: "10-12", rest: 75, desc: "Empuja verticalmente sin arquear excesivamente la espalda baja. Bloquea codos arriba." },
        { name: isGym && hasCables ? "Cruces de Poleas Medias" : hasDumbbells ? "Aperturas Planas con Mancuernas" : "Flexiones con Manos Juntas (Diamond)", muscle: "Pecho", sets: 3, reps: "12", rest: 60, desc: "Enfócate en la contracción en el punto medio del movimiento manteniendo un ligero arco en los codos." },
        { name: hasDumbbells ? "Copa de Tríceps con Mancuerna" : "Fondos en Banco", muscle: "Tríceps", sets: 3, reps: "12-15", rest: 60, desc: "Mantén los codos cerrados y paralelos durante toda la extensión." },
      ];
    } else if (selectedDay === 2) {
      return [
        { name: isGym && hasBarbell ? "Peso Muerto Convencional" : hasDumbbells ? "Peso Muerto Rumano con Mancuernas" : "Superman Isométrico Intensivo", muscle: "Espalda Baja & Glúteos", sets: 4, reps: "8", rest: 120, desc: "Mantén la columna neutral. Empuja las caderas hacia atrás y tracciona usando las piernas y espalda." },
        { name: hasDumbbells ? "Remo con Mancuerna a una Mano" : "Remo Invertido en Mesa o Barra", muscle: "Espalda Media", sets: 4, reps: "10 por lado", rest: 75, desc: "Lleva la mancuerna hacia tu cadera, sintiendo la contracción del dorsal. Evita rotar el torso." },
        { name: hasDumbbells ? "Curl de Bíceps Alterno con Supinación" : "Curl de Bíceps Concentrado con Toalla", muscle: "Bíceps", sets: 3, reps: "12", rest: 60, desc: "Gira la muñeca hacia afuera al subir para maximizar la contracción del bíceps." },
        { name: "Plancha Abdominal Activa", muscle: "Core", sets: 3, reps: "45 seg", rest: 45, desc: "Contrae el abdomen, los glúteos y mantén los hombros alineados con los codos." },
      ];
    } else {
      return [
        { name: isGym && hasBarbell ? "Sentadilla Trasera con Barra" : hasDumbbells ? "Sentadilla Goblet con Mancuerna" : "Sentadillas Peso Corporal Continuas", muscle: "Cuádriceps", sets: 4, reps: "10-12", rest: 90, desc: "Desciende rompiendo el paralelo (90 grados) manteniendo el pecho erguido y las rodillas estables." },
        { name: hasDumbbells ? "Zancadas Caminando con Mancuernas" : "Zancadas Inversas Peso Corporal", muscle: "Pierna Completa", sets: 3, reps: "12 por pierna", rest: 75, desc: "Da pasos estables asegurándote de que la rodilla delantera no sobrepase excesivamente la punta del pie." },
        { name: hasDumbbells ? "Elevaciones de Talones de Pie" : "Elevaciones a un Solo Pie", muscle: "Pantorrillas", sets: 4, reps: "15-20", rest: 60, desc: "Realiza una extensión completa de tobillo aguantando 1 segundo en el pico de contracción." },
      ];
    }
  };

  const exercises = getExercises();

  const handleStartWorkout = () => {
    setActiveSession(true);
    setCurrentExerciseIndex(0);
    setTimerSeconds(0);
    setCompletedExercises([]);
    setSessionCompleted(false);
  };

  const handleCompleteExercise = () => {
    if (!completedExercises.includes(currentExerciseIndex)) {
      setCompletedExercises(prev => [...prev, currentExerciseIndex]);
    }
    
    if (currentExerciseIndex < exercises.length - 1) {
      setCurrentExerciseIndex(prev => prev + 1);
    } else {
      setSessionCompleted(true);
    }
  };

  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="flex h-[70vh] flex-col items-center justify-center space-y-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-muted-foreground font-semibold">Cargando tus entrenamientos de FITTO...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-bold mb-2">
            <Sparkles className="h-3.5 w-3.5" />
            Plan Personalizado de Entrenamientos
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">RUTINAS INTELIGENTES</h1>
          <p className="text-muted-foreground mt-1 font-medium">
            Entrenamientos optimizados para tu meta de <span className="text-primary font-bold">{profile.primary_goal === "muscle_gain" ? "Ganancia Muscular" : profile.primary_goal === "fat_loss" ? "Quema de Grasa" : "Bienestar General"}</span>.
          </p>
        </div>

        {!activeSession && (
          <Button 
            onClick={handleStartWorkout}
            className="rounded-full shadow-lg shadow-primary/20 hover:scale-105 transition-all duration-300 gap-2 h-12 px-6 text-base font-semibold"
          >
            <Play className="h-5 w-5 fill-current" />
            Iniciar Rutina de Hoy
          </Button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {activeSession ? (
          // Active Session Player View
          <motion.div 
            key="active-session"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="border-emerald-500/20 bg-emerald-500/5 shadow-xl shadow-emerald-500/5">
              <CardHeader className="border-b border-border/40 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="text-xs uppercase tracking-wider text-emerald-600 font-bold flex items-center gap-1.5">
                    <Zap className="h-3.5 w-3.5 fill-current" />
                    Entrenamiento En Curso
                  </div>
                  <CardTitle className="text-2xl mt-1 font-black">
                    {sessionCompleted ? "¡ENTRENAMIENTO COMPLETADO!" : exercises[currentExerciseIndex].name}
                  </CardTitle>
                  <CardDescription className="text-sm font-semibold text-muted-foreground">
                    {!sessionCompleted && `Ejercicio ${currentExerciseIndex + 1} de ${exercises.length} • Zona: ${exercises[currentExerciseIndex].muscle}`}
                  </CardDescription>
                </div>
                
                <div className="flex items-center gap-6 bg-card px-6 py-3 rounded-2xl border border-border/40 shadow-sm self-start md:self-auto">
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground font-semibold flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Tiempo
                    </div>
                    <div className="text-xl font-bold tracking-mono text-foreground mt-0.5">
                      {formatTime(timerSeconds)}
                    </div>
                  </div>
                  <div className="h-8 w-px bg-border/60" />
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground font-semibold">Progreso</div>
                    <div className="text-xl font-black text-emerald-600 mt-0.5">
                      {Math.round(((completedExercises.length) / exercises.length) * 100)}%
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-8">
                {sessionCompleted ? (
                  // Success State
                  <div className="flex flex-col items-center justify-center text-center py-12 space-y-6">
                    <div className="w-24 h-24 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-600 scale-110 animate-bounce">
                      <CheckCircle className="w-12 h-12" />
                    </div>
                    <div className="space-y-2">
                      <h2 className="text-3xl font-black">¡FITT-ASTIC! 🎉</h2>
                      <p className="text-muted-foreground font-semibold max-w-md mx-auto">
                        Has completado de forma estricta todo tu entrenamiento del día. Tus registros y volumen han sido guardados para la IA.
                      </p>
                    </div>
                    <div className="flex gap-4">
                      <Button 
                        variant="outline"
                        onClick={() => {
                          setActiveSession(false);
                          setSessionCompleted(false);
                        }}
                        className="rounded-full font-semibold px-6"
                      >
                        Volver al Panel
                      </Button>
                      <Button 
                        onClick={handleStartWorkout}
                        className="rounded-full font-semibold px-6 gap-2"
                      >
                        <RotateCcw className="h-4 w-4" /> Entrenar de Nuevo
                      </Button>
                    </div>
                  </div>
                ) : (
                  // Active Exercise Info
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                    <div className="space-y-6">
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-card p-4 rounded-xl border border-border/50 text-center">
                          <span className="text-xs text-muted-foreground font-bold uppercase">Series</span>
                          <p className="text-2xl font-black mt-1 text-emerald-600">{exercises[currentExerciseIndex].sets}</p>
                        </div>
                        <div className="bg-card p-4 rounded-xl border border-border/50 text-center">
                          <span className="text-xs text-muted-foreground font-bold uppercase">Reps</span>
                          <p className="text-2xl font-black mt-1 text-emerald-600">{exercises[currentExerciseIndex].reps}</p>
                        </div>
                        <div className="bg-card p-4 rounded-xl border border-border/50 text-center">
                          <span className="text-xs text-muted-foreground font-bold uppercase">Descanso</span>
                          <p className="text-2xl font-black mt-1 text-emerald-600">{exercises[currentExerciseIndex].rest}s</p>
                        </div>
                      </div>

                      <div className="bg-card p-5 rounded-2xl border border-border/50 space-y-2.5">
                        <span className="text-xs text-emerald-600 font-bold uppercase flex items-center gap-1">
                          <AlertCircle className="h-3.5 w-3.5" /> Técnica Recomendada FITTO
                        </span>
                        <p className="text-sm font-semibold leading-relaxed text-muted-foreground">
                          {exercises[currentExerciseIndex].desc}
                        </p>
                      </div>

                      <div className="flex gap-4">
                        <Button 
                          onClick={handleCompleteExercise}
                          className="rounded-full font-semibold px-8 h-12 text-base gap-2 flex-1 shadow-lg shadow-primary/20 hover:scale-105 transition-all duration-300"
                        >
                          Completar Serie / Ejercicio
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          onClick={() => setActiveSession(false)}
                          className="rounded-full font-semibold border border-destructive/20 text-destructive hover:bg-destructive/10 px-5 h-12"
                        >
                          <Square className="h-4 w-4 fill-current mr-2" /> Terminar
                        </Button>
                      </div>
                    </div>

                    <div className="relative aspect-video rounded-3xl overflow-hidden border border-border/40 bg-card flex items-center justify-center p-6 shadow-inner">
                      <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/10 via-transparent to-transparent pointer-events-none" />
                      <motion.img 
                        key={currentExerciseIndex}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: "spring", duration: 0.5 }}
                        src="/fittoPesas.png" 
                        alt="FITTO lifting weights" 
                        className="h-56 w-auto object-contain drop-shadow-xl select-none"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          // Idle Routine View
          <motion.div 
            key="idle-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {/* Days Selector Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-border/40">
              {days.map((day) => (
                <button
                  key={day.id}
                  onClick={() => setSelectedDay(day.id)}
                  className={`flex-shrink-0 px-6 py-3 rounded-full text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${
                    selectedDay === day.id 
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 scale-105" 
                      : "bg-card border border-border/50 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  }`}
                >
                  <Dumbbell className="h-4 w-4" />
                  {day.title}
                </button>
              ))}
            </div>

            {/* List of Exercises for Selected Day */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {exercises.map((ex, i) => (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  key={i}
                >
                  <Card className="hover:shadow-md transition-all duration-300 border-border/50 hover:border-emerald-500/20 bg-card/60 backdrop-blur-sm group">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary-foreground">
                          {ex.muscle}
                        </span>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground font-bold">
                          <span>{ex.sets} Series</span>
                          <span>•</span>
                          <span>{ex.reps} Reps</span>
                        </div>
                      </div>
                      <CardTitle className="text-lg font-black mt-2 group-hover:text-primary transition-colors">
                        {ex.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm font-semibold text-muted-foreground leading-relaxed">
                      {ex.desc}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
