const fs = require('fs');

const code = fs.readFileSync('ExerciseData_English.js', 'utf8');

// We can just dump all the variable declarations.
// The code looks like `currentLanguage="English";currentCulture="en-AU";clientFormats=[...]`
// Let's use regex to find arrays that are really large.
const arrayMatches = [...code.matchAll(/(\w+)\s*=\s*\[/g)];

console.log("Found array assignments: ");
for (const match of arrayMatches) {
   const varName = match[1];
   const startIndex = match.index;
   console.log(`- ${varName} at index ${startIndex}`);
}

// Let's also extract the largest array
let largestArrayContent = '';
let largestArrayName = '';

for (const match of arrayMatches) {
   const varName = match[1];
   const start = match.index + match[0].length - 1; // start at '['
   
   let openBrackets = 0;
   let insideString = false;
   let escapeNext = false;
   let i = start;
   
   for (; i < code.length; i++) {
        const char = code[i];
        if (escapeNext) { escapeNext = false; continue; }
        if (char === '\\') { escapeNext = true; continue; }
        if (char === '"') { insideString = !insideString; continue; }
        if (!insideString) {
            if (char === '[') openBrackets++;
            if (char === ']') openBrackets--;
        }
        if (openBrackets === 0) break;
   }
   
   const arrayStr = code.substring(start, i + 1);
   console.log(`Array [${varName}] length: ${arrayStr.length}`);
   if (arrayStr.length > largestArrayContent.length) {
       largestArrayContent = arrayStr;
       largestArrayName = varName;
   }
}

if (largestArrayName) {
   console.log(`\nLargest array is ${largestArrayName} with length ${largestArrayContent.length}`);
   fs.writeFileSync('exercises_dump.json', largestArrayContent);
   console.log('Saved to exercises_dump.json');
}

