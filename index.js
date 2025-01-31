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

const vacancyMenu = {
  reply_markup: {
    keyboard: [
      [
        { text: "Курьер-доставщик" },
        { text: "Сборщик заказов" },
      ],
    ],
    resize_keyboard: true,
    one_time_keyboard: true,
  },
};

// Функция для получения упоминания пользователя
function getUserMention(msg) {
  return msg.from.username ? `@${msg.from.username}` : `@id${msg.from.id}`;
}

bot.onText(/(start|Вернуться в начало ↩️)/, (msg) => {
  const chatId = msg.chat.id;
  userState[chatId] = { step: "/start", data: {} };

  // Отправка сообщений с выбором вакансий
  bot.sendMessage(
    chatId,
    "🚴🏼‍♂️ Компания Самокат приглашает вас на работу!\n\n" +
      "У нас есть две актуальные вакансии:\n" +
      "1️⃣ Курьер-доставщик – доставка заказов на велосипеде или пешком.\n" +
      "2️⃣ Сборщик заказов – комплектация заказов в центре выдачи.\n\n" +
      "Актуален ли для вас поиск работы? Выберите интересующую позицию! 😊",
    vacancyMenu
  );

  // Затем отправляем информацию об условиях работы
  bot.sendMessage(
    chatId,
    "Самокат регулярно расширяет зону присутствия в городах, поэтому мы всегда ищем курьеров и сборщиков для доставки заказов.\n" +
      "\nЧто нужно делать?\n" +
      "Оставить заявку в боте, Принять звонок от рекрутера, Выбрать даркстор, Изучить правила\n" +
      "💸 Гарантированный доход каждый час, даже если нет заказов\n" +
      "А ещё — доплата при сложных погодных условиях, чаевые, бонусы за приведённых друзей и надбавки за доставку в выходные дни\n" +
      "🏘️ Центр формирования заказов в шаговой доступности от дома.\n" +
      "🧭 Радиус доставок в пределах 0,1-3 км от центра формирования заказов.\n" +
      "🚴 Бесплатную униформу, шлем и велосипед, электровелосипед\n" +
      "📅 Абсолютную гибкость в выборе периодов для сотрудничества (доставлять заказы можно от 2-х часов в день).\n" +
      "😌 Комфортные условия для отдыха и ожидания в центре формирования заказов.\n" +
      "🧾 Отсутствие штрафов.\n" +
      "✅ Оформление по самозанятости. Оплату налога Самокат берёт на себя и показывает тебе реальную сумму твоего дохода.",
    mainMenu
  );
});

bot.on("message", (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;
  const userMention = getUserMention(msg);

  console.log("Получено сообщение:", text); // Лог для отладки

  if (!userState[chatId]) {
    userState[chatId] = { step: "/start", data: {} };
  }

  const state = userState[chatId];

  switch (state.step) {
    case "/start":
      if (text.trim() === "Курьер-доставщик") {
        console.log("Выбрана вакансия Курьер-доставщик"); // Лог для отладки
        bot.sendMessage(chatId, "Текст о вакансии курьера", mainMenu);
        state.step = "askName";
      } else if (text.trim() === "Сборщик заказов") {
        console.log("Выбрана вакансия Сборщик заказов"); // Лог для отладки
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
      bot.sendMessage(chatId, "Спасибо! HR-менеджер свяжется с вами.", mainMenu);
      state.step = "/start";
      break;

    default:
      bot.sendMessage(chatId, "Ошибка. Давайте начнем сначала.", mainMenu);
      state.step = "/start";
      break;
  }
});
