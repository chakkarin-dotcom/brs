// ไฟล์: functions/api/repair.js

export async function onRequestPost(context) {
  try {
    // 1. รับข้อมูลฟอร์มแจ้งซ่อมที่ส่งมาจากหน้าบ้าน
    const formData = await context.request.json();

    // 2. ดึงคีย์ความลับจาก Cloudflare Environment Variables (หน้าบ้านมองไม่เห็น)
    const sheetsUrl = context.env.GOOGLE_SHEETS_WEBAPP_URL;
    const chatWebhookUrl = context.env.GOOGLE_CHAT_WEBHOOK_URL;

    // 3. ส่งข้อมูลเข้า Google Sheets
    if (sheetsUrl) {
      await fetch(sheetsUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
    }

    // 4. ส่งข้อความแจ้งเตือนเข้า Google Chat
    if (chatWebhookUrl) {
      await fetch(chatWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `🛠️ **แจ้งซ่อมใหม่ (อาคารพจน์ สารสิน)**\nรายการ: ${formData.title || 'ไม่มีชื่อเรื่อง'}\nผู้แจ้ง: ${formData.reporterName || 'ไม่ระบุ'}`
        }),
      });
    }

    // 5. ส่งสถานะตอบกลับไปบอกหน้าบ้านว่าสำเร็จแล้ว
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}