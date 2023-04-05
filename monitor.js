//in the project folder:
//npm init -y
//npm install axios node-telegram-bot-api

//version 0.3.2

const axios = require("axios");
const TelegramBot = require("node-telegram-bot-api");
const tokens = require("./tokens.json");

const apiUrl = tokens.apiURL;
const bot = new TelegramBot(tokens.telegramBotToken, { polling: true });

bot.onText(/\/start/, async (msg) => {
  console.log("PNZ validatorBOT ACTIVATED! 🎩");
  bot.sendMessage(
  tokens.chatID,
  "PNZ validatorBOT ACTIVATED! 🎩");
});

bot.onText(/\/health/, async (msg) => {
  try {
    const response = await axios.post("http://127.0.0.1:9650/ext/health", {
      jsonrpc: "2.0",
      id: 1,
      method: "health.health",
    });

    bot.sendMessage(
      tokens.chatID,
      `Health check response:\n\n${JSON.stringify(response.data, null, 2)}`
    );
  } catch (error) {
    console.error("Error while checking health:", error);
    bot.sendMessage(
      tokens.chatID,
      `❗ Error while checking health:\n\n${JSON.stringify(
        error.response.data,
        null,
        2
      )}`
    );
  }
});

async function checkValidators(index = 0) {
  if (index >= tokens.nodeIDs.length) {
    setTimeout(() => checkValidators(), tokens.interval);
    return;
  }

  const nodeID = tokens.nodeIDs[index];
  console.log(`Checking validator: ${nodeID}`);

  try {
    const response = await axios.post(apiUrl, {
      jsonrpc: "2.0",
      id: 1,
      method: "platform.getCurrentValidators",
    });

    const validator = response.data.result.validators.find(
      (validator) => validator.nodeID === nodeID
    );

    if (!validator) {
      console.log(`Validator ${nodeID} not found among active validators.`);
      sendMessage(`❓ Validator ${nodeID} not found among active validators.`);
    } else if (!validator.connected) {
      console.log(`Validator ${nodeID} is offline.`);
      sendMessage(
        `⚠️ Validator with NodeID: ${nodeID} is offline! Please check.`
      );
    } else {
      console.log(`Validator ${nodeID} is online and healthy.`);
    }
  } catch (error) {
    console.error(`Error while checking validator ${nodeID}:`, error);
    sendMessage(
      `❗ Error while checking validator ${nodeID}:\n\n${JSON.stringify(
        error.response.data,
        null,
        2
      )}`
    );
  }

  setTimeout(() => checkValidators(index + 1), tokens.pause);
}

function sendMessage(message) {
  bot.sendMessage(tokens.chatID, message);
}

checkValidators();
