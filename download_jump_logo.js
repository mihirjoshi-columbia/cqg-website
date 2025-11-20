const fs = require('fs');
const https = require('https');
const path = require('path');

const url = "https://upload.wikimedia.org/wikipedia/commons/b/bd/Jump_Trading_logo.svg";
const filepath = path.join(__dirname, 'public', 'logos', 'jump-trading.svg');

const file = fs.createWriteStream(filepath);
https.get(url, (response) => {
    if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', () => {
            file.close();
            console.log(`Downloaded Jump Trading SVG`);
        });
    } else {
        console.error(`Failed to download (${response.statusCode})`);
        fs.unlink(filepath, () => { });
    }
}).on('error', (err) => {
    fs.unlink(filepath, () => { });
    console.error(`Error downloading: ${err.message}`);
});
