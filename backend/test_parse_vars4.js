const fs = require('fs');

async function parseVars() {
    const jsContent = fs.readFileSync('pt_data.js', 'utf8');
    
    // Create a new context where we execute the code and capture values safely
    const code = jsContent.replace(/window\./g, 'global.');
    
    const context = {};
    const wrapped = `(function(global){ ${code} ; return { dropdownTitles: typeof dropdownTitles !== 'undefined' ? dropdownTitles : null }; })(arguments[0])`;
    const result = eval(wrapped)(context);
    
    if(result.dropdownTitles) {
        console.log("Found dropdownTitles!");
        console.dir(result.dropdownTitles.slice(0, 30), {depth: null}); // print first 30 categories
    } else {
        console.log("Could not evaluate dropdownTitles");
    }
}
parseVars();
