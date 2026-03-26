const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const vm = require('vm');
const { PrismaClient } = require('@prisma/client');
const https = require('https');

// ─── CONFIGURAÇÃO: DEFINA O LIMITE AQUI ───────────────────────────
// Escolha quantos exercícios processar (ex: 10, 100, ou null para TODOS)
const LIMITE_EXERCICIOS = null; // Limite para teste (use null para todos)
// ──────────────────────────────────────────────────────────────────

const prisma = new PrismaClient();

// ─── Mapeamento de categorias do site para categorias padrão do sistema ───────
// Usamos categorias padronizadas para garantir consistência no filtro do app.
const BODY_CATEGORY_MAP = {
    // Punho/Mão
    'Punho/mão': 'Punho / Mão',
    'Mão': 'Punho / Mão',
    'Punho': 'Punho / Mão',

    // Ombro
    'Ombro': 'Ombro / Braço',
    'Braço': 'Ombro / Braço',

    // Cotovelo
    'Cotovelo': 'Cotovelo / Antebraço',
    'Antebraço': 'Cotovelo / Antebraço',

    // Cervical / Pescoço
    'Coluna cervical / Pescoço': 'Cervical / Pescoço',
    'Pescoço': 'Cervical / Pescoço',
    'Cervical': 'Cervical / Pescoço',

    // Coluna Lombar
    'Coluna lombar': 'Coluna Lombar',
    'Lombar': 'Coluna Lombar',

    // Coluna Torácica
    'Coluna torácica': 'Coluna Torácica',
    'Torácica': 'Coluna Torácica',

    // Quadril
    'Quadril': 'Quadril / Coxa',
    'Coxa': 'Quadril / Coxa',

    // Joelho
    'Joelho': 'Joelho / Perna',
    'Perna': 'Joelho / Perna',

    // Tornozelo/Pé
    'Tornozelo/Pé': 'Tornozelo / Pé',
    'Tornozelo': 'Tornozelo / Pé',
    'Pé': 'Tornozelo / Pé',

    // Core / Abdômen
    'Núcleo/Tronco': 'Core / Abdômen',
    'Abdômen': 'Core / Abdômen',
    'Core': 'Core / Abdômen',
    'Tronco': 'Core / Abdômen',

    // Membros Superiores
    'Membro superior': 'Ombro / Braço',

    // Membros Inferiores
    'Membro inferior': 'Joelho / Perna',

    // Respiratório
    'Respiratório': 'Respiratório',
    'Pulmões': 'Respiratório',
};

/**
 * Normaliza a categoria do corpo para o padrão do app.
 * Se não encontrar no mapa, usa "Geral / Funcional".
 */
function normalizeBodyCategory(rawCategory) {
    if (!rawCategory) return 'Geral / Funcional';
    // Tenta encontrar mapeamento exato
    if (BODY_CATEGORY_MAP[rawCategory]) return BODY_CATEGORY_MAP[rawCategory];
    // Tenta correspondência parcial (case-insensitive)
    const lower = rawCategory.toLowerCase();
    for (const [key, value] of Object.entries(BODY_CATEGORY_MAP)) {
        if (key.toLowerCase().includes(lower) || lower.includes(key.toLowerCase())) {
            return value;
        }
    }
    return 'Geral / Funcional';
}

