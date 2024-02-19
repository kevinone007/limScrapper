const {readFile} = require('./readFile.js');
const {scrapperChrome} = require('./scrapperChrome.js');
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');

require('dotenv').config();
const url = process.env.URL;
const user = process.env.USER;
const pass = process.env.PASS;
const TOKEN = process.env.TOKEN_API;

const bot = new TelegramBot(TOKEN, {polling: true});


const archivoPDF = './oscar.pdf';
const dDir = path.join(__dirname, 'downloads');
if (!fs.existsSync(dDir)) {
    fs.mkdirSync(dDir);
}

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;

    // Verificar si el mensaje contiene un archivo
    if (msg.document) {
        const fileId = msg.document.file_id;
        const fileDetails = await bot.getFile(fileId);
        const fileName = msg.document.file_name;
        const fileNameTelegram = fileDetails.file_path.split('/').pop();

        // Guardar el archivo con el nombre original
        await bot.downloadFile(fileId, dDir);
        fs.rename(path.join(dDir,fileNameTelegram), path.join(dDir,fileName), (err) => {
            if (err) {
                console.error('Error al renombrar el archivo:', err);
                return;
            }
            console.log('Archivo renombrado correctamente.');
        });
        console.log(`Archivo guardado como ${fileName}`);
        // Enviar un mensaje de confirmación al usuario
        bot.sendMessage(chatId, `Se recibió el archivo ${fileName}`);


        readFile(path.join(dDir,fileName))
            .then(resultado => {
                const {rut, periodos} = resultado;
                bot.sendMessage(chatId, `Se procesaran ${periodos.length} vacaciones.`);
                return scrapperChrome(url, user, pass, rut, periodos, bot, chatId);
            })
            .then(() => {
                console.log('Scraping completado');
            })
            .catch(error => {
                console.error('Ocurrió un error:', error);
                process.exit(1);
            });
    } else {
        // Si el mensaje no contiene un archivo, responder con un mensaje predeterminado
        bot.sendMessage(chatId, 'Por favor, envía un archivo (PDF) para procesar.');

    }
});


