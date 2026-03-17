const https = require('https');

function checkURL(url) {
   return new Promise((resolve) => {
       https.request(url, { method: 'HEAD' }, (res) => resolve(res.statusCode)).on('error', () => resolve(0)).end();
   });
}

async function main() {
    const urls = [
       "https://portuguese.physiotherapyexercises.com/ExerciseImages/General/2045.jpg",
       "https://portuguese.physiotherapyexercises.com/ExerciseImages/HighRes/2045.jpg",
       "https://portuguese.physiotherapyexercises.com/ExerciseImages/HighRes/E2045.jpg",
       "https://portuguese.physiotherapyexercises.com/ExerciseImages/HighRes/E2045_1.jpg",
       "https://portuguese.physiotherapyexercises.com/ExerciseImages/HighRes/E227_1.jpg",
       "https://portuguese.physiotherapyexercises.com/ExerciseImages/General/E227_1.jpg",
       "https://www.physiotherapyexercises.com/ExerciseImages/General/E227_1.jpg"
    ];
    for (const url of urls) {
        console.log(url + " - Status: " + (await checkURL(url)));
    }
}
main();
