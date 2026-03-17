const puppeteer = require('puppeteer');

async function test() {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  await page.goto('https://portuguese.physiotherapyexercises.com/home/gallery', { waitUntil: 'networkidle2' });
  
  // Wait for the gallery items to load
  await page.waitForSelector('.galleryEx', { timeout: 30000 });
  
  // Click the first exercise image to open details
  await page.click('.galleryEx img');
  
  // Wait for the exercise detail image to load 
  // e.g. .exerciseImage, or something similar. Let's just find ANY large image
  await new Promise(r => setTimeout(r, 2000));
  
  const imgs = await page.evaluate(() => {
     return Array.from(document.querySelectorAll('img')).map(img => img.src).filter(src => src && !src.includes('logo') && !src.includes('btn_'));
  });
  
  console.log("Found img srcs:", imgs.join('\\n'));
  
  await browser.close();
}
test().catch(console.error);
