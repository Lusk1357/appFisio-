const https = require('https');
const fs = require('fs');

const url = 'https://www.physiotherapyexercises.com/Js/ExerciseData_English_2026_03_11_20_36_37.js';

https.get(url, (res) => {
  let data = '';
  res.on('data', chunk => { data += chunk; });
  res.on('end', () => {
    fs.writeFileSync('ExerciseData_English.js', data);
    console.log('Saved ExerciseData_English.js, length:', data.length);
  });
}).on('error', err => {
  console.log('Error: ', err.message);
});
