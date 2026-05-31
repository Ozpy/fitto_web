'use client';

import { useState } from 'react';
import { useExerciseCatalog } from '@/hooks/useExerciseCatalog';
import { Dumbbell } from 'lucide-react';

interface ExerciseImageProps {
  exerciseName: string;
  muscles?: string[];
  className?: string;
  showSecondary?: boolean;  // Mostrar 2 imágenes (inicio y fin del movimiento)
}

export function ExerciseImage({ 
  exerciseName, 
  muscles, 
  className = '',
  showSecondary = false 
}: ExerciseImageProps) {
  const { data, loading } = useExerciseCatalog(exerciseName, muscles);
  const [imgError, setImgError] = useState(false);
  
  // Loading skeleton
  if (loading) {
    return (
      <div className={`bg-accent/20 animate-pulse rounded-2xl ${className}`} />
    );
  }
  
  // Sin imagen disponible o falló la carga
  if (!data || imgError) {
    return (
      <div className={`bg-muted/50 rounded-2xl flex flex-col items-center justify-center text-muted-foreground border border-border/40 ${className}`}>
        <Dumbbell className="w-8 h-8 mb-1.5 opacity-30 text-primary" />
        <span className="text-[10px] font-black uppercase tracking-widest leading-none select-none">Sin imagen</span>
      </div>
    );
  }
  
  // Mostrar 2 imágenes (movimiento inicial y final)
  if (showSecondary && data.image_url_2) {
    return (
      <div className={`grid grid-cols-2 gap-2.5 ${className}`}>
        <div className="relative overflow-hidden rounded-2xl border border-border/40 aspect-[4/3] bg-card flex items-center justify-center">
          <img 
            src={data.image_url_1}
            alt={`${exerciseName} - inicio`}
            className="w-full h-full object-contain select-none p-1"
            onError={() => setImgError(true)}
            loading="lazy"
          />
          <span className="absolute bottom-2 left-2 bg-black/60 text-white text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider select-none leading-none">Inicio</span>
        </div>
        <div className="relative overflow-hidden rounded-2xl border border-border/40 aspect-[4/3] bg-card flex items-center justify-center">
          <img 
            src={data.image_url_2}
            alt={`${exerciseName} - final`}
            className="w-full h-full object-contain select-none p-1"
            onError={() => setImgError(true)}
            loading="lazy"
          />
          <span className="absolute bottom-2 left-2 bg-black/60 text-white text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider select-none leading-none">Fin</span>
        </div>
      </div>
    );
  }
  
  // Imagen única
  return (
    <div className={`relative overflow-hidden rounded-2xl border border-border/40 bg-card flex items-center justify-center ${className}`}>
      <img 
        src={data.image_url_1}
        alt={exerciseName}
        className="w-full h-full object-contain select-none p-1"
        onError={() => setImgError(true)}
        loading="lazy"
      />
    </div>
  );
}
