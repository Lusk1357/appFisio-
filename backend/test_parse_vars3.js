const fs = require('fs');

async function parseVars() {
    const jsContent = fs.readFileSync('pt_data.js', 'utf8');
    
    const regex = /([a-zA-Z0-9_]+)\s*=\s*\[/g;
    let m;
    let variables = new Set();
    while ((m = regex.exec(jsContent)) !== null) {
        variables.add(m[1]);
    }
    console.log("Found variables:", Array.from(variables).join(', '));
}
parseVars();
