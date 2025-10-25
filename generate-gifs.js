const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');
const GIFEncoder = require('gifencoder');

// Ensure output directory exists
const outputDir = path.join(__dirname, 'public', 'animations');
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// Tier configurations
const tiers = {
    'protocol-user': {
        bg: '#ffffff',
        xColor: '#000000',
        numberColor: '#0052FF',
        codeColor: '#333333',
        trailColor: '#cccccc'
    },
    'early-adopter': {
        bg: '#000000',
        xColor: '#0052FF',
        numberColor: '#ffffff',
        codeColor: '#0052FF',
        trailColor: '#0052FF'
    },
    'pioneer': {
        bg: '#0052FF',
        xColor: '#000000',
        numberColor: '#ffffff',
        codeColor: '#ffffff',
        trailColor: '#ffffff'
    },
    'genesis': {
        bg: '#0052FF',
        xColor: '#000000',
        numberColor: '#ffffff',
        codeColor: '#FFD700',
        trailColor: '#FFD700',
        goldBorder: true
    }
};

function drawFrame(ctx, config, frameNum, canvasWidth, canvasHeight) {
    const w = canvasWidth;
    const h = canvasHeight;
    
    // Clear canvas
    ctx.fillStyle = config.bg;
    ctx.fillRect(0, 0, w, h);
    
    // Gold border for Genesis
    if (config.goldBorder) {
        const grad = ctx.createLinearGradient(0, 0, w, h);
        grad.addColorStop(0, '#FFD700');
        grad.addColorStop(0.5, '#FFED4E');
        grad.addColorStop(1, '#B8860B');
        ctx.strokeStyle = grad;
        ctx.lineWidth = 12;
        ctx.strokeRect(6, 6, w - 12, h - 12);
        
        // Inner border
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 3;
        ctx.strokeRect(18, 18, w - 36, h - 36);
    }
    
    // Animation sequence (90 frames = 3 seconds at 30fps)
    const frame = frameNum % 90;
    
    if (frame < 30) {
        // Code typing phase (1 second)
        ctx.fillStyle = config.codeColor;
        ctx.font = '16px monospace';
        ctx.textAlign = 'left';
        
        const progress = frame / 30;
        const line1 = 'POST /api/x402/payment';
        const line2 = '{ "amount": 0.001,';
        const line3 = '  "to": "0x742d35C...",';
        const line4 = '  "protocol": "x402" }';
        
        const chars1 = Math.floor(progress * line1.length);
        const chars2 = Math.floor(Math.max(0, progress - 0.3) * line2.length / 0.7);
        const chars3 = Math.floor(Math.max(0, progress - 0.5) * line3.length / 0.5);
        const chars4 = Math.floor(Math.max(0, progress - 0.7) * line4.length / 0.3);
        
        ctx.fillText(line1.substring(0, chars1), 20, 40);
        if (chars2 > 0) ctx.fillText(line2.substring(0, chars2), 20, 60);
        if (chars3 > 0) ctx.fillText(line3.substring(0, chars3), 20, 80);
        if (chars4 > 0) ctx.fillText(line4.substring(0, chars4), 20, 100);
        
    } else if (frame < 45) {
        // Logo fade in (0.5 seconds)
        ctx.fillStyle = config.codeColor;
        ctx.font = '16px monospace';
        ctx.textAlign = 'left';
        ctx.fillText('POST /api/x402/payment', 20, 40);
        ctx.fillText('{ "amount": 0.001,', 20, 60);
        ctx.fillText('  "to": "0x742d35C...",', 20, 80);
        ctx.fillText('  "protocol": "x402" }', 20, 100);
        
        const fadeAlpha = (frame - 30) / 15;
        ctx.globalAlpha = fadeAlpha;
        
        // X
        ctx.fillStyle = config.xColor;
        ctx.font = 'bold 120px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('X', w/2, h/2 - 20);
        
        // 402
        ctx.fillStyle = config.numberColor;
        ctx.font = 'bold 60px monospace';
        ctx.fillText('402', w/2, h/2 + 50);
        
        ctx.globalAlpha = 1;
        
    } else if (frame < 63) {
        // Response phase (0.6 seconds)
        ctx.fillStyle = config.codeColor;
        ctx.font = '16px monospace';
        ctx.textAlign = 'left';
        ctx.fillText('POST /api/x402/payment', 20, 40);
        ctx.fillText('{ "amount": 0.001,', 20, 60);
        ctx.fillText('  "to": "0x742d35C...",', 20, 80);
        ctx.fillText('  "protocol": "x402" }', 20, 100);
        
        // Response typing
        const respProgress = (frame - 45) / 18;
        const resp1 = '200 OK';
        const resp2 = '{ "status": "confirmed",';
        const resp3 = '  "txHash": "0x8f2a1b..." }';
        
        const respChars1 = Math.floor(respProgress * resp1.length);
        const respChars2 = Math.floor(Math.max(0, respProgress - 0.4) * resp2.length / 0.6);
        const respChars3 = Math.floor(Math.max(0, respProgress - 0.7) * resp3.length / 0.3);
        
        ctx.fillText(resp1.substring(0, respChars1), 20, h - 80);
        if (respChars2 > 0) ctx.fillText(resp2.substring(0, respChars2), 20, h - 60);
        if (respChars3 > 0) ctx.fillText(resp3.substring(0, respChars3), 20, h - 40);
        
        // Static logo
        ctx.fillStyle = config.xColor;
        ctx.font = 'bold 120px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('X', w/2, h/2 - 20);
        
        ctx.fillStyle = config.numberColor;
        ctx.font = 'bold 60px monospace';
        ctx.fillText('402', w/2, h/2 + 50);
        
    } else if (frame < 72) {
        // Brief pause (0.3 seconds)
        ctx.fillStyle = config.codeColor;
        ctx.font = '16px monospace';
        ctx.textAlign = 'left';
        ctx.fillText('POST /api/x402/payment', 20, 40);
        ctx.fillText('{ "amount": 0.001,', 20, 60);
        ctx.fillText('  "to": "0x742d35C...",', 20, 80);
        ctx.fillText('  "protocol": "x402" }', 20, 100);
        ctx.fillText('200 OK', 20, h - 80);
        ctx.fillText('{ "status": "confirmed",', 20, h - 60);
        ctx.fillText('  "txHash": "0x8f2a1b..." }', 20, h - 40);
        
        // Static logo
        ctx.fillStyle = config.xColor;
        ctx.font = 'bold 120px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('X', w/2, h/2 - 20);
        
        ctx.fillStyle = config.numberColor;
        ctx.font = 'bold 60px monospace';
        ctx.fillText('402', w/2, h/2 + 50);
        
    } else {
        // Shooting animation (0.6 seconds)
        const shootFrame = frame - 72;
        const shootProgress = shootFrame / 18;
        
        // Show all text
        ctx.fillStyle = config.codeColor;
        ctx.font = '16px monospace';
        ctx.textAlign = 'left';
        ctx.fillText('POST /api/x402/payment', 20, 40);
        ctx.fillText('{ "amount": 0.001,', 20, 60);
        ctx.fillText('  "to": "0x742d35C...",', 20, 80);
        ctx.fillText('  "protocol": "x402" }', 20, 100);
        ctx.fillText('200 OK', 20, h - 80);
        ctx.fillText('{ "status": "confirmed",', 20, h - 60);
        ctx.fillText('  "txHash": "0x8f2a1b..." }', 20, h - 40);
        
        // Calculate positions
        const xPos = w/2 - (shootProgress * w * 1.2);
        const fourPos = w/2 - (Math.max(0, shootProgress - 0.2) * w * 1.2);
        
        // Draw moving elements with trails
        if (xPos > -150) {
            // X trail effect
            for (let i = 0; i < 5; i++) {
                ctx.globalAlpha = Math.max(0, 0.6 - (i * 0.12));
                ctx.fillStyle = config.trailColor;
                ctx.font = 'bold 120px monospace';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('X', xPos + (i * 25), h/2 - 20);
            }
            ctx.globalAlpha = 1;
            
            // Main X
            ctx.fillStyle = config.xColor;
            ctx.font = 'bold 120px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('X', xPos, h/2 - 20);
        }
        
        if (fourPos > -150) {
            // 402 trail effect
            for (let i = 0; i < 5; i++) {
                ctx.globalAlpha = Math.max(0, 0.6 - (i * 0.12));
                ctx.fillStyle = config.trailColor;
                ctx.font = 'bold 60px monospace';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('402', fourPos + (i * 15), h/2 + 50);
            }
            ctx.globalAlpha = 1;
            
            // Main 402
            ctx.fillStyle = config.numberColor;
            ctx.font = 'bold 60px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('402', fourPos, h/2 + 50);
        }
    }
}

