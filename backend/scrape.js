const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Native fetch to free Google Translate endpoint
async function translateText(text, retries = 3) {
  if (!text || text.trim() === '') return '';
  for (let i = 0; i < retries; i++) {
    try {
      const url = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=pt&dt=t&q=" + encodeURIComponent(text);
      const res = await fetch(url);
      const json = await res.json();
      // json[0] is an array of translated pieces
      let translated = "";
      for (let piece of json[0]) {
          translated += piece[0];
      }
      return translated;
    } catch (e) {
      console.error('Translation failed (attempt ' + (i+1) + '):', e.message);
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
  return text; // fallback to original
}

async function run() {
  console.log('Loading JSON data...');
  const exercisesRaw = fs.readFileSync(path.join(__dirname, 'exercises_dump.json'), 'utf8');
  const allExercises = JSON.parse(exercisesRaw);
  
  // Get first 10
  const sample = allExercises.slice(0, 10);
  console.log('Processing ' + sample.length + ' exercises...');

  // Ensure image directory exists
  const imgDir = path.join(__dirname, '..', 'frontend', 'public', 'images', 'exercises');
  if (!fs.existsSync(imgDir)) {
      fs.mkdirSync(imgDir, { recursive: true });
  }

  // Setup Puppeteer for sprite rendering
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  
  const cssUrl = 'https://www.physiotherapyexercises.com/Sprite/ExerciseData-Style-2023_12_08_22_28_27.css';
  await page.setContent('<html><head><link rel="stylesheet" href="' + cssUrl + '"><style>body { margin: 0; padding: 20px; background: white; } .preview-container { display: inline-block; padding: 5px; background: white; border: 1px solid #ccc; }</style></head><body><div id="render-target" class="preview-container"></div></body></html>');

  await new Promise(r => setTimeout(r, 2000));

  for (let i = 0; i < sample.length; i++) {
      const ex = sample[i];
      console.log('\\n[' + (i+1) + '/' + sample.length + '] Processing exercise ID: ' + ex.id);
      
      const titleEn = ex.texts[1] || '';
      const aimEn = ex.texts[3] || '';
      const instructionEn = ex.texts[5] || '';
      const precautionsEn = ex.texts[7] || '';
      
      let fullDescEn = 'Aim: ' + aimEn + '\\n\\nInstructions: ' + instructionEn;
      if (precautionsEn) {
          fullDescEn += '\\n\\nPrecautions: ' + precautionsEn;
      }
      
      console.log('  Translating...');
      const titlePt = await translateText(titleEn);
      const descPt = await translateText(fullDescEn);
      
      // Render and screenshot sprite
      const spriteClass = ex.i1c || ''; 
      const imgFilename = 'ex_' + ex.id + '.png';
      const imgPath = path.join(imgDir, imgFilename);
      
      console.log('  Generating image ' + imgFilename + ' using class ' + spriteClass + '...');
      
      await page.evaluate((cls) => {
          const el = document.getElementById('render-target');
          el.innerHTML = '<div class="' + cls + '" style="width: 80px; height: 98px;"></div>';
      }, spriteClass);
      
      await new Promise(r => setTimeout(r, 200)); // allow render
      
      const targetElement = await page.$('#render-target');
      if (targetElement) {
         await targetElement.screenshot({ path: imgPath });
      }

      // Save to Database
      console.log('  Saving to database...');
      try {
         await prisma.exercise.upsert({
           where: { name: titlePt },
           update: {
              observation: descPt,
              imageUrl: '/images/exercises/' + imgFilename,
              type: 'Geral'
           },
           create: {
              name: titlePt,
              observation: descPt,
              imageUrl: '/images/exercises/' + imgFilename,
              type: 'Geral'
           }
         });
         console.log('  -> Saved successfully.');
      } catch(err) {
         console.error('  -> Database error:', err.message);
      }
  }

  await browser.close();
  await prisma.$disconnect();
  console.log('\\nFinished processing 10 exercises!');
}

run().catch(console.error);
