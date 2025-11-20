const fs = require('fs');
const https = require('https');
const path = require('path');

const firm = { name: "SIG", domain: "sig.com" };

const downloadLogo = (firm) => {
    const url = `https://logo.clearbit.com/${firm.domain}`;
    const filename = 'sig.png';
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
            fs.unlink(filepath, () => { });
        }
    }).on('error', (err) => {
        fs.unlink(filepath, () => { });
        console.error(`Error downloading ${firm.name}: ${err.message}`);
    });
};

downloadLogo(firm);
