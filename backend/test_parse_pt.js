const fs = require('fs');

async function parse() {
    const jsContent = fs.readFileSync('pt_data.js', 'utf8');
    
    const lines = jsContent.split('\n');
    let exercises = [];
    
    // We can evaluate the file by wrapping it slightly or extracting the array
    try {
        // Find the array that looks like exerciseRecords
        const match = jsContent.match(/var\s+[a-zA-Z0-9_]+\s*=\s*\[\s*\{"id":.*\}\s*\];/s);
        if (match) {
            let arrStr = match[0];
            arrStr = arrStr.replace(/var\s+[a-zA-Z0-9_]+\s*=\s*/, '').replace(/;$/, '');
            exercises = JSON.parse(arrStr);
            console.log("Success reading array format 1");
        } else {
             // Let's just create a sandbox to eval
             const scriptContent = Object.keys(global).map(k => `var ${k} = {};`).join('') + '\n' + jsContent + '\nmodule.exports = { exerciseRecords: typeof exerciseRecords !== "undefined" ? exerciseRecords : null };';
             fs.writeFileSync('temp_eval.js', scriptContent);
             const result = require('./temp_eval.js');
             if(result.exerciseRecords) {
                 exercises = result.exerciseRecords;
                 console.log("Success reading from eval");
             } else {
                console.log("Could not find exerciseRecords directly.");
             }
        }
    } catch(e) {
        console.log("Error parsing:", e.message);
    }
    
    if (exercises.length > 0) {
        console.log(`Found ${exercises.length} exercises.`);
        // Save to Portuguese JSON dump
        fs.writeFileSync('exercises_pt_dump.json', JSON.stringify(exercises, null, 2));
        console.log("Saved the first item for inspection:");
        console.dir(exercises[0], { depth: null });
        
        // Let's find out how categories are defined. Maybe there's a property for body part?
        let uniqueProps = new Set();
        for (let ex of exercises) {
            for (let t in ex.texts) {
                if(t !== "1" && t !== "3" && t !== "5" && t !== "7" && t !== "2" && t !== "4" && t !== "6" && t !== "8") {
                   uniqueProps.add(`texts[${t}]`);
                }
            }
            for (let k of Object.keys(ex)) {
                if(k !== 'texts') uniqueProps.add(k);
            }
        }
        console.log("Unique keys across all exercises:", Array.from(uniqueProps).join(', '));
    } else {
        // Let's print the first 100 lines to see what to parse
        console.log(lines.slice(0, 50).join('\n'));
    }
}
parse();
