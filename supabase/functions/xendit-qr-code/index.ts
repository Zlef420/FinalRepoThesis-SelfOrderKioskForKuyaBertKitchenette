import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

const xenditApiKey = Deno.env.get("XENDIT_SECRET_KEY");
const authorizationHeader = `Basic ${btoa(xenditApiKey + ":")}`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { amount, external_id } = await req.json();

    if (!amount || !external_id) {
      return new Response(JSON.stringify({ error: "Missing required parameters: amount, external_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch("https://api.xendit.co/qr_codes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": authorizationHeader,
        "Idempotency-key": `qr-code-${external_id}`,
      },
      body: JSON.stringify({
        external_id: external_id,
        type: "DYNAMIC",
        currency: "PHP",
        amount: amount,
        channel_code: "Gcash",
        callback_url: "https://mupkamyontqqnvguejfi.supabase.co/functions/v1/xendit-webhook"
      }),
    });

    const data = await response.json();

    if (response.status !== 200) {
      console.error("Xendit API Error:", data);
      return new Response(JSON.stringify({ error: "Failed to create QR code", xendit_error: data }), {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Server Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}); 