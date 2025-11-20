#!/bin/bash

# Script to download high-quality SVG logos for quant firms
# Using Wikimedia Commons and other sources

cd "$(dirname "$0")/public/logos"

echo "Downloading SVG logos..."

# Citadel - from Wikimedia
curl -H "User-Agent: Mozilla/5.0" -o citadel.svg "https://upload.wikimedia.org/wikipedia/commons/f/f2/Citadel_LLC_Logo.svg" 2>/dev/null && echo "✓ Citadel SVG" || echo "✗ Citadel SVG failed"

# Two Sigma - from Wikimedia
curl -H "User-Agent: Mozilla/5.0" -o two-sigma.svg "https://upload.wikimedia.org/wikipedia/commons/8/8c/Two_Sigma_Investments_logo.svg" 2>/dev/null && echo "✓ Two Sigma SVG" || echo "✗ Two Sigma SVG failed"

# Goldman Sachs - from Wikimedia
curl -H "User-Agent: Mozilla/5.0" -o goldman-sachs.svg "https://upload.wikimedia.org/wikipedia/commons/6/61/Goldman_Sachs.svg" 2>/dev/null && echo "✓ Goldman Sachs SVG" || echo "✗ Goldman Sachs SVG failed"

# Morgan Stanley - from Wikimedia
curl -H "User-Agent: Mozilla/5.0" -o morgan-stanley.svg "https://upload.wikimedia.org/wikipedia/commons/2/26/Morgan_Stanley_Logo_1.svg" 2>/dev/null && echo "✓ Morgan Stanley SVG" || echo "✗ Morgan Stanley SVG failed"

# J.P. Morgan - from Wikimedia
curl -H "User-Agent: Mozilla/5.0" -o j-p--morgan.svg "https://upload.wikimedia.org/wikipedia/commons/4/42/JPMorgan_Chase_logo.svg" 2>/dev/null && echo "✓ J.P. Morgan SVG" || echo "✗ J.P. Morgan SVG failed"

# BlackRock - from Wikimedia
curl -H "User-Agent: Mozilla/5.0" -o blackrock.svg "https://upload.wikimedia.org/wikipedia/commons/4/45/BlackRock_Logo.svg" 2>/dev/null && echo "✓ BlackRock SVG" || echo "✗ BlackRock SVG failed"

# Optiver - from Wikimedia
curl -H "User-Agent: Mozilla/5.0" -o optiver.svg "https://upload.wikimedia.org/wikipedia/commons/f/f0/Optiver_logo.svg" 2>/dev/null && echo "✓ Optiver SVG" || echo "✗ Optiver SVG failed"

# Bridgewater - from Wikimedia
curl -H "User-Agent: Mozilla/5.0" -o bridgewater.svg "https://upload.wikimedia.org/wikipedia/commons/e/e0/Bridgewater_Associates_logo.svg" 2>/dev/null && echo "✗ Bridgewater SVG failed"

# Man Group - from Wikimedia
curl -H "User-Agent: Mozilla/5.0" -o man-group.svg "https://upload.wikimedia.org/wikipedia/commons/8/8e/Man_Group_logo.svg" 2>/dev/null && echo "✓ Man Group SVG" || echo "✗ Man Group SVG failed"

# Jane Street - Try Wikimedia
curl -H "User-Agent: Mozilla/5.0" -o jane-street.svg "https://upload.wikimedia.org/wikipedia/commons/a/a4/Jane_Street_Capital_Logo.svg" 2>/dev/null && echo "✓ Jane Street SVG" || echo "✗ Jane Street SVG failed"

# D.E. Shaw - Try Wikimedia
curl -H "User-Agent: Mozilla/5.0" -o d-e--shaw.svg "https://upload.wikimedia.org/wikipedia/commons/9/9b/D._E._Shaw_%26_Co._Logo.svg" 2>/dev/null && echo "✓ D.E. Shaw SVG" || echo "✗ D.E. Shaw SVG failed"

echo ""
echo "Download complete. Checking which files were successfully downloaded..."
ls -lh *.svg 2>/dev/null | awk '{print $9, $5}'
