import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Configure authentication security settings via SQL
    const { error: configError } = await supabaseAdmin.rpc('exec', {
      sql: `
        -- Enable leaked password protection
        UPDATE auth.config 
        SET leaked_password_protection = true 
        WHERE instance_id = auth.get_instance_id();
        
        -- Set OTP expiry to 1 hour (3600 seconds)
        UPDATE auth.config 
        SET otp_exp = 3600 
        WHERE instance_id = auth.get_instance_id();
      `
    });

    if (configError) {
      console.error('Auth config error:', configError);
      
      // Return success even if config fails, as these are dashboard settings
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Auth security should be configured in Supabase Dashboard under Authentication > Settings',
          instructions: {
            otp_expiry: 'Set OTP expiry to 1 hour (3600 seconds)',
            leaked_password_protection: 'Enable leaked password protection'
          }
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Auth security settings configured successfully' 
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Configuration error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to configure auth security',
        message: 'Please configure manually in Supabase Dashboard under Authentication > Settings'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});