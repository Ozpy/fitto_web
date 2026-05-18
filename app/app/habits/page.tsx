"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Target, 
  Droplet, 
  Moon, 
  TrendingUp, 
  Footprints, 
  Plus, 
  Sparkles, 
  Check, 
  Star 
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function HabitsPage() {
  // Hydration state
  const [waterMilliliters, setWaterMilliliters] = useState(750);
  const waterGoal = 3000;

  // Sleep state
  const [sleepHours, setSleepHours] = useState(7.5);
  const [sleepQuality, setSleepQuality] = useState(4);
  const [isSleepLogged, setIsSleepLogged] = useState(false);

  // Steps state
  const [stepCount, setStepCount] = useState(6400);
  const stepGoal = 10000;

  const handleAddWater = (amount: number) => {
    setWaterMilliliters(prev => Math.min(prev + amount, 4000));
  };

  const handleResetWater = () => {
    setWaterMilliliters(0);
  };

  const handleLogSteps = () => {
    setStepCount(prev => Math.min(prev + 1000, 20000));
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-bold mb-2">
          <Sparkles className="h-3.5 w-3.5" />
          Seguimiento de Hábitos Saludables
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">HÁBITOS & ENERGÍA</h1>
        <p className="text-muted-foreground mt-1 font-medium">
          Monitorea tu hidratación, calidad de sueño y actividad física para mantener un rendimiento óptimo.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* 1. Hydration Tracker */}
        <Card className="border-border/50 bg-card/60 backdrop-blur-sm shadow-sm overflow-hidden flex flex-col justify-between">
          <CardHeader className="pb-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-muted-foreground uppercase">Monitor de Hidratación</span>
              <div className="p-2.5 bg-blue-500/10 text-blue-600 rounded-xl">
                <Droplet className="h-5 w-5" />
              </div>
            </div>
            <CardTitle className="text-xl font-black mt-2">Agua Diaria</CardTitle>
            <CardDescription className="text-sm font-semibold">Meta recomendada: 3.0 Litros</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center py-6 relative">
              <div className="text-5xl font-black text-blue-600 tracking-tight">
                {waterMilliliters / 1000} <span className="text-xl font-bold text-muted-foreground">L</span>
              </div>
              <p className="text-xs text-muted-foreground font-bold mt-2">
                {Math.round((waterMilliliters / waterGoal) * 100)}% de tu objetivo completado
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex gap-2">
                <Button 
                  onClick={() => handleAddWater(250)}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white rounded-full font-bold text-xs py-5"
                >
                  +250 ml (Vaso)
                </Button>
                <Button 
                  onClick={() => handleAddWater(500)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-bold text-xs py-5"
                >
                  +500 ml (Botella)
                </Button>
              </div>
              <Button 
                variant="ghost" 
                onClick={handleResetWater}
                className="w-full text-xs font-bold text-muted-foreground hover:text-foreground"
              >
                Reiniciar Registro
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 2. Sleep Tracker */}
        <Card className="border-border/50 bg-card/60 backdrop-blur-sm shadow-sm overflow-hidden flex flex-col justify-between">
          <CardHeader className="pb-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-muted-foreground uppercase">Registro de Descanso</span>
              <div className="p-2.5 bg-indigo-500/10 text-indigo-600 rounded-xl">
                <Moon className="h-5 w-5" />
              </div>
            </div>
            <CardTitle className="text-xl font-black mt-2">Horas de Sueño</CardTitle>
            <CardDescription className="text-sm font-semibold">Meta de descanso: 7 - 8 horas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <AnimatePresence mode="wait">
              {isSleepLogged ? (
                <motion.div 
                  key="logged"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-6 space-y-3"
                >
                  <div className="text-4xl font-black text-indigo-600">{sleepHours} Horas</div>
                  <div className="flex justify-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star 
                        key={star} 
                        className={`h-4.5 w-4.5 ${star <= sleepQuality ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} 
                      />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground font-bold">¡Registro completado para el análisis de recuperación!</p>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsSleepLogged(false)}
                    className="rounded-full text-xs font-semibold px-4 mt-2"
                  >
                    Editar Registro
                  </Button>
                </motion.div>
              ) : (
                <motion.div 
                  key="not-logged"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-5"
                >
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase">¿Cuántas horas dormiste?</label>
                    <div className="flex items-center justify-between bg-card p-3 rounded-xl border border-border/50">
                      <button onClick={() => setSleepHours(prev => Math.max(prev - 0.5, 4))} className="p-1 font-bold text-lg">-</button>
                      <span className="text-lg font-black">{sleepHours} horas</span>
                      <button onClick={() => setSleepHours(prev => Math.min(prev + 0.5, 12))} className="p-1 font-bold text-lg">+</button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase">Calidad del sueño</label>
                    <div className="flex justify-center gap-2 py-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button 
                          key={star} 
                          onClick={() => setSleepQuality(star)}
                          className="focus:outline-none"
                        >
                          <Star className={`h-7 w-7 transition-colors ${star <= sleepQuality ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground hover:text-yellow-300"}`} />
                        </button>
                      ))}
                    </div>
                  </div>

                  <Button 
                    onClick={() => setIsSleepLogged(true)}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-bold text-xs py-5"
                  >
                    Guardar Registro de Anoche
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* 3. Steps Tracker */}
        <Card className="border-border/50 bg-card/60 backdrop-blur-sm shadow-sm overflow-hidden flex flex-col justify-between">
          <CardHeader className="pb-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-muted-foreground uppercase">Nivel de Actividad</span>
              <div className="p-2.5 bg-emerald-500/10 text-emerald-600 rounded-xl">
                <Footprints className="h-5 w-5" />
              </div>
            </div>
            <CardTitle className="text-xl font-black mt-2">Pasos del Día</CardTitle>
            <CardDescription className="text-sm font-semibold">Meta diaria: 10,000 pasos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center py-6">
              <div className="text-5xl font-black text-emerald-600 tracking-tight">
                {stepCount.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground font-bold mt-2">
                {Math.round((stepCount / stepGoal) * 100)}% de tu caminata completada
              </p>
            </div>

            <div className="space-y-3">
              <Button 
                onClick={handleLogSteps}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white rounded-full font-bold text-xs py-5 gap-2"
              >
                <Plus className="h-4 w-4" /> Registrar +1,000 pasos
              </Button>
              <div className="text-[10px] text-center text-muted-foreground font-semibold">
                Sincronizado dinámicamente con Apple Health / Google Fit
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
