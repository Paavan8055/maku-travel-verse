/**
 * Supabase Edge Function to handle Mem0 webhooks.
 *
 * This function receives POST requests from Mem0 when memories are added,
 * updated or deleted. It logs the event payload to the Supabase logs and
 * returns a 200 response. Extend this handler to persist memory data to
 * your own tables or trigger additional workflows.
 */
import { serve } from "https://deno.land/std/http/server.ts";

serve(async (req) => {
  try {
    const body = await req.json();
    console.log("Received Mem0 webhook:", body);
    // TODO: implement storing the memory payload in your database or other actions
    return new Response(JSON.stringify({ status: "success" }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    console.error("Error handling webhook", err);
    return new Response(JSON.stringify({ error: "Invalid request" }), {
      headers: { "Content-Type": "application/json" },
      status: 400,
    });
  }
});
