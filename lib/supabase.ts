
import { createClient } from '@supabase/supabase-js';

// Access environment variables safely
// Supports Vite (import.meta.env), Next.js (NEXT_PUBLIC_), and CRA (REACT_APP_)
const getEnv = (key: string) => {
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    // @ts-ignore
    return import.meta.env[key] || import.meta.env[`VITE_${key}`];
  }
  return (
    process.env[key] || 
    process.env[`NEXT_PUBLIC_${key}`] || 
    process.env[`REACT_APP_${key}`]
  );
};

const supabaseUrl = getEnv('SUPABASE_URL');
const supabaseAnonKey = getEnv('SUPABASE_ANON_KEY');

// Only create the client if keys are present
export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;
