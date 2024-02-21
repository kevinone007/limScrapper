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
        await bot.sendMessage(chatId, '¡Hola! ¿Has cerrado sesión en RESMAX? Responde Si o No.');
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
    let tiempoInicioReadFile = Date.now();
    let tiempoInicioMarkProgressiveTransactions;
    let tiempoInicioScrapper;

    readFile(path.join(dDir, fileName))
        .then(async resultado => {
            const {rut, progresivasQty, periodos} = resultado;
            await bot.sendMessage(chatId, `Se procesarán ${periodos.length} vacaciones y ${progresivasQty} progresivas.`);
            console.log(`Se procesarán ${periodos.length} vacaciones y ${progresivasQty} progresivas.`);
            if (progresivasQty > 0) {
                tiempoInicioMarkProgressiveTransactions = Date.now();
                return markProgressiveTransactions(periodos, progresivasQty)
                    .then(() => resultado);
            } else {
                return resultado;
            }
        })
        .then(async resultado => {
            const {rut, periodos} = resultado;
            tiempoInicioScrapper = Date.now();
            return scrapperChrome(url, user, pass, rut, periodos, bot, chatId);
        })
        .then(async () => {
            const tiempoFinScrapper = Date.now();

            const segundosReadFile = Math.floor((tiempoInicioMarkProgressiveTransactions - tiempoInicioReadFile) / 1000);
            const segundosMarkProgressiveTransactions = Math.floor((tiempoInicioScrapper - tiempoInicioMarkProgressiveTransactions) / 1000);
            const segundosScrapper = Math.floor((tiempoFinScrapper - tiempoInicioScrapper) / 1000);

            await bot.sendMessage(chatId, `Tiempo de ejecución de lecuta PDF: ${segundosReadFile} seg.`);
            console.log( `Tiempo de ejecución de lecuta PDF: ${segundosReadFile} seg.`);
            await bot.sendMessage(chatId, `Tiempo de ejecución de busqueda de combinación: ${segundosMarkProgressiveTransactions} seg.`);
            console.log( `Tiempo de ejecución de busqueda de combinación: ${segundosMarkProgressiveTransactions} seg.`);
            await bot.sendMessage(chatId, `Tiempo de ejecución de Robot RES+: ${segundosScrapper} seg.`);
            console.log( `Tiempo de ejecución de Robot RES+: ${segundosScrapper} seg.`);

            console.log('Scraping completado');
        })
        .catch(async error => {
            console.error('Ocurrió un error:', error);
            await bot.sendMessage(chatId, `Se presentó un error: ${error}`);
            process.exit(1);
        });

}

console.log('Bot is running...');
