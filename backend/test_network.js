const puppeteer = require('puppeteer');

async function testNetwork() {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  
  const requests = [];
  page.on('response', async (response) => {
     const url = response.url();
     if (url.includes('api') || url.includes('json') || url.includes('Exercise')) {
        try {
           const text = await response.text();
           requests.push({ url, text: text.substring(0, 200) });
        } catch(e) {}
     }
  });

  await page.goto('https://www.physiotherapyexercises.com/home/gallery', { waitUntil: 'networkidle0' });
  
  const fs = require('fs');
  fs.writeFileSync('requests.json', JSON.stringify(requests, null, 2));
  console.log('Saved requests to requests.json');

  await browser.close();
}

testNetwork().catch(console.error);
