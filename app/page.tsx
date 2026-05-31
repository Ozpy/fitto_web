"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Brain, Activity, Apple, Target, MessageSquare, Sparkles, ChevronDown, CheckCircle2, User, Star } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { type User as SupabaseUser } from "@supabase/supabase-js";

const fadeUpVariant = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 }
  }
};

export default function LandingPage() {
  const { scrollYProgress } = useScroll();
  const y1 = useTransform(scrollYProgress, [0, 1], [0, 300]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -200]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoadingUser(false);
    });
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20,
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const faqs = [
    {
      q: "¿Necesito experiencia previa en el gimnasio?",
      a: "No. La IA de FITTO evalúa tu nivel actual y adapta los ejercicios paso a paso, asegurando que tu progresión sea segura y efectiva, ya seas principiante o atleta avanzado."
    },
    {
      q: "¿Es una rutina estática como un PDF?",
      a: "En absoluto. FITTO es dinámico. Si un día estás muy fatigado, tienes poco tiempo o te duele un músculo, la inteligencia artificial regenera tu entrenamiento al instante."
    },
    {
      q: "¿Incluye planes de alimentación?",
      a: "Sí. No solo calculamos tus macros exactos, sino que generamos ideas de comidas basadas en tus preferencias y objetivos."
    },
    {
      q: "¿Cómo interactúo con la inteligencia artificial?",
      a: "Tienes un chat directo con tu Coach 24/7. Pídele que cambie un ejercicio, pregúntale sobre suplementación o pide motivación si tienes un mal día."
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-primary/20">

      {/* Dynamic Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <motion.div
          animate={{ rotate: 360, scale: [1, 1.1, 1] }}
          transition={{ duration: 150, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[50%] -left-[10%] w-[100vw] h-[100vw] rounded-full bg-gradient-to-br from-primary/10 via-transparent to-transparent blur-3xl opacity-50"
        />
        <motion.div
          animate={{ rotate: -360, scale: [1, 1.2, 1] }}
          transition={{ duration: 180, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-[50%] -right-[10%] w-[80vw] h-[80vw] rounded-full bg-gradient-to-tl from-emerald-200/10 via-transparent to-transparent blur-3xl opacity-50"
        />
      </div>

      {/* Navigation */}
      <nav className="relative z-50 flex items-center justify-between px-6 py-6 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}
          className="flex items-center gap-2"
        >
          <img src="/logo.png" alt="FITTO" className="h-14 w-auto" />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}
          className="flex items-center gap-4"
        >
          {loadingUser ? (
            <div className="h-10 w-24 bg-muted/40 animate-pulse rounded-full" />
          ) : user ? (
            <>
              <Link href="/app/dashboard" className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
                Mi Dashboard
              </Link>
              <Link href="/app/dashboard" className="inline-flex items-center justify-center whitespace-nowrap text-sm font-semibold rounded-full bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-6 shadow-sm shadow-primary/20 hover:shadow-primary/40 transition-all duration-300 hover:scale-105 active:scale-95 gap-1">
                <span>Ir a mi plan</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
                Inicia sesión
              </Link>
              <Link href="/auth/login" className="inline-flex items-center justify-center whitespace-nowrap text-sm font-semibold rounded-full bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-6 shadow-sm shadow-primary/20 hover:shadow-primary/40 transition-all duration-300 hover:scale-105 active:scale-95">
                Empieza Gratis
              </Link>
            </>
          )}
        </motion.div>
      </nav>

      {/* 1. Hero Section */}
      <main className="relative z-10">
        <section className="relative pt-12 pb-40 px-6 flex flex-col items-center justify-center text-center min-h-[85vh]">

          {/* Custom Floating Mascot behind Hero */}
          <motion.div
            style={{ y: y1, opacity, x: mousePosition.x * -1.5 }}
            className="absolute top-0 md:-top-2 left-[0%] md:left-[15%] opacity-20 pointer-events-none  hidden md:block"
          >
            <img src="/fittoHi.png" className="w-64 h-auto" alt="Mascot" />
          </motion.div>

          <motion.div
            style={{ y: y2, opacity, x: mousePosition.x * 1.5 }}
            className="absolute bottom-20 right-[5%] md:right-[15%] opacity-30 pointer-events-none hidden md:block"
          >
            <img src="/fittoPesas.png" alt="" className="w-56 h-auto opacity-50 rotate-12" />
          </motion.div>

          <motion.div style={{ y: y1, opacity }} className="max-w-5xl space-y-8 flex flex-col items-center relative z-10">

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.1 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card/80 backdrop-blur-md border border-border/80 shadow-sm text-xs font-semibold uppercase tracking-widest text-primary-foreground hover:bg-card transition-colors cursor-default"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              Tu entrenador personal 24/7
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="text-6xl md:text-8xl lg:text-9xl font-extrabold tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-foreground via-foreground/90 to-muted-foreground leading-[1.05]"
            >
              Entrena. Nutre. <br />
              <span className="relative inline-block mt-2">
                <span className="absolute -inset-2 bg-primary/20 blur-2xl rounded-full" />
                <span className="relative text-primary-foreground">Transforma.</span>
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-2xl text-lg md:text-xl text-muted-foreground leading-relaxed font-medium"
            >
              Descubre el futuro del bienestar. FITTO combina rutinas hiper-personalizadas, nutrición exacta y psicología humana, todo orquestado por Inteligencia Artificial.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col sm:flex-row items-center gap-4 pt-8"
            >
              <Link href="/auth/login" className="inline-flex items-center justify-center whitespace-nowrap font-semibold rounded-full bg-primary text-primary-foreground hover:bg-primary/90 h-14 px-8 text-base shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all duration-300 group">
                Comenzar
              </Link>
            </motion.div>
          </motion.div>

          {/* Abstract Floating UI Mockup */}
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 0.5, type: "spring", bounce: 0.3 }}
            className="absolute -bottom-24 md:-bottom-48 w-full max-w-5xl mx-auto hidden md:flex justify-center perspective-[2000px]"
          >
            <motion.div
              animate={{ rotateX: [12, 14, 12], y: [0, -10, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="w-[120%] h-[400px] bg-card/80 backdrop-blur-2xl rounded-t-3xl border-t border-x border-border shadow-2xl shadow-primary/5 overflow-hidden relative"
            >
              {/* Mockup Header */}
              <div className="absolute top-0 left-0 w-full h-12 bg-muted/40 border-b border-border/50 flex items-center px-6 gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400/80" />
                <div className="w-3 h-3 rounded-full bg-amber-400/80" />
                <div className="w-3 h-3 rounded-full bg-green-400/80" />
              </div>

              <div className="pt-20 px-10 grid grid-cols-4 gap-6 opacity-80">
                {/* Mock Mascot Profile */}
                <div className="col-span-1 h-full flex flex-col gap-4">
                  <div className="bg-muted/50 p-4 rounded-3xl flex flex-col items-center justify-center gap-4 border border-border/50">
                    <img src="/logo.png" className="w-24 h-auto drop-shadow-md" alt="Mascot" />
                    <div className="h-4 w-3/4 bg-primary/20 rounded-full" />
                    <div className="h-3 w-1/2 bg-muted-foreground/20 rounded-full" />
                  </div>
                </div>

                <div className="col-span-3 grid grid-cols-2 gap-6">
                  <div className="h-32 rounded-3xl bg-muted/50 border border-border/50 p-5 flex flex-col gap-3">
                    <div className="w-10 h-10 rounded-full bg-orange-500/20" />
                    <div className="h-4 w-1/2 bg-muted-foreground/30 rounded" />
                    <div className="h-8 w-3/4 bg-muted-foreground/20 rounded" />
                  </div>
                  <div className="h-32 rounded-3xl bg-muted/50 border border-border/50 p-5 flex flex-col gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-500/20" />
                    <div className="h-4 w-1/2 bg-muted-foreground/30 rounded" />
                    <div className="h-8 w-3/4 bg-muted-foreground/20 rounded" />
                  </div>
                  <div className="col-span-2 h-40 rounded-3xl bg-gradient-to-tr from-primary/10 to-transparent border border-primary/20 p-6 flex flex-col justify-end gap-3">
                    <div className="flex items-end gap-2 h-full w-full opacity-50">
                      {[40, 70, 45, 90, 60, 100, 80].map((h, i) => (
                        <div key={i} className="flex-1 bg-primary/40 rounded-t-md transition-all hover:bg-primary" style={{ height: `${h}%` }} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </section>

        {/* 2. Step by step (How it Works) */}
        <section className="py-32 px-6 relative z-20 mt-10 md:mt-40">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeUpVariant}
              className="text-center mb-20 space-y-4"
            >
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight">El método científico,<br />hecho ridículamente simple.</h2>
              <p className="text-muted-foreground font-medium text-lg max-w-2xl mx-auto">No adivines qué hacer. FITTO traza el camino exacto hacia tus objetivos basándose en tus datos, tu cuerpo y tus tiempos.</p>
            </motion.div>

            <motion.div
              initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer}
              className="grid md:grid-cols-3 gap-12 relative"
            >
              <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-[2px] bg-gradient-to-r from-primary/0 via-primary/50 to-primary/0 z-0" />

              {[
                {
                  step: "01",
                  title: "Diagnóstico",
                  desc: "Cuéntanos tus metas, nivel actual y lesiones. Evaluamos tu punto de partida con precisión milimétrica."
                },
                {
                  step: "02",
                  title: "Plan Evolutivo",
                  desc: "La IA genera una ruta estructurada que se auto-ajusta basándose en tu recuperación, fuerza y feedback diario."
                },
                {
                  step: "03",
                  title: "Ejecución Diaria",
                  desc: "Abre la app y sigue las instrucciones. Sin sobrepensar. Tu coach te dirá qué comer y qué levantar hoy."
                }
              ].map((s, i) => (
                <motion.div key={i} variants={fadeUpVariant} className="relative z-10 flex flex-col items-center text-center space-y-5 group">
                  <div className="w-24 h-24 bg-card border-[6px] border-background shadow-xl shadow-primary/10 rounded-full flex items-center justify-center text-2xl font-black text-primary group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                    {s.step}
                  </div>
                  <h3 className="text-2xl font-bold mt-4">{s.title}</h3>
                  <p className="text-muted-foreground font-medium leading-relaxed">{s.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* 3. Deep Dive Feature: AI Interactive Chat */}
        <section className="py-32 px-6 bg-primary/5 border-y border-primary/10 relative z-20 overflow-hidden">
          {/* Animated decorative shapes */}
          <motion.div
            animate={{ rotate: 180, scale: [1, 1.05, 1] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute -right-64 -top-64 w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl pointer-events-none"
          />

          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
            <motion.div
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer}
              className="space-y-8"
            >
              <motion.div variants={fadeUpVariant} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/20 text-primary-foreground text-sm font-semibold">
                <Sparkles className="w-4 h-4" />
                Conoce a tu IA Coach
              </motion.div>
              <motion.h2 variants={fadeUpVariant} className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1]">
                Un entrenador que te <span className="text-primary-foreground relative">
                  escucha de verdad.
                  <span className="absolute bottom-1 left-0 w-full h-3 bg-primary/30 -z-10 rounded-full" />
                </span>
              </motion.h2>
              <motion.p variants={fadeUpVariant} className="text-lg text-muted-foreground font-medium leading-relaxed">
                La vida pasa. A veces duermes mal, te duele el hombro o simplemente no tienes tiempo de ir al gimnasio.
                <br /><br />
                Solo escríbele a FITTO y, en milisegundos, reestructurará tu día entero para mantenerte en progreso sin estresarte.
              </motion.p>
              <motion.ul variants={staggerContainer} className="space-y-4 pt-2">
                {[
                  "Adapta rutinas por falta de tiempo",
                  "Sustituye ejercicios si hay equipo ocupado",
                  "Ajusta macros si sales a comer fuera",
                ].map((item, i) => (
                  <motion.li key={i} variants={fadeUpVariant} className="flex items-center gap-3 font-medium text-foreground text-lg">
                    <div className="p-1 rounded-full bg-primary/20 text-primary">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    {item}
                  </motion.li>
                ))}
              </motion.ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, type: "spring" }}
              className="bg-card border border-border shadow-2xl rounded-[2.5rem] p-6 lg:p-8 space-y-6 relative"
            >
              {/* Cute Mascot peeping out */}
              <img src="/fittoSmart.png" className="w-32 h-auto absolute -top-12 -right-6 drop-shadow-xl" alt="Mascot" />

              <div className="flex items-center gap-4 pb-6 border-b border-border/50">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                  <img src="/fittoHi.png" alt="Coach" className="w-14 h-auto" />
                </div>
                <div>
                  <h4 className="font-bold text-lg">Coach FITTO</h4>
                  <p className="text-sm text-green-600 font-semibold flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                    </span>
                    En línea
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                  className="flex justify-end"
                >
                  <div className="bg-muted text-foreground px-5 py-4 rounded-3xl rounded-tr-sm max-w-[85%] text-base font-medium shadow-sm">
                    Hoy me levanté súper cansado y me duele un poco el hombro. 😩
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 1.5 }}
                  className="flex justify-start relative"
                >
                  <div className="bg-primary text-primary-foreground px-5 py-4 rounded-3xl rounded-tl-sm max-w-[90%] text-base font-medium shadow-md border border-primary/20">
                    Entendido. He cancelado el Press de Banca de hoy para proteger tu hombro. En su lugar, haremos un trabajo enfocado en piernas y movilidad suave. 🦵
                    <br /><br />
                    ¿Te parece bien si lo reducimos a 30 minutos?
                  </div>
                </motion.div>
              </div>

              <div className="relative mt-6 pt-4">
                <input disabled className="w-full bg-muted/40 border border-border/80 rounded-full py-4 px-5 text-sm outline-none font-medium text-muted-foreground shadow-inner" placeholder="Escribe un mensaje a tu Coach..." />
                <Button disabled size="icon" className="absolute right-2 top-6 h-10 w-10 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground">
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* 4. Features Bento Grid */}
        <section id="features" className="py-32 px-6 bg-background relative z-20">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeUpVariant}
              className="text-center mb-16 space-y-4"
            >
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Todo tu ecosistema fitness.</h2>
              <p className="text-muted-foreground font-medium text-lg max-w-2xl mx-auto">Olvídate de usar 5 aplicaciones distintas. FITTO centraliza tus resultados.</p>
            </motion.div>

            <motion.div
              initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer}
              className="grid grid-cols-1 md:grid-cols-3 gap-6 md:auto-rows-[300px]"
            >
              {[
                { title: "Entrenamientos", icon: Activity, color: "orange", desc: "Rutinas dinámicas que evitan estancamientos. Cada repetición cuenta." },
                { title: "Nutrición Precisa", icon: Apple, color: "emerald", desc: "Control de macros y sugerencias de comidas basadas en tus metas reales." },
                { title: "Recuperación", icon: MessageSquare, color: "blue", desc: "El músculo crece cuando descansas. Seguimiento del sueño y fatiga." },
              ].map((f, i) => (
                <motion.div
                  key={i} variants={fadeUpVariant} whileHover={{ y: -8, scale: 1.02 }} transition={{ type: "spring", stiffness: 300 }}
                  className="bg-card rounded-[2.5rem] p-10 border border-border/60 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between overflow-hidden group"
                >
                  <div>
                    <div className={`w-14 h-14 rounded-full bg-${f.color}-500/10 flex items-center justify-center text-${f.color}-600 mb-6 group-hover:rotate-12 transition-transform`}>
                      <f.icon className="w-7 h-7" />
                    </div>
                    <h3 className="text-2xl font-bold mb-3">{f.title}</h3>
                    <p className="text-muted-foreground font-medium">{f.desc}</p>
                  </div>
                </motion.div>
              ))}

              <motion.div
                variants={fadeUpVariant} whileHover={{ y: -8, scale: 1.01 }} transition={{ type: "spring", stiffness: 300 }}
                className="md:col-span-3 bg-gradient-to-br from-primary/90 to-primary text-primary-foreground rounded-[2.5rem] p-10 lg:p-14 border border-primary/20 shadow-lg flex flex-col justify-between overflow-hidden group relative"
              >
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 md:gap-16">
                  <div className="flex-3">
                    <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-white mb-6 backdrop-blur-md">
                      <Target className="w-7 h-7" />
                    </div>
                    <h3 className="text-3xl lg:text-4xl font-bold mb-4 text-white">Hábitos Que Perduran</h3>
                    <p className="text-primary-foreground/90 font-medium text-lg ">
                      La motivación dura un día, los hábitos duran toda la vida. Lleva un tracking perfecto de tu agua, pasos, meditación y lectura diaria directamente integrada al ecosistema.
                    </p>
                  </div>
                  <div className="flex-1 hidden md:flex justify-end">
                    <img src="/fittoMeditation.png" className="w-56 h-auto drop-shadow-2xl mix-blend-multiply opacity-50 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500" alt="Logo Watermark" />
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* 5. Infinite Marquee Testimonials */}
        <section className="py-24 bg-muted/30 relative z-20 overflow-hidden">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">Miles ya han transformado su vida.</h2>
          </div>

          {/* Infinite Scroll Wrapper */}
          <div className="relative w-full flex overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-background to-transparent z-10" />
            <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-background to-transparent z-10" />

            <motion.div
              animate={{ x: ["0%", "-50%"] }}
              transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
              className="flex gap-6 w-max px-6"
            >
              {[
                { name: "Carlos M.", res: "-12 kg en 4 meses", txt: "La IA de FITTO parece magia, cuando no tengo ganas de ir me adapta una rutina de 20 minutos en casa y no pierdo el ritmo." },
                { name: "Ana P.", res: "Aumento masa muscular", txt: "Siempre odié contar macros. La forma en que te sugiere las comidas con base en lo que ya te gusta hacer es revolucionaria." },
                { name: "Diego F.", res: "Recuperación deportiva", txt: "Como corredor, siempre me sobreentrenaba. El sistema de fatiga de la app me frena cuando debe y me empuja cuando estoy al 100%." },
                { name: "Carlos M.", res: "-12 kg en 4 meses", txt: "La IA de FITTO parece magia, cuando no tengo ganas de ir me adapta una rutina de 20 minutos en casa y no pierdo el ritmo." },
                { name: "Ana P.", res: "Aumento masa muscular", txt: "Siempre odié contar macros. La forma en que te sugiere las comidas con base en lo que ya te gusta hacer es revolucionaria." },
                { name: "Diego F.", res: "Recuperación deportiva", txt: "Como corredor, siempre me sobreentrenaba. El sistema de fatiga de la app me frena cuando debe y me empuja cuando estoy al 100%." },
              ].map((t, i) => (
                <div key={i} className="bg-card w-[400px] border border-border/60 rounded-[2rem] p-8 shadow-sm flex flex-col justify-between gap-6 hover:shadow-md transition-shadow">
                  <div className="flex text-amber-400">
                    {[...Array(5)].map((_, j) => <Star key={j} className="w-5 h-5 fill-current" />)}
                  </div>
                  <p className="text-muted-foreground font-medium flex-1 text-lg leading-relaxed">"{t.txt}"</p>
                  <div className="flex items-center gap-4 pt-6 border-t border-border/50">
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                      <User className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold">{t.name}</h4>
                      <span className="text-xs font-bold uppercase tracking-wider text-primary">{t.res}</span>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* 6. FAQ Section */}
        <section className="py-32 px-6 relative z-20">
          <div className="max-w-3xl mx-auto">
            <motion.div
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUpVariant}
              className="text-center mb-16 space-y-4"
            >
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Preguntas Frecuentes</h2>
            </motion.div>
            <motion.div
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer}
              className="space-y-4"
            >
              {faqs.map((faq, i) => (
                <motion.div
                  key={i} variants={fadeUpVariant}
                  className="border border-border/80 bg-card/50 hover:bg-card backdrop-blur-sm rounded-[1.5rem] overflow-hidden transition-all duration-300 shadow-sm"
                >
                  <button
                    onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                    className="flex justify-between items-center w-full p-6 lg:p-8 text-left"
                  >
                    <span className="font-bold text-lg lg:text-xl">{faq.q}</span>
                    <ChevronDown className={`w-6 h-6 text-muted-foreground transition-transform duration-300 ${activeFaq === i ? "rotate-180" : ""}`} />
                  </button>
                  <AnimatePresence>
                    {activeFaq === i && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-6 lg:p-8 pt-0 text-muted-foreground font-medium text-lg leading-relaxed border-t border-border/50 mt-2">
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* 7. Final CTA Section */}
        <section className="py-24 px-6 relative z-20 mb-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.8, type: "spring" }}
            className="max-w-5xl mx-auto bg-card border border-border/80 rounded-[3rem] p-12 md:p-24 text-center shadow-2xl relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />

            {/* Cute Mascot interactive on hover */}
            <motion.div
              initial={{ y: 150 }} whileInView={{ y: 40 }} whileHover={{ y: 0 }} transition={{ type: "spring" }}
              className="absolute bottom-0 right-[10%] md:right-[20%] z-0 hidden md:block opacity-50 hover:opacity-100"
            >
              <img src="/logo.png" className="w-48 h-auto drop-shadow-2xl" alt="Mascot" />
            </motion.div>

            <div className="relative z-10">
              <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 leading-tight">Tu mejor versión <br className="hidden md:block" /> comienza hoy.</h2>
              <p className="text-xl text-muted-foreground font-medium mb-12 max-w-2xl mx-auto">
                No esperes al lunes. Únete a miles de usuarios y transforma la manera en la que cuidas tu cuerpo y mente.
              </p>
              <Link href="/auth/login" className="inline-flex items-center justify-center whitespace-nowrap rounded-full bg-primary text-primary-foreground hover:bg-primary/90 h-16 px-12 text-xl font-bold shadow-2xl shadow-primary/40 hover:scale-105 active:scale-95 transition-all duration-300">
                Crear mi cuenta gratis
              </Link>
            </div>
          </motion.div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-border/60 relative z-20 bg-card">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-4">
            <img src="/logo.png" alt="FITTO" className="h-10 w-auto grayscale opacity-80 hover:grayscale-0 transition-all duration-500" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">
            © {new Date().getFullYear()} FITTO. Entrena, Nutre, Transforma.
          </p>
          <div className="flex gap-6 text-sm font-semibold text-muted-foreground">
            <Link href="#" className="hover:text-primary transition-colors">Términos</Link>
            <Link href="#" className="hover:text-primary transition-colors">Privacidad</Link>
            <Link href="#" className="hover:text-primary transition-colors">Contacto</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
