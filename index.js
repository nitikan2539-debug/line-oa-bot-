// ==============================================
// index.js
// LINE OA Chatbot Webhook Server
// ==============================================

require("dotenv").config();
const express = require("express");
const line = require("@line/bot-sdk");
const { qaList, fallbackMessage, greetingMessage } = require("./qaData");

const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

const app = express();
const client = new line.messagingApi.MessagingApiClient({
  channelAccessToken: config.channelAccessToken,
});

// health check (ใช้เช็คว่า server รันอยู่ เช่นตอน deploy)
app.get("/", (req, res) => res.send("LINE OA NS2 Family bot is running ✅"));

// LINE webhook endpoint — ต้อง middleware ตัวนี้ก่อน เพื่อ verify signature
app.post(
  "/webhook",
  line.middleware(config),
  async (req, res) => {
    try {
      const events = req.body.events;
      await Promise.all(events.map(handleEvent));
      res.status(200).end();
    } catch (err) {
      console.error("Webhook error:", err);
      res.status(500).end();
    }
  }
);

// ---------- Quick Reply buttons จากรายการ Q&A ----------
function buildQuickReply() {
  return {
    items: qaList.map((qa) => ({
      type: "action",
      action: {
        type: "message",
        label: qa.label,
        text: qa.label, // กดปุ่มแล้วจะส่งข้อความ label กลับมาเป็นเหมือนพิมพ์เอง
      },
    })),
  };
}

// ---------- จับคำถามจากข้อความอิสระของผู้ใช้ ----------
function matchQuestion(userText) {
  const text = userText.trim().toLowerCase();

  // 1) ตรงกับ label เป๊ะๆ (กรณีกดปุ่ม quick reply)
  const exact = qaList.find((qa) => qa.label.toLowerCase() === text);
  if (exact) return exact;

  // 2) ค้นจาก keyword ที่ปรากฏอยู่ในข้อความ
  const byKeyword = qaList.find((qa) =>
    qa.keywords.some((kw) => text.includes(kw.toLowerCase()))
  );
  if (byKeyword) return byKeyword;

  return null;
}

// คำทักทายที่จะให้บอทส่งเมนูต้อนรับ
const GREETING_WORDS = ["สวัสดี", "hello", "hi", "เมนู", "help", "ช่วยเหลือ"];

// คำขอบคุณ/รับทราบ ที่ไม่ใช่คำถาม -> ไม่ต้องส่ง fallback แบบเป็นทางการ
// ให้ตอบสั้นๆ แบบเป็นมิตรแทน
const ACKNOWLEDGMENT_WORDS = [
  "ขอบคุณ",
  "ขอบใจ",
  "ขอบพระคุณ",
  "รับทราบ",
  "ทราบแล้ว",
  "เข้าใจแล้ว",
  "โอเค",
  "thank",
  "thanks",
  "ok",
];

async function handleEvent(event) {
  // เพิ่มเพื่อนใหม่ -> ส่งข้อความต้อนรับ + เมนู
  if (event.type === "follow") {
    return client.pushMessage({
      to: event.source.userId,
      messages: [
        {
          type: "text",
          text: greetingMessage,
          quickReply: buildQuickReply(),
        },
      ],
    });
  }

  if (event.type !== "message" || event.message.type !== "text") {
    return Promise.resolve(null);
  }

  const userText = event.message.text;
  const lowerText = userText.trim().toLowerCase();

  // คำทักทาย -> ส่งเมนู
  if (GREETING_WORDS.some((w) => lowerText.includes(w))) {
    return client.replyMessage({
      replyToken: event.replyToken,
      messages: [
        {
          type: "text",
          text: greetingMessage,
          quickReply: buildQuickReply(),
        },
      ],
    });
  }

  // ข้อความขอบคุณ/รับทราบ -> ตอบสั้นๆ แบบเป็นมิตร ไม่ต้องส่ง fallback
  if (ACKNOWLEDGMENT_WORDS.some((w) => lowerText.includes(w))) {
    return client.replyMessage({
      replyToken: event.replyToken,
      messages: [{ type: "text", text: "ยินดีค่ะ 😊" }],
    });
  }

  const matched = matchQuestion(userText);

  // จับคำถามไม่ได้ -> เงียบไว้ ไม่ต้องส่ง fallback
  // (กันกรณีคุณแม่พิมพ์ข้อความทั่วไปที่ไม่ใช่คำถามแล้วบอทตอบแปลกๆ)
  if (!matched) {
    return Promise.resolve(null);
  }

  return client.replyMessage({
    replyToken: event.replyToken,
    messages: [
      {
        type: "text",
        text: matched.answer,
        quickReply: buildQuickReply(), // แนบเมนูปุ่มไว้ทุกครั้ง เพื่อให้กดหัวข้อถัดไปได้ง่าย
      },
    ],
  });
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
