require("dotenv").config();

const TelegramBot = require("node-telegram-bot-api");

const BOT_TOKEN = process.env.BOT_TOKEN; // Используем BOT_TOKEN
const GROUP_CHAT_ID_TWO = process.env.GROUP_CHAT_ID_TWO; // Укажите ID вашей группы

const bot = new TelegramBot(BOT_TOKEN, { polling: true }); // Используем BOT_TOKEN для инициализации

const userState = {};

const mainMenu = {
  reply_markup: {
    keyboard: [[{ text: "Вернуться в начало ↩️" }]],
    resize_keyboard: true,
    one_time_keyboard: true,
  },
};

function getUserMention(msg) {
  return msg.from.username ? `@${msg.from.username}` : `@id${msg.from.id}`;
}

bot.onText(/\/start|Вернуться в начало ↩️/, (msg) => {
  const chatId = msg.chat.id;
  userState[chatId] = { step: "/start", data: {} };

  bot.sendMessage(
    chatId,
    "Перед тем, как продолжить, заполни небольшую анкету. 📄\n\nЭто займёт всего пару минут и поможет мне понять, подходит ли тебе работа в компании Самокат. 🚴\n\nПро какую вакансию хочешь узнать подробнее?",
    {
      reply_markup: {
        keyboard: [[{ text: "Курьер-доставщик" }, { text: "Сборщик заказов" }]],
        resize_keyboard: true,
        one_time_keyboard: true,
      },
    }
  );
});

bot.on("message", (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;
  const userMention = getUserMention(msg);

  if (!userState[chatId]) {
    userState[chatId] = { step: "/start", data: {} };
  }

  const state = userState[chatId];

  switch (state.step) {
    case "/start":
      if (text === "Курьер-доставщик") {
        bot.sendMessage(chatId, "Текст о вакансии курьера", mainMenu);
        state.step = "askName";
      } else if (text === "Сборщик заказов") {
        bot.sendMessage(chatId, "Текст о вакансии сборщика", mainMenu);
        state.step = "askCity";
      }
      break;

    case "askCity":
      state.data.city = text;
      bot.sendMessage(chatId, "Оставьте номер телефона", { reply_markup: { force_reply: true } });
      state.step = "askPhone";
      break;

    case "askPhone":
      state.data.phone = text;
      const userInfo = `Новая заявка:\nИмя: ${state.data.name || "Не указано"}\nГород: ${state.data.city || "Не указан"}\nТелефон: ${state.data.phone}\nID пользователя: ${userMention}`;
      bot.sendMessage(GROUP_CHAT_ID_TWO, userInfo);
      bot.sendMessage(chatId, "Спасибо! HR-менеджер свяжется с вами." , mainMenu);
      state.step = "/start";
      break;

    default:
      bot.sendMessage(chatId, "Ошибка. Давайте начнем сначала.", mainMenu);
      state.step = "/start";
      break;
  }
});
