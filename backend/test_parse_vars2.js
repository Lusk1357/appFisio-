const fs = require('fs');

async function parseVars() {
    const jsContent = fs.readFileSync('pt_data.js', 'utf8');
    const scriptContent = Object.keys(global).map(k => `var ${k} = {};`).join('') + '\n' + jsContent + '\nmodule.exports = { ...global };';
    fs.writeFileSync('temp_eval_vars.js', scriptContent);
    const result = require('./temp_eval_vars.js');
    
    for (const key of Object.keys(result)) {
        if (key === 'langDetails' || key === 'exerciseRecords' || key.startsWith('Math') || key.startsWith('JSON')) continue;
        const val = result[key];
        if (Array.isArray(val)) {
            console.log(`Array '${key}' with ${val.length} elements. First 2:`, val.slice(0, 2));
        } else if (typeof val === 'object' && val !== null) {
            console.log(`Object '${key}' with keys:`, Object.keys(val).slice(0, 5));
        } else {
            console.log(`Primitive '${key}':`, String(val).substring(0, 50));
        }
    }
}
parseVars();
