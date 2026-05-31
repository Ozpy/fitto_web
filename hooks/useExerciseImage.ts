import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

// Memory cache - persists during the user's session
const imageCache = new Map<string, any>();

export function useExerciseImage(exerciseName: string, muscles?: string[]) {
  const cacheKey = `${exerciseName}::${(muscles ?? []).join(',')}`;
  const [data, setData] = useState(imageCache.get(cacheKey) ?? null);
  const [loading, setLoading] = useState(!imageCache.has(cacheKey));
  const [error, setError] = useState<any>(null);
  
  useEffect(() => {
    if (imageCache.has(cacheKey)) {
      setData(imageCache.get(cacheKey));
      setLoading(false);
      return;
    }
    
    let cancelled = false;
    setLoading(true);
    setError(null);
    
    async function fetchImage() {
      try {
        const { data: result, error: rpcError } = await supabase.rpc('find_exercise_image', { 
          p_exercise_name: exerciseName,
          p_muscles: muscles ?? null
        });
        
        if (cancelled) return;
        
        if (rpcError) {
          console.error("Error in find_exercise_image RPC:", rpcError);
          setError(rpcError);
          setLoading(false);
          return;
        }

        const value = result && result.length > 0 ? result[0] : null;
        imageCache.set(cacheKey, value);
        setData(value);
        setLoading(false);
      } catch (err: any) {
        if (cancelled) return;
        console.error("Fetch exercise image catch error:", err);
        setError(err);
        setLoading(false);
      }
    }
    
    fetchImage();
      
    return () => {
      cancelled = true;
    };
  }, [cacheKey, exerciseName, muscles]);
  
  return { data, loading, error };
}