async function generateGIF(tierName, config) {
    console.log(`🎬 Generating ${tierName}.gif...`);
    
    const canvasWidth = 512;
    const canvasHeight = 512;
    const canvas = createCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext('2d');
    
    // Create GIF encoder
    const encoder = new GIFEncoder(canvasWidth, canvasHeight);
    const outputPath = path.join(outputDir, `${tierName}.gif`);
    const stream = fs.createWriteStream(outputPath);
    
    encoder.createReadStream().pipe(stream);
    encoder.start();
    encoder.setRepeat(0);   // Loop forever
    encoder.setDelay(33);   // 30fps (1000ms/30fps ≈ 33ms)
    encoder.setQuality(20); // Good quality
    
    // Generate 90 frames (3 seconds at 30fps)
    for (let frame = 0; frame < 90; frame++) {
        drawFrame(ctx, config, frame, canvasWidth, canvasHeight);
        encoder.addFrame(ctx);
        
        if (frame % 15 === 0) {
            console.log(`  Frame ${frame + 1}/90 (${Math.round((frame + 1) / 90 * 100)}%)`);
        }
    }
    
    encoder.finish();
    
    return new Promise((resolve, reject) => {
        stream.on('finish', () => {
            const stats = fs.statSync(outputPath);
            const fileSizeKB = Math.round(stats.size / 1024);
            console.log(`✅ Generated ${tierName}.gif (${fileSizeKB}KB)`);
            resolve(outputPath);
        });
        
        stream.on('error', reject);
    });
}

