const https = require('https');

function checkURL(url) {
   return new Promise((resolve) => {
       https.get(url, (res) => resolve(res.statusCode)).on('error', () => resolve(0));
   });
}

async function main() {
    const urls = [
       "https://www.physiotherapyexercises.com/ExerciseImages/General/227_1c.jpg",
       "https://www.physiotherapyexercises.com/ExerciseImages/General/E227_1c.jpg",
       "https://www.physiotherapyexercises.com/ExerciseImages/HighRes/227_1c.jpg",
       "https://www.physiotherapyexercises.com/ExerciseImages/HighRes/E227_1c.jpg",
       "https://www.physiotherapyexercises.com/ExerciseImages/HighRes/227_1.jpg",
       "https://www.physiotherapyexercises.com/ExerciseImages/General/E227_1.jpg"
    ];
    for (const url of urls) {
        console.log(url + " - Status: " + (await checkURL(url)));
    }
}
main();
