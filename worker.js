/**
 * Cloudflare Worker: Multi-service router
 * Handles /api/contact, /api/resume, and falls back to static assets.
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // OPTIONS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Max-Age": "86400"
        }
      });
    }

    // API Route: Contact Form Dispatch via Resend
    if (url.pathname === "/api/contact" && request.method === "POST") {
      const corsHeaders = {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json"
      };

      try {
        const injectedKey = "__INJECTED_RESEND_KEY__";
        const apiKey = (env && env.RESEND_API_KEY) ? env.RESEND_API_KEY : (injectedKey.startsWith("__") ? null : injectedKey);
        if (!apiKey) {
          return new Response(JSON.stringify({ error: "Missing RESEND_API_KEY in Cloudflare." }), {
            status: 500,
            headers: corsHeaders
          });
        }

        const payload = await request.json();
        const { sender, email, subject, message } = payload;

        if (!sender || !email || !message) {
          return new Response(JSON.stringify({ error: "Sender name, email, and message are required." }), {
            status: 400,
            headers: corsHeaders
          });
        }

        const resendResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            from: "Portfolio Transmission <onboarding@resend.dev>",
            to: ["mayankmanjul+personal@live.com"],
            reply_to: email,
            subject: `[PORTFOLIO TRANSMISSION] ${subject || 'Inquiry'} from ${sender}`,
            text: `INCOMING PORTFOLIO TRANSMISSION\n-------------------------------\nSender Name: ${sender}\nResponse Channel (Email): ${email}\nInquiry Directive: ${subject}\n\nMessage Payload:\n${message}\n\n-------------------------------\nDispatched securely via Mayank Manjul Portfolio Engine\nhttps://mayankmanjul.com`,
            html: `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b1322; color: #f1f5f9; padding: 24px; border-radius: 8px;">
                <h2 style="color: #00f2fe; margin-top: 0; border-bottom: 1px solid rgba(0, 242, 254, 0.3); padding-bottom: 12px; letter-spacing: 0.05em;">
                  ⚡ INCOMING PORTFOLIO TRANSMISSION
                </h2>
                <p style="margin: 8px 0; font-size: 15px;"><strong>Sender Name:</strong> ${sender}</p>
                <p style="margin: 8px 0; font-size: 15px;"><strong>Response Channel (Email):</strong> <a href="mailto:${email}" style="color: #38bdf8; text-decoration: none;">${email}</a></p>
                <p style="margin: 8px 0; font-size: 15px;"><strong>Inquiry Directive:</strong> ${subject}</p>
                <div style="background: rgba(255, 255, 255, 0.05); border-left: 4px solid #00f2fe; padding: 16px 18px; margin: 20px 0; border-radius: 4px;">
                  <p style="white-space: pre-wrap; font-size: 15px; line-height: 1.6; margin: 0; color: #e2e8f0;">${message}</p>
                </div>
                <p style="font-size: 12px; color: #64748b; margin-top: 24px; margin-bottom: 0;">Dispatched securely via Mayank Manjul Portfolio Engine • <a href="https://mayankmanjul.com" style="color: #64748b;">https://mayankmanjul.com</a></p>
              </div>
            `
          })
        });

        const resendResult = await resendResponse.json();

        if (!resendResponse.ok) {
          console.error("Resend error:", resendResult);
          return new Response(JSON.stringify({ error: resendResult.message || "Failed to dispatch email." }), {
            status: resendResponse.status,
            headers: corsHeaders
          });
        }

        return new Response(JSON.stringify({ success: true, id: resendResult.id }), {
          status: 200,
          headers: corsHeaders
        });

      } catch (err) {
        return new Response(JSON.stringify({ error: err.message || "Internal transmission error." }), {
          status: 500,
          headers: corsHeaders
        });
      }
    }

    // API Route: Resume Redirect
    if (url.pathname === "/api/resume") {
      const mode = url.searchParams.get("mode");
      if (mode === "download") {
        return Response.redirect("https://drive.google.com/uc?export=download&id=1rQcI8EHY2sCMNXN2j-Doxnb8eUOrDM6y", 302);
      }
      return Response.redirect("https://drive.google.com/file/d/1rQcI8EHY2sCMNXN2j-Doxnb8eUOrDM6y/view?usp=sharing", 302);
    }

    // Fallback: serve static assets via env.ASSETS
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response("Not found", { status: 404 });
  }
};
