# LINE OA Chatbot — NS2 Family

บอทตอบคำถามที่พบบ่อยสำหรับ LINE Official Account ของหอผู้ป่วยทารก (NS2 Family)
ทำงานแบบ **ปุ่มเมนู (Quick Reply)** + **จับคำสำคัญจากข้อความ (Keyword Matching)**

---

## โครงสร้างไฟล์

```
line-oa-bot/
├── index.js        # ตัว server หลัก รับ webhook จาก LINE
├── qaData.js        # ← แก้ไข/เพิ่ม/ลบคำถาม-คำตอบที่นี่ไฟล์เดียว
├── package.json
├── .env.example      # ตัวอย่างไฟล์ environment variables
└── .gitignore
```

## ขั้นตอนที่ 1: สร้าง LINE Official Account + Channel

1. ไปที่ [LINE Developers Console](https://developers.line.biz/console/)
2. สร้าง **Provider** (ถ้ายังไม่มี)
3. สร้าง **Channel** ประเภท **Messaging API**
4. ในหน้า Channel ให้ไปที่แท็บ **Messaging API**:
   - เลื่อนลงไปกด **Issue** ที่ช่อง **Channel access token (long-lived)** → คัดลอกเก็บไว้
   - ที่แท็บ **Basic settings** คัดลอกค่า **Channel secret** เก็บไว้
5. ปิดฟีเจอร์ **Auto-reply messages** และ **Greeting messages** ของ LINE Official Account Manager (เพื่อไม่ให้ชนกับบอทของเรา) ที่ [LINE Official Account Manager](https://manager.line.biz/) → Settings → Response settings → เปิด **Webhooks** และปิด Auto-response

## ขั้นตอนที่ 2: รันโค้ดบนเครื่อง (ทดสอบก่อน deploy จริง)

```bash
npm install
cp .env.example .env
# แก้ .env ใส่ LINE_CHANNEL_ACCESS_TOKEN และ LINE_CHANNEL_SECRET ที่คัดลอกมา
npm start
```

server จะรันที่ `http://localhost:3000`

LINE บังคับให้ Webhook URL เป็น **HTTPS** เท่านั้น ตอนทดสอบในเครื่องให้ใช้ [ngrok](https://ngrok.com/) เปิด tunnel:

```bash
ngrok http 3000
```

จะได้ URL เช่น `https://xxxx.ngrok-free.app` — เอา URL นี้ + `/webhook` ไปใส่ในขั้นตอนที่ 3

## ขั้นตอนที่ 3: ตั้งค่า Webhook URL ใน LINE Developers Console

1. กลับไปที่ Channel > แท็บ **Messaging API**
2. ช่อง **Webhook URL** ใส่: `https://<your-domain>/webhook`
3. กด **Verify** เพื่อทดสอบว่าเชื่อมต่อสำเร็จ (ต้อง deploy หรือเปิด ngrok ค้างไว้ก่อน)
4. เปิด toggle **Use webhook** เป็น ON

## ขั้นตอนที่ 4: Deploy ขึ้นเซิร์ฟเวอร์จริง (ฟรี/ราคาถูก แนะนำ 3 ทางเลือก)

### ตัวเลือก A: Railway (ง่ายที่สุด, มี free tier)
1. สมัคร [railway.app](https://railway.app) ด้วย GitHub
2. New Project → Deploy from GitHub repo (push โค้ดนี้ขึ้น GitHub ก่อน)
3. ไปที่ Variables ใส่ `LINE_CHANNEL_ACCESS_TOKEN` และ `LINE_CHANNEL_SECRET`
4. Railway จะให้ URL แบบ `https://xxx.up.railway.app` — เอาไปตั้งเป็น Webhook URL (ต่อท้ายด้วย `/webhook`)

### ตัวเลือก B: Render
1. สมัคร [render.com](https://render.com)
2. New → Web Service → เชื่อม GitHub repo
3. Build command: `npm install`, Start command: `npm start`
4. ใส่ Environment Variables เหมือนขั้นตอน A

### ตัวเลือก C: Google Cloud Run (เหมาะถ้ามี GCP อยู่แล้ว)
ต้องเพิ่ม `Dockerfile` — แจ้งได้ถ้าต้องการให้เตรียมให้

> ไม่ว่าเลือกทางไหน อย่าลืมตั้งค่า Environment Variables (`LINE_CHANNEL_ACCESS_TOKEN`, `LINE_CHANNEL_SECRET`) บนแพลตฟอร์มนั้นๆ ห้าม commit ไฟล์ `.env` ขึ้น GitHub เด็ดขาด

## ขั้นตอนที่ 5: ทดสอบ

1. สแกน QR Code ของ LINE OA เพื่อเพิ่มเพื่อน (อยู่ใน LINE Official Account Manager)
2. บอทควรส่งข้อความต้อนรับ + ปุ่มเมนูให้เลือกอัตโนมัติ
3. ลองพิมพ์คำถาม เช่น "เวลาเยี่ยม" หรือกดปุ่มเมนู

## การแก้ไข/เพิ่มคำถามใหม่

เปิดไฟล์ `qaData.js` แล้วเพิ่ม object ใหม่ในรูปแบบ:

```js
{
  key: "unique_key",
  label: "ชื่อปุ่ม (ไม่เกิน 20 ตัวอักษร)",
  keywords: ["คำ1", "คำ2"],
  answer: "คำตอบเต็ม",
}
```

ไม่ต้องแก้โค้ดใน `index.js` เลย ระบบจะเพิ่มปุ่มและจับคำถามให้อัตโนมัติ

## หมายเหตุเรื่อง Quick Reply

LINE จำกัดปุ่ม Quick Reply สูงสุด **13 ปุ่ม** ต่อข้อความ ตอนนี้มี 9 หัวข้อ ยังเพิ่มได้อีกถ้าต้องการ
ถ้าในอนาคตหัวข้อเยอะเกิน 13 แนะนำเปลี่ยนไปใช้ **Rich Menu** (เมนูรูปภาพด้านล่างแชท) แทน ซึ่งรองรับหมวดหมู่ย่อยได้มากกว่า — แจ้งได้ถ้าต้องการให้ช่วยออกแบบ