async function run() {
    console.log('Carregando dados em Português...');

    // Carrega o mapa de variáveis nativo
    const jsContent = fs.readFileSync(path.join(__dirname, 'pt_data.js'), 'utf8');
    const sandbox = {};
    vm.createContext(sandbox);
    vm.runInContext(jsContent, sandbox);

    // Extrai os mapeamentos de Corpo e Equipamentos
    const dropdownTitles = sandbox.dropdownTitles || [];
    let bodyPartsMap = {};
    let equipmentsMap = {};
    for (const title of dropdownTitles) {
        if (title.description === 'Parte do corpo') {
            title.dropdowns.forEach(d => bodyPartsMap[d.id] = d.description);
        }
        if (title.description === 'Equipamento') {
            title.dropdowns.forEach(d => equipmentsMap[d.id] = d.description);
        }
    }

    const exercisesRaw = fs.readFileSync(path.join(__dirname, 'exercises_pt_dump.json'), 'utf8');
    const allExercises = JSON.parse(exercisesRaw);

    // ─── Seleciona exercícios ─────────────────────────────────────────────
    const sample = LIMITE_EXERCICIOS ? allExercises.slice(0, LIMITE_EXERCICIOS) : allExercises;
    console.log(`Processando ${sample.length} exercício(s)...`);

    // Assegura que o diretório de imagens existe
    const imgDir = path.join(__dirname, '..', '..', 'frontend', 'images', 'exercises');
    if (!fs.existsSync(imgDir)) {
        fs.mkdirSync(imgDir, { recursive: true });
    }

    // ─── Prepara o Puppeteer para capturar sprites ────────────────────────
    const browser = await puppeteer.launch({ 
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    });
    const page = await browser.newPage();
    
    // Configura um viewport com escala maior para imagens mais nítidas (HiDPI)
    await page.setViewport({ width: 800, height: 600, deviceScaleFactor: 2 });

    // Use a URL que o subagente confirmou estar ativa
    const cssUrl = 'https://portuguese.physiotherapyexercises.com/Sprite/ExerciseData-Style-2023_12_08_22_28_27.css';
    
    // Configura a página base com o CSS
    await page.setContent(`<html><head>
      <link rel="stylesheet" href="${cssUrl}">
      <style>
        body { margin: 0; background: white; }
        .capture-target { display: inline-block; width: 80px; height: 98px; }
      </style>
    </head><body class="webp"><div id="render-target" class="capture-target"></div></body></html>`);

    console.log('Aguardando carregamento do CSS e recursos...');
    // Espera o link do CSS carregar especificamente
    await page.waitForSelector('link[href*="ExerciseData-Style"]');
    await new Promise(r => setTimeout(r, 3000)); // Tempo extra para garantir que o browser processou o CSS

    // Função para aguardar o carregamento da imagem de fundo (sprite)
    async function waitForBG(page, selector) {
        await page.waitForFunction((sel) => {
            const el = document.querySelector(sel).firstChild; // O sprite está no primeiro filho
            if (!el) return false;
            const style = window.getComputedStyle(el);
            const bg = style.backgroundImage;
            if (!bg || bg === 'none') return false;
            
            // Extrai a URL
            const url = bg.replace(/url\(['"]?(.*?)['"]?\)/i, '$1');
            if (url.startsWith('data:')) return true;
            
            // Verifica se a imagem já completou o carregamento
            const img = new Image();
            img.src = url;
            return img.complete && img.naturalWidth > 0;
        }, { timeout: 10000 }, selector);
    };

    // Nova função para baixar imagem diretamente (Alta Resolução)
    function downloadImage(url, dest) {
        return new Promise((resolve, reject) => {
            const file = fs.createWriteStream(dest);
            https.get(url, (response) => {
                if (response.statusCode === 200) {
                    response.pipe(file);
                    file.on('finish', () => {
                        file.close(resolve);
                    });
                } else {
                    file.close();
                    fs.unlink(dest, () => reject(new Error(`HTTP ${response.statusCode}`)));
                }
            }).on('error', (err) => {
                file.close();
                fs.unlink(dest, () => reject(err));
            });
        });
    }

    // ─── Loop de extração ─────────────────────────────────────────────────
    for (let i = 0; i < sample.length; i++) {
        const ex = sample[i];
        console.log(`\n[${i + 1}/${sample.length}] Processando exercício ID: ${ex.id}`);

        // Textos localizados (índice 1 = título; 3 = objetivo; 5 = instrução; 7 = precauções)
        const titlePt = ex.texts[1] || 'Exercicio Sem Titulo';
        const aimPt = ex.texts[3] || '';
        const instructionPt = ex.texts[5] || '';
        const precautionsPt = ex.texts[7] || '';

        // --- Composição da Observação (Objetivo + Precauções) ---
        let fullDescPt = aimPt ? `Objetivo: ${aimPt}` : '';
        if (precautionsPt) {
            fullDescPt += (fullDescPt ? '\n\n' : '') + `Precauções: ${precautionsPt}`;
        }

        // --- Composição da Instrução (Como Executar) ---
        const howToExecutePt = instructionPt || '';

        // Categorias brutas do site
        const rawBodyParts = ex.dIds.filter(id => bodyPartsMap[id]).map(id => bodyPartsMap[id]);
        const currentEquipments = ex.dIds.filter(id => equipmentsMap[id]).map(id => equipmentsMap[id]).join(', ');

        // ─── Normaliza categoria para padrão do sistema ───────────────────
        const rawBodyCategory = rawBodyParts.length > 0 ? rawBodyParts[0] : '';
        const normalizedBodyCategory = normalizeBodyCategory(rawBodyCategory);

        console.log(`  Nome: ${titlePt}`);
        console.log(`  Parte do corpo (normalizada): ${normalizedBodyCategory}`);
        console.log(`  Equipamentos: ${currentEquipments}`);

        // ─── Captura Imagem ───────────────────────────────────────────────
        const imgFilename = `ex_${ex.id}.webp`;
        const imgDest = path.join(imgDir, imgFilename);
        let imageCaptured = false;

        // --- Otimização: Pular se imagem já existe ---
        if (fs.existsSync(imgDest) && fs.statSync(imgDest).size > 0) {
            console.log(`  -> Imagem já existe: ${imgFilename}. Pulando captura.`);
            imageCaptured = true;
        }

        // 1. Tentar Alta Resolução (Download Direto)
        if (!imageCaptured) {
            const candidates = [];
            if (ex.i2) candidates.push({ type: 'Photos', prefix: 'Ph', id: ex.i2 });
            if (ex.i1) candidates.push({ type: 'Drawings', prefix: 'Ex', id: ex.i1 });

            for (const cand of candidates) {
                const highResUrl = `https://static.physiotherapyexercises.com/ExerciseImages/${cand.type}_Webp/${cand.prefix}${cand.id}.webp`;
                try {
                    process.stdout.write(`  Tentando download em alta resolução (${cand.type})... `);
                    await downloadImage(highResUrl, imgDest);
                    console.log('✅ Sucesso!');
                    imageCaptured = true;
                    break;
                } catch (err) {
                    console.log(`❌ Falha (${err.message})`);
                }
            }
        }

        // 2. Fallback: Captura via Sprite (Puppeteer)
        if (!imageCaptured) {
            console.log('  Usando fallback: Captura por sprite (Puppeteer)...');
            const spriteClass = ex.i2c || ex.i1c || '';
            const cls = spriteClass.split(' ')[0]; // ex: isph04

            if (cls) {
                await page.evaluate((cls) => {
                    const el = document.getElementById('render-target');
                    el.innerHTML = `<div class="${cls}" style="width:80px;height:98px;"></div>`;
                }, cls);

                try {
                    await waitForBG(page, '#render-target');
                    const targetElement = await page.$('#render-target');
                    await targetElement.screenshot({ path: imgDest, type: 'webp' });
                    imageCaptured = true;
                    console.log('  ✅ Capturado com sucesso!');
                } catch (e) {
                    console.warn(`  ⚠️ Falha no fallback: ${e.message}`);
                }
            }
        }

        const savedImageUrl = imageCaptured ? `/images/exercises/${imgFilename}` : null;
        if (savedImageUrl) console.log(`  Imagem salva: ${savedImageUrl}`);

        // ─── Salva no banco de dados ──────────────────────────────────────
        console.log('  Salvando no banco de dados...');
        try {
            await prisma.exercise.upsert({
                where: { externalId: String(ex.id) },
                update: {
                    name: titlePt,
                    observation: fullDescPt,
                    howToExecute: howToExecutePt,
                    imageUrl: savedImageUrl,
                    equipments: currentEquipments || null,
                    type: normalizedBodyCategory
                },
                create: {
                    externalId: String(ex.id),
                    name: titlePt,
                    observation: fullDescPt,
                    howToExecute: howToExecutePt,
                    imageUrl: savedImageUrl,
                    equipments: currentEquipments || null,
                    type: normalizedBodyCategory
                }
            });
            console.log('  ✅ Registro no BD atualizado!');

            const logEntry = `ID: ${ex.id} | Nome: ${titlePt}\n`;
            fs.appendFileSync(path.join(__dirname, 'importados.log'), logEntry);

        } catch (err) {
            console.error('  ❌ Erro no banco de dados:', err.message);
        }
    }

    await browser.close();
    await prisma.$disconnect();
    console.log(`\n✅ Finalizado! ${sample.length} exercício(s) processado(s).`);
}

run().catch(console.error);
