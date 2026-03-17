const https = require('https');

function checkURL(url) {
   return new Promise((resolve) => {
       https.get(url, (res) => resolve(res.statusCode)).on('error', () => resolve(0));
   });
}

async function main() {
    const urls = [
       "https://www.physiotherapyexercises.com/ExerciseImages/General/2045.jpg",
       "https://www.physiotherapyexercises.com/ExerciseImages/HighRes/2045.jpg",
       "https://www.physiotherapyexercises.com/ExerciseImages/General/2046.jpg",
       "https://www.physiotherapyexercises.com/ExerciseImages/HighRes/2046.jpg",
       "https://www.physiotherapyexercises.com/ExerciseImages/General/2045.gif"
    ];
    for (const url of urls) {
        console.log(url + " - Status: " + (await checkURL(url)));
    }
}
main();
