require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");

// Загрузка переменных окружения
const BOT_TOKEN = process.env.BOT_TOKEN; // Токен бота
const GROUP_CHAT_ID = process.env.GROUP_CHAT_ID; // ID группы для отправки заявок

// Инициализация бота
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// Хранилище состояний пользователей
const userState = {};

// Главное меню с кнопкой "Вернуться в начало"
const mainMenu = {
  reply_markup: {
    keyboard: [[{ text: "Вернуться в начало ↩️" }]],
    resize_keyboard: true,
    one_time_keyboard: true,
  },
};

// Клавиатура для выбора гражданства
const citizenshipKeyboard = {
  reply_markup: {
    keyboard: [
      [{ text: "Гражданство РФ 🇷🇺" }],
      [{ text: "Иностранный гражданин 🌍" }],
    ],
    resize_keyboard: true,
    one_time_keyboard: true,
  },
};

// Клавиатуры для выбора статуса и формы сотрудничества
const statusKeyboard = {
  reply_markup: {
    keyboard: [
      [{ text: "Новый кандидат" }],
      [{ text: "Бывший сотрудник (уволился < месяц)" }],
      [{ text: "Бывший сотрудник (уволился > месяц)" }],
    ],
    resize_keyboard: true,
    one_time_keyboard: true,
  },
};

const employmentKeyboard = {
  reply_markup: {
    keyboard: [
      [{ text: "Самозанятость" }],
      [{ text: "ГПХ" }],
    ],
    resize_keyboard: true,
    one_time_keyboard: true,
  },
};

// Функция для получения упоминания пользователя
function getUserMention(msg) {
  return msg.from.username ? `@${msg.from.username}` : `id${msg.from.id}`;
}

// Функция для запроса гражданства
async function askForCitizenship(chatId) {
  userState[chatId].step = 'WAITING_CITIZENSHIP';
  await bot.sendMessage(chatId, 'Какое у тебя гражданство?', citizenshipKeyboard);
}

// Функция для запроса города
async function askForCity(chatId) {
  userState[chatId].step = 'WAITING_CITY';
  await bot.sendMessage(chatId, 'В каком городе вы проживаете?', mainMenu);
}

// Обработчик команды /start
bot.onText(/\/start|Вернуться в начало ↩️/, (msg) => {
  const chatId = msg.chat.id;

  // Сброс состояния пользователя
  userState[chatId] = { step: "START", data: {} };

  // Отправка приветственного сообщения с кнопками выбора вакансии
  bot.sendMessage(
    chatId,
    "🚴🏼‍♂️ Компания Самокат приглашает вас на работу!\n\n" +
      "У нас есть две актуальные вакансии:\n" +
      "1️⃣ _Курьер-доставщик_ – доставка заказов на велосипеде или пешком.\n" +
      "2️⃣ _Сборщик заказов_ – комплектация заказов в центре выдачи.\n\n" +
      "Актуален ли для вас поиск работы? Выберите интересующую позицию! 😊",
    {
      reply_markup: {
        keyboard: [
          [{ text: "Курьер-доставщик 🚴‍♂️" }, { text: "Сборщик заказов 🛒" }],
        ],
        resize_keyboard: true,
        one_time_keyboard: true,
      },
      parse_mode: "Markdown",
    }
  );
});

