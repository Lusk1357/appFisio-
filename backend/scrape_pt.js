const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const vm = require('vm');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// ─── Mapeamento de categorias do site para categorias padrão do sistema ───────
// Usamos categorias padronizadas para garantir consistência no filtro do app.
const BODY_CATEGORY_MAP = {
    // Punho/Mão
    'Punho/mão': 'Punho / Mão',
    'Mão': 'Punho / Mão',
    'Punho': 'Punho / Mão',

    // Ombro
    'Ombro': 'Ombro',

    // Cotovelo
    'Cotovelo': 'Cotovelo',

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
    'Quadril': 'Quadril',

    // Joelho
    'Joelho': 'Joelho',

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
    'Membro superior': 'Membros Superiores (Geral)',
    'Braço': 'Membros Superiores (Geral)',

    // Membros Inferiores
    'Membro inferior': 'Membros Inferiores (Geral)',
    'Perna': 'Membros Inferiores (Geral)',

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
    
    // ─── Limpa exercícios antigos ─────────────────────────────────────────
    console.log('Limpando o banco de dados de exercícios anteriores...');
    try {
        await prisma.prescriptionExercise.deleteMany({});
        await prisma.routineExercise.deleteMany({});
        await prisma.exerciseVideo.deleteMany({});
        await prisma.exercise.deleteMany({});
        console.log('Banco de dados limpo com sucesso!');
    } catch (e) {
        console.error('Aviso ao limpar BD:', e.message);
    }
    
    // ─── Seleciona exercícios ─────────────────────────────────────────────
    // Processando apenas 1 exercício para teste
    const sample = allExercises.slice(0, 1);
    console.log(`Processando ${sample.length} exercício(s)...`);

    // Assegura que o diretório de imagens existe
    const imgDir = path.join(__dirname, '..', 'frontend', 'images', 'exercises');
    if (!fs.existsSync(imgDir)) {
        fs.mkdirSync(imgDir, { recursive: true });
    }

    // ─── Prepara o Puppeteer para capturar sprites ────────────────────────
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    
    const cssUrl = 'https://www.physiotherapyexercises.com/Sprite/ExerciseData-Style-2023_12_08_22_28_27.css';
    await page.setContent(`<html><head>
      <link rel="stylesheet" href="${cssUrl}">
      <style>
        body { margin: 0; background: white; }
        .capture-target { display: inline-block; }
      </style>
    </head><body><div id="render-target" class="capture-target"></div></body></html>`);
    
    await new Promise(r => setTimeout(r, 2500)); // aguarda CSS carregar

    // ─── Loop de extração ─────────────────────────────────────────────────
    for (let i = 0; i < sample.length; i++) {
        const ex = sample[i];
        console.log(`\n[${i+1}/${sample.length}] Processando exercício ID: ${ex.id}`);
        
        // Textos localizados (índice 1 = título; 3 = objetivo (paciente); 5 = instrução (paciente); 7 = precauções)
        const titlePt = ex.texts[1] || 'Exercicio Sem Titulo';
        const aimPt = ex.texts[3] || '';
        const instructionPt = ex.texts[5] || '';
        const precautionsPt = ex.texts[7] || '';
        
        let fullDescPt = `Objetivo: ${aimPt}\n\nInstruções: ${instructionPt}`;
        if (precautionsPt) {
            fullDescPt += `\n\nPrecauções: ${precautionsPt}`;
        }
        
        // Categorias brutas do site
        const rawBodyParts = ex.dIds.filter(id => bodyPartsMap[id]).map(id => bodyPartsMap[id]);
        const currentEquipments = ex.dIds.filter(id => equipmentsMap[id]).map(id => equipmentsMap[id]).join(', ');
        
        // ─── Normaliza categoria para padrão do sistema ───────────────────
        // Pega a primeira parte do corpo encontrada e normaliza
        const rawBodyCategory = rawBodyParts.length > 0 ? rawBodyParts[0] : '';
        const normalizedBodyCategory = normalizeBodyCategory(rawBodyCategory);
        
        console.log(`  Nome: ${titlePt}`);
        console.log(`  Parte do corpo (bruta): ${rawBodyParts.join(', ')}`);
        console.log(`  Parte do corpo (normalizada): ${normalizedBodyCategory}`);
        console.log(`  Equipamentos: ${currentEquipments}`);
        
        // ─── Captura imagem via CSS sprite ───────────────────────────────
        const spriteClass = ex.i1c || ''; 
        const imgFilename = `ex_${ex.id}.png`;
        const imgPath = path.join(imgDir, imgFilename);
        
        console.log(`  Gerando imagem ${imgFilename} (classe: ${spriteClass})...`);
        
        await page.evaluate((cls) => {
            const el = document.getElementById('render-target');
            // Renderiza o sprite com tamanho exato do elemento CSS
            el.innerHTML = `<div class="${cls}" style="width:80px;height:98px;"></div>`;
        }, spriteClass);
        
        await new Promise(r => setTimeout(r, 300)); // aguarda renderização
        
        const targetElement = await page.$('#render-target');
        let savedImageUrl = null;
        
        if (targetElement) {
            await targetElement.screenshot({ path: imgPath });
            savedImageUrl = `/images/exercises/${imgFilename}`;
            console.log(`  Imagem salva: ${savedImageUrl}`);
        } else {
            console.warn(`  ⚠️ Elemento de imagem não encontrado!`);
        }
        
        // ─── Salva no banco de dados ──────────────────────────────────────
        console.log('  Salvando no banco de dados...');
        try {
            await prisma.exercise.create({
                data: {
                    name: titlePt,
                    observation: fullDescPt,
                    imageUrl: savedImageUrl,
                    equipments: currentEquipments || null,
                    type: normalizedBodyCategory
                }
            });
            console.log('  ✅ Salvo com sucesso!');
        } catch(err) {
            console.error('  ❌ Erro no banco de dados:', err.message);
        }
    }

    await browser.close();
    await prisma.$disconnect();
    console.log(`\n✅ Finalizado! ${sample.length} exercício(s) processado(s).`);
    console.log(`\n📝 Para importar TODOS os exercícios, edite a linha:`);
    console.log(`   const sample = allExercises.slice(0, 1);`);
    console.log(`   e mude para: const sample = allExercises;`);
}

run().catch(console.error);
