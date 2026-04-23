import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("⚠️ Error: Faltan las variables de entorno de Supabase. Verifica tu archivo .env en la carpeta /front");
}

// Cliente de Supabase para Realtime y operaciones directas
// Usamos valores por defecto solo para evitar el crash inmediato, pero fallará al conectar
export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder');