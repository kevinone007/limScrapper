const {readFile} = require('./readFile.js');
const {scrapperChrome} = require('./scrapperChrome.js');
const {markProgressiveTransactions} = require('./combinations.js');
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');

require('dotenv').config();
const url = process.env.URL;
const user = process.env.USER;
const pass = process.env.PASS;
const TOKEN = process.env.TOKEN_API;
const permited_users = process.env.PERMITED_USERS;

const bot = new TelegramBot(TOKEN, {polling: true});

const dDir = path.join(__dirname, 'downloads');
if (!fs.existsSync(dDir)) {
    fs.mkdirSync(dDir);
}

const userState = {};
bot.on('message', async (msg) => {
    if (!msg || !msg.text) {
        return;
    }

    const chatId = msg.chat.id;

    if (!permited_users.includes(chatId)) {
        await bot.sendMessage(chatId, `Usuario no autorizado.`);
        return false;
    }

    if (msg.text === '/start') {
        await bot.sendMessage(chatId, '¡Hola! ¿Has cerrado sesión? Responde Si o No.');
        userState[chatId] = { started: true };

    } else if (userState[chatId] && userState[chatId].started) {
        const text = msg.text.toLowerCase();
        if (text === 'si') {
            await bot.sendMessage(chatId, 'Perfecto, por favor envíame el archivo PDF.');
            userState[chatId].waitingForPDF = true;
        } else {
            await bot.sendMessage(chatId, 'Favor cierre su sesión en RESMAX.');
            delete userState[chatId];
        }
    } else {
        await bot.sendMessage(chatId, `Ejecutar el bot con /start`);
    }
});


bot.on('document', async (msg) => {
    const chatId = msg.chat.id;
    if (userState[chatId] && userState[chatId].waitingForPDF) {
        const fileId = msg.document.file_id;
        const fileDetails = await bot.getFile(fileId);
        const fileName = msg.document.file_name;
        const fileNameTelegram = fileDetails.file_path.split('/').pop();

        await bot.downloadFile(fileId, dDir);
        fs.rename(path.join(dDir, fileNameTelegram), path.join(dDir, fileName), (err) => {
            if (err) {
                console.error('Error al renombrar el archivo:', err);
            }
        });

        await bot.sendMessage(chatId, `Se recibió el archivo ${fileName}`);
        await processPDF(chatId, fileName);
        delete userState[chatId];
    }
});


async function processPDF(chatId, fileName) {
    let tiempoInicioReadFile;
    let tiempoInicioMarkProgressiveTransactions;
    let tiempoInicioScrapper;

    try {
        const resultado = await readFile(path.join(dDir, fileName));
        tiempoInicioReadFile = Date.now();
        const {rut, progresivasQty, periodos} = resultado;
        await bot.sendMessage(chatId, `Se procesarán ${periodos.length} vacaciones y ${progresivasQty} progresivas.`);

        if (progresivasQty > 0) {
            tiempoInicioMarkProgressiveTransactions = Date.now();
        }

        tiempoInicioScrapper = Date.now();
        await scrapperChrome(url, user, pass, rut, periodos, bot, chatId);

        const tiempoFinScrapper = Date.now();
    } catch (error) {
        console.error('Ocurrió un error:', error);
        await bot.sendMessage(chatId, `Se presentó un error: ${error}`);
    }
}

console.log('Bot is running...');
