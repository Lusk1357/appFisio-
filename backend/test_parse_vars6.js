const fs = require('fs');
const vm = require('vm');

async function verifyMapping() {
    const jsContent = fs.readFileSync('pt_data.js', 'utf8');
    const sandbox = {};
    vm.createContext(sandbox);
    
    try {
        vm.runInContext(jsContent, sandbox);
        
        const dropdownTitles = sandbox.dropdownTitles;
        const exercises = sandbox.exerciseRecords;
        
        if (!dropdownTitles || !exercises) return console.log("Missing data");
        
        // Build a map of dropdown ID to category path
        const categoryMap = {};
        for(const title of dropdownTitles) {
            for(const item of title.dropdowns) {
                categoryMap[item.id] = `${title.description} > ${item.description}`;
            }
        }
        
        // Print first exercise's categories
        const ex = exercises[0];
        console.log(`Exercise ID: ${ex.id}, Name: ${sandbox.exTs[ex.iId]?.text || 'N/A'}`);
        console.log("Categories mapped from dIds:");
        for(const id of ex.dIds) {
            console.log(` - ${categoryMap[id]} (ID: ${id})`);
        }
    } catch(e) {
        console.log("Error:", e.message);
    }
}
verifyMapping();
