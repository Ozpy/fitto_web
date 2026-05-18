# Plataforma Fitness + IA — Arquitectura y Planeación Inicial

# Visión del Proyecto

Crear una plataforma web/app enfocada en:

* Entrenamiento personalizado generado por IA.
* Nutrición y planes alimenticios adaptativos.
* Seguimiento de hábitos.
* Calendario de rutinas y hábitos.
* Evolución física y analítica.
* Futuro SaaS multiusuario.
* Futuro coach IA tipo asistente personal.

La idea NO es solo mostrar rutinas.
La meta es construir un sistema inteligente que:

* entienda el contexto del usuario,
* genere programas personalizados,
* adapte recomendaciones,
* mantenga adherencia,
* y funcione como un coach digital.

---

# Objetivos del MVP

## MVP v1

Debe permitir:

1. Registro/login.
2. Perfil físico del usuario.
3. Generación de rutina con IA.
4. Visualización de ejercicios.
5. Calendario de entrenamiento.
6. Seguimiento de progreso.
7. Sistema de hábitos.
8. Nutrición básica.
9. Dashboard principal.

---

# Stack Recomendado

## Frontend

### Opción recomendada

* Next.js
* React
* TypeScript
* TailwindCSS
* shadcn/ui

Razón:

* Escalable.
* Excelente para SaaS.
* SSR.
* Fácil migración a app.
* Gran ecosistema.

---

## Backend

### Opción recomendada

* Supabase

Incluye:

* Auth
* PostgreSQL
* Storage
* Realtime
* Edge Functions

Razón:

* Rapidísimo para MVP.
* Reduce backend inicial.
* Escalable.
* Excelente con IA.

---

## IA

### Inicial

* OpenAI API

Modelos:

* GPT-5.5
* GPT-5 mini para tareas baratas.

Futuro:

* memoria personalizada,
* embeddings,
* vector DB,
* RAG.

---

# Arquitectura General

# Módulos Principales

## 1. Auth

### Funciones

* Login.
* Registro.
* OAuth Google.
* Recuperación contraseña.
* Onboarding inicial.

### Datos iniciales usuario

* Edad.
* Sexo.
* Altura.
* Peso.
* Objetivo.
* Nivel.
* Equipo disponible.
* Restricciones.
* Ventana de alimentación.
* Lesiones.
* Horarios.

---

## 2. Dashboard Principal

Pantalla principal.

### Debe mostrar:

* Rutina de hoy.
* Hábitos pendientes.
* Calorías.
* Peso actual.
* Racha.
* Próxima comida.
* Entrenamiento próximo.
* Insights IA.

### Ejemplos

* “Has dormido poco, hoy baja intensidad.”
* “Llevas 4 días cumpliendo proteína.”
* “Tu rendimiento mejora en entrenamiento upper.”

---

## 3. Sistema de Rutinas

Core del sistema.

---

# Generador IA de Entrenamiento

## Inputs

* Objetivo.
* Peso.
* Altura.
* Nivel.
* Equipo.
* Frecuencia.
* Lesiones.
* Preferencias.
* Historial.
* Tiempo disponible.
* Recuperación.
* Sueño.
* Adherencia.

## Outputs

* Rutina semanal.
* Series.
* Reps.
* Descansos.
* Intensidad.
* Progresión.
* Deload.
* Notas.

---

## Vista de Entrenamiento

Cada ejercicio:

* nombre,
* músculos,
* video/gif,
* instrucciones,
* errores comunes,
* dificultad,
* progresiones.

### Ejemplo

## Remo en anillos

* 4x8
* descanso 90s
* RIR 2
* tempo controlado

---

## Tracking

Guardar:

* reps,
* peso,
* dificultad,
* energía,
* dolor,
* notas.

---

# 4. Calendario

Integración clave.

## Funciones

* Ver entrenamientos.
* Reagendar.
* Arrastrar eventos.
* Sync con Google Calendar.
* Recordatorios.
* Vista semanal/mensual.

---

# 5. Nutrición

## Módulos

### Plan alimenticio IA

Inputs:

* objetivo,
* calorías,
* alergias,
* presupuesto,
* gustos,
* tiempo.

Outputs:

* comidas,
* macros,
* recetas,
* lista supermercado.

---

## Recetas

Cada receta:

* ingredientes,
* calorías,
* proteína,
* grasas,
* carbs,
* tiempo,
* costo aproximado.

---

## Contador Calórico

### Funciones futuras

* búsqueda alimentos,
* escaneo código barras,
* IA desde foto,
* historial,
* favoritos.

---

# 6. Hábitos

## Sistema tipo tracker

Hábitos:

