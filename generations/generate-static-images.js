const fs = require('fs');
const path = require('path');

// Simple SVG to PNG generator for the NFT images
const tiers = {
    'protocol-user': {
        bg: '#ffffff',
        xColor: '#000000',
        numberColor: '#0052FF',
        filename: 'protocol-user.png'
    },
    'early-adopter': {
        bg: '#000000',
        xColor: '#0052FF',
        numberColor: '#ffffff',
        filename: 'early-adopter.png'
    },
    'pioneer': {
        bg: '#0052FF',
        xColor: '#000000',
        numberColor: '#ffffff',
        filename: 'pioneer.png'
    },
    'genesis': {
        bg: '#0052FF',
        xColor: '#000000',
        numberColor: '#ffffff',
        goldBorder: true,
        filename: 'genesis.png'
    }
};

function generateSVG(config) {
    const goldBorderSVG = config.goldBorder ? `
        <defs>
            <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#FFD700;stop-opacity:1" />
                <stop offset="50%" style="stop-color:#FFED4E;stop-opacity:1" />
                <stop offset="100%" style="stop-color:#B8860B;stop-opacity:1" />
            </linearGradient>
        </defs>
        <rect x="6" y="6" width="500" height="500" fill="none" stroke="url(#goldGradient)" stroke-width="12"/>
        <rect x="18" y="18" width="476" height="476" fill="none" stroke="#FFD700" stroke-width="3"/>
    ` : '';

    const baseDots = `
        <g opacity="0.4">
            ${[0,1,2,3].map(i => 
                [0,1,2,3].map(j => 
                    `<circle cx="${452 + i*12}" cy="${452 + j*12}" r="4" fill="${config.goldBorder ? '#FFD700' : config.numberColor}"/>`
                ).join('')
            ).join('')}
        </g>
    `;

    return `<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
        ${goldBorderSVG}
        <rect width="512" height="512" fill="${config.bg}"/>
        
        <!-- X -->
        <text x="256" y="236" text-anchor="middle" font-family="monospace" font-size="180" font-weight="bold" fill="${config.xColor}">X</text>
        
        <!-- 402 -->
        <text x="256" y="336" text-anchor="middle" font-family="monospace" font-size="80" font-weight="bold" fill="${config.numberColor}">402</text>
        
        <!-- Base dots pattern -->
        ${baseDots}
        
        ${goldBorderSVG}
    </svg>`;
}

// Ensure images directory exists
const imagesDir = path.join(__dirname, 'public', 'images');
if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
}

// Generate all SVG files
Object.entries(tiers).forEach(([tierName, config]) => {
    const svg = generateSVG(config);
    const svgPath = path.join(imagesDir, config.filename.replace('.png', '.svg'));
    fs.writeFileSync(svgPath, svg);
    console.log(`✅ Generated ${tierName}.svg`);
});

console.log(`\n📁 SVG files saved to: ${imagesDir}`);
console.log('\n🔧 To convert to PNG, you can use:');
console.log('1. Online converter like convertio.co');
console.log('2. Install ImageMagick: brew install imagemagick');
console.log('   Then: magick *.svg output.png');
console.log('3. Use the browser tool above to download PNGs directly');
