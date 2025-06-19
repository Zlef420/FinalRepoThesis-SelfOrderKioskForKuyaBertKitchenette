import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const xenditWebhookToken = Deno.env.get("XENDIT_WEBHOOK_TOKEN");

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const receivedToken = req.headers.get("x-callback-token");
    if (receivedToken !== xenditWebhookToken) {
      console.warn("Invalid webhook token received.");
      return new Response(JSON.stringify({ error: "Invalid webhook token" }), { status: 401 });
    }

    const payload = await req.json();
    console.log("Received Xendit webhook payload:", payload);

    if (payload.event === "qr.payment") {
      const externalId = payload.data.external_id;
      const paymentStatus = payload.data.status;

      if (paymentStatus === 'SUCCEEDED') {
        const supabase = createClient(
          Deno.env.get("SUPABASE_URL") ?? "",
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        const { data: transaction, error: fetchError } = await supabase
          .from("trans_table")
          .select("total_amntdue")
          .eq("ref_number", externalId)
          .single();

        if (fetchError) {
          if (fetchError.code === "PGRST116") {
            console.log(`Test webhook for non-existent transaction: ${externalId}. Returning success.`);
            return new Response(JSON.stringify({ received: true, message: "Test webhook successful." }), {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
          console.error("Error fetching transaction for webhook:", fetchError);
          throw fetchError;
        }

        const { error: updateError } = await supabase
          .from("trans_table")
          .update({ 
            pymnt_status: "Paid",
            amount_paid: transaction.total_amntdue
          })
          .eq("ref_number", externalId);

        if (updateError) {
          console.error("Error updating transaction from webhook:", updateError);
          throw updateError;
        }

        console.log(`Transaction ${externalId} successfully updated to 'Paid'.`);
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error processing Xendit webhook:", error);
    return new Response(JSON.stringify({ error: "Webhook processing failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}); 