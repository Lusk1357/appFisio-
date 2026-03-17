const fs = require('fs');
const data = JSON.parse(fs.readFileSync('exercises_pt_dump.json', 'utf8'));

let results = [];
data.forEach(ex => {
    const textStr = ex.texts.join(' ').toLowerCase();
    if (textStr.includes('mancha') || 
        textStr.includes('tabelas com uma corda') ||
        textStr.includes('corrida na') ||
        textStr.includes('capacidade de correr') ||
        textStr.includes('levantar os seus joelhos')) {
        results.push(ex);
    }
});

console.log(`Encontrados: ${results.length}`);
results.forEach(r => {
    console.log(`ID: ${r.id}, Name: ${r.texts[1]}`);
});
