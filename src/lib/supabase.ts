import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://vdvzldyqolgeukepwlzc.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZkdnpsZHlxb2xnZXVrZXB3bHpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY4OTc0NzEsImV4cCI6MjA2MjQ3MzQ3MX0.Nzr-sPqzQYF6rlyvND4JghGRXLpdms0-eRSdwarLDMo";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
