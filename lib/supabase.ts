import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://auwqpsjngoarexudjxap.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1d3Fwc2puZ29hcmV4dWRqeGFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzOTQ3NTgsImV4cCI6MjA4Nzk3MDc1OH0.RYLNWW00i0fSCBozuC4r93kFWF4Up7g_Mqrr9QED-0Y';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: 'pkce',
  },
});