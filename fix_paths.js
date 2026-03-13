const fs = require('fs');
const path = require('path');

function walkDir(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function (file) {
        if (file === 'node_modules' || file === '.git') return;
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walkDir(file));
        } else {
            if (file.endsWith('.html')) {
                results.push(file);
            }
        }
    });
    return results;
}

const frontendDir = path.join(__dirname, 'frontend');
const htmlFiles = walkDir(frontendDir);

htmlFiles.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');

    // Replace ../../style with /style
    content = content.replace(/(href|src)="(\.\.\/)+style\//g, '$1="/style/');
    // Replace ../../script with /script
    content = content.replace(/(href|src)="(\.\.\/)+script\//g, '$1="/script/');
    // Replace window.location.href='../../pages with window.location.href='/pages
    content = content.replace(/window\.location\.href='(\.\.\/)+pages\//g, "window.location.href='/pages/");
    // Replace window.location.href="../../pages with window.location.href="/pages
    content = content.replace(/window\.location\.href="(\.\.\/)+pages\//g, 'window.location.href="/pages/');
    // Remove seed.js imports
    content = content.replace(/<script src="\/script\/seed\.js"><\/script>\n?/g, "");
    content = content.replace(/<script src="\.\.\/\.\.\/script\/seed\.js"><\/script>\n?/g, "");

    fs.writeFileSync(file, content, 'utf8');
    console.log("Fixed paths in: " + file);
});

console.log("All HTML files processed.");
