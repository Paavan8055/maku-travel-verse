import { corsHeaders } from '../_shared/cors.ts';
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2.53.0'

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authenticated user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      }
    );

    const { data: user, error: userError } = await supabase.auth.getUser();
    if (userError || !user.user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method === 'GET') {
      // Fetch user documents
      const { data: documents, error } = await supabase
        .from('user_documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching documents:', error);
        return new Response(
          JSON.stringify({ success: false, error: error.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check for expiring documents
      const expiringDocs = documents?.filter(doc => {
        if (!doc.expiry_date) return false;
        const expiryDate = new Date(doc.expiry_date);
        const today = new Date();
        const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return daysUntilExpiry <= 90 && daysUntilExpiry > 0;
      }) || [];

      return new Response(
        JSON.stringify({ 
          success: true, 
          documents: documents || [],
          expiringCount: expiringDocs.length
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method === 'POST') {
      // Create new document
      const documentData = await req.json();
      
      const { data, error } = await supabase
        .from('user_documents')
        .insert({
          user_id: user.user.id,
          document_type: documentData.document_type,
          title: documentData.title,
          description: documentData.description,
          document_number: documentData.document_number,
          issue_date: documentData.issue_date,
          expiry_date: documentData.expiry_date,
          issuing_authority: documentData.issuing_authority,
          metadata: documentData.metadata || {}
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating document:', error);
        return new Response(
          JSON.stringify({ success: false, error: error.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if document expiry notification should be created
      if (data.expiry_date) {
        const expiryDate = new Date(data.expiry_date);
        const today = new Date();
        const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysUntilExpiry <= 90 && daysUntilExpiry > 0) {
          // Create notification using service role client
          const serviceSupabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
          );

          await serviceSupabase.from('notifications').insert({
            user_id: user.user.id,
            type: 'document_expiry',
            title: 'Document Expiry Warning',
            message: `Your ${data.title} expires on ${data.expiry_date}. Please renew to avoid travel disruptions.`,
            priority: daysUntilExpiry <= 30 ? 'high' : daysUntilExpiry <= 60 ? 'medium' : 'low',
            metadata: { document_id: data.id, expiry_date: data.expiry_date }
          });
        }
      }

      return new Response(
        JSON.stringify({ success: true, document: data }),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Document service error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});