* dormir,
* agua,
* pasos,
* lectura,
* entrenamiento,
* proteína,
* meditación.

---

## Features

* streaks,
* estadísticas,
* recordatorios,
* dificultad,
* hábitos automáticos.

---

# 7. Progreso

## Tracking físico

* peso,
* medidas,
* fotos,
* fuerza,
* energía,
* sueño.

---

## Analytics

Gráficas:

* peso,
* calorías,
* adherencia,
* fuerza,
* hábitos.

---

# 8. IA Coach

Futuro diferenciador.

## Funciones

* conversación continua,
* recomendaciones,
* ajustes automáticos,
* análisis de adherencia,
* motivación contextual,
* sugerencias inteligentes.

Ejemplos:

* “Tu recuperación está baja.”
* “Esta semana reduce volumen.”
* “Tu peso se estancó 2 semanas.”

---

# Arquitectura de Base de Datos

## users

* id
* name
* email
* height
* weight
* goal
* activity_level
* fasting_window

---

## workouts

* id
* user_id
* title
* objective
* difficulty
* generated_by_ai

---

## workout_days

* id
* workout_id
* weekday

---

## exercises

* id
* name
* description
* muscle_group
* equipment
* video_url

---

## workout_exercises

* id
* workout_day_id
* exercise_id
* sets
* reps
* rest_seconds
* rir

---

## workout_logs

* id
* user_id
* exercise_id
* reps_done
* perceived_effort
* notes

---

## habits

* id
* user_id
* title
* frequency

---

## habit_logs

* id
* habit_id
* completed_at

---

## nutrition_logs

* id
* user_id
* calories
* protein
* carbs
* fats

---

# Arquitectura IA

# Fase 1

Prompt engineering simple.

## Flujo

Frontend → API → OpenAI → JSON estructurado.

---

# Fase 2

* embeddings,
* memoria,
* contexto histórico,
* recomendaciones adaptativas.

---

# UX/UI

Estilo recomendado:

* minimalista,
* oscuro,
* limpio,
* moderno,
* altamente visual.

Inspiraciones:

* Notion,
* MyFitnessPal,
* Linear,
* Whoop,
* Hevy.

---

# Roadmap

# Fase 1

## Base

* Auth.
* Dashboard.
* Rutinas.
* Tracking.
* Calendario básico.

---

# Fase 2

## Nutrición

* recetas,
* macros,
* contador,
* IA.

---

# Fase 3

## Coach IA avanzado

* memoria,
* recomendaciones,
* adaptación.

---

# Fase 4

## Mobile app

Opciones:

* React Native.
* Expo.

---

# Fase 5

## SaaS

* multiusuario,
* coaches,
* suscripciones,
* white label.

---

# Arquitectura Técnica Recomendada

## Frontend

* Next.js App Router
* Server Components
* Zustand
* React Query

---

## Backend

* Supabase
* Edge Functions
* Cron jobs

---

## Infraestructura

* Vercel
* Supabase
* Cloudflare

---

# Features Futuras Potentes

* Integración Apple Health.
* Integración Google Fit.
* Wearables.
* IA con voz.
* Coach conversacional.
* OCR alimentos.
* Escaneo corporal.
* Gamificación.
* Retos.
* Comunidad.
* Marketplace coaches.
* Rutinas inteligentes adaptativas.

---

# Prioridad REAL para empezar

NO construir todo.

Primero:

1. Auth.
2. Dashboard.
3. Rutinas.
4. Tracking.
5. IA generadora.

Eso ya crea muchísimo valor.

---

# Próximo Paso Recomendado

Construir:

## MVP Frontend

Pantallas:

1. Landing.
2. Login.
3. Onboarding.
4. Dashboard.
5. Rutina.
6. Ejercicio.
7. Calendario.
8. Hábitos.
9. Nutrición.
10. Perfil.

Luego:

* wireframes,
* arquitectura frontend,
* rutas,
* diseño DB real,
* prompts IA,
* API structure.

---

# 🚀 FITTO — Arquitectura del Producto y Frontend

> Asistente personal fitness impulsado por IA enfocado en entrenamiento, nutrición, hábitos, recuperación y adherencia a largo plazo.

---

# 🌎 Visión

FITTO no es solamente una aplicación de rutinas.

FITTO debe sentirse como:

* un entrenador personal,
* un coach nutricional,
* un sistema de hábitos,
* un asistente de recuperación,
* y un copiloto inteligente de salud.

La plataforma debe generar experiencias altamente personalizadas utilizando IA, mientras mantiene una experiencia extremadamente simple y limpia para el usuario.

Principios principales:

* personalización,
* automatización,
* adherencia,
* simplicidad,
* claridad,
* experiencia premium.

---

