const fs = require('fs');
const vm = require('vm');

async function parseVars() {
    const jsContent = fs.readFileSync('pt_data.js', 'utf8');
    
    // Create a new context where we execute the code and capture values safely
    const sandbox = {};
    vm.createContext(sandbox); // Contextify the sandbox.
    
    try {
        vm.runInContext(jsContent, sandbox);
        
        if (sandbox.dropdownTitles) {
            console.log("Found dropdownTitles!");
            console.log(JSON.stringify(sandbox.dropdownTitles.slice(0, 10), null, 2));
        }
        
        if (sandbox.exTs) {
            console.log("Found exTs!");
            // This maps exercise ID to some tags?
            // Print a sample
            let count = 0;
            for (let id in sandbox.exTs) {
                if (count++ < 2) {
                    console.log(`exTs[${id}] =>`, sandbox.exTs[id]);
                }
            }
        }
    } catch(e) {
        console.log("Eval error:", e.message);
    }
}
parseVars();
