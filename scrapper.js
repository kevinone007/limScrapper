//const puppeteer = require('puppeteer')
import puppeteer from 'puppeteer';
const username = 'ccon';
const password = 'LIMchile2024@';

let clickXpath=async (page,xpath)=>{
    let element = await page.$x(xpath);
    await element[0].click();
}




(async () => {
    // Launch the browser and open a new blank page
    const browser = await puppeteer.launch({
        headless:false
    });
    const page = await browser.newPage();

    // Navigate the page to a URL
    await page.goto('https://accounts.rexmas.com/login')
    await page.type('#username', username)
    await page.type('#password', password)
    {
        const targetPage = page;
        const promises = [];
        const startWaitingForEvents = () => {
            promises.push(targetPage.waitForNavigation());
        }
        await puppeteer.Locator.race([
            targetPage.locator('div.Login__ButtonStyled-rexmas-shared__sc-192ujh5-4 span.Text__StyledText-rexmas-shared__sc-84udx0-0'),
            targetPage.locator('::-p-xpath(//*[@data-testid=\\"login-container\\"]/div/div[2]/div[2]/div[5]/button/span[1])'),
            targetPage.locator(':scope >>> div.Login__ButtonStyled-rexmas-shared__sc-192ujh5-4 span.Text__StyledText-rexmas-shared__sc-84udx0-0'),
            targetPage.locator('::-p-text(INICIAR SESIÓN)')
        ])
            .setTimeout(timeout)
            .on('action', () => startWaitingForEvents())
            .click({
                offset: {
                    x: 78.5,
                    y: 18.524993896484375,
                },
            });
        await Promise.all(promises);
    }



    //await browser.close();
})();

