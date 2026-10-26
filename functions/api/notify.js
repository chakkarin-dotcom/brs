// โค้ดใน functions/api/notify.js
export async function onRequestPost(context) {
  try {
    const body = await context.request.json();
    
    // ดึง Webhook URL ที่ซ่อนไว้ใน Cloudflare Environment Variables
    const webhookUrl = context.env.GOOGLE_CHAT_WEBHOOK_URL;

    // Cloudflare ยิงไป Google Chat แทนหน้าบ้าน (คีย์ไม่หลุด)
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    return new Response(JSON.stringify({ success: response.ok }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}