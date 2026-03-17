const fs = require('fs');

async function parseVars() {
    const jsContent = fs.readFileSync('pt_data.js', 'utf8');
    
    const scriptContent = Object.keys(global).map(k => `var ${k} = {};`).join('') + '\n' + jsContent + '\nmodule.exports = { ...global, exerciseRecords: typeof exerciseRecords !== "undefined" ? exerciseRecords : null,  categories: typeof categories !== "undefined" ? categories : null };';
    
    fs.writeFileSync('temp_eval_vars.js', scriptContent);
    const result = require('./temp_eval_vars.js');
    
    // Attempt to parse out any other interesting arrays or objects that could be categories
    // The file is just JS, so let's match all "var XYZ = [...]" and print their names and sample
    const regex = /var\s+([a-zA-Z0-9_]+)\s*=\s*(.*?);[\r\n]/g;
    let m;
    while ((m = regex.exec(jsContent)) !== null) {
        let name = m[1];
        let valStr = m[2];
        if (name === "exerciseRecords") continue;
        console.log(`\nVariable: ${name}`);
        if(valStr.length > 200) {
            console.log(valStr.substring(0, 200) + '...');
        } else {
            console.log(valStr);
        }
    }
}
parseVars();
