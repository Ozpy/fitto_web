import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

// Memory cache - persists during the user's session
const catalogCache = new Map<string, any>();

export function useExerciseCatalog(exerciseName: string, muscles?: string[]) {
  const cacheKey = `${exerciseName}::${(muscles ?? []).join(',')}`;
  const [data, setData] = useState(catalogCache.get(cacheKey) ?? null);
  const [loading, setLoading] = useState(!catalogCache.has(cacheKey));
  const [error, setError] = useState<any>(null);
  
  useEffect(() => {
    if (catalogCache.has(cacheKey)) {
      setData(catalogCache.get(cacheKey));
      setLoading(false);
      return;
    }
    
    let cancelled = false;
    setLoading(true);
    setError(null);
    
    async function fetchCatalog() {
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
        catalogCache.set(cacheKey, value);
        setData(value);
        setLoading(false);
      } catch (err: any) {
        if (cancelled) return;
        console.error("Fetch exercise catalog catch error:", err);
        setError(err);
        setLoading(false);
      }
    }
    
    fetchCatalog();
      
    return () => {
      cancelled = true;
    };
  }, [cacheKey, exerciseName, muscles]);
  
  return { data, loading, error };
}
