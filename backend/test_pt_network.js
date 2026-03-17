const puppeteer = require('puppeteer');
const fs = require('fs');

async function check() {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    
    page.on('response', async res => {
        const url = res.url();
        if (url.includes('.js') && url.includes('ExerciseData')) {
            console.log('Found Data JS:', url);
        }
    });

    console.log('Navigating...');
    await page.goto('https://portuguese.physiotherapyexercises.com/home/gallery', { waitUntil: 'networkidle2' });
    console.log('Done.');
    await browser.close();
}
check();
