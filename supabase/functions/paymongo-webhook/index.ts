// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { createHmac } from "https://deno.land/std@0.168.0/node/crypto.ts";

console.log("PayMongo Webhook handler initialized");

// This function will be triggered by PayMongo's webhook service
Deno.serve(async (req) => {
  console.log("Webhook received a request.");

  // 1. Check if the request is a POST request and has the correct headers
  if (req.method !== "POST") {
    console.log("Request method is not POST.");
    return new Response("Method Not Allowed", { status: 405 });
  }
  const signature = req.headers.get("paymongo-signature");
  if (!signature) {
    console.log("Missing Paymongo-Signature header.");
    return new Response("Missing Paymongo-Signature header", { status: 400 });
  }
  console.log("Paymongo-Signature header found:", signature);

  try {
    // 2. Get webhook secret from environment variables
    const webhookSecretKey = Deno.env.get("PAYMONGO_WEBHOOK_SECRET_KEY");
    if (!webhookSecretKey) {
      console.error("PAYMONGO_WEBHOOK_SECRET_KEY is not set.");
      throw new Error("PAYMONGO_WEBHOOK_SECRET_KEY is not set in function secrets");
    }

    // 3. Verify the webhook signature for security
    const requestBody = await req.text();
    console.log("Request body:", requestBody);

    const parts = signature.split(",").reduce((acc, part) => {
      const [key, value] = part.split("=");
      acc[key.trim()] = value.trim();
      return acc;
    }, {} as Record<string, string>);

    const timestamp = parts.t;
    const signatureFromHeader = parts.te || parts.li;

    if (!timestamp || !signatureFromHeader) {
      console.error("Invalid signature format. Timestamp or signature missing.");
      throw new Error("Invalid signature format: Timestamp or signature missing.");
    }

    const dataToSign = `${timestamp}.${requestBody}`;
    const hmac = createHmac("sha256", webhookSecretKey);
    hmac.update(dataToSign);
    const computedSignature = hmac.digest("hex");

    if (computedSignature !== signatureFromHeader) {
      console.error("Signature verification failed.");
      throw new Error("Signature verification failed.");
    }
    console.log("Signature verified successfully.");

    // 4. If signature is valid, process the event
    const payload = JSON.parse(requestBody);
    const event = payload.data;
    console.log("Processing event:", event.attributes.type);

    if (event.attributes.type === "source.chargeable") {
      // The actual source object is nested inside the event's data attribute
      const sourceObject = event.attributes.data;
      const sourceId = sourceObject.id; // This is the correct 'src_...' ID
      console.log("Source is chargeable. Source ID:", sourceId);

      const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );

      console.log("Calling update_payment_on_success RPC function.");
      const { error } = await supabaseAdmin.rpc("update_payment_on_success", {
        p_payment_ref_id: sourceId,
      });

      if (error) {
        console.error(`Error calling update_payment_on_success for source ${sourceId}:`, error);
        throw new Error(`Supabase DB Error: ${error.message}`);
      }

      console.log(`Successfully processed payment update for source: ${sourceId}.`);
    }

    // 5. Return a 200 OK response to PayMongo
    console.log("Webhook processed successfully.");
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("Webhook processing error:", err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }
});
