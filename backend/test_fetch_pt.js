const fs = require('fs');

async function download() {
    const url = "https://portuguese.physiotherapyexercises.com/Js/ExerciseData_Portuguese_2026_03_11_20_37_27.js";
    const res = await fetch(url);
    const text = await res.text();
    fs.writeFileSync('pt_data.js', text);
    console.log('Saved to pt_data.js. Length:', text.length);
}
download();
