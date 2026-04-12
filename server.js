require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;

const TOKEN = process.env.TOKEN;
const CHAT_ID = process.env.CHAT_ID;

if (!TOKEN || !CHAT_ID) {
    console.error("Ошибка: TOKEN или CHAT_ID не найдены в .env");
    process.exit(1);
}

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

async function sendTelegramMessage(text) {
    const url = `https://api.telegram.org/bot${TOKEN}/sendMessage`;

    for (let attempt = 1; attempt <= 2; attempt++) {
        try {
            console.log(`Отправка в Telegram, попытка ${attempt}...`);

            const response = await axios.post(
                url,
                {
                    chat_id: CHAT_ID,
                    text: text
                },
                {
                    timeout: 30000
                }
            );

            return response.data;
        } catch (error) {
            console.error(`Попытка ${attempt} не удалась`);
            console.error("message:", error.message);
            console.error("code:", error.code);
            console.error("response data:", error.response?.data || null);

            if (attempt === 2) {
                throw error;
            }
        }
    }
}

app.post("/send-message", async (req, res) => {
    const { type, name, contact, message } = req.body;

    console.log("Новая заявка:", req.body);

    if (!type || !name || !contact || !message) {
        return res.status(400).json({
            ok: false,
            message: "Не все поля заполнены"
        });
    }

    const now = new Date().toLocaleString("ru-RU");

    const text =
        `📩 Новая заявка с сайта ЛОФТ\n\n` +
        `🕒 ${now}\n\n` +
        `📌 Тип: ${type}\n` +
        `👤 Имя: ${name}\n` +
        `📞 Контакт: ${contact}\n` +
        `💬 Сообщение:\n${message}`;

    try {
        const result = await sendTelegramMessage(text);

        console.log("Telegram response:", result);

        res.json({
            ok: true,
            message: "Сообщение отправлено"
        });
    } catch (error) {
        console.error("Server error:");
        console.error("message:", error.message);
        console.error("code:", error.code);
        console.error("response data:", error.response?.data || null);

        res.status(500).json({
            ok: false,
            message: "Сервис временно недоступен. Попробуйте ещё раз.",
            error: error.message,
            code: error.code,
            details: error.response?.data || null
        });
    }
});

app.listen(PORT, () => {
    console.log(`Сервер запущен: http://localhost:${PORT}`);
});