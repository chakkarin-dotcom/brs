# Google Apps Script — ฐานข้อมูล Google Sheet สำหรับระบบแจ้งซ่อมอาคารพจน์ สารสิน

## วิธีติดตั้งและ Deploy

### ขั้นตอนที่ 1: สร้าง Google Sheet

1. ไปที่ [Google Sheets](https://sheets.google.com) และสร้าง Sheet ใหม่
2. ตั้งชื่ออะไรก็ได้ เช่น `ระบบแจ้งซ่อมอาคารพจน์ สารสิน`
3. เปลี่ยนชื่อชีต (sheet tab ด้านล่าง) เป็น **`Data`**

### ขั้นตอนที่ 2: ติดตั้ง Apps Script

1. ใน Google Sheet ที่สร้าง → เมนู **ส่วนขยาย (Extensions)** → **Apps Script**
2. ลบ `function myFunction()` ใน editor
3. คัดลอกเนื้อหาจากไฟล์ [`Code.gs`](./Code.gs) วางทั้งหมดลงใน editor
4. กด **Save** (หรือ Ctrl+S)

### ขั้นตอนที่ 3: ใส่ข้อมูลเริ่มต้น (Run ครั้งแรกเท่านั้น)

1. ใน Apps Script editor เลือกฟังก์ชัน `setupInitialData`
2. กดปุ่ม **Run ▶** (เล่น)
3. ระบบจะขอ permission ครั้งแรก ให้กด **Review Permissions** → เลือกบัญชีคุณ → **Allow**
4. รอจนแจ้งเตือน **"✅ ตั้งค่าข้อมูลเริ่มต้นสำเร็จ!"**
5. กลับไปดู Google Sheet ของคุณ — ชีต `Data` จะมีข้อมูลแถวเริ่มต้นดังนี้:
   - `categories` — หมวดหมู่อุปกรณ์/ระบบอาคาร 6 หมวด
   - `tickets` — ว่างเปล่า (ยังไม่มีคำร้อง)
   - `officer` — ข้อมูลเจ้าหน้าที่ผู้ดูแล
   - `webhookUrl` — ว่างเปล่า (ยังไม่ตั้งค่า)

### ขั้นตอนที่ 4: Deploy เป็น Web App

1. ใน Apps Script editor → ปุ่ม **Deploy** → **New deployment**
2. เลือก Type: **Web app**
3. ตั้งค่า:
   - **Description**: ระบบแจ้งซ่อมอาคารพจน์ สารสิน
   - **Execute as**: `Me (chakkarin@kku.ac.th)`
   - **Who has access**: `Anyone` (หรือจำกัดเฉพาะใน มข. ถ้าต้องการ)
4. กด **Deploy**
5. คัดลอก **Web App URL** ที่ได้ (เช่น `https://script.google.com/macros/s/.../exec`)

### ขั้นตอนที่ 5: กำหนด URL ในระบบ

#### ถ้าใช้งานแบบ Dev (Vite dev server)
สร้างไฟล์ `.env` ในโฟลเดอร์โปรเจกต์หลัก (ข้าง `vite.config.ts`):

```env
VITE_GOOGLE_SHEETS_WEBAPP_URL=https://script.google.com/macros/s/xxxxxxxxxxxxx/exec
```

จากนั้นรัน `npm run dev` ตามปกติ

#### ถ้า Deploy จริง (Production build)
ตั้งค่า Environment Variable ใน hosting platform ของคุณ เช่น:

- **Cloud Run**: `gcloud run deploy ... --set-env-vars VITE_GOOGLE_SHEETS_WEBAPP_URL=...`
- **Vercel / Netlify**: ใส่ใน Dashboard Environment Variables

### การทำงานของระบบ

| การทำงาน | localStorage | Google Sheets |
|-----------|-------------|---------------|
| โหลดข้อมูลตอน app mount | ✅ โหลดพร้อมกับ UI ทันที | ✅ ดึง async พร้อมกันแล้วอัปเดต state |
| บันทึกข้อมูล (tickets/categories/etc) | ✅ เขียนทันที (sync) | ✅ เขียน async พร้อมกัน |
| Fallback เมื่อไม่มี URL | ✅ ทำงานปกติ (localStorage อย่างเดียว) | – |
| ทำงาน Offline ได้ | ✅ ได้ (ถ้าเคย sync มาแล้ว) | ❌ ต้องมี internet |

> **หมายเหตุ:** เมื่อเชื่อมต่อ Google Sheets แล้ว ข้อมูลจะถูกเก็บทั้งใน localStorage (สำหรับแสดงผลทันที) และ Google Sheets (สำหรับ persistence ข้าม session/device) หากมีข้อมูลใน Sheets มาก่อน ระบบจะใช้ข้อมูลจาก Sheets แทน localStorage

## การแก้ไขปัญหา

**Q:** POST ไม่ทำงาน ได้ error 404 หรือ redirect?
**A:** เวลา Deploy Web App ใหม่ (แก้ไข Code.gs แล้ว deploy ใหม่) บางครั้ง URL เดิมอาจ cache อยู่ ให้กด Deploy → **Manage deployments** → แก้ไข → **Deploy** เพื่อรับ URL ใหม่ หรือลอง append `/dev` ต่อท้าย URL

**Q:** ข้อมูลไม่ sync?
**A:** ตรวจสอบว่า `VITE_GOOGLE_SHEETS_WEBAPP_URL` ถูกตั้งค่าถูกต้อง และ Web App ถูก deploy ในสถานะที่ execute เป็นบัญชีที่มีสิทธิ์เขียน Sheet

**Q:** อยาก reset ข้อมูล?
**A:** ไปที่ Apps Script editor → Run ฟังก์ชัน `setupInitialData()` อีกครั้ง