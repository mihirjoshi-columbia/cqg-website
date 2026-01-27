const fs = require('fs');
const https = require('https');
const path = require('path');

// 1. Download Tower Research Logo
const towerUrl = "https://upload.wikimedia.org/wikipedia/commons/5/50/Tower_Research_Capital_logo.png";
const towerPath = path.join(__dirname, 'public', 'logos', 'tower-research.png');

const downloadFile = (url, filepath) => {
    const file = fs.createWriteStream(filepath);
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (response) => {
        if (response.statusCode === 200) {
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                console.log(`Downloaded Tower Research logo`);
            });
        } else {
            console.error(`Failed to download Tower logo (${response.statusCode})`);
            fs.unlink(filepath, () => { });
        }
    }).on('error', (err) => {
        fs.unlink(filepath, () => { });
        console.error(`Error downloading Tower logo: ${err.message}`);
    });
};

downloadFile(towerUrl, towerPath);

// 2. Create Favicon SVG
const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
  <rect width="256" height="256" fill="#ffffff"/>
  <text x="50%" y="50%" font-family="Arial, sans-serif" font-weight="bold" font-size="100" fill="#000000" text-anchor="middle" dy=".3em">CQG</text>
</svg>`;

const faviconPath = path.join(__dirname, 'app', 'icon.svg'); // Next.js supports icon.svg
fs.writeFileSync(faviconPath, faviconSvg);
console.log('Created app/icon.svg');
