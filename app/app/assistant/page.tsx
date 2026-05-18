"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { 
  Bot, 
  Send, 
  Sparkles, 
  ArrowRight,
  User,
  Brain,
  MessageSquare,
  Flame,
  Dumbbell
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface UserProfile {
  primary_goal: string;
  experience_level: string;
  training_environment: string;
  available_equipment: string[];
}

interface Message {
  sender: 'coach' | 'user';
  text: string;
  timestamp: string;
}

export default function AssistantPage() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputVal, setInputVal] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

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
    available_equipment: ["barbell", "dumbbells"],
  };

  // Prepopulate welcome message
  useEffect(() => {
    if (!loading && messages.length === 0) {
      const goalText = profile.primary_goal === "muscle_gain" ? "Ganancia Muscular" : profile.primary_goal === "fat_loss" ? "Quema de Grasa" : "Bienestar General";
      setMessages([
        {
          sender: 'coach',
          text: `¡Hola! Soy FITTO Coach, tu guía personal de bienestar. He analizado tus metas de **${goalText}** entrenando en **${profile.training_environment === "gym" ? "Gimnasio" : "Casa"}** y he configurado tus rutinas. ¿En qué te gustaría enfocarte hoy? Puedes hacerme preguntas sobre tus ejercicios, técnicas de recuperación o nutrición.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  }, [loading]);

  // Scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const quickPrompts = [
    { text: "Dame mi consejo de nutrición de hoy", response: `Basado en tu meta de **${profile.primary_goal === "muscle_gain" ? "Ganancia Muscular" : "Quema de Grasa"}**, te aconsejo enfilar al menos 2.0g de proteína por kilogramo de peso corporal. Si entrenas hoy, haz una comida rica en carbohidratos complejos (como avena o batata) 90 minutos antes del esfuerzo para maximizar tu fuerza.` },
    { text: "¿Qué variante puedo hacer para Sentadillas?", response: `Si experimentas alguna molestia o no cuentas con barra olímpica, te sugiero sustituir la Sentadilla Trasera por **Sentadillas Goblet con Mancuerna** pesada apoyada en el pecho, o **Zancadas Inversas**. Ambas opciones reducen significativamente la compresión en la columna vertebral mientras estimulan tus cuádriceps de forma brutal.` },
    { text: "Tips rápidos para recuperar el músculo", response: `Para acelerar tu recuperación post-entrenamiento: 1) Duerme un mínimo de 7.5 horas de calidad esta noche. 2) Mantén tu hidratación por encima de los 3 litros. 3) Realiza 5-10 minutos de estiramientos dinámicos o caminata ligera al finalizar tu sesión para promover el flujo sanguíneo.` }
  ];

  const handleSend = (text: string) => {
    if (!text.trim()) return;

    // 1. Add user message
    const userMsg: Message = {
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, userMsg]);
    setInputVal("");

    // 2. Trigger typing animation
    setIsTyping(true);

    // 3. Find if it matches a quick prompt or give general response
    const matchedPrompt = quickPrompts.find(p => p.text.toLowerCase().includes(text.toLowerCase()) || text.toLowerCase().includes(p.text.toLowerCase()));
    
    setTimeout(() => {
      setIsTyping(false);
      const coachMsg: Message = {
        sender: 'coach',
        text: matchedPrompt 
          ? matchedPrompt.response 
          : `Entendido. Tomando en cuenta tu perfil físico de nivel **${profile.experience_level}** y equipamiento de **${profile.available_equipment.join(", ")}**, mi sugerencia es mantener una progresión de cargas constante. Recuerda cuidar el rango de movimiento completo. ¿Quieres que preparemos una rutina alternativa o una guía de alimentación específica?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, coachMsg]);
    }, 1200);
  };

  if (loading) {
    return (
      <div className="flex h-[70vh] flex-col items-center justify-center space-y-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-muted-foreground font-semibold">Conectando con tu Coach de Inteligencia Artificial...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-12 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-2xl">
          <Brain className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">FITTO COACH AI</h1>
          <p className="text-xs text-muted-foreground font-semibold">Tu asistente inteligente activo 24/7</p>
        </div>
      </div>

      {/* Main Chat Shell */}
      <Card className="border-border/50 bg-card/60 backdrop-blur-md shadow-xl flex flex-col h-[65vh] overflow-hidden">
        <CardHeader className="border-b border-border/40 py-4 px-6 bg-emerald-500/5 flex flex-row items-center gap-4">
          <img src="/fittoSmart.png" className="w-10 h-auto drop-shadow-md select-none" alt="Fitto Smart Coach" />
          <div>
            <CardTitle className="text-base font-black">Coach FITTO</CardTitle>
            <CardDescription className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" /> En línea • Experto en Biomecánica & Nutrición
            </CardDescription>
          </div>
        </CardHeader>

        {/* Message Thread */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-card/10">
          <AnimatePresence initial={false}>
            {messages.map((msg, i) => (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={i}
                className={`flex gap-3 max-w-[80%] ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
              >
                {msg.sender === 'coach' ? (
                  <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                    <img src="/fittoSmart.png" className="w-6 h-auto" alt="Avatar" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs flex-shrink-0">
                    U
                  </div>
                )}
                
                <div className="space-y-1">
                  <div className={`p-4 rounded-2xl text-sm font-semibold leading-relaxed shadow-sm ${
                    msg.sender === 'user' 
                      ? 'bg-primary text-primary-foreground rounded-tr-none' 
                      : 'bg-card border border-border/60 text-foreground rounded-tl-none'
                  }`}>
                    {msg.text}
                  </div>
                  <span className="text-[10px] text-muted-foreground font-bold block px-2">
                    {msg.timestamp}
                  </span>
                </div>
              </motion.div>
            ))}

            {isTyping && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-3 max-w-[80%]"
              >
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                  <img src="/fittoSmart.png" className="w-6 h-auto" alt="Avatar" />
                </div>
                <div className="bg-card border border-border/60 p-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-1.5 py-3">
                  <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-bounce" />
                  <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-bounce delay-150" />
                  <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-bounce delay-300" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={chatEndRef} />
        </div>

        {/* Input Bar & Quick pills */}
        <CardFooter className="flex flex-col border-t border-border/40 p-4 bg-card/30 gap-4">
          {/* Quick pills */}
          {messages.length === 1 && (
            <div className="flex gap-2 overflow-x-auto w-full pb-1">
              {quickPrompts.map((p, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(p.text)}
                  className="flex-shrink-0 px-4 py-2 bg-card hover:bg-accent border border-border/60 text-[11px] font-bold text-muted-foreground hover:text-foreground rounded-full transition-all duration-300"
                >
                  {p.text}
                </button>
              ))}
            </div>
          )}

          {/* Form */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(inputVal);
            }}
            className="flex w-full gap-2"
          >
            <input 
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Pregúntale a tu coach..."
              className="flex-1 bg-card border border-border/60 rounded-full px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-semibold"
            />
            <Button 
              type="submit" 
              className="rounded-full h-11 w-11 flex items-center justify-center p-0 flex-shrink-0"
            >
              <Send className="h-4.5 w-4.5" />
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  );
}
