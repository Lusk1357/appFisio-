const https = require('https');

https.get('https://portuguese.physiotherapyexercises.com/home/gallery', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        const matches = data.match(/href="([^"]+\.css)"/g);
        console.log("CSS Links:", matches);
    });
});