// Обработчик входящих сообщений
bot.on("message", (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  // Инициализация состояния пользователя, если его нет
  if (!userState[chatId]) {
    userState[chatId] = { step: "START", data: {} };
  }

  const state = userState[chatId];

  switch (state.step) {
    case "START":
      if (text === "Курьер-доставщик 🚴‍♂️") {
        // Путь курьера
        bot.sendMessage(
          chatId,
          "Вы выбрали вакансию *Курьер-доставщик*.\n\n" +
            "Доставляйте заказы клиентам на велосипеде или пешком. Гибкий график, стабильная оплата, бесплатное оборудование.\n\n" +
            "Готовы стать курьером доставки?",
          {
            reply_markup: {
              keyboard: [
                [{ text: "Готов стать курьером доставки!" }, { text: "Не подходит" }],
              ],
              resize_keyboard: true,
              one_time_keyboard: true,
            },
          }
        );
        state.step = "CONSENT_COURIER";
      } else if (text === "Сборщик заказов 🛒") {
        // Путь сборщика заказов
        bot.sendMessage(
          chatId,
          "Вы выбрали вакансию *Сборщик заказов*.\n\n" +
            "Комплектуйте заказы в центре выдачи. Работа в помещении, гибкий график, стабильная оплата.\n\n" +
            "Готовы стать сборщиком заказов?",
          {
            reply_markup: {
              keyboard: [
                [{ text: "Готов стать сборщиком заказов!" }, { text: "Не подходит" }],
              ],
              resize_keyboard: true,
              one_time_keyboard: true,
            },
          }
        );
        state.step = "CONSENT_COLLECTION";
      }
      break;

    case "CONSENT_COURIER":
      if (text === "Готов стать курьером доставки!") {
        bot.sendMessage(chatId, "Давайте начнем с вашего имени.", mainMenu);
        state.data.vacancy = "Курьер-доставщик";
        state.step = "WAITING_NAME";
      } else if (text === "Не подходит") {
        bot.sendMessage(chatId, "Жаль! Если передумаете, начните заново.", mainMenu);
        state.step = "ZERO";
      }
      break;

    case "CONSENT_COLLECTION":
      if (text === "Готов стать сборщиком заказов!") {
        bot.sendMessage(chatId, "Давайте начнем с вашего имени.", mainMenu);
        state.data.vacancy = "Сборщик заказов";
        state.step = "WAITING_NAME";
      } else if (text === "Не подходит") {
        bot.sendMessage(chatId, "Жаль! Если передумаете, начните заново.", mainMenu);
        state.step = "ZERO";
      }
      break;

    case "WAITING_NAME":
      state.data.name = text;
      bot.sendMessage(chatId, "Сколько вам лет?", mainMenu);
      state.step = "WAITING_AGE";
      break;

    case "WAITING_AGE":
      const age = parseInt(text, 10);
      if (isNaN(age)) {
        bot.sendMessage(chatId, "Пожалуйста, введите возраст числом.", mainMenu);
      } else if (age < 18) {
        bot.sendMessage(
          chatId,
          "Извините, но работать можно только с 18 лет. Начните заново.",
          mainMenu
        );
        state.step = "START";
      } else {
        state.data.age = age;
        askForCitizenship(chatId);
      }
      break;

    case "WAITING_CITIZENSHIP":
      state.data.citizenship = text;
      askForCity(chatId);
      break;

    case "WAITING_CITY":
      state.data.city = text;
      if (state.data.vacancy === "Курьер-доставщик") {
        bot.sendMessage(
          chatId,
          "Умеете ли вы кататься на велосипеде?",
          {
            reply_markup: {
              keyboard: [[{ text: "Да" }, { text: "Нет" }]],
              resize_keyboard: true,
              one_time_keyboard: true,
            },
          }
        );
        state.step = "WAITING_BIKE";
      } else {
        bot.sendMessage(chatId, "Есть ли у вас ИНН?", mainMenu);
        state.step = "WAITING_INN";
      }
      break;

    case "WAITING_BIKE":
      state.data.bike = text;
      if (text === "Да") {
        bot.sendMessage(
          chatId,
          "Сможете ли вы поднять тяжелый заказ (15-20 кг)?",
          {
            reply_markup: {
              keyboard: [[{ text: "Справлюсь" }, { text: "Не думаю" }]],
              resize_keyboard: true,
              one_time_keyboard: true,
            },
          }
        );
        state.step = "WAITING_WEIGHT";
      } else {
        bot.sendMessage(
          chatId,
          "Готовы ли вы работать пешим курьером?",
          {
            reply_markup: {
              keyboard: [[{ text: "Продолжим" }, { text: "Не думаю" }]],
              resize_keyboard: true,
              one_time_keyboard: true,
            },
          }
        );
        state.step = "WAITING_WALK_COURIER";
      }
      break;

    case "WAITING_WEIGHT":
      state.data.weight = text;
      if (text === "Не думаю") {
        bot.sendMessage(
          chatId,
          "Такие заказы редки. Давайте вернемся к началу.",
          mainMenu
        );
        state.step = "START";
      } else {
        bot.sendMessage(chatId, "Есть ли у вас ИНН?", mainMenu);
        state.step = "WAITING_INN";
      }
      break;

    case "WAITING_WALK_COURIER":
      state.data.walkCourier = text;
      if (text === "Не думаю") {
        bot.sendMessage(
          chatId,
          "Спасибо за интерес! Начните заново, если передумаете.",
          mainMenu
        );
        state.step = "START";
      } else {
        bot.sendMessage(
          chatId,
          "Сможете ли вы поднять тяжелый заказ (15-20 кг)?",
          {
            reply_markup: {
              keyboard: [[{ text: "Справлюсь" }, { text: "Не думаю" }]],
              resize_keyboard: true,
              one_time_keyboard: true,
            },
          }
        );
        state.step = "WAITING_WEIGHT";
      }
      break;

    case "WAITING_INN":
      state.data.inn = text;
      bot.sendMessage(
        chatId,
        "С каким статусом вы обращаетесь?\n" +
          "1️⃣ Новый кандидат\n" +
          "2️⃣ Бывший сотрудник (уволился меньше месяца назад)\n" +
          "3️⃣ Бывший сотрудник (уволился более месяца назад)",
        statusKeyboard
      );
      state.step = "WAITING_STATUS";
      break;

    case "WAITING_STATUS":
      if (
        text === "Новый кандидат" ||
        text === "Бывший сотрудник (уволился < месяц)" ||
        text === "Бывший сотрудник (уволился > месяц)"
      ) {
        state.data.status = text;
        bot.sendMessage(
          chatId,
          "В какой трудовой форме удобно сотрудничать с компанией Самокат?\n" +
            "1️⃣ Самозанятость\n" +
            "2️⃣ ГПХ",
          employmentKeyboard
        );
        state.step = "WAITING_EMPLOYMENT";
      } else {
        bot.sendMessage(chatId, "Пожалуйста, выберите один из предложенных вариантов.", statusKeyboard);
      }
      break;

    case "WAITING_EMPLOYMENT":
      if (text === "Самозанятость" || text === "ГПХ") {
        state.data.employment = text;
        bot.sendMessage(chatId, "Оставьте ваш номер телефона.", mainMenu);
        state.step = "WAITING_PHONE";
      } else {
        bot.sendMessage(chatId, "Пожалуйста, выберите один из предложенных вариантов.", employmentKeyboard);
      }
      break;

    case "WAITING_PHONE":
      state.data.phone = text;

      // Формирование и отправка заявки в группу
      const userInfo = `
Новая заявка:
-------------------
Вакансия: ${state.data.vacancy || "Не указана"}
Имя: ${state.data.name || "Не указано"}
Возраст: ${state.data.age || "Не указан"}
Гражданство: ${state.data.citizenship || "Не указано"}
Город: ${state.data.city || "Не указан"}
Умение кататься на велосипеде: ${state.data.bike || "Не указано"}
Способность поднимать тяжести: ${state.data.weight || "Не указано"}
ИНН: ${state.data.inn || "Не указан"}
Статус: ${state.data.status || "Не указан"}
Форма сотрудничества: ${state.data.employment || "Не указана"}
Телефон: ${state.data.phone || "Не указан"}
ID пользователя: ${getUserMention(msg)}
      `;
      bot.sendMessage(GROUP_CHAT_ID, userInfo);

      // Уведомление пользователя
      bot.sendMessage(
        chatId,
        "Спасибо! HR-менеджер свяжется с вами в ближайшее время.",
        mainMenu
      );

      // Сброс состояния
      state.step = "START";
      break;

    case "ZERO":
      bot.sendMessage(chatId, "Давайте начнем сначала.", mainMenu);
      state.step = "START";
      break;

    default:
      bot.sendMessage(chatId, "Ошибка. Давайте начнем сначала.", mainMenu);
      state.step = "START";
      break;
  }
});