# 🧠 Filosofía Principal del Producto

La mayoría de las apps fitness fallan porque:

* saturan al usuario,
* requieren demasiado tracking manual,
* carecen de personalización,
* no se adaptan.

FITTO resuelve esto mediante:

✅ Rutinas adaptativas generadas por IA
✅ Planes alimenticios dinámicos
✅ Seguimiento inteligente de hábitos
✅ Integración con calendarios
✅ Insights contextuales con IA
✅ Reducción máxima de fricción

La aplicación siempre debe responder:

> “¿Qué debería hacer hoy?”

De la manera más clara posible.

---

# 🎯 Objetivos del MVP

La primera versión debe enfocarse SOLAMENTE en:

## Core Features

### 1. Authentication

* Login
* Register
* OAuth
* Onboarding

### 2. Dashboard

* Daily workout
* Calories/macros
* Habit tracking
* AI insights
* Progress overview

### 3. Workout System

* AI-generated routines
* Exercise viewer
* Tracking
* Progression

### 4. Nutrition

* Meal plans
* Recipes
* Basic calorie tracking

### 5. Habits

* Daily habits
* Streaks
* Completion tracking

### 6. AI Assistant

* Chat-based interface
* Personalized recommendations
* Context-aware suggestions

---

# 🏗️ Stack Tecnológico Oficial

## Frontend

| Technology      | Purpose          |
| --------------- | ---------------- |
| Next.js 15      | Main framework   |
| React 19        | UI rendering     |
| TypeScript      | Type safety      |
| TailwindCSS     | Styling          |
| shadcn/ui       | Component system |
| Framer Motion   | Animations       |
| Zustand         | Global state     |
| TanStack Query  | Server state     |
| React Hook Form | Forms            |
| Zod             | Validation       |
| Recharts        | Charts           |
| FullCalendar    | Calendar system  |

---

## Backend

| Technology     | Purpose          |
| -------------- | ---------------- |
| Supabase       | Backend platform |
| PostgreSQL     | Database         |
| Supabase Auth  | Authentication   |
| Storage        | Media/files      |
| Edge Functions | Server logic     |

---

## AI Layer

| Technology | Purpose              |
| ---------- | -------------------- |
| OpenAI API | AI generation        |
| GPT-5.5    | Primary intelligence |
| GPT-5 mini | Lightweight tasks    |

Future:

* embeddings,
* memory,
* vector search,
* adaptive coaching.

---

# 🎨 Filosofía del Sistema de Diseño

FITTO debe sentirse:

* moderno,
* premium,
* limpio,
* futurista,
* atlético,
* minimalista.

---

## Visual Inspirations

* Linear
* Whoop
* Apple Fitness
* Notion
* Hevy
* Rise Sleep

---

# 🎯 Reglas de UX

## General UX

* Mobile first.
* Maximum 2 clicks for important actions.
* Extremely low friction.
* Fast interactions.
* Clear hierarchy.
* Dashboard-first experience.
* Avoid overwhelming users.

---

## UI Rules

### Components

* Rounded corners
* Soft shadows
* Large touch targets
* Reusable components
* Consistent spacing

### Layout

* Clean grid systems
* Large whitespace
* Minimal visual noise
* Focus-driven sections

### Motion

* Smooth transitions
* Soft animations
* Never distracting

---

# 📱 Arquitectura Frontend

```txt
/app
 ├── /(auth)
 │    ├── login
 │    ├── register
 │    └── forgot-password
 │
 ├── /(app)
 │    ├── dashboard
 │    ├── workouts
 │    ├── nutrition
 │    ├── habits
 │    ├── progress
 │    ├── calendar
 │    ├── assistant
 │    ├── settings
 │    └── profile
 │
 ├── /components
 │    ├── ui
 │    ├── dashboard
 │    ├── workouts
 │    ├── nutrition
 │    ├── habits
 │    ├── charts
 │    └── layout
 │
 ├── /lib
 │    ├── supabase
 │    ├── ai
 │    ├── utils
 │    └── constants
 │
 ├── /services
 ├── /hooks
 ├── /store
 ├── /types
 └── /styles
```

---

# 🧩 Secciones Principales

# 🏠 Dashboard

La pantalla más importante.

Objetivo:

> Darle al usuario una vista completa de su día.

## Must Include

* Workout of the day
* Habit checklist
* Calories/macros
* Current weight
* Progress charts
* Upcoming events
* AI recommendations

---

# 💪 Entrenamientos

## Features

* Weekly workout view
* Exercise detail pages
* Progress tracking
* Difficulty adjustments
* AI-generated plans

## Exercise View

Each exercise includes:

* Instructions
* Muscles trained
* Sets/reps
* Rest time
* Video/GIF
* Progressions
* Notes