async function generateAllGIFs() {
    console.log('🚀 Starting x402 Protocol Pioneer GIF generation...\n');
    
    const results = [];
    
    for (const [tierName, config] of Object.entries(tiers)) {
        try {
            const outputPath = await generateGIF(tierName, config);
            results.push({ tier: tierName, path: outputPath, success: true });
        } catch (error) {
            console.error(`❌ Failed to generate ${tierName}: ${error.message}`);
            results.push({ tier: tierName, error: error.message, success: false });
        }
        
        console.log(); // Add spacing
    }
    
    // Summary
    console.log('📊 Generation Summary:');
    console.log('=====================');
    
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    successful.forEach(result => {
        const stats = fs.statSync(result.path);
        const sizeKB = Math.round(stats.size / 1024);
        console.log(`✅ ${path.basename(result.path)} - ${sizeKB}KB`);
    });
    
    if (failed.length > 0) {
        console.log('\nFailed:');
        failed.forEach(result => {
            console.log(`❌ ${result.tier} - ${result.error}`);
        });
    }
    
    console.log(`\n🎉 Generated ${successful.length}/${results.length} GIFs successfully!`);
    console.log(`📁 Files saved to: ${outputDir}`);
    
    if (successful.length === 4) {
        console.log('\n🌟 Your x402 Protocol Pioneer NFT collection is ready!');
        console.log('Each GIF tells the story of the x402 micropayment protocol in action.');
        console.log('\n📋 Next steps:');
        console.log('1. Check the files in /public/animations/');
        console.log('2. Test your metadata API endpoints');
        console.log('3. Deploy and enjoy your animated NFTs!');
    }
}

// Run the generator
if (require.main === module) {
    generateAllGIFs().catch(console.error);
}

module.exports = { generateAllGIFs, generateGIF };