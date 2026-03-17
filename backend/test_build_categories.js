const fs = require('fs');
const vm = require('vm');

async function testParse() {
    // 1. Load data
    const jsContent = fs.readFileSync('pt_data.js', 'utf8');
    const sandbox = {};
    vm.createContext(sandbox);
    vm.runInContext(jsContent, sandbox);
    
    // 2. Load JSON dump
    const exercisesRaw = fs.readFileSync('exercises_pt_dump.json', 'utf8');
    const allExercises = JSON.parse(exercisesRaw);
    
    // 3. Extract Categories Maps
    const dropdownTitles = sandbox.dropdownTitles;
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
    
    // 4. Process a sample
    const ex = allExercises[0];
    
    // Extract localized texts
    const titlePt = ex.texts[1] || '';
    const aimPt = ex.texts[3] || '';
    const instructionPt = ex.texts[5] || '';
    const precautionsPt = ex.texts[7] || '';
    let fullDescPt = 'Objetivo: ' + aimPt + '\\n\\nInstruções: ' + instructionPt;
    if (precautionsPt) fullDescPt += '\\n\\nPrecauções: ' + precautionsPt;
    
    // Map categories
    const bodyParts = ex.dIds.filter(id => bodyPartsMap[id]).map(id => bodyPartsMap[id]);
    const equipments = ex.dIds.filter(id => equipmentsMap[id]).map(id => equipmentsMap[id]);
    
    console.log({
        name: titlePt,
        observation: fullDescPt,
        bodyCategory: bodyParts.join(', '),
        equipments: equipments.join(', '),
        spriteClass: ex.i1c
    });
}
testParse();
