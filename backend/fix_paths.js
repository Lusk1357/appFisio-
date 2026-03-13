const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, '..', 'frontend');

function walk(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const full = path.join(dir, file);
        const stat = fs.statSync(full);
        if (stat.isDirectory()) {
            walk(full);
        } else if (file.endsWith('.html') || file.endsWith('.js')) {
            let content = fs.readFileSync(full, 'utf-8');
            const original = content;

            content = content.replace(/\.\.\/\.\.\/pages\//g, '/pages/');
            content = content.replace(/\.\.\/\.\.\/images\//g, '/images/');
            content = content.replace(/\.\.\/\.\.\/style\//g, '/style/');
            content = content.replace(/\.\.\/\.\.\/script\//g, '/script/');
            content = content.replace(/\.\.\/\.\.\/data\//g, '/data/');

            if (content !== original) {
                fs.writeFileSync(full, content, 'utf-8');
                console.log('Fixed:', path.relative(baseDir, full));
            }
        }
    }
}

walk(baseDir);
console.log('Done!');
