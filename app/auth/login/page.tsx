"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAppStore } from "@/store/useAppStore";
import { translations } from "@/lib/i18n/translations";
import { Button } from "@/components/ui/button";
import { Globe, Mail, Lock, AlertCircle, CheckCircle2, ChevronRight } from "lucide-react";

// Form schemas
const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

const registerSchema = z.object({
  email: z.string().email({ message: "Invalid email" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { language, setLanguage } = useAppStore();
  const t = translations[language].auth;
  const [isLogin, setIsLogin] = useState(true);
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const { register: registerLogin, handleSubmit: handleSubmitLogin, formState: { errors: loginErrors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const { register: registerSignUp, handleSubmit: handleSubmitSignUp, formState: { errors: signUpErrors } } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const toggleLanguage = () => {
    setLanguage(language === "es" ? "en" : "es");
  };

  const handleLogin = async (data: LoginFormValues) => {
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        setErrorMsg(error.message);
      } else {
        setSuccessMsg(t.successSignIn);
        setTimeout(() => {
          router.push("/app/dashboard");
        }, 1500);
      }
    } catch (err) {
      setErrorMsg(t.errorAuthFailed);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (data: RegisterFormValues) => {
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
      });

      if (error) {
        setErrorMsg(error.message);
      } else {
        setSuccessMsg(t.successSignUp);
        setIsLogin(true); // switch back to login so they can sign in after verifying
      }
    } catch (err) {
      setErrorMsg(t.errorAuthFailed);
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthLogin = async (provider: 'google' | 'github') => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/app/dashboard`,
        }
      });
      if (error) setErrorMsg(error.message);
    } catch (err) {
      setErrorMsg("OAuth Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row relative overflow-hidden selection:bg-primary/20">
      
      {/* Floating Language Switcher */}
      <div className="absolute top-6 right-6 z-50">
        <Button variant="outline" size="sm" onClick={toggleLanguage} className="bg-card/50 backdrop-blur-md border-border/60 hover:bg-card rounded-full text-xs font-semibold px-4">
          <Globe className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
          {language.toUpperCase()}
        </Button>
      </div>

      {/* Decorative background shapes */}
      <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-primary/5 blur-3xl pointer-events-none" />

      {/* Mascot / Brand Column */}
      <div className="w-full md:w-1/2 flex flex-col justify-center items-center p-8 lg:p-16 border-b md:border-b-0 md:border-r border-border/50 bg-gradient-to-b md:bg-gradient-to-r from-muted/20 to-transparent">
        <div className="max-w-md w-full text-center space-y-6 flex flex-col items-center">
          <motion.img 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            src="/logo.png" 
            alt="FITTO Logo" 
            className="w-72 h-auto drop-shadow-md rounded-2xl" 
          />
          
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="p-4 rounded-2xl bg-card border border-border/40 shadow-sm inline-block text-xs font-medium text-muted-foreground"
          >
            🌱 AI-Powered Personal Fitness Assistant
          </motion.div>
        </div>
      </div>

      {/* Form Column */}
      <div className="w-full md:w-1/2 flex flex-col justify-center p-8 lg:p-16">
        <div className="max-w-md w-full mx-auto space-y-8">
          
          {/* Animated Form container */}
          <AnimatePresence mode="wait">
            <motion.div
              key={isLogin ? "login" : "signup"}
              initial={{ opacity: 0, x: isLogin ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: isLogin ? 20 : -20 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">
                  {isLogin ? t.titleSignIn : t.titleSignUp}
                </h2>
                <p className="text-muted-foreground text-sm">
                  {isLogin ? t.subtitleSignIn : t.subtitleSignUp}
                </p>
              </div>

              {/* Status messages */}
              {errorMsg && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 text-sm"
                >
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  <p>{errorMsg}</p>
                </motion.div>
              )}

              {successMsg && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-3 p-4 rounded-2xl bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-400 text-sm"
                >
                  <CheckCircle2 className="h-5 w-5 shrink-0" />
                  <p>{successMsg}</p>
                </motion.div>
              )}

              {/* Native Form */}
              <form 
                onSubmit={isLogin ? handleSubmitLogin(handleLogin) : handleSubmitSignUp(handleRegister)}
                className="space-y-4"
              >
                {/* Email Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t.email}</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-muted-foreground">
                      <Mail className="h-4.5 w-4.5" />
                    </span>
                    <input
                      type="email"
                      {...(isLogin ? registerLogin("email") : registerSignUp("email"))}
                      className="w-full bg-card border border-border/80 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-2xl py-3.5 pl-12 pr-4 text-sm outline-none transition-all"
                      placeholder="you@example.com"
                    />
                  </div>
                  {isLogin && loginErrors.email && (
                    <span className="text-xs text-red-500 font-medium">{t.errorInvalidEmail}</span>
                  )}
                  {!isLogin && signUpErrors.email && (
                    <span className="text-xs text-red-500 font-medium">{t.errorInvalidEmail}</span>
                  )}
                </div>

                {/* Password Input */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t.password}</label>
                    {isLogin && (
                      <Button variant="ghost" className="h-auto p-0 text-xs font-semibold text-primary hover:bg-transparent">
                        {t.forgotPassword}
                      </Button>
                    )}
                  </div>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-muted-foreground">
                      <Lock className="h-4.5 w-4.5" />
                    </span>
                    <input
                      type="password"
                      {...(isLogin ? registerLogin("password") : registerSignUp("password"))}
                      className="w-full bg-card border border-border/80 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-2xl py-3.5 pl-12 pr-4 text-sm outline-none transition-all"
                      placeholder="••••••••"
                    />
                  </div>
                  {isLogin && loginErrors.password && (
                    <span className="text-xs text-red-500 font-medium">{loginErrors.password.message}</span>
                  )}
                  {!isLogin && signUpErrors.password && (
                    <span className="text-xs text-red-500 font-medium">{signUpErrors.password.message}</span>
                  )}
                </div>

                {/* Submit button */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full py-6 rounded-2xl shadow-md text-sm font-semibold tracking-wider transition-all duration-300 hover:scale-[1.01] active:scale-[0.99]"
                >
                  {loading ? t.loading : isLogin ? t.buttonSignIn : t.buttonSignUp}
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </form>

              {/* Divider */}
              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-border/50"></div>
                <span className="flex-shrink mx-4 text-muted-foreground text-xs uppercase tracking-wider font-semibold">
                  {t.orContinueWith}
                </span>
                <div className="flex-grow border-t border-border/50"></div>
              </div>

              {/* OAuth buttons */}
              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  onClick={() => handleOAuthLogin("google")}
                  disabled={loading}
                  className="border-border/80 py-6 rounded-2xl text-xs font-semibold flex items-center justify-center gap-2 hover:bg-muted/10 transition-all active:scale-95"
                >
                  {/* Google SVG */}
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  Google
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleOAuthLogin("github")}
                  disabled={loading}
                  className="border-border/80 py-6 rounded-2xl text-xs font-semibold flex items-center justify-center gap-2 hover:bg-muted/10 transition-all active:scale-95"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.9-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0012 2z" />
                  </svg>
                  GitHub
                </Button>
              </div>

              {/* Mode switch link */}
              <div className="text-center">
                <button
                  onClick={toggleAuthMode}
                  className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                >
                  {isLogin ? (
                    <>
                      {t.noAccount} <span className="text-primary hover:underline ml-1">{t.actionSignUp}</span>
                    </>
                  ) : (
                    <>
                      {t.haveAccount} <span className="text-primary hover:underline ml-1">{t.actionSignIn}</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </AnimatePresence>

        </div>
      </div>
      
    </div>
  );
}
