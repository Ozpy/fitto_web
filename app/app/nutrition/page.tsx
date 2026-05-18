"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { 
  Apple, 
  Flame, 
  TrendingUp, 
  Sparkles, 
  ChevronRight, 
  Utensils, 
  PlusCircle, 
  Heart,
  Droplet,
  Coffee,
  Check
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface UserProfile {
  primary_goal: string;
  weight_kg: number;
  height_cm: number;
  sex: string;
  activity_level: string;
  dietary_preferences: string[];
}

export default function NutritionPage() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMealTab, setSelectedMealTab] = useState("breakfast");
  const [loggedKcal, setLoggedKcal] = useState(0);

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
    weight_kg: 78,
    height_cm: 178,
    sex: "male",
    activity_level: "moderately_active",
    dietary_preferences: ["high_protein"],
  };

  // Calculate target calories
  const birthYear = 1998;
  const age = new Date().getFullYear() - birthYear;
  let bmr = 10 * profile.weight_kg + 6.25 * profile.height_cm - 5 * age;
  bmr += profile.sex === "male" ? 5 : -161;

  const activityMultipliers: Record<string, number> = {
    sedentary: 1.2,
    lightly_active: 1.375,
    moderately_active: 1.55,
    very_active: 1.725,
  };
  const multiplier = activityMultipliers[profile.activity_level] || 1.4;
  let targetCalories = Math.round(bmr * multiplier);
  if (profile.primary_goal === "muscle_gain") targetCalories += 350;
  if (profile.primary_goal === "fat_loss") targetCalories -= 400;

  // Macros
  const proteinTarget = Math.round(profile.weight_kg * 2); // 2g per kg
  const fatTarget = Math.round((targetCalories * 0.25) / 9); // 25% of calories
  const carbsTarget = Math.round((targetCalories - (proteinTarget * 4) - (fatTarget * 9)) / 4);

  // Dynamic food recommendations based on dietary preference
  const isHighProtein = profile.dietary_preferences?.includes("high_protein") ?? true;
  const isVegan = profile.dietary_preferences?.includes("vegan") ?? false;
  
  const getMeals = () => {
    if (isVegan) {
      return {
        breakfast: {
          name: "Bowl de Avena con Proteína Vegana & Bayas",
          kcal: 420,
          protein: 28,
          carbs: 55,
          fat: 8,
          ingredients: ["50g Avena integral", "30g Aislado de proteína de guisante", "80g Frambuesas frescas", "15g Semillas de chía", "250ml Leche de almendras sin azúcar"],
          prep: "Cocina la avena con la leche a fuego medio. Retira del fuego, integra la proteína en polvo y decora con semillas de chía y frambuesas."
        },
        lunch: {
          name: "Tofu Crujiente con Arroz Integral & Brócoli",
          kcal: 680,
          protein: 35,
          carbs: 75,
          fat: 16,
          ingredients: ["200g Tofu extra firme", "100g Arroz integral (en seco)", "150g Brócoli al vapor", "10ml Aceite de sésamo", "Salsa de soja baja en sodio"],
          prep: "Corta el tofu en dados y dóralo en una sartén antiadherente con aceite de sésamo. Sirve junto al arroz integral cocido y el brócoli al vapor."
        },
        dinner: {
          name: "Ensalada Templada de Quinoa, Garbanzos & Aguacate",
          kcal: 590,
          protein: 22,
          carbs: 65,
          fat: 20,
          ingredients: ["80g Quinoa de tres colores", "120g Garbanzos cocidos", "80g Aguacate fresco", "Hojas de espinaca bebé", "Tomates cherry", "Limón"],
          prep: "Mezcla la quinoa templada y los garbanzos con la espinaca, añade tomates cherry cortados a la mitad y decora con rodajas de aguacate y jugo de limón."
        }
      };
    } else {
      return {
        breakfast: {
          name: "Tortilla de Claras con Espinacas, Pavo & Tostada de Centeno",
          kcal: 380,
          protein: 34,
          carbs: 30,
          fat: 7,
          ingredients: ["150ml Claras de huevo", "1 Huevo entero entero", "60g Pechuga de pavo picada", "Puñado de espinacas tiernas", "2 rebanadas de pan de centeno"],
          prep: "Bate las claras y el huevo. Cocina en sartén con espinacas y pavo. Acompaña con las tostadas de centeno crujientes."
        },
        lunch: {
          name: "Pechuga de Pollo Premium a la Plancha con Batata al Horno",
          kcal: 650,
          protein: 48,
          carbs: 60,
          fat: 12,
          ingredients: ["200g Pechuga de pollo limpia", "250g Batata dulce (camote)", "100g Espárragos verdes a la parrilla", "5ml Aceite de oliva virgen extra"],
          prep: "Hornea la batata en rodajas con especias al gusto. Cocina el pollo y los espárragos a la plancha pincelados con aceite de oliva."
        },
        dinner: {
          name: "Filete de Salmón Salvaje con Espinacas & Quinoa",
          kcal: 580,
          protein: 42,
          carbs: 35,
          fat: 22,
          ingredients: ["180g Lomo de salmón fresco", "60g Quinoa cocida", "150g Espinacas salteadas con ajo", "Semillas de sésamo"],
          prep: "Dora el salmón por el lado de la piel hasta que esté crujiente. Saltea las espinacas con ajo y sirve junto a la quinoa decorada con sésamo."
        }
      };
    }
  };

  const meals = getMeals();
  const currentMeal = meals[selectedMealTab as keyof typeof meals];

  const handleLogMeal = (kcal: number) => {
    setLoggedKcal(prev => Math.min(prev + kcal, targetCalories));
  };

  if (loading) {
    return (
      <div className="flex h-[70vh] flex-col items-center justify-center space-y-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-muted-foreground font-semibold">Calculando plan nutricional inteligente...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-bold mb-2">
          <Sparkles className="h-3.5 w-3.5" />
          Plan Nutricional Inteligente
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">NUTRICIÓN EXACTA</h1>
        <p className="text-muted-foreground mt-1 font-medium">
          Tus macros diarios calculados científicamente para <span className="text-primary font-bold">{profile.primary_goal === "muscle_gain" ? "construcción de músculo" : "déficit calórico"}</span>.
        </p>
      </div>

      {/* Target Progress Bar Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="md:col-span-2 border-border/50 bg-card/60 backdrop-blur-sm shadow-sm relative overflow-hidden">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-bold text-muted-foreground uppercase">Objetivo Calórico</span>
                <h3 className="text-4xl font-black mt-1 text-emerald-600 tracking-tight">
                  {targetCalories} <span className="text-sm font-semibold text-muted-foreground">kcal / día</span>
                </h3>
              </div>
              <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-xl">
                <Flame className="h-6 w-6" />
              </div>
            </div>
            
            <div className="mt-6 space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span>Registrado: {loggedKcal} kcal</span>
                <span>Restantes: {targetCalories - loggedKcal} kcal</span>
              </div>
              <div className="h-3 w-full bg-accent rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(loggedKcal / targetCalories) * 100}%` }}
                  transition={{ duration: 0.8 }}
                  className="h-full bg-emerald-500 rounded-full"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Macros Breakdown */}
        <div className="md:col-span-2 grid grid-cols-3 gap-4">
          <Card className="border-border/50 bg-card/60 text-center shadow-sm">
            <CardContent className="pt-6">
              <span className="text-xs font-bold text-muted-foreground uppercase">Proteínas</span>
              <p className="text-3xl font-black mt-2 text-primary">{proteinTarget}g</p>
              <span className="text-xs font-semibold text-muted-foreground block mt-1">Meta diaria</span>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-card/60 text-center shadow-sm">
            <CardContent className="pt-6">
              <span className="text-xs font-bold text-muted-foreground uppercase">Carbos</span>
              <p className="text-3xl font-black mt-2 text-primary">{carbsTarget}g</p>
              <span className="text-xs font-semibold text-muted-foreground block mt-1">Meta diaria</span>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-card/60 text-center shadow-sm">
            <CardContent className="pt-6">
              <span className="text-xs font-bold text-muted-foreground uppercase">Grasas</span>
              <p className="text-3xl font-black mt-2 text-primary">{fatTarget}g</p>
              <span className="text-xs font-semibold text-muted-foreground block mt-1">Meta diaria</span>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Meal Planner */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <Utensils className="h-5 w-5 text-emerald-600" />
            Sugerencia de Menú de Hoy
          </h2>

          <div className="flex gap-2 border-b border-border/40 pb-2 overflow-x-auto">
            {["breakfast", "lunch", "dinner"].map((tab) => (
              <button
                key={tab}
                onClick={() => setSelectedMealTab(tab)}
                className={`px-6 py-2.5 rounded-full text-xs font-bold uppercase transition-all duration-300 ${
                  selectedMealTab === tab
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-105"
                    : "bg-card border border-border/50 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                {tab === "breakfast" ? "Desayuno" : tab === "lunch" ? "Almuerzo" : "Cena"}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={selectedMealTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="border-border/50 bg-card/60 backdrop-blur-sm shadow-sm overflow-hidden">
                <CardHeader className="pb-4 bg-emerald-500/5 border-b border-border/30">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <span className="text-xs font-bold text-emerald-600 uppercase flex items-center gap-1">
                        <Heart className="h-3.5 w-3.5 fill-current" /> Recomendación IA
                      </span>
                      <CardTitle className="text-xl font-black mt-1 text-foreground leading-snug">
                        {currentMeal.name}
                      </CardTitle>
                    </div>
                    <div className="bg-card px-4 py-2 rounded-xl border border-border/40 text-center font-bold">
                      <span className="text-xs text-muted-foreground uppercase block">Kcal</span>
                      <span className="text-lg text-emerald-600 font-black">{currentMeal.kcal}</span>
                    </div>
                  </div>

                  <div className="flex gap-4 text-xs font-bold text-muted-foreground mt-4 pt-4 border-t border-border/30">
                    <span>P: {currentMeal.protein}g</span>
                    <span>•</span>
                    <span>C: {currentMeal.carbs}g</span>
                    <span>•</span>
                    <span>G: {currentMeal.fat}g</span>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  {/* Ingredients */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-bold text-foreground uppercase tracking-wider">Ingredientes Necesarios</h4>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                      {currentMeal.ingredients.map((ing, i) => (
                        <li key={i} className="flex items-center gap-2 font-medium">
                          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                          {ing}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Preparation */}
                  <div className="space-y-3 pt-4 border-t border-border/30">
                    <h4 className="text-sm font-bold text-foreground uppercase tracking-wider">Método de Preparación</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed font-semibold">
                      {currentMeal.prep}
                    </p>
                  </div>

                  {/* Log Button */}
                  <div className="pt-4 flex justify-end">
                    <Button 
                      onClick={() => handleLogMeal(currentMeal.kcal)}
                      className="rounded-full font-bold px-6 gap-2"
                    >
                      <PlusCircle className="h-4 w-4" /> Registrar Consumo
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Nutritional advice side card */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <Coffee className="h-5 w-5 text-emerald-600" />
            Consejos del Coach
          </h2>

          <Card className="border-border/50 bg-card/60 backdrop-blur-sm shadow-sm overflow-hidden p-6 relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-bl-full pointer-events-none" />
            
            <div className="flex items-start gap-4">
              <img src="/fittoMeditation.png" className="w-16 h-auto drop-shadow-md select-none mt-1" alt="Mascot Coach" />
              <div className="space-y-3">
                <span className="text-xs font-bold text-emerald-600 uppercase">Fitto Nutri-Coach</span>
                <p className="text-sm text-muted-foreground leading-relaxed font-semibold">
                  "¡La hidratación es clave! Bebe al menos 3 litros de agua hoy. Si tu meta es {profile.primary_goal === "muscle_gain" ? "ganancia muscular" : "pérdida de grasa"}, enfócate en ingerir las proteínas recomendadas en cada una de tus comidas principales para proteger tus fibras musculares."
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
