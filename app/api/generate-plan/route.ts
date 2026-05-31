import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    // 1. Validar sesión del usuario de manera segura en el servidor
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'No autenticado o sesión expirada' },
        { status: 401 }
      );
    }
    
    // 2. Leer body del cliente (opcional)
    const body = await request.json().catch(() => ({}));
    
    // 3. Llamar al webhook de n8n
    // Sanitizamos la clave y URL para remover saltos de línea (\n), retornos de carro (\r) y espacios ocultos
    const rawSecret = process.env.FITTO_N8N_SECRET || 'miclave';
    const n8nSecret = rawSecret.replace(/[\r\n]/g, '').trim();
    
    const rawURL = process.env.FITTO_N8N_WEBHOOK_URL || 'https://asistencia.innavanti.com/webhook/fitto-generate-plan';
    const n8nURL = rawURL.replace(/[\r\n]/g, '').trim();

    console.log('--- FITTO WEBHOOK DEBUG LOGS ---');
    console.log('URL de destino:', n8nURL);
    console.log('Secret crudo (env):', JSON.stringify(process.env.FITTO_N8N_SECRET));
    console.log('Secret sanitizado:', JSON.stringify(n8nSecret));
    console.log('Secret longitud:', n8nSecret.length);
    console.log('Headers a enviar:', {
      'Content-Type': 'application/json',
      'ftt_value': n8nSecret,
      'x-fitto-token': n8nSecret
    });
    console.log('---------------------------------');

    // Construimos headers usando la clase nativa Headers para máxima fidelidad
    const headersList = new Headers();
    headersList.append('Content-Type', 'application/json');
    headersList.append('ftt_value', n8nSecret);
    headersList.append('x-fitto-token', n8nSecret);
    
    // Forzamos el user_id obtenido desde el JWT (Supabase Auth)
    const n8nResponse = await fetch(n8nURL, {
      method: 'POST',
      headers: headersList,
      body: JSON.stringify({
        user_id: user.id,
        compare: body.compare || false,
        models: body.models,
      }),
      cache: 'no-store' // Evitar caché agresivo de Next.js
    });
    
    if (!n8nResponse.ok) {
      const errorText = await n8nResponse.text();
      console.error('n8n response error:', errorText);
      return NextResponse.json(
        { success: false, error: 'Error del servidor de generación de plan' },
        { status: n8nResponse.status || 500 }
      );
    }
    
    const responseText = await n8nResponse.text();
    let data: any = { success: true };
    
    if (responseText && responseText.trim() !== "") {
      try {
        data = JSON.parse(responseText);
        // Force success field if not present
        if (data && typeof data === 'object' && !('success' in data)) {
          data.success = true;
        }
      } catch (e) {
        console.warn("n8n did not return valid JSON, parsing as text string:", responseText);
        data = { success: true, message: responseText };
      }
    }
    
    return NextResponse.json(data);
    
  } catch (error: any) {
    console.error('Error in generate-plan route:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
