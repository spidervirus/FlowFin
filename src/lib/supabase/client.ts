import { createBrowserClient } from '@supabase/ssr';

export const createClient = () => {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          'Accept': 'application/json, application/vnd.pgrst.object+json',
          'Content-Type': 'application/json',
          'X-Client-Info': 'supabase-js/2.38.4',
        },
      },
    }
  );
}; 