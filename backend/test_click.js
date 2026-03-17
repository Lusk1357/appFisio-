const puppeteer = require('puppeteer');

async function testClick() {
  const browser = await puppeteer.launch({ headless: "new", defaultViewport: { width: 1280, height: 800 } });
  const page = await browser.newPage();
  
  await page.goto('https://www.physiotherapyexercises.com/home/gallery', { waitUntil: 'networkidle2' });
  
  await new Promise(r => setTimeout(r, 2000));
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button, .p-button'));
    const neverBtn = btns.find(b => b.innerText.includes('Never') || b.textContent.includes('Never') || b.innerText.includes('No') || b.textContent.includes('No'));
    if (neverBtn) neverBtn.click();
  });

  await new Promise(r => setTimeout(r, 1000));
  const firstItem = await page.$('.ptx-gallery-item');
  if (firstItem) {
     const box = await firstItem.boundingBox();
     if (box) await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  }
  await new Promise(r => setTimeout(r, 2000));
  const showBtnRect = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button, a, span, div'));
    const showBtn = btns.find(b => b.innerText && (b.innerText.trim() === 'Show' || b.textContent.trim() === 'Show') && b.getBoundingClientRect().height > 0 && b.getBoundingClientRect().bottom <= window.innerHeight + 100);
    if (showBtn) {
       const rect = showBtn.getBoundingClientRect();
       return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    }
    return null;
  });
  if (showBtnRect) {
     await page.mouse.click(showBtnRect.x, showBtnRect.y);
  }

  await new Promise(r => setTimeout(r, 4000));

  const htmlDump = await page.evaluate(() => {
     // The booklet usually has some core wrapper. Let's find it by looking for the image.
     const imgs = Array.from(document.querySelectorAll('img')).filter(img => img.src.includes('exercise'));
     if (imgs.length > 0) {
        let parent = imgs[0].parentElement;
        while(parent && parent.innerText.length < 500 && parent.tagName !== 'BODY') {
            parent = parent.parentElement;
        }
        return parent.innerHTML;
     }
     return document.body.innerHTML.substring(0, 2000);
  });
  
  const fs = require('fs');
  fs.writeFileSync('booklet_html.html', htmlDump);
  console.log('Saved booklet_html.html');
  await browser.close();
}

testClick().catch(console.error);