---

# 🥗 Nutrición

## Features

* Meal plans
* Recipes
* Macros
* Calories
* Grocery lists
* Daily meals

Future:

* Barcode scanner
* AI food detection
* Smart recommendations

---

# 📆 Calendario

## Features

* Workout scheduling
* Habit reminders
* Meal planning
* Drag-and-drop events
* Weekly/monthly view

Future:

* Google Calendar sync

---

# 🔥 Hábitos

Simple but powerful habit system.

Examples:

* Sleep
* Water
* Protein
* Reading
* Meditation
* Steps

Features:

* streaks,
* completion tracking,
* visual progress.

---

# 🤖 Asistente IA

Core differentiator.

Chat-style interface where users can:

* ask questions,
* modify workouts,
* request recipes,
* adjust calories,
* get recommendations,
* receive contextual insights.

The AI must understand:

* user goals,
* habits,
* recovery,
* nutrition,
* workout history.

---

# 🧠 Arquitectura del Sistema IA

# Generador de Entrenamientos

### Inputs

* Goal
* Weight
* Height
* Experience
* Equipment
* Injuries
* Schedule
* Adherence
* Recovery
* Available time

### Outputs

* Workout split
* Exercises
* Sets/reps
* Intensity
* Rest times
* Progressions
* Deload recommendations

---

# Generador Nutricional

### Inputs

* Calories
* Goal
* Allergies
* Budget
* Preferences
* Cooking time

### Outputs

* Meals
* Recipes
* Macros
* Grocery lists
* Meal timing

---

# 🧱 Reglas de Desarrollo

## Code Standards

* Strict TypeScript
* Reusable architecture
* Scalable folder structure
* Modular components
* No duplicated logic
* Clean naming conventions

---

## Performance Rules

* Server Components when possible
* Lazy loading
* Suspense
* Skeleton loaders
* Optimized images
* Efficient queries

---

## Responsive Rules

* Mobile-first mandatory
* Tablet optimized
* Desktop polished

---

# 🌑 Sistema de Temas

El modo oscuro debe ser la experiencia principal.

Characteristics:

* soft contrast,
* deep blacks,
* muted grays,
* premium gradients,
* subtle highlights.

Accent colors should be limited.

---

# 🛣️ Roadmap del Producto

# Fase 1 — MVP

* Auth
* Dashboard
* Workouts
* Tracking
* Basic AI
* Nutrition
* Habits

---

# Fase 2 — Inteligencia

* Adaptive recommendations
* Historical context
* Better analytics
* Smart progression

---

# Fase 3 — App Móvil

Recommended:

* React Native
* Expo

---

# Fase 4 — Ecosistema Avanzado

* Wearables
* Voice AI
* OCR nutrition
* Community
* Challenges
* Marketplace

---

# 🧠 PROMPT MAESTRO — GENERACIÓN DE CÓDIGO CON IA

```md
You are a senior frontend engineer and product designer specialized in:

- Next.js
- React
- TypeScript
- SaaS architecture
- premium UI systems
- scalable frontend development

Your task is to build the frontend for a product called FITTO.

# Product Description

FITTO is an AI-powered personal fitness assistant.

The platform combines:

- workouts,
- nutrition,
- habits,
- recovery,
- analytics,
- calendar systems,
- and contextual AI coaching.

The experience should feel like:

- Whoop
- Linear
- Apple Fitness
- Notion
- Hevy

The UI must feel:

- premium,
- modern,
- minimal,
- futuristic,
- athletic.

# Required Stack

- Next.js 15 App Router
- React 19
- TypeScript
- TailwindCSS
- shadcn/ui
- Zustand
- TanStack Query
- Framer Motion
- Recharts
- React Hook Form
- Zod
- Supabase

# Requirements

- Mobile first.
- Dark mode.
- Reusable architecture.
- Modular components.
- Scalable structure.
- Production-ready code.
- Strict TypeScript.
- Clean folder organization.

# Generate

1. Full project structure
2. Global layout system
3. Sidebar/navigation
4. Dashboard page
5. Theme system
6. Authentication flow
7. Reusable UI components
8. Example data models
9. Zustand stores
10. Responsive layouts

# Routes

/auth
- login
- register
- forgot-password

/app
- dashboard
- workouts
- nutrition
- habits
- progress
- calendar
- assistant
- settings
- profile

# Dashboard Requirements

Show:

- today's workout,
- calories/macros,
- habits,
- progress,
- AI insights,
- upcoming events.

# UI Requirements

- smooth animations,
- modern cards,
- clean charts,
- premium spacing,
- skeleton loaders,
- responsive design.

Generate production-quality code only.
```
