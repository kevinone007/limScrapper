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

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;

    if(!permited_users.includes(chatId)){
        await bot.sendMessage(chatId, `Usuario no autorizado.`);
        return false;
    }

    if (msg.document) {
        const fileId = msg.document.file_id;
        const fileDetails = await bot.getFile(fileId);
        const fileName = msg.document.file_name;
        const fileNameTelegram = fileDetails.file_path.split('/').pop();

        await bot.downloadFile(fileId, dDir);
        fs.rename(path.join(dDir,fileNameTelegram), path.join(dDir,fileName), (err) => {
            if (err) {
                console.error('Error al renombrar el archivo:', err);
                return;
            }
            console.log('Archivo renombrado correctamente.');
        });
        console.log(`Archivo guardado como ${fileName}`);
        await bot.sendMessage(chatId, `Se recibió el archivo ${fileName}`);

        let tiempoInicioReadFile;
        let tiempoInicioMarkProgressiveTransactions;
        let tiempoInicioScrapper;

        readFile(path.join(dDir, fileName))
            .then(resultado => {
                tiempoInicioReadFile = Date.now();
                const { rut, progresivasQty, periodos } = resultado;
                bot.sendMessage(chatId, `Se procesarán ${periodos.length} vacaciones y ${progresivasQty} progresivas.`);
                if (progresivasQty > 0) {
                    tiempoInicioMarkProgressiveTransactions = Date.now();
                    return markProgressiveTransactions(periodos, progresivasQty)
                        .then(() => resultado);
                } else {
                    return resultado;
                }
            })
            .then(resultado => {
                const { rut, periodos } = resultado;
                tiempoInicioScrapper = Date.now();
                return scrapperChrome(url, user, pass, rut, periodos, bot, chatId);
            })
            .then(() => {
                const tiempoFinScrapper = Date.now();
                const tiempoTranscurridoReadFile = tiempoInicioMarkProgressiveTransactions - tiempoInicioReadFile;
                const tiempoTranscurridoMarkProgressiveTransactions = tiempoInicioScrapper - tiempoInicioMarkProgressiveTransactions;
                const tiempoTranscurridoScrapper = tiempoFinScrapper - tiempoInicioScrapper;

                const minutosReadFile = Math.floor((tiempoTranscurridoReadFile % 3600000) / 60000);
                const segundosReadFile = Math.floor((tiempoTranscurridoReadFile % 60000) / 1000);

                const minutosMarkProgressiveTransactions = Math.floor((tiempoTranscurridoMarkProgressiveTransactions % 3600000) / 60000);
                const segundosMarkProgressiveTransactions = Math.floor((tiempoTranscurridoMarkProgressiveTransactions % 60000) / 1000);

                const minutosScrapper = Math.floor((tiempoTranscurridoScrapper % 3600000) / 60000);
                const segundosScrapper = Math.floor((tiempoTranscurridoScrapper % 60000) / 1000);

                bot.sendMessage(chatId, `Tiempo de ejecución de lecuta PDF: ${minutosReadFile} min y ${segundosReadFile} seg.`);
                bot.sendMessage(chatId, `Tiempo de ejecución de busqueda de combinacin: ${minutosMarkProgressiveTransactions} min y ${segundosMarkProgressiveTransactions} seg.`);
                bot.sendMessage(chatId, `Tiempo de ejecución de Robot RES+: ${minutosScrapper} min y ${segundosScrapper} seg.`);

                console.log('Scraping completado');
            })
            .catch(error => {
                console.error('Ocurrió un error:', error);
                bot.sendMessage(chatId, `Se presentó un error: ${error}`);
                process.exit(1);
            });

    } else {
        await bot.sendMessage(chatId, 'Por favor, envía un archivo (PDF) para procesar.');
        return false;
    }
});


async function esperarConfirmacion(chatId, bot) {
    return new Promise((resolve) => {
        const timeoutId = setTimeout(async () => {
            await bot.sendMessage(chatId, `Se agotó el tiempo de espera. Cancelando el proceso.`);
            resolve(false);
        }, 30000);

        bot.once('message', async (msg) => {
            clearTimeout(timeoutId);
            if (msg.text.toLowerCase() === 'sí, confirmo') {
                resolve(true);
            } else {
                resolve(false);
            }
        });
        bot.sendMessage(chatId, `Por favor, valida que tienes tu sesión cerrada y confirma con un mensaje "Sí, confirmo".`);
    });
}