const fs = require('fs');
const https = require('https');
const path = require('path');

const firms = [
    { name: "Jane Street", domain: "janestreet.com" },
    { name: "Citadel", domain: "citadel.com" },
    { name: "Two Sigma", domain: "twosigma.com" },
    { name: "D.E. Shaw", domain: "deshaw.com" },
    { name: "Hudson River Trading", domain: "hudsonrivertrading.com" },
    { name: "Jump Trading", domain: "jumptrading.com" },
    { name: "Five Rings", domain: "fiverings.com" },
    { name: "Tower Research", domain: "tower-research.com" },
    { name: "Optiver", domain: "optiver.com" },
    { name: "IMC", domain: "imc.com" },
    { name: "Goldman Sachs", domain: "goldmansachs.com" },
    { name: "Morgan Stanley", domain: "morganstanley.com" },
    { name: "J.P. Morgan", domain: "jpmorgan.com" },
    { name: "BlackRock", domain: "blackrock.com" },
    { name: "Point72", domain: "point72.com" },
    { name: "Millennium", domain: "millennium.com" },
    { name: "Bridgewater", domain: "bridgewater.com" },
    { name: "AQR", domain: "aqr.com" },
    { name: "Man Group", domain: "man.com" }
];

const downloadLogo = (firm) => {
    const url = `https://logo.clearbit.com/${firm.domain}`;
    const filename = firm.name.toLowerCase().replace(/[^a-z0-9]/g, '-') + '.png';
    const filepath = path.join(__dirname, 'public', 'logos', filename);

    const file = fs.createWriteStream(filepath);
    https.get(url, (response) => {
        if (response.statusCode === 200) {
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                console.log(`Downloaded ${firm.name}`);
            });
        } else {
            console.error(`Failed to download ${firm.name} (${response.statusCode})`);
            fs.unlink(filepath, () => { }); // Delete partial file
        }
    }).on('error', (err) => {
        fs.unlink(filepath, () => { });
        console.error(`Error downloading ${firm.name}: ${err.message}`);
    });
};

firms.forEach(downloadLogo);
