const puppeteer = require('puppeteer');
const {setTimeout} = require('timers/promises');
const {takeTime, calculateTime} = require('./util/util');

const scrapperChrome = async (url, user, pass, rut, periodos, bot, chatId, env) => {
    let browser;
    if(env === 'QA'){
        browser = await puppeteer.launch({
        headless: false, //solo para ambiente local
        args: [
            '--disable-web-security',
            '--enable-javascript'
        ]
    });
    }else{
        browser = await puppeteer.launch({
            //headless: false, //solo para ambiente local
            args: [
                '--disable-web-security',
                '--enable-javascript',
                '--no-sandbox'
            ]
        });
    }
    console.log('levantando browser')
    const page = await browser.newPage();
    const timeout = 60000;
    page.setDefaultTimeout(timeout);

    await page.setViewport({width: 864, height: 791});

    await page.goto(url);

    const usernameSelector = await page.waitForSelector('::-p-aria(Nombre de usuario), #username, ::-p-xpath(//*[@id="username"]), :scope >>> #username');
    await usernameSelector.type(user);

    const passwordSelector = await page.waitForSelector('::-p-aria(Contraseña), #password, ::-p-xpath(//*[@id="password"]), :scope >>> #password');
    await passwordSelector.type(pass);

    const loginButtonSelector = await page.waitForSelector('div.Login__ButtonStyled-rexmas-shared__sc-192ujh5-4 span.Text__StyledText-rexmas-shared__sc-84udx0-0, ::-p-xpath(//*[@data-testid="login-container"]/div/div[2]/div[2]/div[5]/button/span[1]), :scope >>> div.Login__ButtonStyled-rexmas-shared__sc-192ujh5-4 span.Text__StyledText-rexmas-shared__sc-84udx0-0, ::-p-text(INICIAR SESIÓN)');
    await loginButtonSelector.click({offset: {x: 78.5, y: 18.524993896484375}});
    await page.waitForNavigation();

    await page.goto(`https://lim.rexmas.com/remuneraciones/es-CL/rexcpe/empleados/${rut}/vacaciones`);
    await setTimeout(5000);


    const employeeID = await getEmployeeID(rut, page);

    if (!employeeID) {
        console.error('id usuario no encontrado');
        bot.sendMessage(chatId, 'id usuario no encontrado');
        return false;
    }


    let contador = 1;
    for (const periodo of periodos) {
        let inicioVacacion = await takeTime();
        await page.goto(`https://lim.rexmas.com/remuneraciones/es-CL/rexcpe/empleados/${rut}/vacaciones/${employeeID}/crear`);
        const daysSelector = await page.waitForSelector('#id_dias, ::-p-xpath(//*[@id="id_dias"]), :scope >>> #id_dias');
        const fecIniSelector = await page.waitForSelector('#id_fechaInic, ::-p-xpath(//*[@id="id_fechaInic"]), :scope >>> #id_fechaInic');
        await setTimeout(500);
        await daysSelector.type(periodo.dias);
        await fecIniSelector.click({clickCount: 3});
        await setTimeout(1500);
        await fecIniSelector.press('Backspace');
        await fecIniSelector.type(periodo.desde);
        const fuera = await page.waitForSelector('#wrapper > div.main-panel.mega > div.rex-content.container-fluid > div > form > div.card-body > div:nth-child(4) > div:nth-child(3)');
        await fuera.click();
        await setTimeout(2000);
        const guardarMovimiento = await page.waitForSelector('#wrapper > div.main-panel.mega > div.rex-content.container-fluid > div > form > div.card-footer.d-flex.flex-centered > input');
        await guardarMovimiento.click();
        await page.waitForNavigation();
        let errorMessage
        try {
            await page.waitForSelector('#wrapper > div.main-panel.mega > div.rex-content.container-fluid > div.alert.alert-danger > strong', {timeout: 1000});
            errorMessage = await page.evaluate(() => {
                return document.querySelector('#wrapper > div.main-panel.mega > div.rex-content.container-fluid > div.alert.alert-danger > strong').innerText;
            });

            if(errorMessage){
                const guardarMovimiento2 = await page.waitForSelector('#wrapper > div.main-panel.mega > div.rex-content.container-fluid > div > form > div.card-footer.d-flex.flex-centered > input');
                await guardarMovimiento2.click();
                await page.waitForNavigation()
            }
            if(errorMessage === 'La fecha de retorno ingresada no es válida'){
                await bot.sendMessage(chatId, `error: ${errorMessage}`);
                console.log(`error: ${errorMessage}`);
                await browser.close();
                return false;
            }
        } catch (error) {
        }
        const segundos = await calculateTime(await takeTime() - inicioVacacion);
        //await setTimeout(5000);
        await bot.sendMessage(chatId, (errorMessage)?`Vacación Nro ${contador}: ${errorMessage} en ${segundos} seg.`:`Vacación Nro ${contador}: creada en ${segundos} seg.`);
        console.log((errorMessage)?`Vacación Nro ${contador}: ${errorMessage} en ${segundos} seg.`:`Vacación Nro ${contador}: creada en ${segundos} seg.`);
        contador++;
    }

    await browser.close();
    return true;
};

async function getEmployeeID(rut, page) {
    const regex = new RegExp(`/remuneraciones/es-CL/rexcpe/empleados/${rut}/vacaciones/(\\d+)`);
    const links = await page.$$('a[href*="/remuneraciones/es-CL/rexcpe/empleados/"]');
    let numeroVacaciones;

    for (const link of links) {
        const href = await page.evaluate(element => element.getAttribute('href'), link);
        const match = href.match(regex);

        if (match && match[1]) {
            numeroVacaciones = match[1];
            break;
        }
    }

    if (numeroVacaciones) {
        return numeroVacaciones;
    } else {
        return null;
    }
}

module.exports = {
    scrapperChrome
};